"""
Advanced Workflow & Automation Engine

Executes event-driven workflows with DAG-based execution, logic branching,
variable interpolation, timeouts, retries, and script sandboxing.
"""

import json
import logging
import os
import re
import signal
import subprocess
import threading
import traceback
from collections import deque
from datetime import datetime
from typing import Dict, List, Any, Optional, Set, Tuple

from app import db
from app.models import Workflow, WorkflowExecution, WorkflowLog, User
from app.services.workflow_service import WorkflowService
from app.services.docker_service import DockerService
from app.services.database_service import DatabaseService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Defaults for node execution
DEFAULT_TIMEOUT = 300  # 5 minutes
MAX_TIMEOUT = 3600  # 1 hour
DEFAULT_RETRY_COUNT = 0
MAX_RETRY_COUNT = 5
DEFAULT_RETRY_DELAY = 5  # seconds
MAX_OUTPUT_SIZE = 1024 * 512  # 512 KB


class CycleDetectedError(Exception):
    """Raised when a cycle is detected in the workflow graph."""
    pass


class NodeTimeoutError(Exception):
    """Raised when a node exceeds its timeout."""
    pass


class WorkflowEngine:
    """Engine for executing advanced workflows with DAG support."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    def validate_graph(nodes: List[Dict], edges: List[Dict]) -> Optional[str]:
        """
        Validate a workflow graph for cycles.

        Returns None if valid, or an error message string if a cycle is found.
        """
        adj: Dict[str, List[str]] = {}
        node_ids = {n['id'] for n in nodes}

        for edge in edges:
            src = edge['source']
            if src not in adj:
                adj[src] = []
            adj[src].append(edge['target'])

        # Kahn's algorithm for cycle detection
        in_degree = {nid: 0 for nid in node_ids}
        for src, targets in adj.items():
            for t in targets:
                if t in in_degree:
                    in_degree[t] += 1

        queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
        visited_count = 0

        while queue:
            nid = queue.popleft()
            visited_count += 1
            for neighbor in adj.get(nid, []):
                if neighbor in in_degree:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        queue.append(neighbor)

        if visited_count < len(node_ids):
            # Find nodes involved in the cycle for a helpful message
            cycle_nodes = [nid for nid, deg in in_degree.items() if deg > 0]
            node_labels = {}
            for n in nodes:
                node_labels[n['id']] = n.get('data', {}).get('label', n['id'])
            cycle_labels = [node_labels.get(nid, nid) for nid in cycle_nodes[:5]]
            return f"Cycle detected involving: {', '.join(cycle_labels)}"

        return None

    @staticmethod
    def execute_workflow(workflow_id: int, trigger_type: str = 'manual',
                         context: Dict[str, Any] = None) -> int:
        """
        Execute a workflow by ID.

        Returns the ID of the created WorkflowExecution.
        """
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        nodes = json.loads(workflow.nodes) if workflow.nodes else []
        edges = json.loads(workflow.edges) if workflow.edges else []

        # Validate graph before executing
        cycle_err = WorkflowEngine.validate_graph(nodes, edges)
        if cycle_err:
            raise CycleDetectedError(cycle_err)

        execution = WorkflowExecution(
            workflow_id=workflow_id,
            trigger_type=trigger_type,
            status='running',
            context=json.dumps(context or {}),
            started_at=datetime.utcnow()
        )
        db.session.add(execution)
        db.session.commit()

        workflow.last_run_at = execution.started_at
        db.session.commit()

        try:
            WorkflowEngine._run_execution(execution.id, nodes, edges)
        except Exception as e:
            WorkflowEngine._log(execution.id, f"Engine Error: {str(e)}", level='ERROR')
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            workflow.last_status = 'failed'
            db.session.commit()

        return execution.id

    # ------------------------------------------------------------------
    # DAG Execution
    # ------------------------------------------------------------------

    @staticmethod
    def _run_execution(execution_id: int, nodes: List[Dict], edges: List[Dict]):
        """Run the workflow using topological DAG execution with branch support."""
        execution = WorkflowExecution.query.get(execution_id)
        workflow = execution.workflow

        WorkflowEngine._log(execution_id, f"Starting workflow: {workflow.name}")

        if not nodes:
            WorkflowEngine._log(execution_id, "Workflow has no nodes", level='WARNING')
            execution.status = 'success'
            execution.completed_at = datetime.utcnow()
            db.session.commit()
            return

        # Build graph structures
        node_map = {n['id']: n for n in nodes}
        adj: Dict[str, List[Tuple[str, str]]] = {}  # source -> [(target, sourceHandle)]
        in_degree: Dict[str, int] = {n['id']: 0 for n in nodes}

        for edge in edges:
            src = edge['source']
            tgt = edge['target']
            src_handle = edge.get('sourceHandle', 'output')
            if src not in adj:
                adj[src] = []
            adj[src].append((tgt, src_handle))
            if tgt in in_degree:
                in_degree[tgt] += 1

        # Start with root nodes (no incoming edges)
        ready = deque(nid for nid, deg in in_degree.items() if deg == 0)
        if not ready:
            ready.append(nodes[0]['id'])

        context = json.loads(execution.context) if execution.context else {}
        results: Dict[str, Dict] = {}
        processed: Set[str] = set()
        # Track which branches are active (for logic_if gating)
        # Maps node_id -> set of sourceHandles that were activated
        active_branches: Dict[str, Set[str]] = {}
        failed = False

        while ready and not failed:
            node_id = ready.popleft()

            if node_id in processed:
                continue

            node = node_map.get(node_id)
            if not node:
                continue

            # Check if this node is gated by a logic_if branch
            if not WorkflowEngine._is_node_reachable(node_id, edges, active_branches, processed):
                processed.add(node_id)
                # Still decrement successors so they can become ready
                for tgt, _ in adj.get(node_id, []):
                    if tgt in in_degree:
                        in_degree[tgt] -= 1
                        if in_degree[tgt] == 0:
                            ready.append(tgt)
                continue

            node_label = node.get('data', {}).get('label', node_id)
            WorkflowEngine._log(execution_id, f"Executing node: {node_label} ({node['type']})", node_id=node_id)

            try:
                node_result = WorkflowEngine._execute_node_with_retry(
                    node, edges, execution, context, results
                )
                results[node_id] = node_result

                if not node_result.get('success', True):
                    WorkflowEngine._log(
                        execution_id,
                        f"Node failed: {node_result.get('error', 'unknown')}",
                        level='ERROR', node_id=node_id
                    )
                    if node_result.get('critical', True):
                        failed = True
                        break

                # For logic_if nodes, record which branch was taken
                if node['type'] == 'logic_if':
                    branch = node_result.get('branch', 'true')
                    if node_id not in active_branches:
                        active_branches[node_id] = set()
                    active_branches[node_id].add(branch)

                # Enqueue successor nodes whose in-degree reaches 0
                for tgt, src_handle in adj.get(node_id, []):
                    if tgt in in_degree:
                        in_degree[tgt] -= 1
                        if in_degree[tgt] == 0:
                            ready.append(tgt)

            except Exception as e:
                WorkflowEngine._log(execution_id, f"Node Execution Error: {str(e)}", level='ERROR', node_id=node_id)
                WorkflowEngine._log(execution_id, traceback.format_exc(), level='DEBUG', node_id=node_id)
                failed = True
                break

            processed.add(node_id)

        execution.status = 'failed' if failed else 'success'
        execution.results = json.dumps(results)
        execution.completed_at = datetime.utcnow()
        workflow.last_status = execution.status
        db.session.commit()

        WorkflowEngine._log(execution_id, f"Workflow finished with status: {execution.status}")

    @staticmethod
    def _is_node_reachable(node_id: str, edges: List[Dict],
                           active_branches: Dict[str, Set[str]],
                           processed: Set[str]) -> bool:
        """
        Check if a node should execute based on logic_if branching.

        A node is unreachable if ALL its incoming edges from logic_if nodes
        come through inactive branches.
        """
        incoming_from_logic = []

        for edge in edges:
            if edge['target'] != node_id:
                continue
            src = edge['source']
            src_handle = edge.get('sourceHandle', 'output')

            # Only gate on logic_if nodes that have already been processed
            if src in active_branches:
                incoming_from_logic.append((src, src_handle))

        if not incoming_from_logic:
            return True  # No logic_if gating, always reachable

        # Reachable if at least one logic_if branch leading here is active
        for src, src_handle in incoming_from_logic:
            if src_handle in active_branches[src]:
                return True

        return False

    # ------------------------------------------------------------------
    # Node Execution with Retry
    # ------------------------------------------------------------------

    @staticmethod
    def _execute_node_with_retry(node: Dict, edges: List, execution: WorkflowExecution,
                                  context: Dict, results: Dict) -> Dict:
        """Execute a node with retry support."""
        node_data = node.get('data', {})
        retry_count = min(int(node_data.get('retryCount', DEFAULT_RETRY_COUNT)), MAX_RETRY_COUNT)
        retry_delay = max(1, int(node_data.get('retryDelay', DEFAULT_RETRY_DELAY)))

        last_result = None
        for attempt in range(retry_count + 1):
            if attempt > 0:
                WorkflowEngine._log(
                    execution.id,
                    f"Retry {attempt}/{retry_count} after {retry_delay}s",
                    node_id=node['id']
                )
                import time
                time.sleep(retry_delay)

            last_result = WorkflowEngine._execute_node(node, edges, execution, context, results)

            if last_result.get('success', True):
                return last_result

        return last_result

    # ------------------------------------------------------------------
    # Node Execution
    # ------------------------------------------------------------------

    @staticmethod
    def _execute_node(node: Dict, edges: List, execution: WorkflowExecution,
                      context: Dict, results: Dict) -> Dict:
        """Execute a single node and return its results."""
        node_type = node.get('type')
        node_data = node.get('data', {})

        if node_type == 'trigger':
            return {'success': True, 'output': context}

        elif node_type in ('database', 'dockerApp', 'service', 'domain'):
            res = WorkflowService.deploy_node(node, edges, execution.workflow.user_id, results)
            return res

        elif node_type == 'notification':
            return WorkflowEngine._execute_notification(node, execution, context, results)

        elif node_type == 'script':
            return WorkflowEngine._execute_script(node, execution, context, results)

        elif node_type == 'logic_if':
            return WorkflowEngine._execute_logic_if(node, context, results)

        return {'success': True, 'message': f"Node type {node_type} passed through"}

    # ------------------------------------------------------------------
    # Logic If Evaluation
    # ------------------------------------------------------------------

    @staticmethod
    def _execute_logic_if(node: Dict, context: Dict, results: Dict) -> Dict:
        """
        Evaluate a logic_if condition.

        The condition is a Python expression that has access to:
        - results: dict of {node_id: node_result}
        - context: the workflow execution context
        """
        node_data = node.get('data', {})
        condition = node_data.get('condition', '').strip()

        if not condition:
            return {'success': True, 'branch': 'true'}

        # Build a safe evaluation namespace
        eval_globals = {"__builtins__": {}}
        eval_locals = {
            'results': results,
            'context': context,
            # Expose common helpers
            'len': len,
            'str': str,
            'int': int,
            'float': float,
            'bool': bool,
            'abs': abs,
            'min': min,
            'max': max,
            'any': any,
            'all': all,
            'isinstance': isinstance,
        }

        try:
            result = eval(condition, eval_globals, eval_locals)
            branch = 'true' if result else 'false'
            return {
                'success': True,
                'branch': branch,
                'condition': condition,
                'evaluated': bool(result)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Condition evaluation failed: {str(e)}",
                'condition': condition,
                'branch': 'false',
                'critical': False  # Don't kill the whole workflow for a bad condition
            }

    # ------------------------------------------------------------------
    # Variable Interpolation
    # ------------------------------------------------------------------

    @staticmethod
    def _interpolate(text: str, context: Dict, results: Dict,
                     execution: Optional[WorkflowExecution] = None) -> str:
        """
        Replace variable placeholders in text.

        Supported syntax:
        - ${node_id.field}     — access a specific field from a node's result
        - ${node_id.output}    — shorthand for the output field
        - {{workflow_name}}    — built-in workflow variables
        - {{execution_id}}     — current execution ID
        - {{started_at}}       — execution start time
        - {{context.field}}    — access context fields
        """
        if not text or not isinstance(text, str):
            return text

        # Replace ${node_id.field} patterns
        def replace_node_var(match):
            node_id = match.group(1)
            field = match.group(2)
            node_result = results.get(node_id, {})
            if field == 'output' and 'output' not in node_result:
                # Try stdout as fallback for script nodes
                return str(node_result.get('stdout', ''))
            return str(node_result.get(field, ''))

        text = re.sub(r'\$\{([^.}]+)\.([^}]+)\}', replace_node_var, text)

        # Replace {{builtin}} patterns
        builtins = {
            'workflow_name': execution.workflow.name if execution else '',
            'execution_id': str(execution.id) if execution else '',
            'started_at': execution.started_at.isoformat() if execution and execution.started_at else '',
            'trigger_type': execution.trigger_type if execution else '',
        }

        # Add context.* variables
        for key, value in context.items():
            builtins[f'context.{key}'] = str(value)

        for key, value in builtins.items():
            text = text.replace('{{' + key + '}}', value)

        # Replace {{node_id.field}} as alternative syntax
        def replace_node_var_braces(match):
            node_id = match.group(1)
            field = match.group(2)
            node_result = results.get(node_id, {})
            return str(node_result.get(field, ''))

        text = re.sub(r'\{\{([^.}]+)\.([^}]+)\}\}', replace_node_var_braces, text)

        return text

    # ------------------------------------------------------------------
    # Notification Node
    # ------------------------------------------------------------------

    @staticmethod
    def _execute_notification(node: Dict, execution: WorkflowExecution,
                              context: Dict, results: Dict) -> Dict:
        """Execute a notification node with variable interpolation."""
        node_data = node.get('data', {})
        channel = node_data.get('channel', 'system')
        message = node_data.get('message', 'Workflow notification')

        # Interpolate variables in the message
        message = WorkflowEngine._interpolate(message, context, results, execution)

        title = f"Workflow: {execution.workflow.name}"

        # Build alert in the format NotificationService expects
        alerts = [{
            'type': 'workflow',
            'severity': 'info',
            'message': message,
            'value': '',
            'threshold': ''
        }]

        try:
            if channel == 'system' or channel == 'all':
                result = NotificationService.send_all(alerts)
            elif channel == 'discord':
                config = NotificationService.get_config().get('discord', {})
                result = NotificationService.send_discord(alerts, config)
            elif channel == 'slack':
                config = NotificationService.get_config().get('slack', {})
                result = NotificationService.send_slack(alerts, config)
            elif channel == 'email':
                config = NotificationService.get_config().get('email', {})
                result = NotificationService.send_email(alerts, config)
            elif channel == 'telegram':
                config = NotificationService.get_config().get('telegram', {})
                result = NotificationService.send_telegram(alerts, config)
            else:
                result = NotificationService.send_all(alerts)

            return {'success': result.get('success', True), 'channel': channel}
        except Exception as e:
            return {'success': False, 'error': str(e), 'critical': False}

    # ------------------------------------------------------------------
    # Script Node (Sandboxed)
    # ------------------------------------------------------------------

    @staticmethod
    def _execute_script(node: Dict, execution: WorkflowExecution,
                        context: Dict, results: Dict) -> Dict:
        """Execute a script node with timeout, output limits, and variable interpolation."""
        node_data = node.get('data', {})
        script_type = node_data.get('language', 'bash')
        content = node_data.get('content', '')
        timeout = min(int(node_data.get('timeout', DEFAULT_TIMEOUT)), MAX_TIMEOUT)

        if not content.strip():
            return {'success': True, 'stdout': '', 'stderr': '', 'returncode': 0}

        # Interpolate variables in script content
        content = WorkflowEngine._interpolate(content, context, results, execution)

        # Build environment with node results available as env vars
        env = os.environ.copy()
        env['WORKFLOW_ID'] = str(execution.workflow_id)
        env['EXECUTION_ID'] = str(execution.id)
        env['TRIGGER_TYPE'] = execution.trigger_type or 'manual'

        for nid, nresult in results.items():
            safe_id = re.sub(r'[^a-zA-Z0-9_]', '_', nid).upper()
            if isinstance(nresult, dict):
                stdout = nresult.get('stdout', nresult.get('output', ''))
                if isinstance(stdout, str):
                    env[f'NODE_{safe_id}_OUTPUT'] = stdout[:4096]
                rc = nresult.get('returncode')
                if rc is not None:
                    env[f'NODE_{safe_id}_RC'] = str(rc)

        try:
            if script_type == 'bash':
                cmd = ['bash', '-c', content]
            elif script_type == 'python':
                cmd = ['python3', '-c', content]
            else:
                return {'success': False, 'error': f"Unsupported script language: {script_type}"}

            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env,
                cwd='/tmp' if os.name != 'nt' else None
            )

            stdout = proc.stdout[:MAX_OUTPUT_SIZE] if proc.stdout else ''
            stderr = proc.stderr[:MAX_OUTPUT_SIZE] if proc.stderr else ''

            return {
                'success': proc.returncode == 0,
                'stdout': stdout,
                'stderr': stderr,
                'returncode': proc.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f"Script timed out after {timeout}s",
                'stdout': '',
                'stderr': '',
                'returncode': -1
            }
        except FileNotFoundError:
            fallback = 'python' if script_type == 'python' else script_type
            try:
                proc = subprocess.run(
                    [fallback, '-c', content] if script_type == 'python' else content,
                    capture_output=True, text=True, timeout=timeout,
                    env=env, shell=(script_type == 'bash'),
                    cwd='/tmp' if os.name != 'nt' else None
                )
                stdout = proc.stdout[:MAX_OUTPUT_SIZE] if proc.stdout else ''
                stderr = proc.stderr[:MAX_OUTPUT_SIZE] if proc.stderr else ''
                return {
                    'success': proc.returncode == 0,
                    'stdout': stdout, 'stderr': stderr,
                    'returncode': proc.returncode
                }
            except Exception as e:
                return {'success': False, 'error': str(e)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------

    @staticmethod
    def _log(execution_id: int, message: str, level: str = 'INFO', node_id: str = None):
        """Add a log entry for an execution."""
        log_entry = WorkflowLog(
            execution_id=execution_id,
            level=level,
            message=message,
            node_id=node_id
        )
        db.session.add(log_entry)
        db.session.commit()
        logger.info(f"[{level}] Workflow {execution_id}: {message}")

    # Keep backward-compatible alias
    log = _log


# ------------------------------------------------------------------
# Event Bus for workflow triggers
# ------------------------------------------------------------------

class WorkflowEventBus:
    """
    Simple in-process event bus for triggering workflows on system events.

    Events are emitted by services (monitoring, health checks, git deploy)
    and matched against workflows with trigger_type='event'.
    """

    _listeners_lock = threading.Lock()

    @staticmethod
    def emit(event_type: str, data: Dict[str, Any] = None):
        """
        Emit an event that may trigger workflows.

        Args:
            event_type: One of health_check_failed, high_cpu, high_memory,
                        git_push, app_stopped, or any custom string.
            data: Event payload passed as workflow context.
        """
        from flask import current_app
        try:
            app = current_app._get_current_object()
        except RuntimeError:
            logger.warning(f"WorkflowEventBus.emit called outside app context for {event_type}")
            return

        threading.Thread(
            target=WorkflowEventBus._process_event,
            args=(app, event_type, data or {}),
            daemon=True,
            name=f'wf-event-{event_type}'
        ).start()

    @staticmethod
    def _process_event(app, event_type: str, data: Dict):
        """Find and execute workflows subscribed to this event type."""
        with app.app_context():
            try:
                workflows = Workflow.query.filter_by(
                    is_active=True,
                    trigger_type='event'
                ).all()

                for workflow in workflows:
                    try:
                        config = json.loads(workflow.trigger_config) if workflow.trigger_config else {}
                        subscribed_event = config.get('eventType', '')

                        if subscribed_event != event_type:
                            continue

                        # Cooldown: don't re-trigger within 60 seconds
                        if workflow.last_run_at:
                            elapsed = (datetime.utcnow() - workflow.last_run_at).total_seconds()
                            if elapsed < 60:
                                continue

                        logger.info(f"Event '{event_type}' triggering workflow: {workflow.name}")
                        context = {
                            'event_type': event_type,
                            'event_data': data,
                            'triggered_at': datetime.utcnow().isoformat()
                        }
                        WorkflowEngine.execute_workflow(
                            workflow_id=workflow.id,
                            trigger_type='event',
                            context=context
                        )
                    except Exception as e:
                        logger.error(f"Event trigger failed for workflow {workflow.id}: {e}")

            except Exception as e:
                logger.error(f"WorkflowEventBus._process_event error: {e}")

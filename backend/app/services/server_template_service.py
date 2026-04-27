import json
import logging
from datetime import datetime
from app import db
from app.models.server_template import ServerTemplate, ServerTemplateAssignment
from app.models.server import Server

logger = logging.getLogger(__name__)


class ServerTemplateService:
    """Service for server template management and config drift detection."""

    # Built-in template library
    TEMPLATE_LIBRARY = {
        'web-server': {
            'name': 'Web Server',
            'description': 'Nginx + PHP-FPM web server with standard security',
            'category': 'web',
            'packages': ['nginx', 'php-fpm', 'certbot'],
            'services': [
                {'name': 'nginx', 'enabled': True, 'running': True},
                {'name': 'php-fpm', 'enabled': True, 'running': True},
            ],
            'firewall_rules': [
                {'port': 80, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 443, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 22, 'protocol': 'tcp', 'action': 'allow'},
            ],
        },
        'database-server': {
            'name': 'Database Server',
            'description': 'MySQL/MariaDB database server with backups',
            'category': 'database',
            'packages': ['mariadb-server'],
            'services': [
                {'name': 'mariadb', 'enabled': True, 'running': True},
            ],
            'firewall_rules': [
                {'port': 3306, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 22, 'protocol': 'tcp', 'action': 'allow'},
            ],
        },
        'mail-server': {
            'name': 'Mail Server',
            'description': 'Postfix + Dovecot mail server',
            'category': 'mail',
            'packages': ['postfix', 'dovecot-imapd', 'dovecot-pop3d', 'spamassassin', 'opendkim'],
            'services': [
                {'name': 'postfix', 'enabled': True, 'running': True},
                {'name': 'dovecot', 'enabled': True, 'running': True},
                {'name': 'spamassassin', 'enabled': True, 'running': True},
            ],
            'firewall_rules': [
                {'port': 25, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 587, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 993, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 995, 'protocol': 'tcp', 'action': 'allow'},
                {'port': 22, 'protocol': 'tcp', 'action': 'allow'},
            ],
        },
    }

    @staticmethod
    def list_templates(category=None):
        query = ServerTemplate.query
        if category:
            query = query.filter_by(category=category)
        return query.order_by(ServerTemplate.name).all()

    @staticmethod
    def get_template(template_id):
        return ServerTemplate.query.get(template_id)

    @staticmethod
    def create_template(data, user_id=None):
        if ServerTemplate.query.filter_by(name=data['name']).first():
            raise ValueError(f"Template '{data['name']}' already exists")

        template = ServerTemplate(
            name=data['name'],
            description=data.get('description', ''),
            category=data.get('category', 'general'),
            parent_id=data.get('parent_id'),
            auto_remediate=data.get('auto_remediate', False),
            remediation_approval_required=data.get('remediation_approval_required', True),
            created_by=user_id,
        )
        template.packages = data.get('packages', [])
        template.services = data.get('services', [])
        template.firewall_rules = data.get('firewall_rules', [])
        template.files = data.get('files', [])
        template.users = data.get('users', [])
        template.sysctl_params = data.get('sysctl_params', [])

        db.session.add(template)
        db.session.commit()
        return template

    @staticmethod
    def update_template(template_id, data):
        template = ServerTemplate.query.get(template_id)
        if not template:
            return None

        for field in ['name', 'description', 'category', 'parent_id',
                      'auto_remediate', 'remediation_approval_required']:
            if field in data:
                setattr(template, field, data[field])

        for json_field in ['packages', 'services', 'firewall_rules', 'files', 'users', 'sysctl_params']:
            if json_field in data:
                setattr(template, json_field, data[json_field])

        template.version += 1
        db.session.commit()
        return template

    @staticmethod
    def delete_template(template_id):
        template = ServerTemplate.query.get(template_id)
        if not template:
            return False
        active = template.assignments.count()
        if active > 0:
            raise ValueError(f'Cannot delete template with {active} active assignments')
        # Remove children references
        for child in template.children:
            child.parent_id = None
        db.session.delete(template)
        db.session.commit()
        return True

    @staticmethod
    def get_library_templates():
        return ServerTemplateService.TEMPLATE_LIBRARY

    @staticmethod
    def create_from_library(key, user_id=None):
        if key not in ServerTemplateService.TEMPLATE_LIBRARY:
            raise ValueError(f"Unknown library template: {key}")
        data = ServerTemplateService.TEMPLATE_LIBRARY[key].copy()
        return ServerTemplateService.create_template(data, user_id)

    # --- Assignment & Drift ---

    @staticmethod
    def assign_template(template_id, server_id):
        template = ServerTemplate.query.get(template_id)
        if not template:
            raise ValueError('Template not found')
        server = Server.query.get(server_id)
        if not server:
            raise ValueError('Server not found')

        existing = ServerTemplateAssignment.query.filter_by(
            template_id=template_id, server_id=server_id
        ).first()
        if existing:
            raise ValueError('Template already assigned to this server')

        assignment = ServerTemplateAssignment(
            template_id=template_id,
            server_id=server_id,
        )
        db.session.add(assignment)
        db.session.commit()
        return assignment

    @staticmethod
    def unassign_template(assignment_id):
        assignment = ServerTemplateAssignment.query.get(assignment_id)
        if not assignment:
            return False
        db.session.delete(assignment)
        db.session.commit()
        return True

    @staticmethod
    def bulk_assign(template_id, server_ids):
        results = []
        for sid in server_ids:
            try:
                a = ServerTemplateService.assign_template(template_id, sid)
                results.append({'server_id': sid, 'status': 'assigned', 'assignment_id': a.id})
            except ValueError as e:
                results.append({'server_id': sid, 'status': 'error', 'error': str(e)})
        return results

    @staticmethod
    def check_drift(assignment_id):
        """Check configuration drift for a server assignment."""
        assignment = ServerTemplateAssignment.query.get(assignment_id)
        if not assignment:
            return None

        assignment.status = ServerTemplateAssignment.STATUS_CHECKING
        db.session.commit()

        # Send drift check command to agent
        try:
            from app.agent_gateway import get_agent_gateway
            gw = get_agent_gateway()
            if gw and assignment.server:
                spec = assignment.template.get_merged_spec()
                gw.send_command(assignment.server.agent_id, 'config_drift_check', {
                    'assignment_id': assignment.id,
                    'spec': spec,
                })
        except Exception as e:
            logger.warning(f'Could not send drift check command: {e}')

        return assignment

    @staticmethod
    def update_drift_report(assignment_id, report):
        assignment = ServerTemplateAssignment.query.get(assignment_id)
        if not assignment:
            return None
        assignment.drift_report = report
        assignment.last_check_at = datetime.utcnow()
        has_drift = any(
            report.get(k, []) for k in ['missing_packages', 'extra_packages',
                                          'stopped_services', 'missing_rules', 'changed_files']
        )
        assignment.status = (
            ServerTemplateAssignment.STATUS_DRIFTED if has_drift
            else ServerTemplateAssignment.STATUS_COMPLIANT
        )
        db.session.commit()
        return assignment

    @staticmethod
    def remediate(assignment_id):
        """Apply template to bring server back to expected state."""
        assignment = ServerTemplateAssignment.query.get(assignment_id)
        if not assignment:
            return None

        assignment.status = ServerTemplateAssignment.STATUS_REMEDIATING
        db.session.commit()

        try:
            from app.agent_gateway import get_agent_gateway
            gw = get_agent_gateway()
            if gw and assignment.server:
                spec = assignment.template.get_merged_spec()
                gw.send_command(assignment.server.agent_id, 'config_remediate', {
                    'assignment_id': assignment.id,
                    'spec': spec,
                })
        except Exception as e:
            logger.warning(f'Could not send remediate command: {e}')

        return assignment

    @staticmethod
    def get_server_assignments(server_id):
        return ServerTemplateAssignment.query.filter_by(server_id=server_id).all()

    @staticmethod
    def get_template_assignments(template_id):
        return ServerTemplateAssignment.query.filter_by(template_id=template_id).all()

    @staticmethod
    def get_compliance_summary():
        """Get fleet-wide compliance summary."""
        assignments = ServerTemplateAssignment.query.all()
        total = len(assignments)
        if total == 0:
            return {'total': 0, 'compliant': 0, 'drifted': 0, 'unknown': 0, 'compliance_pct': 100}

        compliant = sum(1 for a in assignments if a.status == 'compliant')
        drifted = sum(1 for a in assignments if a.status == 'drifted')
        unknown = total - compliant - drifted

        return {
            'total': total,
            'compliant': compliant,
            'drifted': drifted,
            'unknown': unknown,
            'compliance_pct': round(compliant / total * 100, 1) if total > 0 else 100,
        }

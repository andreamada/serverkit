import logging
import threading
import queue
import time
from datetime import datetime
from functools import wraps

logger = logging.getLogger(__name__)


class BackgroundJobService:
    """Simple background job queue for long-running tasks."""

    _queue = queue.Queue()
    _workers = []
    _results = {}
    _lock = threading.Lock()
    _running = False

    @classmethod
    def start(cls, app, num_workers=3):
        """Start background worker threads."""
        if cls._running:
            return

        cls._running = True

        for i in range(num_workers):
            t = threading.Thread(
                target=cls._worker_loop,
                args=(app,),
                daemon=True,
                name=f'bg-worker-{i}',
            )
            t.start()
            cls._workers.append(t)

        logger.info(f'Background job service started with {num_workers} workers')

    @classmethod
    def _worker_loop(cls, app):
        while cls._running:
            try:
                job = cls._queue.get(timeout=1)
            except queue.Empty:
                continue

            job_id = job['id']
            with cls._lock:
                cls._results[job_id] = {'status': 'running', 'started_at': datetime.utcnow().isoformat()}

            try:
                with app.app_context():
                    result = job['func'](*job.get('args', ()), **job.get('kwargs', {}))
                with cls._lock:
                    cls._results[job_id] = {
                        'status': 'completed',
                        'result': result,
                        'completed_at': datetime.utcnow().isoformat(),
                    }
            except Exception as e:
                logger.error(f'Background job {job_id} failed: {e}')
                with cls._lock:
                    cls._results[job_id] = {
                        'status': 'failed',
                        'error': str(e),
                        'completed_at': datetime.utcnow().isoformat(),
                    }
            finally:
                cls._queue.task_done()

    @classmethod
    def enqueue(cls, func, *args, job_id=None, **kwargs):
        """Add a job to the queue. Returns job_id."""
        import uuid
        job_id = job_id or str(uuid.uuid4())[:8]

        with cls._lock:
            cls._results[job_id] = {'status': 'queued', 'queued_at': datetime.utcnow().isoformat()}

        cls._queue.put({
            'id': job_id,
            'func': func,
            'args': args,
            'kwargs': kwargs,
        })

        return job_id

    @classmethod
    def get_job_status(cls, job_id):
        with cls._lock:
            return cls._results.get(job_id)

    @classmethod
    def list_jobs(cls):
        with cls._lock:
            return dict(cls._results)

    @classmethod
    def cleanup_old(cls, max_age_seconds=3600):
        """Remove completed/failed jobs older than max_age."""
        now = datetime.utcnow()
        with cls._lock:
            to_remove = []
            for jid, info in cls._results.items():
                if info['status'] in ('completed', 'failed'):
                    completed_at = info.get('completed_at')
                    if completed_at:
                        dt = datetime.fromisoformat(completed_at)
                        if (now - dt).total_seconds() > max_age_seconds:
                            to_remove.append(jid)
            for jid in to_remove:
                del cls._results[jid]

    @classmethod
    def get_queue_stats(cls):
        return {
            'queue_size': cls._queue.qsize(),
            'workers': len(cls._workers),
            'total_jobs': len(cls._results),
            'running': cls._running,
        }

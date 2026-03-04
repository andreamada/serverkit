"""Database migration service using Flask-Migrate (Alembic)."""

import os
import logging
import shutil
from datetime import datetime

from alembic import command
from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from alembic.migration import MigrationContext
from sqlalchemy import inspect as sa_inspect, text

logger = logging.getLogger(__name__)


class MigrationService:
    """Handles database migration detection, backup, and execution."""

    _needs_migration = False
    _current_revision = None
    _head_revision = None
    _pending_migrations = []

    @classmethod
    def _get_alembic_config(cls, app):
        """Build an Alembic config pointing at the migrations directory."""
        migrations_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'migrations')
        cfg = AlembicConfig()
        cfg.set_main_option('script_location', migrations_dir)
        cfg.set_main_option('sqlalchemy.url', app.config['SQLALCHEMY_DATABASE_URI'])
        return cfg

    @classmethod
    def _fix_missing_columns(cls, db):
        """Add columns that may be missing from existing tables.

        Runs raw SQL before any ORM queries to prevent crashes when models
        reference columns that don't exist in the database yet.
        """
        inspector = sa_inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if 'users' in existing_tables:
            cols = {c['name'] for c in inspector.get_columns('users')}
            if 'auth_provider' not in cols:
                logger.info('Adding missing column: users.auth_provider')
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'"
                    ))

    @classmethod
    def check_and_prepare(cls, app):
        """Called on startup to detect migration state.

        Three scenarios:
        1. Fresh install (no DB / no tables) -> upgrade head to create everything
        2. Existing install (tables exist, no alembic_version) -> stamp baseline, then check
        3. Normal state (alembic_version exists) -> compare current vs head
        """
        from app import db

        try:
            # Fix any missing columns before ORM queries can fail
            cls._fix_missing_columns(db)

            cfg = cls._get_alembic_config(app)
            script = ScriptDirectory.from_config(cfg)
            head = script.get_current_head()
            cls._head_revision = head

            inspector = sa_inspect(db.engine)
            existing_tables = inspector.get_table_names()
            has_alembic = 'alembic_version' in existing_tables

            # Count real application tables (exclude alembic_version)
            app_tables = [t for t in existing_tables if t != 'alembic_version']

            if not app_tables and not has_alembic:
                # Scenario 1: Fresh install — create everything via Alembic
                logger.info('Fresh install detected — running alembic upgrade head')
                with app.app_context():
                    command.upgrade(cfg, 'head')
                cls._needs_migration = False
                cls._current_revision = head
                cls._pending_migrations = []
                return

            if app_tables and not has_alembic:
                # Scenario 2: Existing install upgrading to Alembic
                # Run upgrade so migrations can add missing columns to existing tables
                logger.info('Existing install detected — running alembic upgrade head')
                with app.app_context():
                    command.upgrade(cfg, 'head')

            # Scenario 3 (or after stamping): Check current vs head
            with db.engine.connect() as conn:
                context = MigrationContext.configure(conn)
                current_heads = context.get_current_heads()
                cls._current_revision = current_heads[0] if current_heads else None

            if cls._current_revision != head:
                # Calculate pending migrations
                cls._pending_migrations = []
                for rev in script.walk_revisions():
                    if cls._current_revision and rev.revision == cls._current_revision:
                        break
                    cls._pending_migrations.append({
                        'revision': rev.revision,
                        'description': rev.doc or '',
                        'down_revision': rev.down_revision,
                    })
                cls._pending_migrations.reverse()
                if cls._pending_migrations:
                    logger.info(
                        f'Database migration needed: {len(cls._pending_migrations)} pending '
                        f'(current={cls._current_revision}, head={head}) — running upgrade'
                    )
                    with app.app_context():
                        command.upgrade(cfg, 'head')
                    cls._current_revision = head
                cls._needs_migration = False
            else:
                cls._needs_migration = False
                cls._pending_migrations = []

        except Exception as e:
            logger.error(f'Migration check failed: {e}')
            # Don't block startup on migration check failure — fall back to no-migration state
            cls._needs_migration = False

    @classmethod
    def get_status(cls):
        """Return current migration status."""
        return {
            'needs_migration': cls._needs_migration,
            'current_revision': cls._current_revision,
            'head_revision': cls._head_revision,
            'pending_count': len(cls._pending_migrations),
            'pending_migrations': cls._pending_migrations,
        }

    @classmethod
    def create_backup(cls, app):
        """Create a database backup before migration.

        SQLite: file copy. PostgreSQL: pg_dump.
        """
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

        try:
            if db_url.startswith('sqlite'):
                # Extract file path from sqlite:///path or sqlite:////path
                db_path = db_url.replace('sqlite:///', '')
                if not os.path.isabs(db_path):
                    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), db_path)

                if not os.path.exists(db_path):
                    return {'success': False, 'error': 'Database file not found'}

                backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
                os.makedirs(backup_dir, exist_ok=True)
                backup_name = f'serverkit_pre_migration_{timestamp}.db'
                backup_path = os.path.join(backup_dir, backup_name)

                shutil.copy2(db_path, backup_path)
                logger.info(f'Database backup created: {backup_path}')
                return {'success': True, 'path': backup_path}

            elif 'postgresql' in db_url:
                import subprocess
                backup_dir = '/var/serverkit/backups/db'
                os.makedirs(backup_dir, exist_ok=True)
                backup_name = f'serverkit_pre_migration_{timestamp}.sql'
                backup_path = os.path.join(backup_dir, backup_name)

                result = subprocess.run(
                    ['pg_dump', db_url, '-f', backup_path],
                    capture_output=True, text=True, timeout=300
                )
                if result.returncode != 0:
                    return {'success': False, 'error': result.stderr}

                logger.info(f'Database backup created: {backup_path}')
                return {'success': True, 'path': backup_path}

            else:
                return {'success': False, 'error': f'Unsupported database type'}

        except Exception as e:
            logger.error(f'Backup failed: {e}')
            return {'success': False, 'error': str(e)}

    @classmethod
    def apply_migrations(cls, app):
        """Run all pending Alembic migrations."""
        try:
            cfg = cls._get_alembic_config(app)

            with app.app_context():
                command.upgrade(cfg, 'head')

            # Update internal state
            from app import db
            with db.engine.connect() as conn:
                context = MigrationContext.configure(conn)
                current_heads = context.get_current_heads()
                cls._current_revision = current_heads[0] if current_heads else None

            cls._needs_migration = False
            cls._pending_migrations = []

            # Record in SystemSettings
            try:
                from app.models import SystemSettings
                from app import db as _db
                SystemSettings.set('schema_version', cls._current_revision)
                SystemSettings.set('last_migration_at', datetime.utcnow().isoformat())
                _db.session.commit()
            except Exception as e:
                logger.warning(f'Failed to record migration in settings: {e}')

            logger.info(f'Migrations applied successfully (now at {cls._current_revision})')
            return {'success': True, 'revision': cls._current_revision}

        except Exception as e:
            logger.error(f'Migration failed: {e}')
            return {'success': False, 'error': str(e)}

    @classmethod
    def get_migration_history(cls, app):
        """Return list of all Alembic revisions with descriptions."""
        try:
            cfg = cls._get_alembic_config(app)
            script = ScriptDirectory.from_config(cfg)

            revisions = []
            for rev in script.walk_revisions():
                revisions.append({
                    'revision': rev.revision,
                    'down_revision': rev.down_revision,
                    'description': rev.doc or '',
                    'is_current': rev.revision == cls._current_revision,
                    'is_head': rev.revision == cls._head_revision,
                })

            revisions.reverse()
            return revisions

        except Exception as e:
            logger.error(f'Failed to get migration history: {e}')
            return []

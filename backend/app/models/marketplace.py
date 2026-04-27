from datetime import datetime
from app import db
import json


class Extension(db.Model):
    """A marketplace extension/plugin."""
    __tablename__ = 'extensions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    display_name = db.Column(db.String(256), nullable=False)
    slug = db.Column(db.String(128), nullable=False, unique=True)
    description = db.Column(db.Text)
    long_description = db.Column(db.Text)
    version = db.Column(db.String(32), nullable=False)
    author = db.Column(db.String(128))
    homepage = db.Column(db.String(512))
    repository = db.Column(db.String(512))
    license = db.Column(db.String(64))

    # Classification
    category = db.Column(db.String(64))  # monitoring, security, deployment, integration, ui
    tags_json = db.Column(db.Text)

    # Extension type
    TYPE_WIDGET = 'widget'
    TYPE_API_HOOK = 'api_hook'
    TYPE_THEME = 'theme'
    TYPE_INTEGRATION = 'integration'
    extension_type = db.Column(db.String(32), default=TYPE_INTEGRATION)

    # Extension package
    entry_point = db.Column(db.String(256))
    config_schema_json = db.Column(db.Text)

    # Rating
    rating = db.Column(db.Float, default=0)
    rating_count = db.Column(db.Integer, default=0)
    download_count = db.Column(db.Integer, default=0)

    # Status
    STATUS_PUBLISHED = 'published'
    STATUS_DRAFT = 'draft'
    STATUS_DEPRECATED = 'deprecated'
    status = db.Column(db.String(32), default=STATUS_DRAFT)

    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    installs = db.relationship('ExtensionInstall', backref='extension', lazy='dynamic')

    @property
    def tags(self):
        return json.loads(self.tags_json) if self.tags_json else []

    @tags.setter
    def tags(self, v):
        self.tags_json = json.dumps(v)

    @property
    def config_schema(self):
        return json.loads(self.config_schema_json) if self.config_schema_json else {}

    @config_schema.setter
    def config_schema(self, v):
        self.config_schema_json = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'slug': self.slug,
            'description': self.description,
            'long_description': self.long_description,
            'version': self.version,
            'author': self.author,
            'homepage': self.homepage,
            'repository': self.repository,
            'license': self.license,
            'category': self.category,
            'tags': self.tags,
            'extension_type': self.extension_type,
            'config_schema': self.config_schema,
            'rating': self.rating,
            'rating_count': self.rating_count,
            'download_count': self.download_count,
            'status': self.status,
            'install_count': self.installs.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ExtensionInstall(db.Model):
    """Tracks extension installations."""
    __tablename__ = 'extension_installs'

    id = db.Column(db.Integer, primary_key=True)
    extension_id = db.Column(db.Integer, db.ForeignKey('extensions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    installed_version = db.Column(db.String(32))
    config_json = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    installed_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('extension_installs', lazy='dynamic'))

    @property
    def config(self):
        return json.loads(self.config_json) if self.config_json else {}

    @config.setter
    def config(self, v):
        self.config_json = json.dumps(v)

    def to_dict(self):
        return {
            'id': self.id,
            'extension_id': self.extension_id,
            'extension_name': self.extension.display_name if self.extension else None,
            'installed_version': self.installed_version,
            'config': self.config,
            'is_active': self.is_active,
            'installed_at': self.installed_at.isoformat() if self.installed_at else None,
        }

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(10), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), default='user')
    must_change_password = db.Column(db.Boolean, default=True)

class Metadata(db.Model):
    __tablename__ = "metadata"
    id = db.Column(db.Integer, primary_key=True)
    video = db.Column(db.String(200), nullable=False)
    frame = db.Column(db.Integer, nullable=False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    filesaved = db.Column(db.String(200), nullable=False)
    quality = db.Column(db.String(50))
    zone = db.Column(db.String(50))
    evaluator = db.Column(db.String(100), nullable=False)
    extra = db.Column(JSONB)  # campos flexibles

class MetadataRecuperado(db.Model):
    __tablename__ = "metadataRecuperado"
    id = db.Column(db.Integer, primary_key=True)
    video = db.Column(db.String(200), nullable=False)
    frame = db.Column(db.Integer, nullable=False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    filesaved = db.Column(db.String(200), nullable=False)
    quality = db.Column(db.String(50))
    zone = db.Column(db.String(50))
    evaluator = db.Column(db.String(100), nullable=False)
    extra = db.Column(JSONB)  # campos flexibles

class MetadataRM(db.Model):
    __tablename__ = "metadataRM"
    id = db.Column(db.Integer, primary_key=True)
    imageoriginal = db.Column(db.String(200), nullable=False)
    filesaved = db.Column(db.String(200), nullable=False)
    zone = db.Column(db.String(50))
    evaluator = db.Column(db.String(100), nullable=False)

class BrushSetting(db.Model):
    __tablename__ = "brush_settings"
    id = db.Column(db.Integer, primary_key=True)
    app_name = db.Column(db.String(100), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    structure_name = db.Column(db.String(100), nullable=False)
    width = db.Column(db.String(3), nullable=False, default="20")
    __table_args__ = (
        db.UniqueConstraint('app_name', 'zone', 'structure_name'),
    )
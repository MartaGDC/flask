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

class ElectrolysisQuality(db.Model):
    __tablename__ = "electrolysis_quality"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(200), nullable=False)
    video = db.Column(db.String(200), nullable=False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    evaluator = db.Column(db.String(100), nullable=False)
    glcm = db.Column(JSONB, nullable=True)
    features_GLDS = db.Column(JSONB, nullable=True)
    haar_mean = db.Column(db.Float, nullable=False)
    haar_variance = db.Column(db.Float, nullable=False)
    point = db.Column(JSONB, nullable=True)

class ElectrolysisBone(db.Model):
    __tablename__ = "electrolysis_bone"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(200), nullable=False)
    video = db.Column(db.String(200), nullable=False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    evaluator = db.Column(db.String(100), nullable=False)
    contours = db.Column(db.Integer, nullable=True)
    area = db.Column(db.Float, nullable=True)
    perimeter = db.Column(db.Float, nullable=True)
    convex = db.Column(db.Float, nullable=True)
    homogeneity = db.Column(db.Float, nullable=True)
    contrast = db.Column(db.Float, nullable=True)
    correlation = db.Column(db.Float, nullable=True)
    point = db.Column(JSONB, nullable=True)

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

class ElectrolysisQuality2(db.Model):
    __tablename__ = "electrolysis_quality2"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(200), nullable=False)
    video = db.Column(db.String(200), nullable=False)
    zona = db.Column(db.String(200), nullable = False)
    estructrua = db.Column(db.String(200), nullable = False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    frameMask = db.Column(db.String(200), nullable=False)
    evaluator = db.Column(db.String(100), nullable=False)

    glcm_contrast = db.Column(db.Float, nullable=True)
    glcm_sumAvg = db.Column(db.Float, nullable=True)
    glcm_sumOfVar2 = db.Column(db.Float, nullable=True)
    glcm_diffVar = db.Column(db.Float, nullable=True)
    glcm_correlation = db.Column(db.Float, nullable=True)
    glcm_invDiffMoment = db.Column(db.Float, nullable=True)
    glds_homogeneity = db.Column(db.Float, nullable=True)
    glds_contrast = db.Column(db.Float, nullable=True)
    glds_asm = db.Column(db.Float, nullable=True)
    glds_entropy = db.Column(db.Float, nullable=True)
    glds_mean = db.Column(db.Float, nullable=True)
    haar_mean = db.Column(db.Float, nullable=False)
    haar_variance = db.Column(db.Float, nullable=False)
    point = db.Column(JSONB, nullable=True)

class ElectrolysisBone2(db.Model):
    __tablename__ = "electrolysis_bone2"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(200), nullable=False)
    video = db.Column(db.String(200), nullable=False)
    zona = db.Column(db.String(200), nullable = False)
    estructrua = db.Column(db.String(200), nullable = False)
    frameoriginal = db.Column(db.String(200), nullable=False)
    frameMask = db.Column(db.String(200), nullable=False)
    evaluator = db.Column(db.String(100), nullable=False)
    threshold = db.Column(db.Integer, nullable=False)
    
    contours = db.Column(db.Integer, nullable=True)
    area = db.Column(db.Float, nullable=True)
    perimeter = db.Column(db.Float, nullable=True)
    convex = db.Column(db.Float, nullable=True)
    homogeneity = db.Column(db.Float, nullable=True)
    contrast = db.Column(db.Float, nullable=True)
    correlation = db.Column(db.Float, nullable=True)
    point = db.Column(JSONB, nullable=True)

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
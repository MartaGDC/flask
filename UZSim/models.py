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

class Zonas (db.Model):
    __tablename__ = "zonas"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Cortes (db.Model):
    __tablename__ = "cortes"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) 

class Orientacion (db.Model):
    __tablename__ = "orientacion"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

'''class ZonaCorteOrientacion (db.Model):
    __tablename__ = "zona_corte_orientacion"
    id = db.Column(db.Integer, primary_key=True)
    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=False)
    corte_id = db.Column(db.Integer, db.ForeignKey('cortes.id'), nullable=False)
    orientacion_id = db.Column(db.Integer, db.ForeignKey('orientacion.id'), nullable=False)
    mapa_url = db.Column(db.String(200), nullable=True)
    video_url = db.Column(db.String(200), nullable=True)'''

class ZonaCorteEstructura (db.Model):
    __tablename__ = "zona_corte_estructura"
    id = db.Column(db.Integer, primary_key=True)
    corte_id = db.Column(db.Integer, db.ForeignKey('cortes.id'), nullable=False)
    zone_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=False)
    name_structure = db.Column(db.String(50), unique=True, nullable=True)

class ConjuntoMapa (db.Model):
    __tablename__ = "conjunto_mapa"
    id = db.Column(db.Integer, primary_key=True)
    zce_id = db.Column(db.Integer, db.ForeignKey('zona_corte_estructura.id'), nullable=False)
    orientacion_id = db.Column(db.Integer, db.ForeignKey('orientacion.id'), nullable=False)
    mapa_url = db.Column(db.String(200), nullable=True)
    video_url = db.Column(db.String(200), nullable=True)

class Mascaras (db.Model):
    __tablename__ = "mascaras"
    id = db.Column(db.Integer, primary_key=True)
    id_cm = db.Column(db.Integer, db.ForeignKey('conjunto_mapa.id'), nullable=False)
    mascara_url = db.Column(db.String(200), nullable=True)
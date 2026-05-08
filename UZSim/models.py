import enum
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(10), unique=True, nullable=False)
    role = db.Column(db.String(10), default='user')


class Proyectos(enum.Enum):
    CAR = "Aprendizaje Ecografía"
    CERF = "Aprendizaje Fisiología"
    SF = "Simulación Fisiológica"
    SP = "Simulación Patológica"
class Proyecto(db.Model):
    __tablename__= "proyecto"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Enum(Proyectos), nullable=False)

class Cortes (db.Model):
    __tablename__ = "cortes"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) 

class Zonas (db.Model):
    __tablename__ = "zonas"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Orientacion (db.Model):
    __tablename__ = "orientacion"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Ficha (db.Model):
    __tablename__ = "ficha"
    id = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=False)
    corte_id = db.Column(db.Integer, db.ForeignKey('cortes.id'), nullable=True)
    orientacion_id = db.Column(db.Integer, db.ForeignKey('orientacion.id'), nullable=True)

class ConjuntoMapa (db.Model):
    __tablename__ = "conjunto_mapa"
    id = db.Column(db.Integer, primary_key=True)
    id_ficha = db.Column(db.Integer, db.ForeignKey('ficha.id'), nullable=False)
    mapa_url = db.Column(db.String(200), nullable=True)

class Mascaras (db.Model):
    __tablename__ = "mascaras"
    id = db.Column(db.Integer, primary_key=True)
    id_cm = db.Column(db.Integer, db.ForeignKey('conjunto_mapa.id'), nullable=False)
    mascara_url = db.Column(db.String(200), nullable=True)



# Simulacion
class Estructura (db.Model): #Para SF y SP
    __tablename__ = "estructura"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=False)
    corte_id = db.Column(db.Integer, db.ForeignKey('cortes.id'), nullable=False)

class Patologia (db.Model): #Para SP
    __tablename__ = "patologia"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    estructura_id = db.Column(db.Integer, db.ForeignKey('estructura.id'), nullable=False)

class Exploración (db.Model): #Para SP, detalles de la sonda
    __tablename__ = "exploracion"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    orientacion_id = db.Column(db.Integer, db.ForeignKey('orientacion.id'), nullable=False)

class FichaSF (db.Model):
    __tablename__ = "fichaSF"
    id = db.Column(db.Integer, primary_key=True)
    estructura_id = db.Column(db.Integer, db.ForeignKey('estructura.id'), nullable=False)

class FichaSP (db.Model):
    __tablename__ = "fichaSP"
    id = db.Column(db.Integer, primary_key=True)
    patologia_id = db.Column(db.Integer, db.ForeignKey('patologia.id'), nullable=False)
    exploracion_id = db.Column(db.Integer, db.ForeignKey('exploracion.id'), nullable=True)

class ConjuntoMapaSF (db.Model):
    __tablename__ = "conjunto_mapaSF"
    id = db.Column(db.Integer, primary_key=True)
    id_fichasf = db.Column(db.Integer, db.ForeignKey('fichaSF.id'), nullable=False)
    mapa_url = db.Column(db.String(200), nullable=True)
    video_url = db.Column(db.String(200), nullable=True)

class ConjuntoMapaSP (db.Model):
    __tablename__ = "conjunto_mapaSP"
    id = db.Column(db.Integer, primary_key=True)
    id_fichasp = db.Column(db.Integer, db.ForeignKey('fichaSP.id'), nullable=False)
    mapa_url = db.Column(db.String(200), nullable=True)
    video_url = db.Column(db.String(200), nullable=True)

class MascarasSF (db.Model):
    __tablename__ = "mascarasSF"
    id = db.Column(db.Integer, primary_key=True)
    id_cmsf = db.Column(db.Integer, db.ForeignKey('conjunto_mapaSF.id'), nullable=False)
    mascara_url = db.Column(db.String(200), nullable=True)

class MascarasSP (db.Model):
    __tablename__ = "mascarasSP"
    id = db.Column(db.Integer, primary_key=True)
    id_cmsp = db.Column(db.Integer, db.ForeignKey('conjunto_mapaSP.id'), nullable=False)
    mascara_url = db.Column(db.String(200), nullable=True)
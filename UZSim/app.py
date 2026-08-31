from flask import Flask, render_template, redirect, request, jsonify, session, send_file, send_from_directory
from functools import wraps
import jwt
import json
import os, io, base64
from PIL import Image
import SimpleITK as sitk
import skimage.io
from skimage import feature, measure, morphology
import pyfeats as pf
import pywt as pw
import numpy as np
import math
from sqlalchemy import text
import csv, zipfile
from io import StringIO, BytesIO
from datetime import datetime
from models import db, User, Proyecto, Zonas, Cortes, Orientacion, Ficha, Estructura, FichaSF, Patologia, Exploracion, FichaSP, ConjuntoMapa, ConjuntoMapaSF, ConjuntoMapaSP, Mascaras, MascarasSF, MascarasSP
from config import SECRET_KEY, DATABASE_URI, BASE_DIR


#from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SECRET_KEY'] = SECRET_KEY
db.init_app(app)
with app.app_context():
    db.create_all()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = (
            request.cookies.get('token') or 
            request.args.get('token')
        )
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            username = payload["username"]
            user = User.query.filter_by(username=username).first()
            if not user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        return f(user, *args, **kwargs)
    return decorated


def user_can_access(user):
    if user.role=='admin':
        return True

@app.route('/UZSim')
@token_required
def index(user):
    if not user_can_access(user):
        return redirect("http://localhost/index.php")
    return render_template('index_UZSim.html', user=user.username, title='UZSim') 


#Añadir opciones
@app.route('/crearProyecto', methods=['POST'])
def createProyecto():
    name = request.json
    proyecto = Proyecto.query.filter_by(name=name).first()
    if not proyecto:
        nuevoProyecto = Proyecto(name=name)
        db.session.add(nuevoProyecto)
        db.session.commit()
    return jsonify({"status": "success"}), 200


#Obtener zonas
@app.route('/api/zonas', methods=['GET'])
def get_zonas():
    proyecto_name = request.args.get('proyecto')
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        zonas = (
            db.session.query(Zonas)
            .join(Ficha, Zonas.id == Ficha.zona_id)
            .filter(Ficha.proyecto_id == proyecto.id)
            .distinct()
            .all()
        )
    elif proyecto_name == 'SF':
        zonas = (
            db.session.query(Zonas)
            .join(Estructura, Zonas.id == Estructura.zona_id)
            .join(FichaSF, Estructura.id == FichaSF.estructura_id)
            .distinct()
            .all()
        )
    else:
        proyecto = Proyecto.query.filter_by(name=proyecto_name).first() #SP o CERP
        zonas = (
            db.session.query(Zonas)
            .join(Estructura, Zonas.id == Estructura.zona_id)
            .filter(Estructura.proyecto_id == proyecto.id)
            .distinct()
            .all()
        )
    return jsonify([zona.name for zona in zonas])

#Añadir zonas
@app.route('/crearZona', methods=['POST'])
def createZone():
    proyecto_name = request.json["proyecto"]
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    zona_name = request.json["zona"]
    nueva_zona = Zonas.query.filter_by(name=zona_name).first()
    if not nueva_zona:
        nueva_zona = Zonas(name=zona_name)
        db.session.add(nueva_zona)
        db.session.flush()

    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        nuevaFicha = Ficha(
            proyecto_id = proyecto.id,
            zona_id = nueva_zona.id,
        )
        db.session.add(nuevaFicha)
        db.session.flush()
        nuevoMapa = ConjuntoMapa(
            id_ficha = nuevaFicha.id
        )
        db.session.add(nuevoMapa)
    else:
        nuevaEstructura = Estructura(
            name = None,
            zona_id = nueva_zona.id,
            corte_id = None,
            proyecto_id = proyecto.id
        )
        db.session.add(nuevaEstructura)
        db.session.flush()

        if proyecto_name=="SF":
            nuevaFicha = FichaSF(
                estructura_id = nuevaEstructura.id,
                orientacion_id = None
            )
            db.session.add(nuevaFicha)
            db.session.flush()
            nuevoMapa = ConjuntoMapaSF(
                id_fichasf = nuevaFicha.id,
            )
            db.session.add(nuevoMapa)

        else: #CERP o SP
            nuevaPatologia = Patologia(
                name = None,
                estructura_id = nuevaEstructura.id
            )
            nuevaFicha = FichaSP(
                patologia_id = nuevaPatologia.id,
                exploracion_id = None
            )
            db.session.add(nuevaFicha)
            db.session.flush()
            nuevoMapa = ConjuntoMapaSP(
                id_fichasp = nuevaFicha.id,
            )
            db.session.add(nuevoMapa)

    db.session.commit()
    return jsonify({"status": "success"}), 200

#Obtener cortes
@app.route('/api/cortes', methods=['GET'])
def get_cortes():
    '''Cortes definidos y presentes en la zona seleccionada'''
    proyecto_name = request.args.get('proyecto')
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    zona_name = request.args.get('zona')
    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        cortes = (
            db.session.query(Cortes)
            .join(Ficha, Cortes.id == Ficha.corte_id)
            .join(Zonas, Zonas.id == Ficha.zona_id)
            .filter(Zonas.name == zona_name, Ficha.proyecto_id == proyecto.id)
            .distinct()
            .all()
        )
    else:
        cortes = (
            db.session.query(Cortes)
            .join(Estructura, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .filter(Zonas.name == zona_name, Estructura.proyecto_id == proyecto.id)
            .distinct()
            .all()
        )
    return jsonify([corte.name for corte in cortes])

#Añadir cortes
@app.route('/crearCorte', methods=['POST'])
def createCorte():
    proyecto_name = request.json["proyecto"]
    name = request.json["name"]
    zona_name = request.json["zona"]
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    if not name:
        return jsonify({"error": "Missing name"}), 400
    corte = Cortes.query.filter_by(name=name).first()
    if not corte:
        corte = Cortes(name=name)
        db.session.add(corte)
        db.session.flush()
    zona = Zonas.query.filter_by(name=zona_name).first()

    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        nuevaFicha = Ficha.query.filter_by(
            proyecto_id=proyecto.id,
            zona_id=zona.id,
            corte_id=None,
            orientacion_id=None
        ).first()
        if nuevaFicha:
            nuevaFicha.corte_id = corte.id
        else:
            nuevaFicha=Ficha(
                proyecto_id=proyecto.id,
                zona_id=zona.id,
                corte_id=corte.id,
                orientacion_id=None
            )
            db.session.add(nuevaFicha)
            db.session.flush()
            nuevoMapa = ConjuntoMapa(
                id_ficha = nuevaFicha.id
            )
            db.session.add(nuevoMapa)
        
    else:
        nuevaEstructura = Estructura.query.filter_by(
            proyecto_id = proyecto.id,
            zona_id = zona.id,
            corte_id = None
        ).first()
        if nuevaEstructura:
            nuevaEstructura.corte_id = corte.id
        else:
            nuevaEstructura=Estructura(
                zona_id=zona.id,
                corte_id=corte.id,
                name=None,
                proyecto_id = proyecto.id
            )
            db.session.add(nuevaEstructura)
            db.session.flush()
            if proyecto_name == 'SF':
                nuevaFicha = FichaSF(
                    estructura_id = nuevaEstructura.id
                )
                db.session.add(nuevaFicha)
                db.session.flush()
                nuevoMapa = ConjuntoMapaSF(
                    id_fichasf = nuevaFicha.id
                )
                db.session.add(nuevoMapa)
            else:
                nuevaPatologia = Patologia(
                    name = None,
                    estructura_id = nuevaEstructura.id
                )
                nuevaFicha = FichaSP(
                    patologia_id = nuevaPatologia.id,
                    exploracion_id = None
                )
                db.session.add(nuevaFicha)
                db.session.flush()
                nuevoMapa = ConjuntoMapaSP(
                    id_fichasp = nuevaFicha.id,
                )
                db.session.add(nuevoMapa)

    db.session.commit()
    return jsonify({"status": "success"}), 200

#Obtener estructuras
@app.route('/api/estructuras', methods=['GET'])
def get_estructuras():
    '''Estruturas definidas y presentes en la zona y corte seleccionados'''
    zona_name = request.args.get("zona")
    corte_name = request.args.get('corte')
    proyecto_name = request.args.get('proyecto')
    estructuras = (
        db.session.query(Estructura)
        .join(Cortes, Cortes.id == Estructura.corte_id)
        .join(Zonas, Zonas.id == Estructura.zona_id)
        .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
        .filter(Zonas.name == zona_name, Cortes.name == corte_name, Proyecto.name == proyecto_name)
        .distinct()
        .all()
    )
    return jsonify([estructura.name for estructura in estructuras])

#Añadir estructuras
@app.route('/crearEstructura', methods=['POST'])
def createEstructura():
    proyecto_name = request.json["proyecto"]
    corte_name = request.json["corte"]
    zona_name = request.json["zona"]
    nombre = request.json["nombre"]
    zona = Zonas.query.filter_by(name=zona_name).first()
    corte = Cortes.query.filter_by(name=corte_name).first()
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    if not nombre:
        return jsonify({"error": "Missing estructure name"})
    nuevaEstructura = Estructura.query.filter_by(
        name=nombre,
        zona_id = zona.id,
        corte_id = corte.id,
        proyecto_id = proyecto.id
    ).first()
    if not nuevaEstructura:
        nuevaEstructura = (
            db.session.query(Estructura)
            .join(Cortes, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
            .filter(Zonas.name == zona_name, Cortes.name == corte_name, Proyecto.name == proyecto_name, Estructura.name == None)
            .distinct()
            .first()
        )
        if nuevaEstructura:
            nuevaEstructura.name = nombre
        else:
            nuevaEstructura = Estructura(
                name = nombre,
                zona_id = zona.id,
                corte_id = corte.id,
                proyecto_id = proyecto.id
            )
            db.session.add(nuevaEstructura)
            db.session.flush()
            if proyecto_name == 'SF':
                nuevaFicha = FichaSF(
                    estructura_id = nuevaEstructura.id,
                    orientacion_id = None
                )
                db.session.add(nuevaFicha)
                db.session.flush()
                nuevoMapa = ConjuntoMapaSF(
                    id_fichasf = nuevaFicha.id,
                )
                db.session.add(nuevoMapa)
            else:
                nuevaPatologia = Patologia(
                    name = None,
                    estructura_id = nuevaEstructura.id
                )
                db.session.add(nuevaPatologia)
                db.session.flush()
                nuevaFicha = FichaSP(
                    patologia_id= nuevaPatologia.id,
                    exploracion_id = None
                )
                db.session.add(nuevaFicha)
                db.session.flush()
                nuevoMapa = ConjuntoMapaSP(
                    id_fichasp = nuevaFicha.id
                )
                db.session.add(nuevoMapa)
    db.session.commit()
    return jsonify({"status": "success"}), 200


#Obtener patologias
@app.route('/api/patologias', methods=['GET'])
def get_patologias():
    '''Orientaciones definidas y presentes en la zona, corte y estructura seleccionados'''
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    estructura_name = request.args.get('estructura')
    proyecto_name = request.args.get('proyecto')
    patologias = (
        db.session.query(Patologia)
        .join(FichaSP, Patologia.id == FichaSP.patologia_id)
        .join(Estructura, Estructura.id == Patologia.estructura_id)
        .join(Cortes, Cortes.id == Estructura.corte_id)
        .join(Zonas, Zonas.id == Estructura.zona_id)
        .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
        .filter(Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name, Proyecto.name == proyecto_name)
        .distinct()
        .all()
    )
    return jsonify([patologia.name for patologia in patologias])

#Añadir patologia
@app.route('/crearPatologia', methods=['POST'])
def createPatologia():
    proyecto_name = request.json["proyecto"]
    corte_name = request.json["corte"]
    zona_name = request.json["zona"]
    estructura_name = request.json["estructura"]
    patologia_name = request.json["patologia"]
    zona = Zonas.query.filter_by(name=zona_name).first()
    corte = Cortes.query.filter_by(name=corte_name).first()
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    estructura = Estructura.query.filter_by(
        name = estructura_name,
        zona_id = zona.id,
        corte_id = corte.id,
        proyecto_id = proyecto.id
    ).first()
    if not patologia_name:
        return jsonify({"error": "Missing pathology"})
    
    nuevaPatologia = Patologia.query.filter_by(
        estructura_id=estructura.id,
        name = None
    ).first()
    if nuevaPatologia:
        nuevaPatologia.name = patologia_name
    else:
        nuevaPatologia = Patologia(
            estructura_id = estructura.id,
            name = patologia_name
        )
        db.session.add(nuevaPatologia)
        db.session.flush()
        fichaSP = FichaSP(
            patologia_id = nuevaPatologia.id,
            exploracion_id = None
        )
        db.session.add(fichaSP)
        db.session.flush()
        nuevoMapa = ConjuntoMapaSP(
            id_fichasp = fichaSP.id,
        )
        db.session.add(nuevoMapa)
    db.session.commit()
    return jsonify({"status": "success"}), 200


#Obtener orientaciones
@app.route('/api/orientaciones', methods=['GET'])
def get_orientaciones():
    '''Orientaciones definidas y presentes en la zona, corte y estructura (y patologia) seleccionados'''
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    estructura_name = request.args.get('estructura')
    patologia_name = request.args.get('patologia')
    exploracion_name = request.args.get('exploracion')
    proyecto_name = request.args.get('proyecto')
    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP': #En estos la orientacion se rellan tras la exploracion.
        orientaciones = (
            db.session.query(Orientacion)
            .join(Ficha, Orientacion.id == Ficha.orientacion_id)
            .join(Cortes, Cortes.id == Ficha.corte_id)
            .join(Zonas, Zonas.id == Ficha.zona_id)
            .filter(Zonas.name == zona_name, Cortes.name == corte_name)
            .distinct()
            .all()
        )
    elif proyecto_name == 'SF':
        orientaciones = (
            db.session.query(Orientacion)
            .join(FichaSF, Orientacion.id == FichaSF.orientacion_id)
            .join(Estructura, Estructura.id == FichaSF.estructura_id)
            .join(Cortes, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .filter(Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name)
            .distinct()
            .all()
        )
    else:
        orientaciones = (
            db.session.query(Orientacion)
            .join(Exploracion, Orientacion.id == Exploracion.orientacion_id)
            .join(FichaSP, Exploracion.id == FichaSP.exploracion_id)
            .join(Patologia, Patologia.id == FichaSP.patologia_id)
            .join(Estructura, Estructura.id == Patologia.estructura_id)
            .join(Cortes, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
            .filter(Proyecto.name == proyecto_name, Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name, Exploracion.name == exploracion_name, Patologia.name == patologia_name)
            .distinct()
            .all()
        )
    return jsonify([orientacion.name for orientacion in orientaciones])

#Añadir orientaciones
@app.route('/crearOrientacion', methods=['POST'])
def createOrientacion():
    proyecto_name = request.json["proyecto"]
    corte_name = request.json["corte"]
    zona_name = request.json["zona"]
    estructura_name = request.json["estructura"]
    orientacion_name = request.json["orientacion"]
    patologia_name = request.json['patologia']
    exploracion_name = request.json['exploracion']
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    zona = Zonas.query.filter_by(name=zona_name).first()
    corte = Cortes.query.filter_by(name=corte_name).first()
    if not orientacion_name:
        return jsonify({"error": "Missing orientation"})
    nuevaOrientacion = Orientacion.query.filter_by(name=orientacion_name).first()
    if not nuevaOrientacion:
        nuevaOrientacion = Orientacion(name=orientacion_name)
        db.session.add(nuevaOrientacion)
        db.session.flush()

    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        ficha = Ficha.query.filter_by(
            proyecto_id=proyecto.id,
            zona_id=zona.id,
            corte_id=corte.id,
            orientacion_id=None
        ).first()
        if ficha:
            ficha.orientacion_id = nuevaOrientacion.id
        else:
            ficha = Ficha(
                proyecto_id=proyecto.id,
                zona_id=zona.id,
                corte_id=corte.id,
                orientacion_id=nuevaOrientacion.id
            )
            db.session.add(ficha)
            db.session.flush()
            nuevoMapa = ConjuntoMapa(
                id_ficha = ficha.id,
            )
            db.session.add(nuevoMapa)
    else:
        estructura = Estructura.query.filter_by(
            name=estructura_name,
            zona_id = zona.id,
            corte_id = corte.id,
            proyecto_id = proyecto.id
        ).first()
        if proyecto_name == 'SF':  
            fichaSF = (
                db.session.query(FichaSF)
                .join(Estructura, Estructura.id == FichaSF.estructura_id)
                .join(Cortes, Cortes.id == Estructura.corte_id)
                .join(Zonas, Zonas.id == Estructura.zona_id)
                .filter(Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name, FichaSF.orientacion_id == None)
                .distinct()
                .first()
            )
            if fichaSF:
                fichaSF.orientacion_id = nuevaOrientacion.id
            else:
                fichaSF = FichaSF(
                    estructura_id = estructura.id,
                    orientacion_id = nuevaOrientacion.id
                )
                db.session.add(fichaSF)
                db.session.flush()
                nuevoMapa = ConjuntoMapaSF(
                    id_fichasf = fichaSF.id,
                )
                db.session.add(nuevoMapa)
        else:
            patologia_name = request.json["patologia"]
            patologia = Patologia.query.filter_by(
                name = patologia_name,
                estructura_id = estructura.id
            ).first()
            exploracion = Exploracion.query.filter_by(
                name = exploracion_name,
                orientacion_id = None
            ).first()
            if exploracion:
                exploracion.orientacion_id = nuevaOrientacion.id
            else:
                exploracion = Exploracion(
                    name = exploracion_name,
                    orientacion_id = nuevaOrientacion.id
                )
                db.session.add(exploracion)
                db.session.flush()
                fichaSP = (
                    db.session.query(FichaSP)
                    .join(Patologia, Patologia.id == FichaSP.patologia_id)
                    .join(Exploracion, Exploracion.id == FichaSP.exploracion_id)
                    .filter(FichaSP.patologia_id == patologia.id, FichaSP.exploracion_id == None)
                    .distinct()
                    .first()
                )
                if fichaSP:
                    fichaSP.exploracion_id = exploracion.id
                else:
                    fichaSP = FichaSP(
                        patologia_id = patologia.id,
                        exploracion_id = exploracion.id
                    )
                    db.session.add(fichaSP)
                    db.session.flush()
                    nuevoMapa = ConjuntoMapaSP(
                        id_fichasp = fichaSP.id,
                    )
                    db.session.add(nuevoMapa)

    db.session.commit()
    return jsonify({"status": "success"}), 200


#Obtener exploraciones
@app.route('/api/exploraciones', methods=['GET'])
def get_exploraciones():
    proyecto_name = request.args.get('proyecto')
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    estructura_name = request.args.get('estructura')
    patologia_name = request.args.get('patologia')
    exploraciones = ( 
        db.session.query(Exploracion)
        .join(FichaSP, Exploracion.id == FichaSP.exploracion_id)
        .join(Patologia, Patologia.id == FichaSP.patologia_id)
        .join(Estructura, Estructura.id == Patologia.estructura_id)
        .join(Cortes, Cortes.id == Estructura.corte_id)
        .join(Zonas, Zonas.id == Estructura.zona_id)
        .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
        .filter(Proyecto.name == proyecto_name, Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name, Patologia.name == patologia_name)
        .distinct()
        .all()
    )
    return jsonify([exploracion.name for exploracion in exploraciones])

#Añadir exploraciones
@app.route('/crearExploracion', methods=['POST'])
def createExploracion():
    proyecto_name = request.json["proyecto"]
    corte_name = request.json["corte"]
    zona_name = request.json["zona"]
    estructura_name = request.json["estructura"]
    patologia_name = request.json['patologia']
    exploracion_name = request.json['exploracion']
    zona = Zonas.query.filter_by(name=zona_name).first()
    corte = Cortes.query.filter_by(name=corte_name).first()
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    estructura = Estructura.query.filter_by(
        name = estructura_name,
        zona_id = zona.id,
        corte_id = corte.id,
        proyecto_id = proyecto.id
    ).first()
    patologia = Patologia.query.filter_by(
        name = patologia_name,
        estructura_id = estructura.id
    ).first()
    
    nuevaExploracion = Exploracion.query.filter_by(name=exploracion_name).first()
    if not nuevaExploracion:
        nuevaExploracion = Exploracion(
            name=exploracion_name,
            orientacion_id = None
        )
        db.session.add(nuevaExploracion)
        db.session.flush()

        fichaSP = FichaSP(
            patologia_id = patologia.id,
            exploracion_id = nuevaExploracion.id
        )
        db.session.add(fichaSP)
        db.session.flush()
        nuevoMapa = ConjuntoMapaSP(
            id_fichasp = fichaSP.id,
        )
        db.session.add(nuevoMapa)

    db.session.commit()
    return jsonify({"status": "success"}), 200

#Get imagenes 
@app.route('/api/images', methods=['GET'])
def get_images():
    '''Imagenes presentes en la ficha correspondiente (zona y corte, con orientacion, patologia ... segun proyecto)'''
    proyecto_name = request.args.get('proyecto')
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    estructura_name = request.args.get('estructura')
    orientacion_name = request.args.get('orientacion')
    patologia_name = request.args.get('patologia')
    exploracion_name = request.args.get('exploracion')
    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        if corte_name: #CERF
            ficha = (
                db.session.query(Ficha)
                .join(Proyecto, Proyecto.id == Ficha.proyecto_id)
                .join(Zonas, Zonas.id == Ficha.zona_id)
                .join(Cortes, Cortes.id == Ficha.corte_id)
                .join(Orientacion, Orientacion.id == Ficha.orientacion_id)
                .filter(Zonas.name == zona_name, Cortes.name == corte_name, Orientacion.name == orientacion_name, Proyecto.name == proyecto_name)
                .first()
            )
        else: #CAR
            ficha = (
                db.session.query(Ficha)
                .join(Proyecto, Proyecto.id == Ficha.proyecto_id)
                .join(Zonas, Zonas.id == Ficha.zona_id)
                .filter(Zonas.name == zona_name, Proyecto.name == proyecto_name)
                .first()
            )
        mapa = (
            db.session.query(ConjuntoMapa)
            .filter(ConjuntoMapa.id_ficha == ficha.id)
            .first()
        )
        mascaras = (
            db.session.query(Mascaras)
            .filter(Mascaras.id_cm == mapa.id)
            .all()
        )
        return jsonify([mapa.mapa_url, [m.mascara_url for m in mascaras]])
    else:
        orientacion = Orientacion.query.filter_by(name=orientacion_name).first()
        estructura = (
            db.session.query(Estructura)
            .join(Cortes, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
            .filter(Proyecto.name == proyecto_name, Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name)
            .distinct()
            .first() 
        )
        if proyecto_name == 'SF':
            ficha = (
                db.session.query(FichaSF)
                .filter(estructura.id == FichaSF.estructura_id, orientacion.id == FichaSF.orientacion_id)
                .distinct()
                .first()
            )
            mapa = (
                db.session.query(ConjuntoMapaSF)
                .filter(ConjuntoMapaSF.id_fichasf == ficha.id)
                .first()
            )
            mascaras = (
                db.session.query(MascarasSF)
                .filter(MascarasSF.id_cmsf == mapa.id)
                .all()
            )
        else:
            patologia = (
                db.session.query(Patologia)
                .filter(Patologia.name == patologia_name, Patologia.estructura_id == estructura.id)
                .distinct()
                .first()
            )
            exploracion = (
                db.session.query(Exploracion)
                .filter(Exploracion.name == exploracion_name, Exploracion.orientacion_id == orientacion.id)
                .distinct()
                .first()
            )
            ficha = (
                db.session.query(FichaSP)
                .filter(FichaSP.patologia_id == patologia.id, FichaSP.exploracion_id == exploracion.id)
                .distinct()
                .first()
            )
            mapa = (
                db.session.query(ConjuntoMapaSP)
                .filter(ConjuntoMapaSP.id_fichasp == ficha.id)
                .first()
            )
            mascaras = (
                db.session.query(MascarasSP)
                .filter(MascarasSP.id_cmsp == mapa.id)
                .all()
            )
        return jsonify([mapa.mapa_url, mapa.video_url, [m.mascara_url for m in mascaras]])

#Guardar imagenes
@app.route('/save', methods=['POST'])
def save_images():
    mapa_dir = os.path.join(app.root_path, "static", "mapa")
    video_dir = os.path.join(app.root_path, "static", "video")
    ecos_dir = os.path.join(app.root_path, "static", "ecos")
    os.makedirs(mapa_dir, exist_ok=True)
    os.makedirs(video_dir, exist_ok=True)
    os.makedirs(ecos_dir, exist_ok=True)

    proyecto_name = request.form.get("proyecto")
    zona_name = request.form.get("zona")
    corte_name = request.form.get("corte")
    orientacion_name = request.form.get("orientacion")
    estructura_name = request.form.get("estructura")
    proyecto = Proyecto.query.filter_by(name=proyecto_name).first()
    zona = Zonas.query.filter_by(name=zona_name).first()
    
    if proyecto_name != 'SF' and proyecto_name != 'SP' and proyecto_name != 'CERP':
        if not corte_name: #CAR
            ficha = Ficha.query.filter_by(
                proyecto_id=proyecto.id,
                zona_id=zona.id,
                corte_id=None,
                orientacion_id=None
            ).first()
        else: #CERF
            corte = Cortes.query.filter_by(name=corte_name).first()
            orientacion = Orientacion.query.filter_by(name=orientacion_name).first()
            ficha = Ficha.query.filter_by(
                proyecto_id=proyecto.id,
                zona_id=zona.id,
                corte_id=corte.id,
                orientacion_id=orientacion.id
            ).first()
        nuevoMapa = ConjuntoMapa.query.filter_by(id_ficha=ficha.id).first()
        if not nuevoMapa:
            nuevoMapa = ConjuntoMapa(id_ficha=ficha.id, mapa_url=None)
            db.session.add(nuevoMapa)
            db.session.flush()

        mapaData = request.files.get("mapa")
        if mapaData:
            nuevoMapa.mapa_url = mapaData.filename
            mapaData.save(os.path.join(mapa_dir, mapaData.filename))

        mascarasData = request.files.getlist("mascaras")
        for i in mascarasData:
            nuevaMascara = Mascaras(id_cm=nuevoMapa.id, mascara_url=i.filename)
            db.session.add(nuevaMascara)
            db.session.flush()
        for i in mascarasData:
            i.save(os.path.join(ecos_dir, i.filename))

    else:
        orientacion = Orientacion.query.filter_by(name=orientacion_name).first()
        estructura = (
            db.session.query(Estructura)
            .join(Cortes, Cortes.id == Estructura.corte_id)
            .join(Zonas, Zonas.id == Estructura.zona_id)
            .join(Proyecto, Proyecto.id == Estructura.proyecto_id)
            .filter(Proyecto.name == proyecto_name, Zonas.name == zona_name, Cortes.name == corte_name, Estructura.name == estructura_name)
            .distinct()
            .first()
        )

        if proyecto_name == 'SF':    
            ficha = (
                db.session.query(FichaSF)
                .filter(estructura.id == FichaSF.estructura_id, orientacion.id == FichaSF.orientacion_id)
                .distinct()
                .first()
            )
            nuevoMapa = ConjuntoMapaSF.query.filter_by(id_fichasf=ficha.id).first()
            if not nuevoMapa:
                nuevoMapa = ConjuntoMapaSF(id_fichasf=ficha.id, mapa_url=None, video_url=None)
                db.session.add(nuevoMapa)
                db.session.flush()

            mapaData = request.files.get("mapa")
            if mapaData:
                nuevoMapa.mapa_url = mapaData.filename
                mapaData.save(os.path.join(mapa_dir, mapaData.filename))

            videoData = request.files.get("video")
            if videoData:
                nuevoMapa.video_url = videoData.filename
                videoData.save(os.path.join(video_dir, videoData.filename))
            
            mascarasData = request.files.getlist("mascaras")
            for i in mascarasData:
                nuevaMascara = MascarasSF(id_cmsf=nuevoMapa.id, mascara_url=i.filename)
                db.session.add(nuevaMascara)
                db.session.flush()
            for i in mascarasData:
                i.save(os.path.join(ecos_dir, i.filename))
    
        else:
            patologia_name = request.form.get("patologia")
            exploracion_name = request.form.get("exploracion")
            
            patologia = (
                db.session.query(Patologia)
                .filter(Patologia.name == patologia_name, Patologia.estructura_id == estructura.id)
                .distinct()
                .first()
            )
            exploracion = (
                db.session.query(Exploracion)
                .filter(Exploracion.name == exploracion_name, Exploracion.orientacion_id == orientacion.id)
                .distinct()
                .first()
            )
            
            ficha = (
                db.session.query(FichaSP)
                .filter(patologia.id == FichaSP.patologia_id, exploracion.id == FichaSP.exploracion_id)
                .distinct()
                .first()
            )
            nuevoMapa = ConjuntoMapaSP.query.filter_by(id_fichasp=ficha.id).first()
            if not nuevoMapa:
                nuevoMapa = ConjuntoMapaSP(id_fichasp=ficha.id, mapa_url=None, video_url=None)
                db.session.add(nuevoMapa)
                db.session.flush()

            mapaData = request.files.get("mapa")
            if mapaData:
                nuevoMapa.mapa_url = mapaData.filename
                mapaData.save(os.path.join(mapa_dir, mapaData.filename))

            mascarasData = request.files.getlist("mascaras")
            for i in mascarasData:
                nuevaMascara = MascarasSP(id_cmsp=nuevoMapa.id, mascara_url=i.filename)
                db.session.add(nuevaMascara)
                db.session.flush()
            for i in mascarasData:
                i.save(os.path.join(ecos_dir, i.filename))

            if proyecto_name == "SP":
                videoData = request.files.get("video")
                if videoData:
                    nuevoMapa.video_url = videoData.filename
                    videoData.save(os.path.join(video_dir, videoData.filename))
                        

    db.session.commit()
    return jsonify({"status": "success"})


#Eliminar img
@app.route('/deleteImg', methods=['POST'])
def delete_image():
    mapa_dir = os.path.join(app.root_path, "static", "mapa")
    video_dir = os.path.join(app.root_path, "static", "video")
    ecos_dir = os.path.join(app.root_path, "static", "ecos")

    mapOrMask = request.json["mapOrMask"]
    svg_url = request.json["svg_url"]
    proyecto = request.json["proyecto"]

    if proyecto != 'SF' and proyecto != 'SP' and proyecto != 'CERP':
        if mapOrMask=="mapa":
            mapa = ConjuntoMapa.query.filter_by(
                mapa_url=svg_url,
            ).first()
            if mapa:
                mapa.mapa_url = None
            
            file = os.path.join(mapa_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
        else:
            mascara = Mascaras.query.filter_by(
                mascara_url = svg_url
            ).first()
            if mascara:
                db.session.delete(mascara)
            file = os.path.join(ecos_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
    elif proyecto == 'SF':
        if mapOrMask=="mapa":
            mapa = ConjuntoMapaSF.query.filter_by(
                mapa_url=svg_url,
            ).first()
            if mapa:
                mapa.mapa_url = None
            file = os.path.join(mapa_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
        elif mapOrMask == 'video':
            video = ConjuntoMapaSF.query.filter_by(
                video_url=svg_url,
            ).first()
            if video:
                video.video_url = None
            file = os.path.join(video_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
        else:
            mascara = MascarasSF.query.filter_by(
                mascara_url = svg_url
            ).first()
            if mascara:
                db.session.delete(mascara)
            file = os.path.join(ecos_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
    else:
        if mapOrMask=="mapa":
            mapa = ConjuntoMapaSP.query.filter_by(
                mapa_url=svg_url,
            ).first()
            if mapa:
                mapa.mapa_url = None
            file = os.path.join(mapa_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
        elif mapOrMask == 'video':
            video = ConjuntoMapaSP.query.filter_by(
                video_url=svg_url,
            ).first()
            if video:
                video.video_url = None
            file = os.path.join(video_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)
        else:
            mascara = MascarasSP.query.filter_by(
                mascara_url = svg_url
            ).first()
            if mascara:
                db.session.delete(mascara)
            file = os.path.join(ecos_dir, svg_url)
            if os.path.exists(file):
                os.remove(file)

    db.session.commit()
    return jsonify({"status": "success"})


@app.route('/download')
def download():
    date = datetime.now().strftime("%Y-%m-%d")
    zip_buffer = BytesIO()
    files = []
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        def create_csv(filename, query):
            '''Creacion csvs'''
            conn = db.engine.connect()
            result = conn.execute(text(query))
            columns = result.keys()
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(columns)
            rows = []
            for row in result:
                rows.append(row)
                writer.writerow(row)
            result.close()
            conn.close()
            zf.writestr(filename, output.getvalue().encode('utf-8-sig'))
            return rows
        
        #CAR:
        create_csv(
            f"csv/CAR.csv",
            """
                SELECT 
                    mascaras.id, 
                    mascaras.mascara_url, 
                    conjunto_mapa.mapa_url, 
                    p.name AS proyecto, 
                    z.name AS zonas 
                FROM mascaras 
                JOIN conjunto_mapa 
                    ON mascaras.id_cm = conjunto_mapa.id 
                JOIN ficha f 
                    ON conjunto_mapa.id_ficha = f.id 
                JOIN proyecto p 
                    ON f.proyecto_id = p.id 
                JOIN zonas z 
                    ON f.zona_id = z.id 
                WHERE p.name = 'CAR'
                ORDER BY mascaras.id
            """
        )

        #CERF:
        create_csv(
            f"csv/CERF.csv",
            """
                SELECT 
                    mascaras.id, 
                    mascaras.mascara_url, 
                    conjunto_mapa.mapa_url, 
                    p.name AS proyecto, 
                    z.name AS zonas,
                    c.name AS cortes,
                    o.name AS orientacion
                FROM mascaras 
                JOIN conjunto_mapa 
                    ON mascaras.id_cm = conjunto_mapa.id 
                JOIN ficha f 
                    ON conjunto_mapa.id_ficha = f.id 
                JOIN proyecto p 
                    ON f.proyecto_id = p.id 
                JOIN zonas z 
                    ON f.zona_id = z.id 
                JOIN cortes c
                    ON f.corte_id = c.id
                JOIN orientacion o
                    ON f.orientacion_id = o.id
                ORDER BY mascaras.id
            """
        )

        #CERP:
        create_csv(
            f"csv/CERP.csv",
            """
                SELECT 
                    mascaras.id, 
                    mascaras.mascara_url, 
                    conjunto_mapa.mapa_url, 
                    p.name AS proyecto, 
                    z.name AS zonas,
                    c.name AS cortes,
                    e.name AS estructura,
                    pa.name AS patologia, 
                    o.name AS orientacion,
                    ex.name AS exploracion 
                FROM "mascarasSP" AS mascaras
                JOIN "conjunto_mapaSP" AS conjunto_mapa
                    ON mascaras.id_cmsp = conjunto_mapa.id 
                JOIN "fichaSP" f 
                    ON conjunto_mapa.id_fichasp = f.id 
                JOIN patologia pa 
                    ON f.patologia_id = pa.id 
                JOIN exploracion ex 
                    ON f.exploracion_id = ex.id 
                JOIN orientacion o
                    ON ex.orientacion_id = o.id
                JOIN estructura e
                    ON pa.estructura_id = e.id
                JOIN proyecto p 
                    ON e.proyecto_id = p.id 
                JOIN zonas z 
                    ON e.zona_id = z.id 
                JOIN cortes c
                    ON e.corte_id = c.id
                WHERE p.name = 'CERP'
                ORDER BY mascaras.id
            """
        )

        #SF:
        create_csv(
            f"csv/SF.csv",
            """
                SELECT 
                    mascaras.id, 
                    mascaras.mascara_url, 
                    conjunto_mapa.mapa_url, 
                    conjunto_mapa.video_url, 
                    p.name AS proyecto, 
                    z.name AS zonas,
                    c.name AS cortes,
                    o.name AS orientacion,
                    e.name AS estructura
                FROM "mascarasSF" AS mascaras 
                JOIN "conjunto_mapaSF" AS conjunto_mapa
                    ON mascaras.id_cmsf = conjunto_mapa.id 
                JOIN "fichaSF" f 
                    ON conjunto_mapa.id_fichasf = f.id 
                JOIN estructura e
                    ON f.estructura_id = e.id
                JOIN orientacion o 
                    ON f.orientacion_id = o.id
                JOIN proyecto p 
                    ON e.proyecto_id = p.id 
                JOIN zonas z 
                    ON e.zona_id = z.id 
                JOIN cortes c
                    ON e.corte_id = c.id
                ORDER BY mascaras.id
            """
        )

        #SP:
        create_csv(
            f"csv/SP.csv",
            """
                SELECT 
                    mascaras.id, 
                    mascaras.mascara_url, 
                    conjunto_mapa.mapa_url, 
                    conjunto_mapa.video_url, 
                    p.name AS proyecto, 
                    z.name AS zonas,
                    c.name AS cortes,
                    e.name AS estructura,
                    pa.name AS patologia, 
                    o.name AS orientacion,
                    ex.name AS exploracion 
                FROM "mascarasSP" AS mascaras
                JOIN "conjunto_mapaSP" AS conjunto_mapa
                    ON mascaras.id_cmsp = conjunto_mapa.id 
                JOIN "fichaSP" f 
                    ON conjunto_mapa.id_fichasp = f.id 
                JOIN patologia pa 
                    ON f.patologia_id = pa.id 
                JOIN exploracion ex 
                    ON f.exploracion_id = ex.id 
                JOIN orientacion o
                    ON ex.orientacion_id = o.id
                JOIN estructura e
                    ON pa.estructura_id = e.id
                JOIN proyecto p 
                    ON e.proyecto_id = p.id 
                JOIN zonas z 
                    ON e.zona_id = z.id 
                JOIN cortes c
                    ON e.corte_id = c.id
                ORDER BY mascaras.id
            """
        )


        
    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype='application/zip',
        download_name=f"download_{date}.zip",
        as_attachment=True
    )

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5006)

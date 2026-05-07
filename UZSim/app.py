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
from models import db, User, Proyecto, Zonas, Cortes, Orientacion, Ficha, ConjuntoMapa, Mascaras
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
    zonas = Zonas.query.all()
    return jsonify([zona.name for zona in zonas])

#Añadir zonas
@app.route('/crearZona', methods=['POST'])
def createZone():
    name = request.json
    nueva_zona = Zonas(name=name)
    db.session.add(nueva_zona)
    db.session.commit()
    return jsonify({"status": "success"}), 200

#Obtener cortes
@app.route('/api/cortes', methods=['GET'])
def get_cortes():
    '''Cortes definidos y presentes en la zona seleccionada'''
    zona_name = request.args.get('zona')
    cortes = (
        db.session.query(Cortes)
        .join(Ficha, Cortes.id == Ficha.corte_id)
        .join(Zonas, Zonas.id == Ficha.zona_id)
        .filter(Zonas.name == zona_name)
        .distinct()
        .all()
    )

    return jsonify([corte.name for corte in cortes])

#Añadir cortes
@app.route('/crearCorte', methods=['POST'])
def createCorte():
    proyecto = request.json["proyecto"]
    name = request.json["name"]
    zona = request.json["zona"]
    if not proyecto:
        return jsonify({"error": "Missing project"}), 400
    proyecto = Proyecto.query.filter_by(name=proyecto).first()
    if not name:
        return jsonify({"error": "Missing name"}), 400
    corte = Cortes.query.filter_by(name=name).first()
    if not corte:
        corte = Cortes(name=name)
        db.session.add(corte)
        db.session.flush()
    zona = Zonas.query.filter_by(name=zona).first()

    nuevaFicha = Ficha(
        proyecto_id = proyecto.id,
        zona_id = zona.id,
        corte_id= corte.id
    )
    db.session.add(nuevaFicha)
    db.session.commit()
    return jsonify({"status": "success"}), 200

#Obtener orientaciones
@app.route('/api/orientaciones', methods=['GET'])
def get_orientaciones():
    '''Orientaciones definidas y presentes en la zona y corte seleccionados'''
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    orientaciones = (
        db.session.query(Orientacion)
        .join(Ficha, Orientacion.id == Ficha.orientacion_id)
        .join(Cortes, Cortes.id == Ficha.corte_id)
        .join(Zonas, Zonas.id == Ficha.zona_id)
        .filter(Zonas.name == zona_name, Cortes.name == corte_name)
        .distinct()
        .all()
    )

    return jsonify([orientacion.name for orientacion in orientaciones])

#Añadir orientaciones
@app.route('/crearOrientacion', methods=['POST'])
def createOrientacion():
    proyecto = request.json["proyecto"]
    name = request.json["name"]
    zona = request.json["zona"]
    orientacion = request.json["orientacion"]
    if not proyecto:
        return jsonify({"error": "Missing project"}), 400
    proyecto = Proyecto.query.filter_by(name=proyecto).first()
    if not name:
        return jsonify({"error": "Missing cut"}), 400
    corte = Cortes.query.filter_by(name=name).first()
    if not orientacion:
        return jsonify({"error": "Missing orientation"})
    nuevaOrientacion = Orientacion.query.filter_by(name=orientacion).first()
    if not nuevaOrientacion:
        nuevaOrientacion = Orientacion(name=orientacion)
        db.session.add(nuevaOrientacion)
        db.session.flush()

    zona = Zonas.query.filter_by(name=zona).first()
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
    db.session.commit()
    return jsonify({"status": "success"}), 200


#Get imagenes 
@app.route('/api/images', methods=['GET'])
def get_images():
    '''Imagenes presentes en la ficha correspondiente (zona y corte, con orientacion, patologia ... segun proyecto)'''
    proyecto_name = request.args.get('proyecto')
    zona_name = request.args.get('zona')
    corte_name = request.args.get('corte')
    ficha = (
        db.session.query(Ficha)
        .join(Proyecto, Proyecto.id == Ficha.proyecto_id)
        .join(Cortes, Cortes.id == Ficha.corte_id)
        .join(Zonas, Zonas.id == Ficha.zona_id)
        .filter(Zonas.name == zona_name, Cortes.name == corte_name, Proyecto.name == proyecto_name)
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

#Guardar imagenes
@app.route('/save', methods=['POST'])
def save_images():
    mapa_dir = os.path.join(app.root_path, "static", "mapa")
    ecos_dir = os.path.join(app.root_path, "static", "ecos")
    os.makedirs(mapa_dir, exist_ok=True)
    os.makedirs(ecos_dir, exist_ok=True)

    proyectoData = request.form.get("proyecto")
    if not proyectoData:
        return jsonify({"error": "Missing project"}), 400
    proyecto = Proyecto.query.filter_by(name=proyectoData).first()

    zonaData = request.form.get("zona")
    if not zonaData:
        return jsonify({"error": "Missing zone"}), 400
    zona = Zonas.query.filter_by(name=zonaData).first()

    corteData = request.form.get("corte")
    if not corteData:
        return jsonify({"error": "Missing cut"}), 400
    corte = Cortes.query.filter_by(name=corteData).first()

    ficha = Ficha.query.filter_by(
        proyecto_id=proyecto.id,
        zona_id=zona.id,
        corte_id=corte.id,
        orientacion_id=None
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
        print(nuevaMascara.mascara_url)
        db.session.add(nuevaMascara)
        db.session.flush()

    for i in mascarasData:
        i.save(os.path.join(ecos_dir, i.filename))
    db.session.commit()
    return jsonify({"status": "success"})


#Eliminar img
@app.route('/deleteImg', methods=['POST'])
def delete_image():
    mapa_dir = os.path.join(app.root_path, "static", "mapa")
    ecos_dir = os.path.join(app.root_path, "static", "ecos")

    mapOrMask = request.json["mapOrMask"]
    svg_url = request.json["svg_url"]

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
    db.session.commit()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5006)

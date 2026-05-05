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
    print(db.engine)
    print(db.metadata.tables.keys())
    db.create_all()

PERMISSIONS = {
    "admin": ["electrolysis"]
}

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
    print(request.json)
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



if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5006)

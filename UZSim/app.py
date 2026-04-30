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
from models import db, User, Zonas, Cortes, Orientacion, ZonaCorteOrientacion, Mascaras
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


def user_can_access(user, app_name, permissions):
    proyectos = permissions.get(user.role, [])
    return any(app_name.startswith(p) for p in proyectos)


@app.route('/UZSim')
@token_required
def index(user):
    if not user_can_access(user, "electrolysis", PERMISSIONS):
        return redirect("http://localhost/index.php")
    return render_template('index_UZSim.html', user=user.username, title='UZSim') 


#Obtener zonas
@app.route('/api/zonas', methods=['GET'])
def get_zonas():
    zonas = Zonas.query.all()
    return jsonify([zona.name for zona in zonas])

#Añadir zonas
@app.route('/crearZona', methods=['POST'])
def createZone():
    data = request.json
    nueva_zona = Zonas(name=data["name"])
    db.session.add(nueva_zona)
    db.session.commit()
    return jsonify({"status": "success"}), 200

#Obtener cortes
@app.route('/api/cortes', methods=['GET'])
def get_cortes():
    cortes = Cortes.query.all()
    return jsonify([corte.name for corte in cortes])

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5006)

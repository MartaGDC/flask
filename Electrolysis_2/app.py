
import cv2
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
from models import db, User, ElectrolysisBone2, ElectrolysisQuality2, BrushSetting
from config import SECRET_KEY, DATABASE_URI, BASE_DIR


#from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SECRET_KEY'] = SECRET_KEY
db.init_app(app)
with app.app_context():
    db.create_all()


# CORS(app)
APP_VIDEOS = {
    "base_tejidos":"",
    "base_artefactos" : "",
    "base_ROIS":"",
    "base_marco":"",
    
    "foot_longitudinal_fascia": "1_1_",
    "foot_transversal_fascia": "1_2_",
    "foot_longitudinal_achilles": "1_3_",
    "foot_transversal_achilles": "1_4_",
    "foot_longitudinal_volar": "1_5_",
    "foot_transversal_tarsal": "1_6_",

    "knee_anterior_longitudinal": "2_1_",
    "knee_anterior_transversal": "2_2_",
    "knee_anterior_transverse_trochlea": "2_3_",
    "knee_anterior_longitudinal_trochlea": "2_4_",
    "knee_anterior_parasagittal": "2_5_",
    "knee_medial_LLI": '2_6_',
    'knee_medial_meniscal_transversal': '2_7_',
    'knee_medial_meniscal_longitudinal': '2_8_',
    'knee_lateral_cintilla': '2_9_',
    'knee_lateral_LLE': '2_10_',
    'knee_lateral_biceps': '2_11_',
    'knee_lateral_menisco_transversal': '2_12_',
    'knee_lateral_menisco_longitudinal': '2_13_',
    'knee_posterior_transversal_medial': '2_14_',
    'knee_posterior_transversal_central': '2_15_',
    'knee_posterior_transversal_lateral': '2_16_',
    'knee_posterior_logitudinal_medial': '2_17_',
    'knee_posterior_longitudinal_lateral': '2_18_',

    'hand_longitudinal': '3_1_',
    'hand_transversal': '3_2_',
    'hand_radial': '3_3_',
    'hand_cubital': '3_4_',
    'hand_dorsal': '3_5_',

    'nerves_STC': '4_1_',

    'abd_transversal_alba': '5_1_',
    'abd_transversal_recto': '5_2_',
    'abd_transversal_spiegel': '5_3_',
    'abd_transversal_toracolum': '5_4_',
    'abd_suelo_pelvico': '5_5_',

    'diafragma': '6_',

    'menisco': '9_',

    'rm': '',

    'aquiles_longitudinal': '1_3_',
    'aquiles_transversal': '1_4_',

    'stc_transversal': "010_1_",
    'stc_longitudinal': '010_2_',

    'polea_longitudinal': '3_1_',
    'proDiafragma': '6_'
}



PERMISSIONS = {
    "admin": ["electrolysis"],
    "knee_menisco": ["electrolysis"], #jmp
    "electrolysis": ["electrolysis"] #iag
}


def token_required(f):
    '''Acceso permitido si usuario correctamente autenticado'''
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
    '''Acceso permitido según rol del usuario'''
    proyectos = permissions.get(user.role, [])
    return any(app_name.startswith(p) for p in proyectos)


def load_json(path):
    '''Para acceder al json que define las estructuras y zonas de cada parte anatómica'''
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route('/electrolysis2')
@token_required
def index(user):
    if not user_can_access(user, "electrolysis", PERMISSIONS):
        return redirect("http://localhost/index.php")
    structures = load_json(os.path.join(app.root_path, "structures.json")).get("electrolysis2", {})
    brush_settings = BrushSetting.query.filter_by(app_name="electrolysis2").all()
    brush_map = {}
    for b in brush_settings:
        brush_map[(b.zone, b.structure_name)] = b.width
    for zone, structs in structures.get("structures", {}).items():
        for s in structs:
            key = (zone, s["name"])
            if key in brush_map:
                s["width"] = brush_map[key]
    return render_template('index_electrolysis2.html', user=user.username, title='electrolysis2', data=structures) 


@app.route("/count_frames/<username>/<video>")
def count_frames_electrolysis(username, video):
    '''Cuenta el número de frames analizados por un usuario en un video'''
    count = ElectrolysisBone2.query.filter_by(
        evaluator=username
    ).filter(
        ElectrolysisBone2.video.startswith(video)
    ).count()
    return jsonify({"count": count})


#Subir archivo y guardarlo. Tambien procesarlos si es un video
@app.route("/upload", methods=["POST"])
def upload_file():
    '''Sube un archivo y lo guarda. Si es un video, también lo procesa'''
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    filename = file.filename
    name, extension = os.path.splitext(filename)
    extension = extension.lower()
    allowed_extensions = [".jpg", ".jpeg", ".png", ".mp4", ".mha", ".wmv"]
    if extension not in allowed_extensions:
        return jsonify({"error": "File type not allowed"}), 400
    if extension == ".wmv" or extension == ".mp4":
        name = name.replace(",", "_").replace(" ", "_")
        name = f"electro{name}"
        filename = name + extension
    save_path = os.path.join(BASE_DIR, filename)
    file.save(save_path)

    import sys
    tools_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tools"))
    sys.path.insert(0, tools_path)
    if extension == ".mp4" or extension == ".mpeg" or extension == ".wmv":
        from generar_proxys import process_one
        process_one(filename, 'electrolysis')

    return jsonify({
        "success": True,
        "filename": filename
    })


#Acceso al video de la carpeta
@app.route("/media/<filename>", methods=["GET"])
def play_video(filename):
    '''Devuelve el video o la imagen'''
    name, extension = os.path.splitext(filename)
    if extension.lower() == ".mha":
        file_path = os.path.join(BASE_DIR, filename)
        try:
            image = sitk.ReadImage(file_path)
            array = sitk.GetArrayFromImage(image)
            array = ((array - np.min(array)) / (np.max(array) - np.min(array)) * 255).astype(np.uint8)
            img = Image.fromarray(array)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            return send_file(buf, mimetype="image/png")
        
        except Exception as e:
            print(f"[ERROR] No se pudo convertir {filename}: {e}")
            return "Error processing MHA file", 500
    elif extension.lower() not in [".jpeg", ".jpg", ".png"]:
        filename = f"{name}_proxy{extension}"
        dir_path = BASE_DIR + "/proxy"
        if extension==".wmv" or extension==".mp4":
            filename=f"{name}_proxy.mp4"
    else:
        dir_path = BASE_DIR
    return send_from_directory(directory=dir_path, path=filename)


@app.route("/update_brush", methods=["POST"])
def update_brush_width():
    '''Actualiza el ancho del pincel de dibujo para una estructura y zona específica'''
    req = request.json
    appName = req["appName"]
    name = req["name"]
    zone = req["zone"]
    width = req["width"]
    brush = BrushSetting.query.filter_by(app_name=appName, zone=zone, structure_name=name).first()
    if brush:
        brush.width = width
    else:
        brush = BrushSetting(app_name=appName, zone=zone, structure_name=name, width=width)
        db.session.add(brush)
    db.session.commit()
    return jsonify({"status": "ok"})


@app.route('/save-parametres', methods=['POST'])
def save_parametres():
    '''
    - Guarda las imagenes de máscaras y de visibilidad según threshold
    - Guarda originales
    - Accede a las funciones para calcular los parámetros de calidad y de "hueso" -> PENDIENTE
    - Guardado en base de datos -> PENDIENTE 
    '''
    data = request.json
    try:
        #Guardado mascaras
        frames_dir = os.path.join(app.root_path, "static", "frames")
        data_dir = os.path.join(app.root_path, "static", "DATA")
        os.makedirs(frames_dir, exist_ok=True)
        os.makedirs(data_dir, exist_ok=True)
        original_imgQ = base64.b64decode(data["qualityData"]['originalImage'].split(",")[1])
        edited_imgQ = base64.b64decode(data["qualityData"]['maskImage'].split(",")[1])
        with open(os.path.join(frames_dir, data["qualityData"]["frameoriginal"]), 'wb') as f:
            f.write(original_imgQ)
        with open(os.path.join(data_dir, data["qualityData"]["frameMask"]), 'wb') as f:
            f.write(edited_imgQ)
        #Guardado imagenes en thresholds
        image = skimage.io.imread(io.BytesIO(base64.b64decode(data["boneData"]['originalImage'].split(",")[1])), as_gray=True)
        image = (image * 255).astype(np.uint8)
        threshold = data["boneData"]['threshold']
        binary_img = (image > threshold).astype(bool)
        erosion = morphology.binary_erosion(binary_img,footprint=np.ones((7,7)))
        dilation = morphology.binary_dilation(erosion, footprint=morphology.ellipse(20,15))
        hueso = image * dilation
        skimage.io.imsave(os.path.join(data_dir, data["boneData"]['frameMask']), hueso)        

        quality = tissue_quality(data["qualityData"])
        bone = bone_region(data["boneData"])
        #db.session.commit()
        #return jsonify({"status": "success", "newQuality": quality, "newBone": bone}), 200
        return jsonify({"status": "success"}), 200
    except Exception as e:
        #db.session.rollback()
        #import traceback
        #traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


def tissue_quality(data):
    '''
    GLCM: glcm_contrast, glcm_sumAvg, glcm_sumOfVar2, glcm_diffVar, glcm_correlation, glcm_invDiffMoment, 
    GLDS: glds_homogeneity, glds_contrast, glds_asm, glds_entropy, glds_mean,
    haar_mean, haar_variance
    '''
    originalImage = data['originalImage']
    maskImage = data['maskImage']
    
    original_img = skimage.io.imread(io.BytesIO(base64.b64decode(originalImage.split(",")[1])), as_gray=True)
    original_img = (original_img * 255).astype(np.uint8)
    edited_img = skimage.io.imread(io.BytesIO(base64.b64decode(maskImage.split(",")[1])), as_gray=True)
    edited_img = edited_img > 0 

    img_roi, mask_roi = crop_bbox(original_img, edited_img)
    #...calcular parametros de calidad
    
    return get_quality_parameters()

def crop_bbox(img, mask):
    ys, xs = np.where(mask)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    return img[y0:y1, x0:x1], mask[y0:y1, x0:x1]

def get_quality_parameters():
    # TO DO
    return {
        "glcm_contrast": 0.0,
        "glcm_sumAvg": 0.0,
        "glcm_sumOfVar2": 0.0,
        "glcm_diffVar": 0.0,
        "glcm_correlation": 0.0,
        "glcm_invDiffMoment": 0.0,
        "glds_homogeneity": 0.0,
        "glds_contrast": 0.0,
        "glds_asm": 0.0,
        "glds_entropy": 0.0,
        "glds_mean": 0.0,
        "haar_mean": 0.0,
        "haar_variance": 0.0
    }

def bone_region(data):
    '''
    contours, area, perimeter, convex,
    GLCM: homogeneity, contrast, correlation
    '''
    originalImage = data['originalImage']
    maskImage = data['maskImage']
    threshold = data['threshold']
    _scale = float(data['scale'])
    #...calcular parametros de calidad

    return get_bone_parameters()

def get_bone_parameters():
    # TO DO
    return {
        "contours": 0,
        "area": 0.0,
        "perimeter": 0.0,
        "convex": 0.0,
        "glcm_homogeneity": 0.0,
        "glcm_contrast": 0.0,
        "glcm_correlation": 0.0
    }



@app.route('/download')
def download():
    '''Descarga los datos de electrolysis_bone2 y electrolysis_quality2 en un archivo zip -> PENDIENTE, copiado de Electrolisis'''
    date = datetime.now().strftime("%Y-%m-%d")
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        conn = db.engine.connect()
        result = conn.execute(text("SELECT * FROM electrolysis_bone2"))
        columns = result.keys()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        for row in result:
            writer.writerow(row)
        result.close()
        conn.close()

        zf.writestr(f"electrolysis_bone2_{date}.csv", output.getvalue())

        conn = db.engine.connect()
        result = conn.execute(text("SELECT * FROM electrolysis_quality2"))
        columns = result.keys()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        for row in result:
            writer.writerow(row)
        result.close()
        conn.close()

        zf.writestr(f"electrolysis_quality2_{date}.csv", output.getvalue())

    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype='application/zip',
        download_name=f"electrolysis_data_{date}.zip",
        as_attachment=True
    )



@app.after_request
def add_header(response): #Con los cambios en el html, había problemas de cache al usar el boton Reload
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return '', 200


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5005)

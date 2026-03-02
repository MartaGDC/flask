import json
import os, io, base64
from flask import Flask, jsonify, session, send_file, send_from_directory
from PIL import Image
import SimpleITK as sitk
import numpy as np
from draw_rm import drawrm_bp
from electrolysis import electrolysis_bp
from config import SECRET_KEY, DATABASE_URI, BASE_DIR
from models import db, Metadata, MetadataRM

#from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SECRET_KEY'] = SECRET_KEY
db.init_app(app)
with app.app_context():
    db.create_all()

app.register_blueprint(drawrm_bp, url_prefix='/')
app.register_blueprint(electrolysis_bp, url_prefix='/electrolysis')

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

    'menisco': '6_',

    'rm': '',

    'electrolysis': ''

}


@app.route("/count_frames/<username>/<video>")
def count_frames(username, video):
    count = Metadata.query.filter_by(
        evaluator=username
    ).filter(
        Metadata.video.startswith(video)
    ).count()
    return jsonify({"count": count})


#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    app_num = APP_VIDEOS[app_name]
    dir_path = BASE_DIR
    if(app_name.startswith("base")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".mp4")])
    elif(app_name.startswith("rm")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha")])
    elif(app_name.startswith("hand") or app_name.startswith("electrolysis")):
        videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app_num) and (file.lower().endswith(".mp4") or file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha"))])
    else:
        videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app_num) and file.lower().endswith(".mp4")])
    return jsonify(videos)


#Acceso al video de la carpeta
@app.route("/media/<filename>", methods=["GET"])
def play_video(filename):
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
    else:
        dir_path = BASE_DIR
    return send_from_directory(directory=dir_path, path=filename)


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
    app.run(debug=True, host='127.0.0.1',port=5004)

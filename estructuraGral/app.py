import json
import os, io, base64
from flask import Flask, redirect, render_template, request, jsonify, session, send_file, send_from_directory
import jwt
from functools import wraps
from PIL import Image
import SimpleITK as sitk
import numpy as np
from config import SECRET_KEY, DATABASE_URI, BASE_DIR
from models import db, User, Metadata, MetadataRM, BrushSetting

#from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SECRET_KEY'] = SECRET_KEY
db.init_app(app)
with app.app_context():
    db.create_all()


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

    'menisco': '9_',

    'rm': '',

    'aquiles_longitudinal': '1_3_',
    'aquiles_transversal': '1_4_',

    'stc_transversal': "10_1_",
    'stc_longitudinal': '10_2_'
}

PERMISSIONS = {
    "admin": ["base", "foot", "knee", "hand", "nerves", "abd", "menisco", "rm", "aquiles", "stc"],
    "foot_aquiles": ["foot", "aquiles"],
    "aquiles": ["aquiles"],
    "knee_hand": ["knee", "hand"],
    "knee_menisco": ["knee", "menisco"],
    "nerves_stc": ["nerves", "stc"],
    "abd": ["abd"],
    "stc": ["stc"]
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

def user_can_access(user, app_name):
    proyectos = PERMISSIONS.get(user.role, [])
    return any(app_name.startswith(p) for p in proyectos)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route('/<app_name>')
@token_required
def index(user, app_name):
    if not user_can_access(user, app_name):
        return redirect("http://localhost/index.php")

    structures = load_json(os.path.join(app.root_path, "structures.json")).get(app_name, {})
    brush_settings = BrushSetting.query.filter_by(app_name=app_name).all()
    brush_map = {}
    for b in brush_settings:
        brush_map[(b.zone, b.structure_name)] = b.width
    for zone, structs in structures.get("structures", {}).items():
        for s in structs:
            key = (zone, s["name"])
            if key in brush_map:
                s["width"] = brush_map[key]
    return render_template('index.html', user=user.username, title=app_name, data=structures)


@app.route("/update_brush", methods=["POST"])
def update_brush_width():
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


#Conteo de frames 
@app.route("/count_frames/<username>/<video>")
def count_frames(username, video):
    count = Metadata.query.filter_by(
        evaluator=username
    ).filter(
        Metadata.video.startswith(video)
    ).count()
    return jsonify({"count": count})


@app.route("/unanalysed-images/<app_name>/<evaluator>")
def get_unanalysed_images(app_name, evaluator):
    """Returns list of unanalyzed images for a specific evaluator (for RM script only)"""
    dir_path = BASE_DIR
    if(app_name.startswith("rm")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha")])    
    analyzed = MetadataRM.query.filter_by(evaluator=evaluator).all()
    analyzed_images = [m.imageoriginal for m in analyzed]
    unanalyzed = [f for f in videos if f not in analyzed_images]
    return jsonify(unanalyzed)


#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    app_num = APP_VIDEOS[app_name]
    dir_path = BASE_DIR
    if(app_name.startswith("base")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".mp4")])
    elif(app_name.startswith("rm")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha")])
    elif(app_name.startswith("hand")):
        videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app_num) and (file.lower().endswith(".mp4") or file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha"))])
    else:
        videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app_num) and (file.lower().endswith(".mp4") or file.lower().endswith(".wmv"))])
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
            return "Error processing MHA file", 500
    elif extension.lower() not in [".jpeg", ".jpg", ".png"]:
        filename = f"{name}_proxy{extension}"
        dir_path = BASE_DIR + "/proxy"
    else:
        dir_path = BASE_DIR
    return send_from_directory(directory=dir_path, path=filename)


@app.route('/save', methods=['POST'])
def save():
    data = request.json
    frames_dir = os.path.join(app.root_path, "static", "frames")
    data_dir = os.path.join(app.root_path, "static", "DATA")
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)
    if isinstance(data, dict):
        data = [data]  # para tratar guardado de un frame (dict) y guardado de varios frames de la misma manera.
    for i in data:
        extra = {k: v for k, v in i.items() if k not in ["video","frame","frameoriginal","filesaved","quality","zone","evaluator","originalImage","imageEdited"]}
        metadata = Metadata(
            video=i["video"],
            frame=i["frame"],
            frameoriginal=i["frameoriginal"],
            filesaved=i["filesaved"],
            quality=i["quality"],
            zone=i["zone"],
            evaluator=i["evaluator"],
            extra=extra
        )
        db.session.add(metadata)

        original_img = base64.b64decode(i['originalImage'].split(",")[1])
        edited_img = base64.b64decode(i['imageEdited'].split(",")[1])
        with open(os.path.join(frames_dir, i["frameoriginal"]), 'wb') as f:
            f.write(original_img)
        with open(os.path.join(data_dir, i["filesaved"]), 'wb') as f:
            f.write(edited_img)

    db.session.commit()
    return jsonify({"status": "success"})


@app.route('/saveRM', methods=['POST'])
def saveRM():
    data = request.json
    frames_dir = os.path.join(app.root_path, "static", "frames")
    data_dir = os.path.join(app.root_path, "static", "DATA")
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)
    metadata = MetadataRM(
        imageoriginal=data["image"],
        filesaved=data["filesaved"],
        zone=data["zone"],
        evaluator=data["evaluator"],
    )
    db.session.add(metadata)

    imageEdited = base64.b64decode(data['imageEdited'].split(",")[1])
    file_path = os.path.join(data_dir, data["filesaved"])
    with open(file_path, 'wb') as f:
        f.write(imageEdited)

    db.session.commit()
    return jsonify({"status": "success"})


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

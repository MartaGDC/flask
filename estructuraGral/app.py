import json
import os, io, shutil, base64
from flask import Flask, redirect, render_template, request, jsonify, session, send_file, send_from_directory, render_template_string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import jwt
from functools import wraps
from filelock import FileLock
from PIL import Image
import SimpleITK as sitk
import numpy as np
from filelock import FileLock
from config import SECRET_KEY, DATABASE_URI, BASE_DIR
from models import ElectrolysisBone, ElectrolysisQuality, db, User, Metadata, MetadataRM, BrushSetting

import skimage.io
from skimage import feature, measure, morphology
import pyfeats as pf
import pywt as pw
#from flask_cors import CORS


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY

db.init_app(app)

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

PERMISSIONS = {
    "admin": ["base", "foot", "knee", "hand", "nerves", "abd", "menisco", "rm", "electrolysis"],
    "foot": ["foot"],
    "knee_hand": ["knee", "hand"],
    "knee_menisco": ["knee", "menisco"],
    "nerves": ["nerves"],
    "abd": ["abd"]
}

def user_can_access(user, app_name):
    proyectos = PERMISSIONS.get(user.role, [])
    return any(app_name.startswith(p) for p in proyectos)

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
def load_json_safe(path):
    """Carga JSON, restaurando backup si hay error."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        if os.path.exists("settings_brush.json.bak"):
            shutil.copy("settings_brush.json.bak", path)
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
def save_json_atomic_safe(path, data):
    """Guarda JSON con lock, backup y escritura atómica."""
    with FileLock("settings_brush.json.lock"):
        if os.path.exists(path):
            shutil.copy(path, "settings_brush.json.bak")
        temp_path = path + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        os.replace(temp_path, path)


'''def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
'''

@app.route('/<app_name>') #Cuando se accede a la ruta que sea, se ejecuta la función index
@token_required
def index(user, app_name):
    evaluator_name = user.username 
    #user = request.args.get('user')
    if not user_can_access(user, app_name):
        return redirect("http://localhost/index.php")
    # En caso de que haya diferentes archivos HTML: template_name = f"{app_name}.html" 
    #                                                return render_template(template_name, title=app_name)

    #Para que las zonas y las estructuras, y el ancho de los pinceles, puedan ser definidas dinámicamente para el html:
    structures = load_json("structures.json").get(app_name, {}) #elementos dentro del elemento de la app concreta
    '''brush = load_json("settings_brush.json").get(app_name, {}) #elementos dentro del elemento de la app concreta
    for zone, structs in structures["structures"].items():
        for structure in structs:
            s_name = structure["name"]
            for b in brush["structures"].get(zone, []):
                if b["name"] == s_name:
                    structure["width"] = b["width"]
                    break'''
    brush_settings = BrushSetting.query.filter_by(app_name=app_name).all()
    brush_map = {}
    for b in brush_settings:
        brush_map[(b.zone, b.structure_name)] = b.width
    for zone, structs in structures.get("structures", {}).items():
        for s in structs:
            key = (zone, s["name"])
            if key in brush_map:
                s["width"] = brush_map[key]
    
    if app_name.startswith("electrolysis"):
        return render_template('index_electrolysis.html', user = evaluator_name, title=app_name)

    return render_template('index.html', user = evaluator_name, title=app_name, data=structures)



@app.route("/update_brush", methods=["POST"])
def update_brush_width():
    req = request.json
    appName = req["appName"]
    name = req["name"]
    zone = req["zone"]
    width = req["width"]

    '''brush = load_json_safe("settings_brush.json")

    if appName not in brush:
        brush[appName] = {"zones": [{"value": zone, "label": ""}],
                          "structures": {zone: []}}
    found = False
    for b in brush[appName]["structures"][zone]:
        if b["name"] == str(name):
            b["width"] = str(width)
            found = True
            break
    if not found:
        brush[appName]["structures"][zone].append({"name": name, "width": width})

    save_json_atomic_safe("settings_brush.json", brush)'''
    brush = BrushSetting.query.filter_by(app_name=appName, zone=zone, structure_name=name).first()
    if brush:
        brush.width = width
    else:
        brush = BrushSetting(app_name=appName, zone=zone, structure_name=name, width=width)
        db.session.add(brush)
    db.session.commit()

    return jsonify({"status": "ok"})


'''@app.route('/verifyUser/<user>/<app_name>')
def verifyUser(user, app_name):
    if (user== "None" or user == None or user==""):
        error = True
    if((user == "mmu" or user == "mgd") and (app_name.startswith("base") or app_name.startswith("foot") or app_name.startswith("knee") or app_name.startswith("hand") or app_name.startswith("nerves") or app_name.startswith("abd") or app_name.startswith("menisco"))):
        error = False
    elif (user == "jpr" and app_name.startswith("foot")):
        error = False
    elif (user == "pfm" and (app_name.startswith("knee") or app_name.startswith("hand"))):
        error = False
    elif (user == "jmp" and (app_name.startswith("knee") or app_name.startswith("menisco"))):
        error = False
    elif(user == 'ebg' and app_name.startswith("nerves")):
        error = False
    elif (user == "ppa" and app_name.startswith("abd")):
        error = False
    elif ((user == "mmu" or user == "mgd") and app_name.startswith("rm")):
        error = False
    else:
        error = True
    if error:
        return jsonify({
            "error": True,
            "message": "You must enter a valid user for this project.\nEnter new credentials.",
            "redirect": "http://localhost/index.php" #Cambiar a la url para el servidor
        })
    else:
        return jsonify({"error": False})
'''

@app.route("/count_frames/<username>/<video>")
def count_frames(username, video):
    count = Metadata.query.filter_by(
        evaluator=username
    ).filter(
        Metadata.video.startswith(video)
    ).count()
    return jsonify({"count": count})


@app.route('/save', methods=['POST'])
def save():
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)
    data = request.json
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
        with open(f'static/frames/{i["frameoriginal"]}', 'wb') as f:
            f.write(original_img)
        with open(f'static/DATA/{i["filesaved"]}', 'wb') as f:
            f.write(edited_img)

    db.session.commit()
    return jsonify({"status": "success"})


@app.route('/saveRM', methods=['POST'])
def saveRM():
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)
    data = request.json
    metadata = MetadataRM(
        imageoriginal=data["image"],
        filesaved=data["filesaved"],
        zone=data["zone"],
        evaluator=data["evaluator"],
    )
    db.session.add(metadata)

    imageEdited = base64.b64decode(data['imageEdited'].split(",")[1])
    with open(f'static/DATA/{data["filesaved"]}', 'wb') as f:
        f.write(imageEdited)

    db.session.commit()
    return jsonify({"status": "success"})
    

'''@app.route('/save', methods=['POST'])
def save():
    #Cargar el json donde guardar la info
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)
    metadata_file = 'static/DATA/file_info.json'
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    else:
        metadata = []

    #Cargar la respuesta
    data = request.json
    if isinstance(data, dict): #guardado de un solo frame
        entry = {
            "video": data["video"],
            "frame": data["frame"],
            "frameoriginal": data["frameoriginal"],
            "filesaved": data["filesaved"],
            "quality": data["quality"],
            "zone": data["zone"],
            "evaluator": data["evaluator"]
        }
        for key, value in data.items():
            if key not in entry and key not in ["originalImage", "imageEdited"]:
                entry[key] = value

        frameoriginal = data['frameoriginal']
        filesaved = data['filesaved']
        originalImage = data['originalImage'].split(",")[1]
        originalImage = base64.b64decode(originalImage)
        imageEdited = data['imageEdited'].split(",")[1]
        imageEdited = base64.b64decode(imageEdited)
                
        with open(f'static/frames/{frameoriginal}', 'wb') as f:
            f.write(originalImage)
        with open(f'static/DATA/{filesaved}', 'wb') as f:
            f.write(imageEdited)

        metadata.append(entry)

    elif isinstance(data, list): #guardado de multiples frames
        for i in data:
            entry = {
                "video": i.get("video"),
                "frame": i.get("frame"),
                "frameoriginal": i.get("frameoriginal"),
                "filesaved": i.get("filesaved"),
                "quality": i.get("quality"),
                "zone": i.get("zone"),
                "evaluator": i.get("evaluator"),
            }
            for key, value in i.items():
                if key not in entry and key not in ["originalImage", "imageEdited"]:
                    entry[key] = value
            
            frameoriginal = i.get('frameoriginal')
            filesaved = i.get('filesaved')
            originalImage = i.get('originalImage').split(",")[1]
            originalImage = base64.b64decode(originalImage)
            imageEdited = i.get('imageEdited').split(",")[1]
            imageEdited = base64.b64decode(imageEdited)
            
            with open(f'static/frames/{frameoriginal}', 'wb') as f:
                f.write(originalImage)
            with open(f'static/DATA/{filesaved}', 'wb') as f:
                f.write(imageEdited)
            #Añadir la nueva informacion al json
            metadata.append(entry)

    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)

    return jsonify({"status": "success"})

@app.route('/saveRM', methods=['POST'])
def saveRM():
    #Cargar el json donde guardar la info
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)
    metadata_file = 'static/DATA/file_info_RM.json'
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r', enconding='utf-8') as f:
            metadata = json.load(f)
    else:
        metadata = []

    #Cargar la respuesta
    data = request.json

    imageoriginal = data["image"]
    imageEdited = data['imageEdited'].split(",")[1]
    imageEdited = base64.b64decode(imageEdited)
    filesaved = data['filesaved']
    zone = data['zone'] #innecesario en supraespinoso
    evaluator = data['evaluator']
    #time = data['time']
    
    with open(f'static/DATA/{filesaved}', 'wb') as f:
        f.write(imageEdited)
    #Añadir la nueva informacion al json
    metadata.append({
        "imageoriginal": imageoriginal,
        "filesaved": filesaved,
        "zone": zone,
        "evaluator": evaluator
        #"time": time
    })

    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)

    return jsonify({"status": "success"})'''

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

#Acceso al video de la carpeta
@app.route("/media/<app_name>/<filename>", methods=["GET"])
def play_video(app_name, filename):
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

#Parámetros electrolysis
@app.route('/save-parametres', methods=['POST'])
def save_parametres():
    data = request.json
    try:
        db.create_all()
        quality = tissue_quality(data["qualityData"])
        bone = bone_region(data["boneData"])
        db.session.commit()
        return jsonify({"status": "success", "newQuality": quality, "newBone": bone}), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"[ERROR] save_parametres: {str(e)}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

def tissue_quality(data):
    timestamp  = data['timestamp']
    video = data['video']
    frameoriginal = data['frameoriginal']
    originalImage = data['originalImage']
    evaluator = data['evaluator']
    startPoint = data['startPoint']
    endPoint = data['endPoint']
    dimensions = data['dimensions']

    _x1 = int(startPoint['x'])
    _y1 = int(startPoint['y'])
    _x2 = int(endPoint['x'])
    _y2 = int(endPoint['y'])
    _width = int(dimensions['width'])
    _height = int(dimensions['height'])

    image = skimage.io.imread(io.BytesIO(base64.b64decode(originalImage.split(",")[1])), as_gray=True)
    image = (image * 255).astype(np.uint8)
    height, width = image.shape
    
    x1 = int(_x1 * width / _width)
    x2 = int(_x2 * width / _width)
    y1 = int(_y1 * height / _height)
    y2 = int(_y2 * height / _height)
    ROI = image[y1:y2, x1:x2]
    
    features_GLCM, _, labels_GLCM, _ = pf.glcm_features(ROI, ignore_zeros=True)
    glcm_ind = [1,5,3,9,2,4]
    glcm = [features_GLCM[i] for i in glcm_ind]
    labels_glcm = [labels_GLCM[i] for i in glcm_ind]

    aux = ROI.astype(np.float32)
    cA, (_, _, _) = pw.dwt2(aux, 'haar')
    haar_mean = float(np.mean(cA))
    haar_variance = float(np.var(cA))

    mask = np.ones(ROI.shape)
    features_GLDS, labels_GLDS = pf.glds_features(ROI, mask, Dx=[0, 1, 1, 1], Dy=[1, 1, 0, -1])

    Point = [[x1,y1],[x2,y2]]
    db.create_all()

    new_quality = ElectrolysisQuality(
        timestamp=timestamp,
        video=video,
        frameoriginal=frameoriginal,
        evaluator=evaluator,
        glcm=glcm,
        features_GLDS=list(features_GLDS),
        haar_mean=haar_mean,
        haar_variance=haar_variance,
        point=Point
    )
    db.session.add(new_quality)
    return {"glcm": glcm, "glcm_label": labels_glcm, "features_GLDS": list(features_GLDS), "labels_GLDS": labels_GLDS, "haar_mean": haar_mean, "haar_variance": haar_variance}

#Calculos zona de hueso (electrolysis)
def bone_region(data):
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)

    timestamp  = data['timestamp']
    video = data['video']
    frameoriginal = data['frameoriginal']
    originalImage = data['originalImage']
    evaluator = data['evaluator']
    startPoint = data['startPoint']
    endPoint = data['endPoint']
    dimensions = data['dimensions']
    threshold = data['threshold']
    
    _scale = float(data['scale'])
    _x1 = int(startPoint['x'])
    _y1 = int(startPoint['y'])
    _x2 = int(endPoint['x'])
    _y2 = int(endPoint['y'])
    _width = int(dimensions['width'])
    _height = int(dimensions['height'])

    image = skimage.io.imread(io.BytesIO(base64.b64decode(originalImage.split(",")[1])), as_gray=True)
    image = (image * 255).astype(np.uint8)

    height, width = image.shape
    scale = _scale * height

    x1 = int(_x1 * width / _width)
    x2 = int(_x2 * width / _width)
    y1 = int(_y1 * height / _height)
    y2 = int(_y2 * height / _height)

    ROI = image[y1:y2, x1:x2]
    binary_img = ROI > threshold
    erosion = morphology.binary_erosion(binary_img,footprint=np.ones((7,7)))
    dilation = morphology.binary_dilation(erosion, footprint=morphology.ellipse(20,15))
    hueso = ROI * dilation #Bone mask

    #GUARDAR IMAGEN HUESO io.imsave('folder/'+Name[:-4]+'-Bone.png',hueso)
    with open(f'static/frames/{frameoriginal}', 'wb') as f:
        f.write(base64.b64decode(originalImage.split(",")[1]))
    skimage.io.imsave(f'static/DATA/{timestamp}_bone.png', hueso)

    contours = measure.find_contours(dilation, 0.5)
    cnt = [c for c in contours if len(c) > 4]

    A = measure.moments(dilation.astype(np.uint8))[0,0]
    Area = float(A / scale ** 2)
    Per = float(measure.perimeter(dilation)/scale)

    hull = morphology.convex_hull_image(dilation)
    Convex = float(A / measure.moments(hull.astype(np.uint8))[0,0])
    
    glcm = feature.graycomatrix(hueso, distances=[1], angles=[0, np.pi / 4, np.pi / 2, 3 * np.pi / 4], levels=256, symmetric=True, normed=True)
    homogeneity = float(feature.graycoprops(glcm, 'homogeneity')[0].mean())
    contrast = float(feature.graycoprops(glcm, 'contrast')[0].mean())
    correlation = float(feature.graycoprops(glcm, 'correlation')[0].mean())
    
    Point = [[x1, y1], [x2, y2]]

    new_bone = ElectrolysisBone(
        timestamp=timestamp,
        video=video,
        frameoriginal=frameoriginal,
        evaluator=evaluator,
        contours=len(cnt),
        area=Area,
        perimeter=Per,
        convex=Convex,
        homogeneity=homogeneity,
        contrast=contrast,
        correlation=correlation,
        point=Point
    )
    db.session.add(new_bone)
    return {"contours": len(cnt), "area": Area, "perimeter": Per, "convex": Convex, "homogeneity": homogeneity, "contrast": contrast, "correlation": correlation}

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

import json
import os, io, shutil
from flask import Flask, render_template, request, jsonify, session, send_file, send_from_directory, render_template_string
from filelock import FileLock
#from flask_cors import CORS
import base64
from PIL import Image
import SimpleITK as sitk
import numpy as np
from datetime import datetime

app = Flask(__name__)
app.secret_key = "secret_key"

# CORS(app)
BASE_DIR = "/srv/data" #cambiar acceso del usuario ubuntu para que sea como admin (chown y chmod 755)
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

    # codo pendiente '4_'

    'abd_transversal_alba': '5_1_',
    'abd_transversal_recto': '5_2_',
    'abd_transversal_spiegel': '5_3_',
    'abd_transversal_toracolum': '5_4_',
    'abd_suelo_pelvico': '5_5_',

    'rm': ''

}

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

@app.route('/<app_name>') #Cuando se accede a la ruta que sea, se ejecuta la función index
def index(app_name):
    user = request.args.get('user')
    # En caso de que haya diferentes archivos HTML: template_name = f"{app_name}.html" 
    #                                                return render_template(template_name, title=app_name)

    #Para que las zonas y las estructuras, y el ancho de los pinceles, puedan ser definidas dinámicamente para el html:
    structures = load_json("structures.json").get(app_name, {}) #elementos dentro del elemento de la app concreta
    brush = load_json("settings_brush.json").get(app_name, {}) #elementos dentro del elemento de la app concreta
    for zone, structs in structures["structures"].items():
        for structure in structs:
            s_name = structure["name"]
            for b in brush["structures"].get(zone, []):
                if b["name"] == s_name:
                    structure["width"] = b["width"]
                    break

    return render_template('index.html', user = user, title=app_name, data=structures)



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

@app.route("/update_brush", methods=["POST"])
def update_brush_width():
    req = request.json
    appName = req["appName"]
    name = req["name"]
    zone = req["zone"]
    width = req["width"]

    brush = load_json_safe("settings_brush.json")

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

    save_json_atomic_safe("settings_brush.json", brush)
    return jsonify({"status": "ok", "updated": name})


@app.route('/verifyUser/<user>/<app_name>')
def verifyUser(user, app_name):
    if (user== "None" or user == None or user==""):
        error = True
    if((user == "mmu" or user == "mgd") and (app_name.startswith("base") or app_name.startswith("foot") or app_name.startswith("knee") or app_name.startswith("hand") or app_name.startswith("abd"))):
        error = False
    elif (user == "jpr" and (app_name.startswith("base") or app_name.startswith("foot"))):
        error = False
    elif (user == "pfm" and (app_name.startswith("base") or app_name.startswith("knee") or app_name.startswith("hand"))):
        error = False
    elif (user == "ppa" and (app_name.startswith("base") or app_name.startswith("abd"))):
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


@app.after_request
def add_header(response): #Con los cambios en el html, había problemas de cache al usar el boton Reload
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    app_num = APP_VIDEOS[app_name]
    dir_path = BASE_DIR
    if(app_name.startswith("base")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".mp4")])
    elif(app_name.startswith("rm")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha")])
    else:
        videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app_num) and file.lower().endswith(".mp4")])
    return jsonify(videos)
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


@app.route('/save', methods=['POST'])
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
    evaluator = data['evaluator']
    #time = data['time']
    
    with open(f'static/DATA/{filesaved}', 'wb') as f:
        f.write(imageEdited)
    #Añadir la nueva informacion al json
    metadata.append({
        "imageoriginal": imageoriginal,
        "filesaved": filesaved,
        "evaluator": evaluator,
        #"time": time
    })

    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)

    return jsonify({"status": "success"})


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return '', 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

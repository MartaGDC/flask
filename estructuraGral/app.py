import json
import os
from flask import Flask, render_template, request, jsonify, session, send_from_directory, abort
#from flask_cors import CORS
import base64
from datetime import datetime

app = Flask(__name__)
app.secret_key = "secret_key"
# CORS(app)
BASE_DIR = "/srv/data" #cambiar acceso del usuario ubuntu para que sea como admin (chown y chmod 755)
APP_DIRS = {
    "foot": "1.1"
}



@app.route('/<app_name>') #Cuando se accede a la ruta que sea, se ejecuta la función index
def index(app_name):
    # En caso de que haya diferentes archivos HTML: template_name = f"{app_name}.html" 
    #                                                return render_template(template_name, title=app_name)

    #Para que las zonas y las estructuras puedan ser definidas dinámicamente para el html:
    data = {}
    if(app_name == "foot"):
        data = {
            "zones" : [
                {"value": "heel", "label": "Heel"},
                {"value": "arc", "label": "Arc"},
                {"value": "ejemplo", "label": "..."}
            ],
            "structures": {
                "heel": [
                    {"name": "Skin and SCT", "color": "rgba(255, 150, 255, 0.25)"},
                    {"name": "Connective tissue", "color": "rgba(255, 255, 200, 0.1)"},                    
                    {"name": "Muscle", "color": "rgba(255, 50, 0, 0.5)"},
                    {"name": "Tendon", "color": "rgba(170, 170, 200, 0.5)"},
                    # {"name": "Ligament-Capsule", "color": "rgba(150, 200, 155, 0.5)"},
                    # {"name": "Synovial fluid", "color": "rgba(255, 255, 75, 0.25)"},
                    # {"name": "Artery", "color": "rgba(255, 0, 0, 0.5)"},
                    # {"name": "Vein", "color": "rgba(0, 0, 255, 0.5)"},
                    # {"name": "Nerve", "color": "rgba(255, 255, 0, 0.5)"},
                    # {"name": "Bone", "color": "rgba(255, 255, 150)"},
                    # {"name": "Cartilage", "color": "rgba(125, 200, 255, 0.75)"},
                    # {"name": "Fibrocartilage", "color": "rgba(150, 255, 150, 0.5)"},
                    # {"name": "Fatty tissue", "color": "rgba(255, 255, 175, 0.5)"},
                    # {"name": "Synovial membrane", "color": "rgba(255, 175, 255, 0.5)"},
                    # {"name": "Synovial sheath", "color": "rgba(175, 255, 175, 0.25)"},
                ],
                "arc": [
                    {"name": "Skin", "color": "#D81B60"},
                    {"name": "Muscle", "color": "#8E24AA"},
                    {"name": "Tendon...", "color": "#00ACC1"}
                ],
                "ejemplo":[
                    {"name": "...", "color": "#D81B60"},
                ]
            }
        }
    elif(app_name == "hand"):
        data = {
            "zones" : [
                {"value": "wrist", "label": "Wrist"},
                {"value": "palm", "label": "Palm"},
                {"value": "ejemplo", "label": "..."}
            ],
            "structures": {
                "wrist": [
                    {"name": "Skin", "color": "#D81B60"},
                    {"name": "Muscle", "color": "#8E24AA"},
                    {"name": "Tendon", "color": "#00ACC1"},
                    {"name": "Bone...", "color": "#FB8C00"},
                ],
                "palm": [
                    {"name": "Skin", "color": "#D81B60"},
                    {"name": "Muscle", "color": "#8E24AA"},
                    {"name": "Tendon...", "color": "#00ACC1"}
                ],
                "ejemplo":[
                    {"name": "...", "color": "#D81B60"},
                ]
            }
        }
    #...  
    return render_template('index.html', title=app_name, data=data)

#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    if app_name not in APP_DIRS:
        return abort(404, description=f"{app_name} doens't have a folder")
    dir_path = os.path.join(BASE_DIR, APP_DIRS[app_name])
    if not os.path.exists(dir_path) or not os.path.isdir(dir_path):
        return abort(404, description=f"Folder {APP_DIRS[APP_NAME]} not found")
    videos = [file for file in os.listdir(dir_path) if file.lower().endswith((".mp4"))]
    return jsonify(videos)
#Acceso al video de la carpeta
@app.route("/media/<app_name>/<filename>", methods=["GET"])
def play_video(app_name, filename):
    dir_path = os.path.join(BASE_DIR, APP_DIRS[app_name])
    return send_from_directory(directory=dir_path, path=filename)



@app.route('/save', methods=['POST'])
def save():
    #Cargar la respuesta
    data = request.json
    video = data['video']
    frame = data["frame"]
    originalImage = data['originalImage'].split(",")[1]
    originalImage = base64.b64decode(originalImage)
    imageEdited = data['imageEdited'].split(",")[1]
    imageEdited = base64.b64decode(imageEdited)
    filesaved = data['filesaved']
    quality = data['quality']
    zone = data['zone']
    evaluator = data['evaluator']

    #Cargar el json donde guardar la info
    os.makedirs("static/DATA", exist_ok=True)
    with open(f'static/DATA/{filesaved}', 'wb') as f:
        f.write(imageEdited)
    metadata_file = 'static/DATA/file_info.json'
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = []

    #Añadir la nueva informacion al json
    metadata.append({
        "video": video,
        "frame": frame,
        "filesaved": filesaved,
        "quality": quality,
        "zone": zone,
        "evaluator": evaluator
    })
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=4)

    return jsonify({"status": "success"})

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return '', 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

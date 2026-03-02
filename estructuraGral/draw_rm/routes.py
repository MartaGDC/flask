import os, base64
from flask import current_app as app
from flask import render_template, redirect, request, jsonify
from models import db, BrushSetting, Metadata, MetadataRM
from utils import token_required, load_json, user_can_access
from . import drawrm_bp
from config import BASE_DIR

PERMISSIONS = {
    "admin": ["base", "foot", "knee", "hand", "nerves", "abd", "menisco", "rm", "electrolysis"],
    "foot": ["foot"],
    "knee_hand": ["knee", "hand"],
    "knee_menisco": ["knee", "menisco"],
    "nerves": ["nerves"],
    "abd": ["abd"]
}

@drawrm_bp.route('/<app_name>')
@token_required
def index(user, app_name):
    if not user_can_access(user, app_name, PERMISSIONS):
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


@drawrm_bp.route("/count_frames/<username>/<video>")
def count_frames(username, video):
    count = Metadata.query.filter_by(
        evaluator=username
    ).filter(
        Metadata.video.startswith(video)
    ).count()
    return jsonify({"count": count})


@drawrm_bp.route("/unanalysed-images/<app_name>/<evaluator>")
def get_unanalysed_images(app_name, evaluator):
    """Returns list of unanalyzed images for a specific evaluator (for RM script only)"""
    dir_path = BASE_DIR
    if(app_name.startswith("rm")):
        videos = sorted([file for file in os.listdir(dir_path) if file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha")])    
    analyzed = MetadataRM.query.filter_by(evaluator=evaluator).all()
    analyzed_images = [m.imageoriginal for m in analyzed]
    unanalyzed = [f for f in videos if f not in analyzed_images]
    return jsonify(unanalyzed)


@drawrm_bp.route("/update_brush", methods=["POST"])
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


@drawrm_bp.route('/save', methods=['POST'])
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


@drawrm_bp.route('/saveRM', methods=['POST'])
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
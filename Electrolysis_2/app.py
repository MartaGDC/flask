
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


def load_json(path):
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
    count = ElectrolysisBone2.query.filter_by(
        evaluator=username
    ).filter(
        ElectrolysisBone2.video.startswith(video)
    ).count()
    return jsonify({"count": count})


#Subir archivo y guardarlo. Tambien procesarlos y es un video
@app.route("/upload", methods=["POST"])
def upload_file():
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

#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    app_num = APP_VIDEOS[app_name]
    dir_path = BASE_DIR
    videos = sorted([file for file in os.listdir(BASE_DIR) if file.startswith(app_num) and (file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".mha"))])
    dir_path = os.path.join(BASE_DIR, "proxy")
    videos.extend([file for file in os.listdir(dir_path) if file.startswith(app_num) and (file.lower().endswith(".mp4") or file.lower().endswith(".wmv"))])
    videos = [video.replace('_proxy', '') for video in videos]
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
        if extension==".wmv" or extension==".mp4":
            filename=f"{name}_proxy.mp4"
    else:
        dir_path = BASE_DIR
    return send_from_directory(directory=dir_path, path=filename)

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


@app.route('/save-parametres', methods=['POST'])
def save_parametres():
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
        #bone = bone_region(data["boneData"])
        #db.session.commit()
        #return jsonify({"status": "success", "newQuality": quality, "newBone": bone}), 200
        return jsonify({"status": "success"}), 200
    except Exception as e:
        #db.session.rollback()
        #import traceback
        #traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


def tissue_quality(data):
    timestamp = data['timestamp']
    video = data['video']
    zona = data['zona'] 
    estructura = data['estructura']
    frameoriginal = data['frameoriginal']
    frameMask = data['frameMask']
    originalImage = data['originalImage']
    maskImage = data['maskImage']
    evaluator = data['evaluator']
    dimensions = data['dimensions']

    edited_img = skimage.io.imread(io.BytesIO(base64.b64decode(maskImage.split(",")[1])), as_gray=True)
    original_img = skimage.io.imread(io.BytesIO(base64.b64decode(originalImage.split(",")[1])), as_gray=True)
    original_img = (original_img * 255).astype(np.uint8)
    edited_img = edited_img > 0

    img_roi, mask_roi = crop_bbox(original_img, edited_img)

    glcm = get_glcm(img_roi)
    g1 = glcm_features(glcm)
    cA, _ = pw.dwt2(img_roi.astype(np.float32), "haar")
    haar_mean = float(np.mean(cA)),
    haar_variance = float(np.var(cA))
    
    print("manual", g1, haar_mean, haar_variance)
    print("pyfeats real", get_pyfeats(edited_img, original_img))
    return get_quality_parametersPyfeats(glcm, img_roi), qualityFormulasTeoricas(img_roi, mask_roi)

    
def get_pyfeats(edited_img, original_img):
    ys, xs = np.where(edited_img)
    y_min = ys.min()
    y_max = ys.max()+1
    x_min = xs.min()
    x_max = xs.max()+1
    img_roi = (original_img * 255).astype(np.uint8)
    img_roi = img_roi[y_min:y_max, x_min:x_max]
    features_GLCM, _, labels_GLCM, _ = pf.glcm_features(img_roi, ignore_zeros=True)
    glcm_ind = [1,5,3,9,2,4]
    glcm = [features_GLCM[i] for i in glcm_ind]
    labels_glcm = [labels_GLCM[i] for i in glcm_ind]
    aux = img_roi.astype(np.float32)
    cA, (_, _, _) = pw.dwt2(aux, 'haar')
    haar_mean = float(np.mean(cA))
    haar_variance = float(np.var(cA))
    mask = np.ones(img_roi.shape)
    features_GLDS, labels_GLDS = pf.glds_features(img_roi, mask, Dx=[0, 1, 1, 1], Dy=[1, 1, 0, -1])
    return {"glcm": glcm, "glcm_label": labels_glcm, "features_GLDS": list(features_GLDS), "labels_GLDS": labels_GLDS, "haar_mean": haar_mean, "haar_variance": haar_variance}
 

def get_glcm(image, dxs=(0,1,1,1), dys=(1,1,0,-1)):
    h, w = image.shape
    levels = 256
    glcm_total = np.zeros((levels, levels), dtype=np.float64)
    for dx, dy in [(0,1),(1,1),(1,0),(1,-1)]:
        glcm = np.zeros((levels, levels), dtype=np.float64)
        for y in range(h):
            for x in range(w):
                y2 = y + dy
                x2 = x + dx
                # comprobar que el pixel vecino existe
                if 0 <= y2 < h and 0 <= x2 < w:
                    i = image[y, x]
                    j = image[y2, x2]
                    glcm[i, j] += 1
                    glcm[j, i] += 1
        #Normalizacion
        glcm /= (glcm.sum() + 1e-12)
        glcm_total += glcm
    glcm_total /= 4.0
    return glcm_total
def crop_bbox(img, mask):
    ys, xs = np.where(mask)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    return img[y0:y1, x0:x1], mask[y0:y1, x0:x1]
def glcm_features(glcm):
    Ng = glcm.shape[0]
    i, j = np.indices(glcm.shape)
    k = np.arange(Ng)
    px = glcm.sum(axis=1)
    py = glcm.sum(axis=0)
    mu_x = np.sum(k * px)
    mu_y = np.sum(k * py)
    sigma_x = np.sqrt(np.sum(((k - mu_x)**2) * px))
    sigma_y = np.sqrt(np.sum(((k - mu_y)**2) * py))
    contrast = np.sum((i - j)**2 * glcm)
    correlation = np.sum(
        (i - mu_x) * (j - mu_y) * glcm
    ) / (sigma_x * sigma_y + 1e-12)
    idm = np.sum(glcm / (1 + (i - j)**2))
    # SUM
    p_sum = np.zeros(2 * Ng)
    for r in range(Ng):
        for c in range(Ng):
            p_sum[r + c] += glcm[r, c]
    p_sum /= (p_sum.sum() + 1e-12)
    k_sum = np.arange(len(p_sum))
    sum_avg = np.sum(k_sum * p_sum)
    sum_entropy = -np.sum(p_sum * np.log2(p_sum + 1e-12))
    sum_var = np.sum(((i - mu_x)**2) * glcm)
    # DIFF
    p_diff = np.zeros(Ng)
    for r in range(Ng):
        for c in range(Ng):
            p_diff[abs(r - c)] += glcm[r, c]
    p_diff /= (p_diff.sum() + 1e-12)
    k_diff = np.arange(Ng)
    diff_mean = np.sum(k * p_diff)
    diff_var = np.sum(((k - diff_mean)**2) * p_diff)
    return {
        "glcm_contrast": contrast,
        "glcm_sumAvg": sum_avg,
        "glcm_sumOfVar2": sum_var,
        "glcm_diffVar": diff_var,
        "glcm_correlation": correlation,
        "glcm_invDiffMoment": idm
    }


def get_quality_parametersPyfeats(glcm, img_roi):
    i, j = np.indices(glcm.shape)
    glcm_contrast = np.sum((i - j) ** 2 * glcm)

    p_sum = np.zeros(2*glcm.shape[0]-1)
    for r in range(glcm.shape[0]):
        for c in range(glcm.shape[0]):
            p_sum[r+c] += glcm[r,c]
    sum_avg = np.sum(np.arange(len(p_sum))*p_sum)

    px = glcm.sum(axis=1)
    k = np.arange(glcm.shape[0])
    mu = np.sum(k * px)
    glcm_sumOfVar2 = np.sum(((i-mu)**2) * glcm)

    p_diff = np.zeros(glcm.shape[0])
    for r in range(glcm.shape[0]):
        for c in range(glcm.shape[0]):
            p_diff[abs(r-c)] += glcm[r,c]
    mu = np.sum(k * p_diff)
    glcm_diffVar = np.sum(((k-mu)**2) * p_diff)

    px = glcm.sum(axis=1)
    py = glcm.sum(axis=0)
    mu_x = np.sum(k * px)
    mu_y = np.sum(k * py)
    sigma_x = np.sqrt(np.sum(((k-mu_x)**2) * px))
    sigma_y = np.sqrt(np.sum(((k-mu_y)**2) * py))
    glcm_correlation = np.sum(((i-mu_x)*(j-mu_y)*glcm))/(sigma_x*sigma_y + 1e-12) #1e-12 para evitar que el denominador pueda ser 0

    glcm_invDiffMoment = np.sum(glcm / (1 + (i-j)**2))

    p_diff = np.zeros(glcm.shape[0])
    for r in range(glcm.shape[0]):
        for c in range(glcm.shape[0]):
            p_diff[abs(r-c)] += glcm[r,c]
    glds_homogeneity =  np.sum(p_diff / (1 + k**2))
    p_diff = np.zeros(glcm.shape[0])
    for r in range(glcm.shape[0]):
        for c in range(glcm.shape[0]):
            p_diff[abs(r-c)] += glcm[r,c]
    glds_contrast = np.sum((k**2) * p_diff)
    glds_asm = np.sum(p_diff**2)
    glds_entropy = -np.sum(p_diff * np.log2(p_diff + 1e-12))
    glds_mean = np.sum(k * p_diff)

    cA, (_, _, _) = pw.dwt2(img_roi.astype(np.float32), 'haar')
    cA = cA.astype(np.float64)
    haar_mean = float(np.mean(cA))
    haar_variance = float(np.var(cA))

    return {"glcm_contrast": glcm_contrast,
            "glcm_sumAvg": sum_avg,
            "glcm_sumOfVar2": glcm_sumOfVar2, 
            "glcm_diffVar": glcm_diffVar,
            "glcm_correlation": glcm_correlation,
            "glcm_invDiffMoment": glcm_invDiffMoment,
            "glds_homogeneity": glds_homogeneity,
            "glds_contrast": glds_contrast,
            "glds_asm": glds_asm,
            "glds_entropy": glds_entropy,
            "glds_mean": glds_mean,
            "haar_mean": haar_mean,
            "haar_variance": haar_variance}


def qualityFormulasTeoricas(img_roi, mask_roi):
    P = get_glcm(img_roi, mask_roi)
    Ng = P.shape[0]
    i, j = np.indices(P.shape)
    #distribuciones marginales
    px = P.sum(axis=1)
    py = P.sum(axis=0)
    g = np.arange(Ng)
    #Distribucion suma
    p_sum = np.zeros(2*Ng - 1) # o np.zeros(2*(Ng-1))??
    for r in range(Ng):
        for c in range(Ng):
            p_sum[r + c] += P[r, c]
    p_sum = p_sum / (p_sum.sum() + 1e-12)
    k_sum = np.arange(len(p_sum))
    #Distribucion diferencia
    p_diff = np.zeros(Ng)
    for r in range(Ng):
        for c in range(Ng):
            p_diff[abs(r - c)] += P[r, c]
    p_diff = p_diff / (p_diff.sum() + 1e-12)
    k_diff = np.arange(Ng)
    
    #GLCM Haralick:
        #Contrast
    contrast = np.sum((i - j)**2 * P)
        #Correlation
    mu_x = np.sum(g * px)
    mu_y = np.sum(g * py)
    sigma_x = np.sqrt(np.sum((g - mu_x)**2 * px))
    sigma_y = np.sqrt(np.sum((g - mu_y)**2 * py))
    correlation = np.sum((i - mu_x)*(j - mu_y)*P) / (sigma_x*sigma_y + 1e-12)
        #InvDiffMoment
    invDiffMoment = np.sum(P / (1 + (i - j)**2))
        #SumofSquares
    variance = np.sum(((i - mu_x)**2) * P)
        #Sum Average
    sum_average = np.sum(k_sum * p_sum)
        #Difference Variance
    diff_mean = np.sum(k_diff * p_diff)
    difference_variance = np.sum(((k_diff - diff_mean)**2) * p_diff)

    #GLDS Soh & Tsatsoulis
        #Mean
    glds_mean = np.sum(k_diff * p_diff)
        #Contrast
    glds_contrast = np.sum((k_diff**2) * p_diff)
        #ASM
    glds_asm = np.sum(p_diff**2)
        #Entropy
    glds_entropy = -np.sum(p_diff * np.log2(p_diff + 1e-12))
        #homogeneity
    glds_homogeneity = np.sum(p_diff / (1 + k_diff**2))

    #Haar
    cA, (_, _, _) = pw.dwt2(img_roi.astype(np.float32), 'haar')
    cA = cA.astype(np.float64)
    haar_mean = float(np.mean(cA))
    haar_variance = float(np.var(cA))

    return {"glcm_contrast": contrast,
            "glcm_sumAvg": sum_average,
            "glcm_sumOfVar2": variance,
            "glcm_diffVar": difference_variance,
            "glcm_correlation": correlation,
            "glcm_invDiffMoment": invDiffMoment,
            "glds_homogeneity": glds_homogeneity,
            "glds_contrast": glds_contrast,
            "glds_asm": glds_asm,
            "glds_entropy": glds_entropy,
            "glds_mean": glds_mean,
            "haar_mean": haar_mean,
            "haar_variance": haar_variance}



#Calculos zona de hueso (electrolysis)
def bone_region(data):
    timestamp  = data['timestamp']
    video = data['video']
    zona = data['zona']
    estructura = data['estructura']
    frameoriginal = data['frameoriginal']
    frameMask = data['fameMask']
    originalImage = data['originalImage']
    maskImage = data['maskImage']
    evaluator = data['evaluator']
    dimensions = data['dimensions']
    threshold = data['threshold']
    _scale = float(data['scale'])


    #Modificarlo cuando termine quality, que las imagenes de interes sera otros
    edited_img = skimage.io.imread(io.BytesIO(base64.b64decode(maskImage.split(",")[1])), as_gray=True)
    edited_img = (edited_img * 255).astype(np.uint8)
    mask = edited_img > 0

    original_img = skimage.io.imread(io.BytesIO(base64.b64decode(originalImage.split(",")[1])), as_gray=True)
    original_img = (original_img * 255).astype(np.uint8)
    img_roi = original_img
    mask_roi = mask
    mask_uint8 = (mask_roi*255).astype(np.uint8)

    contours, _ = cv2.findContours(
        mask_uint8,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    cnt = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt, True)
    convex = cv2.isContourConvex(cnt)


    scale = _scale * height
    x1 = int(_x1 * width / _width)
    x2 = int(_x2 * width / _width)
    y1 = int(_y1 * height / _height)
    y2 = int(_y2 * height / _height)
    x_min = min(x1, x2)
    x_max = max(x1, x2)
    y_min = min(y1, y2)
    y_max = max(y1, y2)

    ROI = image[y_min:y_max, x_min:x_max]
    binary_img = (ROI > threshold).astype(bool)
    erosion = morphology.binary_erosion(binary_img,footprint=np.ones((7,7)))
    dilation = morphology.binary_dilation(erosion, footprint=morphology.ellipse(20,15))
    hueso = ROI * dilation #Bone mask

    #GUARDAR IMAGEN HUESO io.imsave('folder/'+Name[:-4]+'-Bone.png',hueso)
    with open(os.path.join(frames_dir, frameoriginal), 'wb') as f:
        f.write(base64.b64decode(originalImage.split(",")[1]))
    skimage.io.imsave(os.path.join(data_dir, f'{timestamp}_bone.png'), hueso)

    contours = measure.find_contours(dilation, 0.5)
    
    # Diagnostic logging for contour analysis
    print(f"\n[CONTOUR ANALYSIS] {timestamp}")
    print(f"  Total contours detected: {len(contours)}")
    if contours:
        contour_sizes = [len(c) for c in contours]
        print(f"  Contour sizes: min={min(contour_sizes)}, max={max(contour_sizes)}, avg={sum(contour_sizes)/len(contour_sizes):.1f}")
        print(f"  Distribution: >2pts={sum(1 for c in contours if len(c) > 2)}, >3pts={sum(1 for c in contours if len(c) > 3)}, >4pts={sum(1 for c in contours if len(c) > 4)}, >5pts={sum(1 for c in contours if len(c) > 5)}")
    
    cnt = [c for c in contours if len(c) > 4]
    print(f"  Contours passing filter (>4 pts): {len(cnt)}\n")

    A = measure.moments(dilation.astype(np.uint8))[0,0]
    Area = nan_null(A / scale ** 2)
    Per = nan_null(measure.perimeter(dilation)/scale)

    hull = morphology.convex_hull_image(dilation)
    Convex = nan_null(A / measure.moments(hull.astype(np.uint8))[0,0])
    
    glcm = feature.graycomatrix(hueso, distances=[1], angles=[0, np.pi / 4, np.pi / 2, 3 * np.pi / 4], levels=256, symmetric=True, normed=True)
    homogeneity = nan_null(feature.graycoprops(glcm, 'homogeneity')[0].mean())
    contrast = nan_null(feature.graycoprops(glcm, 'contrast')[0].mean())
    correlation = nan_null(feature.graycoprops(glcm, 'correlation')[0].mean())
    
    Point = [[x_min, y_min], [x_max, y_max]]

    new_bone = ElectrolysisBone2(
        timestamp=timestamp,
        video=video,
        frameoriginal=frameoriginal,
        evaluator=evaluator,
        threshold=threshold,
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
    return {"threshold": threshold, "contours": len(cnt), "area": Area, "perimeter": Per, "convex": Convex, "homogeneity": homogeneity, "contrast": contrast, "correlation": correlation}

def nan_null(x):
    try:
        f = float(x)
        if math.isnan(f):
            return None
        return f
    except:
        return None

@app.route('/download')
def download():
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

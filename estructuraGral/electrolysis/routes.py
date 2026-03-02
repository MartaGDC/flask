from flask import render_template, redirect, request, jsonify
from flask import current_app as app
import os, io, base64
import skimage.io
from skimage import feature, measure, morphology
import pyfeats as pf
import pywt as pw
import numpy as np
from models import db, ElectrolysisBone, ElectrolysisQuality
from utils import token_required, user_can_access
from . import electrolysis_bp

PERMISSIONS = {
    "admin": ["base", "foot", "knee", "hand", "nerves", "abd", "menisco", "rm", "electrolysis"],
    "foot": ["foot"],
    "knee_hand": ["knee", "hand"],
    "knee_menisco": ["knee", "menisco"],
    "nerves": ["nerves"],
    "abd": ["abd"]
}

@electrolysis_bp.route('/')
@token_required
def index(user):
    if not user_can_access(user, "electrolysis", PERMISSIONS):
        return redirect("http://localhost/index.php")
    return render_template('index_electrolysis.html', user=user.username, title='electrolysis') 


@electrolysis_bp.route("/count_frames/<username>/<video>")
def count_frames_electrolysis(username, video):
    count = ElectrolysisBone.query.filter_by(
        evaluator=username
    ).filter(
        ElectrolysisBone.video.startswith(video)
    ).count()
    return jsonify({"count": count})

#Parámetros electrolysis
@electrolysis_bp.route('/save-parametres', methods=['POST'])
def save_parametres():
    data = request.json
    try:
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
    frames_dir = os.path.join(app.root_path, "static", "frames")
    data_dir = os.path.join(app.root_path, "static", "DATA")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)

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
    with open(os.path.join(frames_dir, frameoriginal), 'wb') as f:
        f.write(base64.b64decode(originalImage.split(",")[1]))
    skimage.io.imsave(os.path.join(data_dir, f'{timestamp}_bone.png'), hueso)

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

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
APP_VIDEOS = {
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
    'knee_posterior_longitudinal_lateral': '2_18_'
}


@app.route('/<app_name>') #Cuando se accede a la ruta que sea, se ejecuta la función index
def index(app_name):
    user = request.args.get('user')
    # En caso de que haya diferentes archivos HTML: template_name = f"{app_name}.html" 
    #                                                return render_template(template_name, title=app_name)

    #Para que las zonas y las estructuras puedan ser definidas dinámicamente para el html:
    data = {}

    if(app_name == "foot_longitudinal_fascia"):
        data = {
            'zones': [
                {"value": "insercion", "label": "Inserción"},
                {"value": "arco", "label": "Arco"},
                {"value": "Meta", "label": "Meta"},
            ],
            'structures': {
                "insercion": [
                    {'name': 'Fascia plantar superf', 'color': 'rgba(170, 230, 155)'},
                    {'name': 'Fascia plantar prof', 'color': 'rgba(170, 220, 155)'},
                    {'name': 'Almohadilla', 'color': 'rgba(252, 255, 170)'},
                    {'name': "Músculos flexores prof", 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 200)"},
                ],
                "arco": [
                    {'name': 'Fascia plantar', 'color': 'rgba(170, 230, 155)'},
                    {'name': "Músculo flexor corto de los dedos", 'color': 'rgba(240, 70, 0)'},
                    {'name': "Músculo cuadrado plantar", 'color': 'rgba(240, 60, 0)'},
                ],
                "meta": [
                    {'name': 'Fascia plantar', 'color': 'rgba(170, 230, 155)'},
                    {'name': "Músculos intrínsecos", 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Metatarsiano', 'color': "rgba(225, 255, 200)"},
                ]
            }
        }

    elif(app_name == "foot_transversal_fascia"):
        data = {
            'zones': [
                {"value": "insercion", "label": "Inserción"},
                {"value": "arco", "label": "Arco"},
            ],
            'structures': {
                "insercion": [
                    {'name': 'Fascia plantar superf', 'color': 'rgba(170, 230, 155)'},
                    {'name': 'Fascia plantar prof', 'color': 'rgba(170, 220, 155)'},
                    {'name': 'Almohadilla', 'color': 'rgba(252, 255, 170)'},
                    {'name': "Músculos flexores prof", 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 200)"},
                ],
                "arco": [
                    {'name': 'Fascia plantar', 'color': 'rgba(170, 230, 155)'},
                    {'name': "Músculo flexor corto de los dedos", 'color': 'rgba(240, 70, 0)'},
                    {'name': "Músculo cuadrado plantar", 'color': 'rgba(240, 60, 0)'},
                    {'name': "Abductor del primer dedo", 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Tendón flexor largo de los dedos', 'color': 'rgb(140, 190, 200)'},
                    {'name': 'Tendón flexor largo del primer dedo', 'color': 'rgb(140, 180, 200)'},
                    {'name': 'Tendón peroneo largo', 'color': 'rgb(140, 170, 200)'},
                    {'name': 'N plantar lat', 'color': 'rgb(255, 255, 50)'},
                    {'name': 'N plantar medial', 'color': 'rgb(255, 255, 40)'}
                ]
            }
        }
    
    elif(app_name == "foot_longitudinal_achilles"):
        data = {
            'zones': [
                {"value": "umt", "label": "UMT"},
                {"value": "cuerpo", "label": "Cuerpo"},
                {"value": "entesis", "label": "Entesis"},
            ],
            'structures': {
                "umt": [
                    {'name': "Músculo gastrocnemio", 'color': 'rgba(240, 70, 0)'},
                    {'name': "Músculo sóleo", 'color': 'rgba(240, 60, 0)'},
                    {'name': "Músculo flexores prof", 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Tendón de Aquiles', 'color': 'rgb(140, 190, 200)'},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 200)"},
                ],
                "cuerpo": [
                    {'name': 'Tendón de Aquiles', 'color': 'rgb(140, 190, 200)'},
                    {'name': "Músculo sóleo", 'color': 'rgba(240, 60, 0)'},
                    {'name': "Músculo flexores prof", 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Astrágalo', 'color': "rgba(225, 255, 180)"},
                    {'name': 'Paquete de Kager', 'color': "rgba(252, 255, 170)"},
                    {'name': 'Bursa prof', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Bursa superf', 'color': "rgba(250, 255, 80)"},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 200)"}
                ],
                'entesis': [
                    {'name': 'Tendón de Aquiles superf', 'color': 'rgb(140, 190, 200)'},
                    {'name': 'Tendón de Aquiles prof', 'color': 'rgb(140, 180, 200)'},
                    {'name': 'Paquete de Kager', 'color': "rgba(252, 255, 170)"},
                    {'name': 'Bursa prof', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Bursa superf', 'color': "rgba(250, 255, 80)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Astrágalo', 'color': "rgba(225, 255, 180)"},
                    {'name': "Músculo flexor largo del primer dedo", 'color': 'rgba(240, 60, 0)'},
                ]
            }
        }

    elif(app_name == "foot_transversal_achilles"):
        data = {
            'zones': [
                {"value": "umt", "label": "UMT"},
                {"value": "cuerpo", "label": "Cuerpo"},
                {"value": "entesis", "label": "Entesis"},
            ],
            'structures': {
                "umt": [
                    {'name': "Músculo gastrocnemio medial", 'color': 'rgba(240, 70, 0)'},
                    {'name': "Músculo gastrocnemio lat", 'color': 'rgba(240, 60, 0)'},
                    {'name': "Músculo sóleo", 'color': 'rgba(240, 50, 0)'},
                    {'name': "Músculo flexores prof", 'color': 'rgba(240, 40, 0)'},
                    {'name': 'Tendón de Aquiles', 'color': 'rgb(140, 190, 200)'},
                    {'name': 'Tendón delgado plantar', 'color': 'rgb(140, 180, 200)'},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Peroné', 'color': "rgba(225, 255, 190)"},
                    {'name': 'N tibial', 'color': "rgba(255, 255, 50)"},
                    {'name': 'N sural', 'color': "rgba(255, 255, 40)"},
                ],
                "cuerpo": [
                    {'name': 'Tendón de Aquiles', 'color': 'rgb(140, 190, 200)'},
                    {'name': "Músculo sóleo", 'color': 'rgba(240, 60, 0)'},
                    {'name': "Músculo flexores prof", 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Peroné', 'color': "rgba(225, 255, 190)"},
                    {'name': 'N tibial', 'color': "rgba(255, 255, 50)"},
                    {'name': 'N sural', 'color': "rgba(255, 255, 40)"},
                    {'name': 'Paquete de Kager', 'color': "rgba(252, 255, 170)"},
                ],
                'entesis': [
                    {'name': 'Tendón de Aquiles', 'color': 'rgb(140, 190, 200)'},
                    {'name': 'Calcáneo', 'color': "rgba(225, 255, 190)"},
                ]
            }
        }

    elif(app_name == "foot_longitudinal_volar"):
        data = {
            'zones': [
                {'value': 'none', 'label': ''},
            ],
            'structures' : {
                "none": [
                    {'name': 'Bandeleta de fascia plantar', 'color':'rgba(170, 230, 155)'},
                    {'name': 'Ligamento metatarsiano transverso superf', 'color':'rgba(170, 220, 155)'},
                    {'name': 'Cápsula', 'color': 'rgba(170, 210, 155)'},
                    {'name': 'Ligamento de checkrein', 'color': 'rgba(170, 200, 155)'}, 
                    {'name': 'Tendón flexor corto', 'color': 'rgba(140, 190, 200)'},
                    {'name': 'Tendón flexor largo', 'color': 'rgba(140, 180, 200)'},
                    {'name': 'Músculo lumbrical', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo aductor hallucis', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Placa volar', 'color': 'rgba(150, 255, 200)'},
                    {'name': 'Cartílago metatarsiano', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Cartílago falange', 'color': 'rgba(125, 240, 255)'},
                    {'name': 'Metatarsiano', 'color': 'rgba(225, 255, 200)'},
                    {'name': 'Falange proximal', 'color': 'rgba(225, 255, 190)'}
                ]
            }
        }

    elif(app_name == "foot_transversal_tarsal"):
        data = {
            'zones': [
                {'value': 'none', 'label': ''},
            ],
            'structures' : {
                "none" : [
                    {'name': 'Ligamento retináculo flexor', 'color':'rgba(170, 230, 155)'},
                    {'name': 'Tibia', 'color': 'rgba(225, 255, 200)'},
                    {'name': 'Astrágalo', 'color': 'rgba(225, 255, 190)'},
                    {'name': 'Calcáneo', 'color': 'rgba(225, 255, 180)'},
                    {'name': 'Tendón tibial post', 'color': 'rgba(140, 190, 200)'},
                    {'name': 'Tendón flexor largo de los dedos', 'color': 'rgba(140, 180, 200)'},
                    {'name': 'Tendón flexor largo del primer dedo', 'color': 'rgba(140, 170, 200)'},
                    {'name': 'Arteria tibial', 'color': 'rgba(230, 30, 0)'},
                    {'name': 'Venas tibiales', 'color': 'rgba(0, 30, 255)'},
                    {'name': 'N tibial', 'color':'rgba(255, 255, 50)'},
                    {'name': 'N ramas calcáneas', 'color': 'rgba(255, 255, 40)'},
                    {'name', 'N ramas plantar medial', 'color': 'rgba(255, 255, 30)'},
                    {'name': 'N ramas plantar lat', 'color': 'rgba(255, 255, 20)'}
                ]
            }
        }

    elif(app_name == "knee_anterior_longitudinal"):
        data = {
            'zones': [
                {"value": "suprarrotuliana", "label": "Supra-rotuliana"},
                {"value": "rotuliana", "label": "Rotuliana"},
                {"value": "infrarrotuliana", "label": "Infra-rotuliana"},
            ],
            'structures': {
                "suprarrotuliana": [
                    {'name': "Recto femoral", 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Vasto', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo articular', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cuadricipital interm', 'color': "rgba(140, 180, 200)"},
                    {'name': 'Cuadricipital prof', 'color': "rgba(140, 170, 200)"},
                    {'name': 'Grasa prefemoral', 'color': "rgba(252, 255, 170)"},
                    {'name': 'Grasa suprapatelar', 'color': "rgba(252, 255, 150)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula base', 'color': "rgba(225, 255, 190)"},
                ],
                "rotuliana": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Bursa infrarrotuliana superf', 'color': "rgba(250, 255, 70)"},
                    {'name': 'Rótula centro', 'color': "rgba(225, 255, 180)"},
                ],
                "infrarrotuliana": [
                    {'name': 'Rotuliano superf', 'color': "rgba(140, 160, 200)"},
                    {'name': 'Rotuliano prof', 'color': "rgba(140, 150, 200)"},
                    {'name': 'Grasa retrorrotuliana', 'color': "rgba(252, 255, 150)"},
                    {'name': 'Bursa infrarrotuliana prof', 'color': "rgba(250, 255, 80)"},
                    {'name': 'Bursa infrarrotuliana superf', 'color': "rgba(250, 255, 70)"},
                    {'name': 'Fémur cóndilo', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula ápex', 'color': "rgba(225, 255, 170)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 160)"}
                ]
            }
        }

    elif(app_name == "knee_anterior_transversal"):
        data = {
            'zones': [
                {"value": "suprarrotuliana", "label": "Supra-rotuliana"},
                {"value": "rotuliana", "label": "Rotuliana"},
                {"value": "infrarrotuliana", "label": "Infra-rotuliana"},
            ],
            'structures': {
                "suprarrotuliana": [
                    {'name': "Recto femoral", 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Vasto interno', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Vasto externo', 'color': "rgba(240, 50, 0)"},
                    {'name': 'Vasto interm', 'color': "rgba(240, 40, 0)"},
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cuadricipital interm', 'color': "rgba(140, 180, 200)"},
                    {'name': 'Cuadricipital prof', 'color': "rgba(140, 170, 200)"},
                    {'name': 'Grasa prefemoral', 'color': "rgba(252, 255, 170)"},
                    {'name': 'Grasa suprapatelar', 'color': "rgba(252, 255, 160)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula base', 'color': "rgba(225, 255, 190)"},
                ],
                "rotuliana": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Bursa infrarrotuliana superf', 'color': "rgba(250, 255, 70)"},
                    {'name': 'Rótula centro', 'color': "rgba(225, 255, 180)"},
                ],
                "infrarrotuliana": [
                    {'name': 'Rotuliano superf', 'color': "rgba(140, 160, 200)"},
                    {'name': 'Rotuliano prof', 'color': "rgba(140, 150, 200)"},
                    {'name': 'Grasa retrorrotuliana', 'color': "rgba(252, 255, 150)"},
                    {'name': 'Bursa infrarrotuliana prof', 'color': "rgba(250, 255, 80)"},
                    {'name': 'Bursa infrarrotuliana superf', 'color': "rgba(250, 255, 70)"},
                    {'name': 'Fémur cóndilo', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula ápex', 'color': "rgba(225, 255, 170)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 160)"}
                ]
            }
        }

    elif(app_name == "knee_anterior_transverse_trochlea"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cuadricipital interm', 'color': "rgba(140, 180, 200)"},
                    {'name': 'Cuadricipital prof', 'color': "rgba(140, 170, 200)"},
                    {'name': 'Grasa suprapatelar', 'color': "rgba(252, 255, 150)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Cartílago Trólea femoral', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"}
                ]
            }
        }
        
    elif(app_name == "knee_anterior_longitudinal_trochlea"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cuadricipital interm', 'color': "rgba(140, 180, 200)"},
                    {'name': 'Cuadricipital prof', 'color': "rgba(140, 170, 200)"},
                    {'name': 'Grasa suprapatelar', 'color': "rgba(252, 255, 150)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Cartílago Trólea femoral', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"}
                ]
            }
        }
    
    elif(app_name == "knee_anterior_parasagittal"):
        data = {
            'zones': [
                {"value": "medial", "label": "Medial"},
                {"value": "lateral", "label": "Lateral"}
            ],
            'structures': {
                "medial": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cartílago Trólea femoral', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Cartílago rotuliano', 'color': 'rgba(125, 240, 255)'},
                    {'name': 'Fémur cóndilo', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {"name": "Retináculo superf", "color": "rgba(170, 230, 155)"},
                    {"name": "Retináculo prof", "color": "rgba(170, 220, 155)"}
                ],
                "lateral": [
                    {'name': 'Cuadricipital superf', 'color': "rgba(140, 190, 200)"},
                    {'name': 'Cartílago Trólea femoral', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Cartílago rotuliano', 'color': 'rgba(125, 240, 255)'},
                    {'name': 'Fémur cóndilo', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Rótula', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Receso articular', 'color': "rgba(250, 255, 90)"},
                    {"name": "Retináculo superf", "color": "rgba(170, 230, 155)"},
                    {"name": "Retináculo prof", "color": "rgba(170, 220, 155)"}
                ],
            }
        }
    
    elif(app_name == "knee_medial_LLI"):
        data = {
            'zones': [
                {"value": "interlinea", "label": "Interlínea"},
                {"value": "pataganso", "label": "Pata de ganso"},
            ],
            'structures': {
                "interlinea": [
                    {'name': 'LLI superf', 'color': "rgba(170, 230, 155)"},
                    {'name': 'LLI prof', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Menisco int', "color": "rgba(150, 255, 200)"},
                    {'name': 'Arteria geniculada superf', "color": "rgba(230, 30, 0)"},                
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"},
                ],
                "pataganso": [
                    {'name': 'LLI superf', 'color': "rgba(170, 230, 155)"},
                    {'name': 'LLI prof', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Pata de ganso superf', "color": "rgba(140, 190, 200)"},
                    {'name': 'Pata de ganso prof', "color": "rgba(140, 180, 200)"},
                    {'name': 'Arteria geniculada inf', "color": "rgba(230, 30, 0)"},                
                    {'name': 'Ramas n. geniculadas inf', 'color': "rgba(255, 255, 50)"},
                ]
            }
        }
    
    elif(app_name == "knee_medial_meniscal_transversal"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'LLI superf', 'color': "rgba(170, 230, 155)"},
                    {'name': 'LLI prof', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Receso medial sup', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Receso medial inf', 'color': "rgba(250, 255, 80)"},
                    {'name': 'Menisco int', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }
    
    elif(app_name == "knee_medial_meniscal_longitudinal"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'LLI superf', 'color': "rgba(170, 230, 155)"},
                    {'name': 'LLI prof', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Menisco int', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_lateral_cintilla"):
        data = {
            'zones': [
                {"value": "femur", "label": "Fémur"},
                {"value": "interlinea", "label": "Interlínea"},
                {"value": "tibia", "label": "Tibia"},
            ],
            'structures': {
                "femur": [
                    {'name': 'Vasto ext', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Cintilla iliotibial', "color": "rgba(140, 190, 200)"},
                    {'name': 'Bursa', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                ],
                "interlinea": [
                    {'name': 'Cintilla iliotibial', "color": "rgba(140, 190, 200)"},
                    {'name': 'Tendón poplíteo', "color": "rgba(140, 180, 200)"},
                    {'name': 'Bursa', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Arteria geniculada superf', "color": "rgba(230, 30, 0)"},                
                    {'name': 'Cápsula articular', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Menisco ext', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ],
                "tibia": [
                    {'name': 'Cintilla iliotibial', "color": "rgba(140, 190, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_lateral_LLE"):
        data = {
            'zones': [
                {"value": "femur", "label": "Fémur"},
                {"value": "interlinea", "label": "Interlínea"},
                {"value": "perone", "label": "Peroné"},
            ],
            'structures': {
                "femur": [
                    {'name': 'Ligamento lat ext', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Cápsula', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Tendón poplíteo', "color": "rgba(140, 190, 200)"},
                    {'name': 'Bursa', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 180)"}
                ],
                "interlinea": [
                    {'name': 'Ligamento lat ext', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Cápsula', 'color': "rgba(170, 220, 155)"},
                    {'name': 'Tendón poplíteo', "color": "rgba(140, 190, 200)"},
                    {'name': 'Bursa', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Arteria geniculada superf', "color": "rgba(230, 30, 0)"},                
                    {'name': 'Menisco ext', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 180)"}
                ],
                "perone": [
                    {'name': 'Ligamento lat ext', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Peroné', 'color': "rgba(225, 255, 180)"}
                ]
            }
        }

    elif(app_name == "knee_lateral_biceps"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Tendón bicipital', "color": "rgba(140, 190, 200)"},
                    {'name': 'Bíceps', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Peroné', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_lateral_menisco_transversal"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Cápsula', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Tendón poplíteo', "color": "rgba(140, 190, 200)"},
                    {'name': 'Receso', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Menisco ext', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_lateral_menisco_longitudinal"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Cápsula', 'color': "rgba(170, 230, 155)"},
                    {'name': 'Tendón poplíteo', "color": "rgba(140, 190, 200)"},
                    {'name': 'Receso', 'color': "rgba(250, 255, 90)"},
                    {'name': 'Menisco ext', "color": "rgba(150, 255, 200)"},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_posterior_transversal_medial"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Nervio CPI', 'color': "rgba(255, 255, 50)"},
                    {'name': 'Nervio sural medial', 'color': "rgba(255, 255, 40)"},
                    {'name': 'Arteria poplítea', 'color': "rgba(230, 30, 0)"},
                    {'name': 'Vena poplítea', 'color': "rgba(0, 30, 255)"},
                    {'name': 'Músculo semimembranoso', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo gastrocnemio medial', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo poplíteo', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Tendón semimembranoso', "color": "rgba(140, 180, 200)"},
                    {'name': 'Tendón semitendinoso', "color": "rgba(140, 170, 200)"},
                    {'name': 'Cartílago cóndilo medial', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_posterior_transversal_central"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Nervio CPI', 'color': "rgba(255, 255, 50)"},
                    {'name': 'Nervio CPE', 'color': "rgba(255, 255, 40)"},
                    {'name': 'Nervio sural medial', 'color': "rgba(255, 255, 30)"},
                    {'name': 'Nervio sural lateral', 'color': "rgba(255, 255, 20)"},
                    {'name': 'Arteria poplítea', 'color': "rgba(230, 30, 0)"},
                    {'name': 'Vena poplítea', 'color': "rgba(0, 30, 255)"},
                    {'name': 'Músculos isquiosurales', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo gastrocnemio medial', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo gastrocnemio lateral', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Músculo plantar', 'color': 'rgba(240, 40, 0)'},
                    {'name': 'Músculo poplíteo', 'color': 'rgba(240, 30, 0)'},
                    {'name': 'Cartílago cóndilo medial', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Cartílago cóndilo lateral', 'color': 'rgba(125, 240, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_posterior_transversal_lateral"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Nervio CPE', 'color': "rgba(255, 255, 50)"},
                    {'name': 'Nervio sural lateral', 'color': "rgba(255, 255, 40)"},
                    {'name': 'Arteria poplítea', 'color': "rgba(230, 30, 0)"},
                    {'name': 'Vena poplítea', 'color': "rgba(0, 30, 255)"},
                    {'name': 'Músculo bíceps femoral', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo gastrocnemio lateral', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo plantar', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Músculo poplíteo', 'color': 'rgba(240, 40, 0)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"}
                ]
            }
        }

    elif(app_name == "knee_posterior_logitudinal_medial"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Músculo isquiosural', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo gastrocnemio', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo poplíteo', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Cartílago cóndilo medial', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Fabela', 'color': "rgba(225, 255, 180)"}
                ]
            }
        }

    elif(app_name == "knee_posterior_longitudinal_lateral"):
        data = {
            'zones': [
                {"value": "none", "label": ""},
            ],
            'structures': {
                "none": [
                    {'name': 'Músculo isquiosural', 'color': 'rgba(240, 70, 0)'},
                    {'name': 'Músculo gastrocnemio', 'color': 'rgba(240, 60, 0)'},
                    {'name': 'Músculo poplíteo', 'color': 'rgba(240, 50, 0)'},
                    {'name': 'Cartílago cóndilo lateral', 'color': 'rgba(125, 250, 255)'},
                    {'name': 'Fémur', 'color': "rgba(225, 255, 200)"},
                    {'name': 'Tibia', 'color': "rgba(225, 255, 190)"},
                    {'name': 'Fabela', 'color': "rgba(225, 255, 180)"}
                ]
            }
        }

    return render_template('index.html', title=app_name, data=data)


@app.after_request
def add_header(response): #Con los cambios en el html, había problemas de cache al usar el boton Reload
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


#Acceso a carpetas de videos según la app_name
@app.route("/select/<app_name>", methods=["GET"])
def list_files(app_name):
    app = APP_VIDEOS[app_name]
    dir_path = BASE_DIR
    videos = sorted([file for file in os.listdir(dir_path) if file.startswith(app) and file.lower().endswith(".mp4")])
    return jsonify(videos)
#Acceso al video de la carpeta
@app.route("/media/<app_name>/<filename>", methods=["GET"])
def play_video(app_name, filename):
    dir_path = BASE_DIR
    return send_from_directory(directory=dir_path, path=filename)



@app.route('/save', methods=['POST'])
def save():
    #Cargar el json donde guardar la info
    os.makedirs("static/DATA", exist_ok=True)
    os.makedirs("static/frames", exist_ok=True)
    metadata_file = 'static/DATA/file_info.json'
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = []

    #Cargar la respuesta
    data = request.json
    if isinstance(data, dict): #guardado de un solo frame
        video = data['video']
        frame = data["frame"]
        originalImage = data['originalImage'].split(",")[1]
        originalImage = base64.b64decode(originalImage)
        imageEdited = data['imageEdited'].split(",")[1]
        imageEdited = base64.b64decode(imageEdited)
        frameoriginal = data['frameoriginal']
        filesaved = data['filesaved']
        quality = data['quality']
        zone = data['zone']
        evaluator = data['evaluator']
        
        with open(f'static/frames/{frameoriginal}', 'wb') as f:
            f.write(originalImage)
        with open(f'static/DATA/{filesaved}', 'wb') as f:
            f.write(imageEdited)
        #Añadir la nueva informacion al json
        metadata.append({
            "video": video,
            "frame": frame,
            "frameoriginal": frameoriginal,
            "filesaved": filesaved,
            "quality": quality,
            "zone": zone,
            "evaluator": evaluator
        })
    elif isinstance(data, list): #guardado de multiples frames
        for i in range(len(data)):
            video = data[i]['video']
            frame = data[i]["frame"]
            originalImage = data[i]['originalImage'].split(",")[1]
            originalImage = base64.b64decode(originalImage)
            imageEdited = data[i]['imageEdited'].split(",")[1]
            imageEdited = base64.b64decode(imageEdited)
            frameoriginal = data[i]['frameoriginal']
            filesaved = data[i]['filesaved']
            quality = data[i]['quality']
            zone = data[i]['zone']
            evaluator = data[i]['evaluator']
            with open(f'static/frames/{frameoriginal}', 'wb') as f:
                f.write(originalImage)
            with open(f'static/DATA/{filesaved}', 'wb') as f:
                f.write(imageEdited)
            #Añadir la nueva informacion al json
            metadata.append({
                "video": video,
                "frame": frame,
                "frameoriginal": frameoriginal,
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

import json
import os
from flask import Flask, render_template, request, jsonify
import base64
from datetime import datetime

app = Flask(__name__)

@app.route('/<app_name>') #Cuando se accede a la ruta que sea, se ejecuta la función index
def index(app_name):
    # En caso de que haya diferentes archivos HTML: template_name = f"{app_name}.html" 
    #                                                return render_template(template_name, title=app_name)

    #Para que las zonas puedan ser definidas dinámicamente para el html
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
                    {"name": "Skin", "color": "#D81B60"},
                    {"name": "Muscle", "color": "#8E24AA"},
                    {"name": "Tendon", "color": "#00ACC1"},
                    {"name": "Bone...", "color": "#FB8C00"},
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

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

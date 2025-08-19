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
    if(app_name == "foot"):
        zones = [
            {"value": "heel", "label": "Heel"},
            {"value": "arc", "label": "Arc"},
            {"value": "toe", "label": "Toe"}
        ]
    elif(app_name == "hand"):
        zones = [
            {"value": "wrist", "label": "Wrist"},
            {"value": "palm", "label": "Palm"}
        ]
    #...  
    return render_template('index.html', title=app_name, zones=zones)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

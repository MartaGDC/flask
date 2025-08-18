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
    data = {
        "foot": {"video_path": "videos/foot.mp4"}, #Rellenar para el resto de aplicaciones
    }
    app_data = data.get(app_name, {})
    return render_template('index.html', title=app_name, app_data=app_data)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1',port=5004)

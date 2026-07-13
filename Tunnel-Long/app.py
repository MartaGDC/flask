import json
import os
from flask import Flask, render_template, request, jsonify
import base64
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/images')
def images():
    folder_path = 'static/echographies'
    files = os.listdir(folder_path)
    return jsonify(files)

@app.route('/save', methods=['POST'])
def save():
    data = request.json
    image_data = data['image'].split(",")[1]
    image_data = base64.b64decode(image_data)
    filename = data['filename']
    original_image = data['originalImage']  # Get the original image filename
    evName = data['evName']
    quality = data['imgQuality']

    # Save the drawing
    with open(f'static/DATA/{filename}', 'wb') as f:
        f.write(image_data)

    # Load existing metadata
    metadata_file = 'static/DATA/file_info.json'
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = []

    # Append new metadata
    metadata.append({
        'drawing': filename,
        'original_image': original_image,
        'Evaluator': evName,
        'Echography Quality': quality
    })

    # Save updated metadata
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=4)

    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

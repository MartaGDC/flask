import os
import subprocess

ORIG = "/srv/data"
PROXY = "/srv/data/proxy"

for filename in os.listdir(ORIG):
    if not filename.lower().endswith(".mp4"):
        continue
    orig_path = os.path.join(ORIG, filename)
    proxy_name = filename.replace(".mp4", "_proxy.mp4")
    proxy_path = os.path.join(PROXY, proxy_name)
    os.makedirs(PROXY, exist_ok=True)

    if not os.path.exists(proxy_path) or os.path.getmtime(orig_path) > os.path.getmtime(proxy_path): #Comprobar si el archivo proxy para un original de una fecha determinada (por si ha habido sobreescrituras)
        subprocess.run([
            "ffmpeg", #comando para ejecutar ffmpeg (instalado previamente en el sistema)
            "-i", orig_path, #-i: Archivo de entrada
            "-vf", "scale=640:-1", #redimensiona por si puede hacerse mas ligero
            "-vsync", "cfr", #contant frame rate
            "-c:v", "libx264", #asegura formato de video compatible con web, libx264 es el codec de video H.264
            "-preset", "veryfast", #optimiza velocidad de codificación
            "-tune", "zerolatency", #minimiza la latencia del streaming
            "-x264-params", "keyint=1:min-keyint=1:scenecut=0", #paramtros del video H.264 para separar los frames rápidamente
            "-b:v", "2M", #tasa de bits de 2Mbps, video pequeñito
            "-movflags", "+faststart", #permite reproducir el video antes de que se haya descargado completamente
            proxy_path #guardado de salida
        ], check=True)
    

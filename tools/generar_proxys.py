import os
import subprocess

ORIG = "/srv/data"
PROXY = "/srv/data/proxy"

def process_all():
    os.makedirs(PROXY, exist_ok=True)
    for filename in os.listdir(ORIG):
        if not filename.lower().endswith((".mp4", ".mpeg", ".wmv")):
            continue
        orig_path = os.path.join(ORIG, filename)
        name, _ = os.path.splitext(filename)
        proxy_name = f"{name}_proxy.mp4"
        proxy_path = os.path.join(PROXY, proxy_name)

        if not os.path.exists(proxy_path) or os.path.getmtime(orig_path) > os.path.getmtime(proxy_path): #Comprobar si el archivo proxy para un original de una fecha determinada (por si ha habido sobreescrituras)
            if filename.lower().endswith(".wmv"):
                subprocess.run([
                    "ffmpeg",
                    "-i", orig_path,
                    "-c:v", "libx264",
                    "-crf", "18",
                    "-preset", "slow",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    proxy_path #guardado de salida
                ], check=True)
            else:
                subprocess.run([
                    "ffmpeg", #comando para ejecutar ffmpeg (instalado previamente en el sistema)
                    "-i", orig_path, #-i: Archivo de entrada
                    "-vf", 'scale=640:trunc(ow/a/2)*2', #redimensiona por si puede hacerse mas ligero. Necesario hacer esto en vez de scale=640:-1 para las imagenes con pixeles impares.
                    "-vsync", "cfr", #contant frame rate
                    "-c:v", "libx264", #asegura formato de video compatible con web, libx264 es el codec de video H.264
                    "-preset", "veryfast", #optimiza velocidad de codificación
                    "-x264-params", "keyint=1:min-keyint=1:scenecut=0", #paramtros del video H.264 para separar los frames rápidamente
                    "-b:v", "2M", #tasa de bits de 2Mbps, video pequeñito
                    "-c:a", "aac",
                    "-movflags", "+faststart", #permite reproducir el video antes de que se haya descargado completamente
                    proxy_path #guardado de salida
                ], check=True)

def process_one(filename):
    orig_path = os.path.join(ORIG, filename)
    name, _ = os.path.splitext(filename)
    proxy_name = f"{name}_proxy.mp4"
    proxy_path = os.path.join(PROXY, proxy_name)
    os.makedirs(PROXY, exist_ok=True)

    if not os.path.exists(proxy_path): #Comprobar si el archivo proxy para un original de una fecha determinada (por si ha habido sobreescrituras)
        if filename.lower().endswith(".wmv"):
                subprocess.run([
                    "ffmpeg",
                    "-i", orig_path,
                    "-c:v", "libx264",
                    "-crf", "18",
                    "-preset", "slow",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    proxy_path #guardado de salida
                ], check=True)
        else:
            subprocess.run([
                "ffmpeg", #comando para ejecutar ffmpeg (instalado previamente en el sistema)
                "-i", orig_path, #-i: Archivo de entrada
                "-vf", 'scale=640:trunc(ow/a/2)*2', #redimensiona por si puede hacerse mas ligero. Necesario hacer esto en vez de scale=640:-1 para las imagenes con pixeles impares.
                "-vsync", "cfr", #contant frame rate
                "-c:v", "libx264", #asegura formato de video compatible con web, libx264 es el codec de video H.264
                "-preset", "veryfast", #optimiza velocidad de codificación
                "-tune", "zerolatency", #minimiza la latencia del streaming
                "-x264-params", "keyint=1:min-keyint=1:scenecut=0", #paramtros del video H.264 para separar los frames rápidamente
                "-b:v", "2M", #tasa de bits de 2Mbps, video pequeñito
                "-movflags", "+faststart", #permite reproducir el video antes de que se haya descargado completamente
                proxy_path #guardado de salida
            ], check=True)

if __name__ == "__main__":
    process_all()
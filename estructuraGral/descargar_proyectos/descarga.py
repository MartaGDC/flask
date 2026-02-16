import pandas as pd
from sqlalchemy import create_engine, text
import json
import os
import shutil


proyecto = input("Identificador del proyecto, por ejemplo 1_3_: ").strip()
rutaActual=f'proyecto_{proyecto}actual/'
rutaRecuperada=f'proyecto_{proyecto}recuperado/'
rutaActual_csv = f'{rutaActual}{proyecto}actual.csv'
rutaRecuperada_csv = f'{rutaRecuperada}{proyecto}recuperado.csv'

os.makedirs(f"{rutaActual}originales", exist_ok=True)
os.makedirs(f"{rutaActual}mascaras", exist_ok=True)
os.makedirs(f"{rutaRecuperada}originales", exist_ok=True)
os.makedirs(f"{rutaRecuperada}mascaras", exist_ok=True)


engine = create_engine("postgresql://php_flask:SdeSindrome$@localhost/db_php_flask")

query_actual = text("""
    SELECT video, frameoriginal, filesaved
    FROM "metadata"
    WHERE frameoriginal LIKE :proyecto
""")
query_recuperado = text("""
    SELECT video, frameoriginal, filesaved
    FROM "metadataRecuperado"
    WHERE frameoriginal LIKE :proyecto
""")

df_actual = pd.read_sql(query_actual, engine, params={"proyecto": f"{proyecto}%"})

#lista_videosActual = df_actual['video'].tolist()
lista_imgOriginalesActual = df_actual['frameoriginal'].tolist()
for img in lista_imgOriginalesActual:
    src = f"../static/frames/{img}"
    dst = f"{rutaActual}originales/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

lista_imgMaskActual = df_actual['filesaved'].tolist()
for img in lista_imgMaskActual:
    src = f"../static/DATA/{img}"
    dst = f"{rutaActual}mascaras/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

df_actual.to_csv(rutaActual_csv, index=False, encoding='utf-8-sig')


df_recuperado = pd.read_sql(query_recuperado, engine, params={"proyecto": f"{proyecto}%"})

#lista_videosRecuperado = df_recuperado['video'].tolist()
lista_imgOriginalesRecuperado = df_recuperado['frameoriginal'].tolist()
for img in lista_imgOriginalesRecuperado:
    src = f"../static/frames/{img}"
    dst = f"{rutaRecuperada}originales/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

lista_imgMaskRecuperado = df_recuperado['filesaved'].tolist()
for img in lista_imgMaskRecuperado:
    src = f"../static/DATA/{img}"
    dst = f"{rutaRecuperada}mascaras/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

df_recuperado.to_csv(rutaRecuperada_csv, index=False, encoding='utf-8-sig')

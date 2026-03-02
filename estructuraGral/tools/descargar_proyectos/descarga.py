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


#-----COLORES-----
proyectos_dict = {
    "base_tejidos":"0_1_",
    "base_artefactos" : "0_2_",
    "base_ROIS":"0_3_",
    "base_marco":"0_4_",
    
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

    'menisco': '6_',

    'rm': ''
}
app_nombre=''
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
for key, value in proyectos_dict.items():
    if value == proyecto:
        app_nombre= key
        break
structures = load_json("../../structures.json").get(app_nombre, {})
with open(f'proyecto_{proyecto}_colores.json', "w", encoding="utf-8") as f:
    json.dump(structures, f, indent=4, ensure_ascii=False)


#-----Imagenes y metadatos-----
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
    src = f"../../static/frames/{img}"
    dst = f"{rutaActual}originales/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

lista_imgMaskActual = df_actual['filesaved'].tolist()
for img in lista_imgMaskActual:
    src = f"../../static/DATA/{img}"
    dst = f"{rutaActual}mascaras/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

df_actual.to_csv(rutaActual_csv, index=False, encoding='utf-8-sig')


df_recuperado = pd.read_sql(query_recuperado, engine, params={"proyecto": f"{proyecto}%"})

#lista_videosRecuperado = df_recuperado['video'].tolist()
lista_imgOriginalesRecuperado = df_recuperado['frameoriginal'].tolist()
for img in lista_imgOriginalesRecuperado:
    src = f"../../static/frames/{img}"
    dst = f"{rutaRecuperada}originales/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

lista_imgMaskRecuperado = df_recuperado['filesaved'].tolist()
for img in lista_imgMaskRecuperado:
    src = f"../../static/DATA/{img}"
    dst = f"{rutaRecuperada}mascaras/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

df_recuperado.to_csv(rutaRecuperada_csv, index=False, encoding='utf-8-sig')

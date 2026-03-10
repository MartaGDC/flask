import pandas as pd
from sqlalchemy import create_engine, text
import json
import os
import shutil

#En el proyecto de electrolysis lo relevante no son las imagenes sino las variables calculadas. Descagar también los framesoriginales para documentar si necesario
proyecto = "electrolysis"
ruta_quality = f'electrolyis_quality.csv'
ruta_bone = f'electrolyis_bone.csv'
os.makedirs(f"originales", exist_ok=True)

os.makedirs(f"electrolysis_originales", exist_ok=True)

#-----Imagenes y metadatos-----
engine = create_engine("postgresql://php_flask:SdeSindrome$@localhost/db_php_flask")

query_quality = text("""
    SELECT *
    FROM "electrolysis_quality"
""")

query_bone = text("""
    SELECT *
    FROM "electrolysis_bone"
""")

df_quality = pd.read_sql(query_quality, engine)
df_bone = pd.read_sql(query_bone, engine)

lista_imgOriginales = df_bone['frameoriginal'].tolist()
for img in lista_imgOriginales:
    src = f"../../static/frames/{img}"
    dst = f"originales/{img}"
    if os.path.exists(src):
        shutil.copy2(src, dst)

df_quality.to_csv(ruta_quality, index=False, encoding='utf-8-sig')
df_bone.to_csv(ruta_bone, index=False, encoding='utf-8-sig')

import json
from app import app
from models import db, BrushSetting

with app.app_context():
    db.create_all()

    with open("settings_brush.json", encoding="utf-8") as f:
        data = json.load(f)

    for app_name, content in data.items():

        for zone, structures in content.get("structures", {}).items():

            for s in structures:
                name = s.get("name")
                width = s.get("width", "20")

                row = BrushSetting(
                    app_name=app_name,
                    zone=zone,
                    structure_name=name,
                    width=width
                )

                db.session.add(row)

    db.session.commit()

print("✅ Brush settings importados a la DB")

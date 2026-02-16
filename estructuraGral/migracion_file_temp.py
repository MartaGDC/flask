import json
from app import app
from models import db, Metadata, MetadataRecuperado, MetadataRM

with app.app_context():
    db.create_all()

    Metadata.query.delete()
    MetadataRecuperado.query.delete()
    MetadataRM.query.delete()
    db.session.commit()

    with open("static/DATA/file_info.json", encoding="utf-8") as f:
        data = json.load(f)

    for i in data:
        extra = {k: v for k, v in i.items() if k not in ["video","frame","frameoriginal","filesaved","quality","zone","evaluator","originalImage","imageEdited"]}
        row = Metadata(
            video=i["video"],
            frame=i["frame"],
            frameoriginal=i["frameoriginal"],
            filesaved=i["filesaved"],
            quality=i["quality"],
            zone=i["zone"],
            evaluator=i["evaluator"],
            extra=extra
        )
        db.session.add(row)
    

    with open("static/DATA/file_info_recuperado.json", encoding="utf-8") as f:
        data_recuperado = json.load(f)
    
    for i in data_recuperado:
        extra = {k: v for k, v in i.items() if k not in ["video","frame","frameoriginal","filesaved","quality","zone","evaluator","originalImage","imageEdited"]}
        row = MetadataRecuperado(
            video=i["video"],
            frame=i["frame"],
            frameoriginal=i["frameoriginal"],
            filesaved=i["filesaved"],
            quality=i["quality"],
            zone=i["zone"],
            evaluator=i["evaluator"],
            extra=extra
        )
        db.session.add(row)

    
    with open("static/DATA/file_info_RM.json", encoding="utf-8") as f:
        data_RM = json.load(f)
    
    for i in data_RM:
        row = MetadataRM(
            imageoriginal=i["imageoriginal"],
            filesaved=i["filesaved"],
            zone=i["zone"],
            evaluator=i["evaluator"],
        )
        db.session.add(row)


    db.session.commit()

print("✅ Metadata importados a la DB")
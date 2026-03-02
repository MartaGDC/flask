from functools import wraps
from flask import request, jsonify
import jwt
from config import SECRET_KEY
from models import User
import json


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = (
            request.cookies.get('token') or 
            request.args.get('token')
        )
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            username = payload["username"]
            user = User.query.filter_by(username=username).first()
            if not user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        return f(user, *args, **kwargs)
    return decorated


def user_can_access(user, app_name, permissions):
    proyectos = permissions.get(user.role, [])
    return any(app_name.startswith(p) for p in proyectos)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
    
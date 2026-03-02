from flask import Blueprint

electrolysis_bp = Blueprint('electrolysis', __name__, template_folder='../templates')

from . import routes
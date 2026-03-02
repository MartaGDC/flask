from flask import Blueprint

drawrm_bp = Blueprint('drawrm', __name__, template_folder='../templates')

from . import routes
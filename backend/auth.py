from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from .models import db, User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.post('/register')
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'email and password required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'email already registered'}), 400
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'registered'}), 201

@bp.post('/login')
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'invalid credentials'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token})

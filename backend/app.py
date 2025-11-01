import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .models import db
from .auth import bp as auth_bp
from .routes.tasks import bp as tasks_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    db.init_app(app)
    JWTManager(app)

    with app.app_context():
        db.create_all()

    @app.get('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)

    # Static frontend
    front_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'web'))

    @app.route('/')
    def index():
        return send_from_directory(front_dir, 'index.html')

    @app.route('/<path:path>')
    def static_proxy(path):
        # Serve files from web/ (css, js, images). Fallback to index.html for SPA routes
        full_path = os.path.join(front_dir, path)
        if os.path.exists(full_path):
            return send_from_directory(front_dir, path)
        return send_from_directory(front_dir, 'index.html')
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

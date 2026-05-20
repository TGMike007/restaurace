from flask import Flask
from flask_smorest import Api  # Import Flask-Smorest API
from .config import config_by_name
from .db import db, migrate  # Import db a migrate z db.py
import os
from flask_jwt_extended import JWTManager


def create_app(config_name=None, config_override=None):
    """Factory funkce pro vytvoření Flask aplikace."""
    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "default")

    app = Flask(__name__)

    if config_override:
        app.config.from_object(config_override)
    else:
        app.config.from_object(config_by_name[config_name])

    # Inicializace rozšíření s aplikací
    db.init_app(app)
    migrate.init_app(app, db)

    jwt = JWTManager(app)

    # Inicializace Flask-Smorest
    api = Api(app)

    # Registrace Blueprintů
    from .api import api_v1_bp

    api.register_blueprint(api_v1_bp)

    # Zde můžete přidat další blueprinty (např. pro webové rozhraní, pokud by bylo)

    @jwt.additional_claims_loader
    def add_claims_to_access_token(identity):
        from .models import User
        user = db.session.get(User, int(identity))
        if user:
            return {"role": user.role.value}
        return {}
    # Shell kontext pro `flask shell`

    @app.shell_context_processor
    def make_shell_context():
        from .models import User
        return {"db": db, "User": User}  # Přidejte sem své modely

    # Jednoduchá testovací routa na kořeni

    @app.route("/hello")
    def hello():
        return "Hello, World from Flask!"

    return app

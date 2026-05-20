from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Inicializace rozšíření bez vazby na konkrétní aplikaci
db = SQLAlchemy()
migrate = Migrate()

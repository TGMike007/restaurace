from flask_smorest import Blueprint

# Vytvoření Blueprintu pro API verze 1
# První argument: název blueprintu
# Druhý argument: __name__ (pro hledání zdrojů)
# url_prefix: prefix pro všechny routy v tomto blueprintu
# description: popis pro OpenAPI dokumentaci
api_v1_bp = Blueprint(
    "api_v1", __name__, url_prefix="/api/v1", description="API Verze 1 pro IS Šablonu"
)

# Import rout, aby se registrovaly v blueprintu
# Důležité: importujte až po vytvoření blueprintu, aby se zabránilo cyklickým importům
from . import routes

from app import create_app, db # Import z lokálního balíčku app
from app.models import User # Importujte své modely
import os

# Získání názvu konfigurace z proměnné prostředí nebo default
config_name = os.getenv('FLASK_CONFIG') or 'default'
app = create_app(config_name)

# Zde můžete přidat příkazy pro Flask CLI pomocí app.cli.command()
# Například pro vytvoření databáze nebo seedování dat

if __name__ == '__main__':
    # Spuštění vývojového serveru (pro produkci použijte WSGI server jako Gunicorn)
    app.run(host='0.0.0.0', port=5000) # Naslouchání na všech rozhraních

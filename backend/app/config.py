import os
from dotenv import load_dotenv
from datetime import timedelta

# Načtení proměnných z .env souboru
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env"))


class Config:
    """Základní konfigurace."""

    SECRET_KEY = os.environ.get("SECRET_KEY") or "vychozi_slabý_klíč_pro_vývoj"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Nastavte na True pro logování SQL dotazů

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Konfigurace pro Flask-Smorest (OpenAPI)
    API_TITLE = "IS Šablona API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.2"
    OPENAPI_URL_PREFIX = "/api/docs"
    OPENAPI_SWAGGER_UI_PATH = "/swagger"
    OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    API_SPEC_OPTIONS = {
        "security": [{"bearerAuth": []}],
        "components": {
            "securitySchemes":
            {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        }
    }


class DevelopmentConfig(Config):
    """Konfigurace pro vývoj."""

    DEBUG = True
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URL")
        or "postgresql+psycopg://user:password@localhost/dev_db"
    )
    SQLALCHEMY_ECHO = True  # Logování SQL ve vývoji může být užitečné

    if not Config.JWT_SECRET_KEY:
        Config.JWT_SECRET_KEY = "key change in production"


class TestingConfig(Config):
    """Konfigurace pro testování."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("TEST_DATABASE_URL")
        or "sqlite:///:memory:"
    )
    WTF_CSRF_ENABLED = False  # Vypnutí CSRF pro testy formulářů


class ProductionConfig(Config):
    """Konfigurace pro produkci."""

    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL"
    )  # V produkci MUSÍ být nastaveno
    # Zde další produkční nastavení (logging, security headers, atd.)


# Mapování názvů konfigurací na třídy
config_by_name = dict(
    development=DevelopmentConfig,
    testing=TestingConfig,
    production=ProductionConfig,
    default=DevelopmentConfig,
)


# Funkce pro získání klíče (pro SECRET_KEY)
def get_secret_key():
    key = os.environ.get("SECRET_KEY")
    if not key:
        # V produkci by toto mělo vyvolat chybu nebo použít bezpečnější default
        print("VAROVÁNÍ: SECRET_KEY není nastaven v .env souboru!")
        key = "vychozi_slabý_klíč_pro_vývoj_oprav_mne"
    return key

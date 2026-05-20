# Backend Aplikace (Flask & Flask-Smorest)

Tento adresář obsahuje kód pro backendovou část vašeho informačního systému. Je postavena na Pythonu s využitím mikroframeworku Flask a rozšíření Flask-Smorest pro snadnou tvorbu REST API. Backend zodpovídá za zpracování dat, komunikaci s databází a poskytování API pro frontendovou část.

## Vývojové Prostředí (Docker & Dev Containers)

Celý projekt (backend, frontend, databáze) je navržen pro běh v Docker kontejnerech, které zajišťují konzistentní prostředí nezávislé na vašem lokálním nastavení. Konfigurace je definována v souboru `docker-compose.yml` v kořenovém adresáři projektu.

**Dev Containers (VS Code):** Pokud používáte Visual Studio Code, můžete využít rozšíření "Dev Containers". To vám umožní otevřít tento projekt přímo *uvnitř* běžícího Docker kontejneru.
    * **Výhody:** Máte plně nakonfigurované vývojové prostředí (správná verze Pythonu, nainstalované závislosti, přístup k běžícím službám) přímo ve VS Code. Příkazy (jako `alembic`, `pytest`) spouštíte v integrovaném terminálu VS Code, jako byste je spouštěli přímo v kontejneru (bez nutnosti `docker-compose exec`).
    * **Jak použít:** Pokud je v projektu přítomen adresář `.devcontainer` s konfigurací, VS Code vám při otevření projektu pravděpodobně nabídne možnost "Reopen in Container". Pokud ne, můžete použít příkazovou paletu (Ctrl+Shift+P nebo Cmd+Shift+P) a vyhledat "Dev Containers: Reopen in Container" nebo "Dev Containers: Open Folder in Container...".

## Použité Technologie

* **Flask:** Lehký a flexibilní Python webový framework, který tvoří základ naší aplikace.
* **Flask-Smorest:** Rozšíření pro Flask, které zjednodušuje tvorbu REST API. Automaticky generuje interaktivní dokumentaci (Swagger UI/OpenAPI) a stará se o validaci vstupních dat a serializaci výstupních dat pomocí Marshmallow.
* **SQLAlchemy:** Knihovna pro práci s databázemi (ORM - Object-Relational Mapper). Umožňuje definovat databázové tabulky jako Python třídy (modely) a pracovat s databází pomocí Python objektů místo psaní SQL dotazů ručně.
* **Alembic:** Nástroj pro správu databázových migrací. Umožňuje sledovat změny ve vašich SQLAlchemy modelech a generovat skripty pro aktualizaci schématu databáze.
* **Marshmallow:** Knihovna pro serializaci (převod Python objektů na JSON) a deserializaci/validaci (převod JSON na Python objekty a jejich kontrola). Flask-Smorest ji intenzivně využívá.
* **Psycopg:** Adaptér pro připojení Pythonu k databázi PostgreSQL. (Pokud používáte PostgreSQL).
* **python-dotenv:** Knihovna pro načítání konfiguračních proměnných ze souboru `.env`.
* **pytest:** Framework pro psaní a spouštění automatizovaných testů.

## Struktura Adresáře `backend/`

```
backend/
│
├── app/            # Hlavní balíček obsahující logiku aplikace
│   ├── api/        # Modul pro definici API endpointů
│   │   ├── __init__.py # Inicializace API Blueprintu (Flask-Smorest)
│   │   └── routes.py   # Definice konkrétních API cest a logiky (Resources)
│   │
│   ├── __init__.py # Inicializace Flask aplikace (Application Factory pattern - funkce create_app)
│   ├── config.py   # Konfigurační třídy (Development, Testing, Production) - načítá z .env
│   ├── db.py       # Inicializace SQLAlchemy a Flask-Migrate
│   ├── models.py   # Definice databázových modelů (SQLAlchemy třídy)
│   └── schemas.py  # Definice schémat (Marshmallow třídy) pro validaci a serializaci dat
│
├── migrations/     # Adresář spravovaný nástrojem Alembic
│   ├── versions/   # Jednotlivé migrační skripty generované Alembicem
│   ├── alembic.ini # Konfigurační soubor pro Alembic
│   └── env.py      # Skript pro běhové prostředí Alembicu (konfigurace připojení k DB atd.)
│
├── tests/          # Adresář s automatizovanými testy
│   └── test_api.py # Příklad testů pro API endpointy (používá pytest)
│
├── Dockerfile      # Instrukce pro sestavení Docker image pro backend
├── requirements.txt # Seznam Python závislostí pro backend
└── run.py          # Jednoduchý skript pro spuštění Flask aplikace (používá se v Dockeru)
```

## Klíčové Soubory a Koncepty

* **`app/__init__.py` (Application Factory):**
    * Obsahuje funkci `create_app()`, která sestavuje a konfiguruje Flask aplikaci.
    * Tento vzor umožňuje vytvářet více instancí aplikace s různými konfiguracemi (např. pro vývoj, testování, produkci).
    * Inicializuje rozšíření jako SQLAlchemy (`db.init_app(app)`) a Flask-Smorest (`Api(app)`).
    * Registruje Blueprints (např. `api_v1_bp`).
* **`app/config.py`:**
    * Definuje různé konfigurační třídy (`DevelopmentConfig`, `TestingConfig`, `ProductionConfig`).
    * Načítá citlivé údaje a nastavení z proměnných prostředí (definovaných v `.env` souboru v kořenovém adresáři projektu).
    * Obsahuje nastavení jako `SECRET_KEY`, `SQLALCHEMY_DATABASE_URI`, `DEBUG` atd.
* **`app/db.py`:**
    * Vytváří instance rozšíření SQLAlchemy (`db = SQLAlchemy()`) a Flask-Migrate (`migrate = Migrate()`). Tyto instance jsou později spojeny s konkrétní Flask aplikací uvnitř `create_app`.
* **`app/models.py`:**
    * Zde definujete strukturu vaší databáze pomocí SQLAlchemy modelů.
    * Každá třída odvozená od `db.Model` reprezentuje jednu databázovou tabulku.
    * Atributy třídy definované pomocí `db.Column` odpovídají sloupcům v tabulce.
    * Můžete zde definovat i vztahy mezi tabulkami (`db.relationship`).
* **`app/schemas.py`:**
    * Obsahuje definice Marshmallow schémat.
    * Schémata definují, jaká data očekáváte na vstupu API (`load_only` pole, validace) a jaká data budete posílat na výstupu (`dump_only` pole).
    * Flask-Smorest používá tato schémata v dekorátorech `@api.arguments()` a `@api.response()`.
* **`app/api/` (Blueprint & Routes):**
    * `__init__.py`: Vytváří instanci `Blueprint` z Flask-Smorest. Blueprinty umožňují modulárně organizovat routy a pohledy.
    * `routes.py`: Definuje konkrétní API endpointy pomocí tříd odvozených od `MethodView` a dekorátorů z Flask-Smorest (`@blueprint.route()`, `@blueprint.response()`, `@blueprint.arguments()`). Zde se nachází logika pro zpracování HTTP požadavků (GET, POST, PUT, DELETE).
* **`migrations/` (Alembic):**
    * Tento adresář je spravován nástrojem Alembic.
    * Když změníte své modely v `app/models.py`, vygenerujete nový migrační skript pomocí Alembicu.
    * Tento skript obsahuje instrukce pro úpravu schématu databáze (vytvoření/smazání tabulek, přidání/odebrání sloupců atd.).
    * Aplikací migrace se změny promítnou do vaší skutečné databáze.
* **`tests/` (Pytest):**
    * Obsahuje automatizované testy pro ověření funkčnosti vašeho API a logiky.
    * Testy typicky vytvářejí testovací instanci aplikace s izolovanou databází (např. SQLite in-memory), posílají simulované HTTP požadavky na API endpointy a ověřují správnost odpovědí a stavu databáze.

## Jak Pracovat s Backendem

(Předpokládá se, že kontejnery běží - `docker-compose up -d`)

**Důležitá poznámka pro uživatele Dev Containers (VS Code):** Pokud pracujete uvnitř Dev Containeru, všechny níže uvedené příkazy (`alembic`, `pytest`) spouštějte přímo v **integrovaném terminálu VS Code**. Není potřeba používat `docker-compose exec backend ...`.

1.  **Úprava Modelů (`app/models.py`):**
    * Přidejte nebo upravte třídy modelů podle potřeb vašeho IS.
2.  **Generování Migrace:**
    * Po změně modelů otevřete terminál (lokální nebo v Dev Containeru) a spusťte:

      Pokud adresář `migrations/` ještě nebyl inicializován (např. při prvním spuštění projektu), můžete použít wrapper z Flask-Migrate a inicializovat Alembic pomocí:

      ```bash
      export FLASK_APP=run.py
      # (volitelně) export FLASK_ENV=development
      flask db init
      ```

      Poté můžete vygenerovat migraci a aplikovat ji:

      ```bash
      flask db migrate -m "Stručný popis změny modelu"
      flask db upgrade
      ```

      Poznámka: V tomto repozitáři je již adresář `migrations/` (viz výše). Pokud tam je, `flask db init` obvykle není potřeba a můžete rovnou spustit:

      ```bash
      alembic revision --autogenerate -m "Stručný popis změny modelu"
      ```

    * Tím se v adresáři `migrations/versions/` vytvoří nový Python soubor s migračním skriptem. Zkontrolujte jeho obsah.
3.  **Aplikace Migrace:**
    * Aplikujte vygenerovanou migraci na databázi:
        ```bash
        alembic upgrade head
        ```
4.  **Definice Schémat (`app/schemas.py`):**
    * Vytvořte nebo upravte Marshmallow schémata odpovídající vašim modelům a tomu, jaká data chcete přijímat a odesílat přes API.
5.  **Implementace API Endpointů (`app/api/routes.py`):**
    * Vytvořte nové `MethodView` třídy nebo upravte stávající.
    * Použijte dekorátory `@api_v1_bp.route()`, `@api_v1_bp.arguments(YourSchema)` a `@api_v1_bp.response(YourSchema)` pro definování cest, validaci vstupů a formátování výstupů.
    * Implementujte metody `get()`, `post()`, `put()`, `delete()` s vaší business logikou (interakce s databází pomocí SQLAlchemy - `db.session`).
6.  **Psaní Testů (`tests/`):**
    * Pro každý nový endpoint nebo logiku přidejte odpovídající testy do `tests/test_api.py` (nebo vytvořte nové testovací soubory).
    * Použijte `test_client` (poskytovaný fixturem v `test_api.py`) k posílání požadavků a `assert` ke kontrole výsledků.
7.  **Spouštění Testů:**
    * Spusťte všechny testy:
        ```bash
        python -m pytest tests/ -v
        ```
8.  **Prohlížení API Dokumentace:**
    * Otevřete v prohlížeči adresu Swagger UI (obvykle `http://localhost:5000/api/docs/swagger` nebo podobnou - viz `OPENAPI_SWAGGER_UI_PATH` v `app/config.py`). Zde uvidíte automaticky generovanou dokumentaci vašich endpointů a můžete je přímo testovat.

## Důležité Poznámky

* **Konfigurace:** Všechna citlivá data (hesla k DB, `SECRET_KEY`) by měla být spravována pomocí souboru `.env` v kořenovém adresáři projektu a **nikdy by neměla být součástí Gitu**. Použijte `.env.example` jako šablonu.
* **Databázové Migrace:** Vždy generujte a aplikujte migrace po změně modelů. Migrační soubory (`migrations/versions/*.py`) **verzujte v Gitu**, aby měli všichni členové týmu stejnou strukturu databáze.
* **Hesla:** **Nikdy neukládejte hesla v čistém textu!** V modelu `User` implementujte metody pro hashování (při ukládání/aktualizaci) a ověřování (při přihlašování) hesel pomocí knihoven jako `Werkzeug.security` nebo `passlib`. Schémata by měla používat `load_only=True` pro pole s heslem.
* **Chybové Stavy:** V API endpointech používejte `abort(http_status_code, message="...")` z `flask_smorest` pro vracení standardizovaných chybových odpovědí (např. 404 Not Found, 400 Bad Request, 409 Conflict).

Tento README poskytuje základní přehled. Pro hlubší pochopení jednotlivých technologií doporučuji prostudovat jejich oficiální dokumentaci.
# Šablona projektu pro vývoj IS - TEST

Tato šablona slouží jako výchozí bod pro vývoj informačního systému v rámci předmětu Vývoj IS. Poskytuje základní strukturu a konfiguraci pro moderní webovou aplikaci s odděleným backendem (Flask/Flask-Smorest) a frontendem (React/Vite), využívající kontejnerizaci pomocí Dockeru a optimalizovanou pro vývoj v Dev Containers (VS Code).

## Použité Technologie

* **Backend:**
    * Python 3
    * Flask (mikroframework pro webové aplikace)
    * Flask-Smorest (pro tvorbu REST API s OpenAPI/Swagger dokumentací)
    * SQLAlchemy (ORM pro práci s databází)
    * Alembic (pro správu databázových migrací)
    * Marshmallow (pro serializaci a validaci dat)
    * Psycopg (PostgreSQL adaptér)
    * python-dotenv (načítání konfigurace z `.env`)
    * pytest (testování)
* **Frontend:**
    * React (JavaScriptová knihovna pro UI)
    * Vite (rychlý build a dev server)
    * TypeScript (typová nadstavba JavaScriptu)
    * Node.js & npm (prostředí a správa balíčků)
    * CSS (stylování)
* **Databáze:**
    * PostgreSQL (relační databáze)
* **Kontejnerizace & Vývojové Prostředí:**
    * Docker & Docker Compose (definice a spouštění kontejnerů)
    * **Dev Containers (VS Code):** Doporučené prostředí pro vývoj, které běží přímo uvnitř Docker kontejneru.

## Struktura Projektu

```
.
├── backend/            # Adresář pro backend (Flask)
│   ├── app/            # Hlavní kód aplikace
│   │   ├── api/        # API endpointy (routes.py)
│   │   ├── __init__.py # Application Factory (create_app)
│   │   ├── config.py   # Konfigurace
│   │   ├── db.py       # SQLAlchemy a Migrate instance
│   │   ├── models.py   # SQLAlchemy modely
│   │   └── schemas.py  # Marshmallow schémata
│   ├── migrations/     # Alembic migrace
│   ├── tests/          # Pytest testy
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md       # Detailní README pro backend
│
├── frontend/           # Adresář pro frontend (React)
│   └── react-app/      # Kořenový adresář React aplikace
│       ├── public/
│       ├── src/        # Zdrojový kód Reactu
│       ├── package.json
│       ├── vite.config.ts # Vite konfigurace (včetně proxy)
│       ├── Dockerfile
│       └── README.md   # Detailní README pro frontend
│
├── .devcontainer/      # (Volitelně) Konfigurace pro VS Code Dev Containers
│   └── devcontainer.json
│
├── docker-compose.yml  # Konfigurace Docker Compose pro spuštění všech služeb
├── .env.example        # Šablona pro konfigurační proměnné (přejmenujte na .env)
├── .gitignore          # Soubory ignorované Gitem (mělo by obsahovat .env)
└── README.md           # Tento hlavní soubor
```

## Nastavení a Spuštění (Pomocí Dev Containers)

Tento projekt je optimalizován pro vývoj pomocí **Dev Containers** ve Visual Studio Code. Tento přístup vám poskytne plně nakonfigurované a izolované vývojové prostředí.

1.  **Předpoklady:**
    * Nainstalovaný **Docker Desktop**.
    * Nainstalovaný **Visual Studio Code** s rozšířením **"Dev Containers"** (ID: `ms-vscode-remote.remote-containers`).
2.  **Klonování Repozitáře:**
    ```bash
    git clone <URL_VAŠEHO_REPOZITÁŘE>
    cd <NÁZEV_SLOŽKY_REPOZITÁŘE>
    ```
3.  **Vytvoření `.env` souboru:**
    * Zkopírujte soubor `.env.example` a přejmenujte kopii na `.env`.
        ```bash
        cp .env.example .env
        ```
    * Upravte hodnoty v `.env` podle potřeby (zejména `POSTGRES_PASSWORD`). **Tento soubor (`.env`) nesmí být v Gitu!**
4.  **Otevření v Dev Containeru:**
    * Otevřete složku projektu ve VS Code.
    * VS Code by měl automaticky detekovat konfiguraci Dev Containeru (pokud existuje adresář `.devcontainer`) a nabídnout vám možnost **"Reopen in Container"** v pravém dolním rohu. Klikněte na ni.
    * Pokud se nabídka nezobrazí, otevřete paletu příkazů (Ctrl+Shift+P nebo Cmd+Shift+P), napište "Dev Containers: Reopen in Container" a vyberte tuto možnost.
    * VS Code nyní sestaví (pokud je to poprvé) a spustí potřebné kontejnery a připojí se k vývojovému kontejneru. To může chvíli trvat.
5.  **Spuštění Služeb (automatické):**
    * Konfigurace Dev Containeru (v `.devcontainer/devcontainer.json` nebo `docker-compose.yml`) by měla zajistit, že služby definované v `docker-compose.yml` (backend, frontend, db) se automaticky spustí po připojení ke kontejneru.
6.  **Databázové Migrace (Alembic):**
    * Při prvním spuštění nebo po jakékoli změně modelů v `backend/app/models.py` je potřeba aplikovat migrace.
    * Otevřete **integrovaný terminál ve VS Code** (který již běží uvnitř Dev Containeru).
    * Spusťte příkazy Alembicu:
        ```bash
        # (Pouze pokud jste změnili modely) Vygenerování nové migrace:
        alembic revision --autogenerate -m "Popis vaší změny modelů"

        # Aplikování čekajících migrací na databázi:
        alembic upgrade head
        ```
7.  **Přístup k Aplikaci:**
    * VS Code Dev Containers automaticky mapuje porty z kontejneru na váš lokální stroj.
    * **Backend API Dokumentace (Swagger UI):** [http://localhost:5000/api/v1/openapi](http://localhost:5000/api/v1/openapi) (Ověřte cestu podle `OPENAPI_SWAGGER_UI_PATH` v `backend/app/config.py`)
    * **Frontend (React Dev Server):** [http://localhost:5173](http://localhost:5173) (Port podle `docker-compose.yml`)
    * **Databáze (např. přes DBeaver/pgAdmin):** Host: `localhost`, Port: `5432` (Port podle `docker-compose.yml`), Databáze/Uživatel/Heslo: podle vašeho `.env` souboru.

## Vývojový Workflow v Dev Containeru

* **Úpravy Kódu:** Upravujte soubory backendu (`backend/`) a frontendu (`frontend/react-app/`) přímo ve VS Code. Změny se díky mapování volumes projeví uvnitř kontejnerů.
* **Backend (Flask):** Změny v Python kódu by měly automaticky restartovat Flask server (pokud běží v debug režimu).
* **Frontend (React/Vite):** Změny v React kódu se díky Vite HMR projeví v prohlížeči téměř okamžitě.
* **Terminál:** Používejte integrovaný terminál VS Code pro všechny příkazy týkající se projektu:
    * **Backend:**
        * `alembic revision ...`, `alembic upgrade head` (správa databáze)
        * `python -m pytest tests/ -v` (spouštění testů)
    * **Frontend:**
        * `npm install <balíček>` (instalace závislostí)
        * `npm run lint` (kontrola kódu, pokud je definováno)
        * (Vývojový server `npm run dev` by měl běžet automaticky)
* **Databáze:** Připojujte se k databázi z vašeho lokálního stroje na `localhost:5432`.

## Další Kroky

Tato šablona poskytuje základ. Další kroky zahrnují:

1.  **Backend:**
    * Definování vlastních SQLAlchemy modelů (`models.py`).
    * Definování odpovídajících Marshmallow schémat (`schemas.py`).
    * Implementace API endpointů (`api/routes.py`).
    * Vytváření a aplikování databázových migrací (`alembic ...`).
    * Psaní testů (`pytest`).
2.  **Frontend:**
    * Vytváření React komponent (`src/components`, `src/pages`).
    * Implementace routování (např. pomocí `react-router-dom`).
    * Volání backendového API (pomocí `fetch` nebo `axios`).
    * Stylování aplikace (CSS, Tailwind CSS, atd.).

---
Pro detailnější informace o backendové nebo frontendové části se podívejte do příslušných `README.md` souborů v adresářích `backend/` a `frontend/react-app/`. 

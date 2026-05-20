# Tento soubor obsahuje testy pro API endpointy definované pomocí Flask-Smorest.

from app.models import User  # Import modelu User
from app.db import db  # Import instance databáze
from app import create_app  # Import tovární funkce pro vytvoření aplikace
import json
import pytest
import sys
import os
# Získání absolutní cesty k adresáři 'tests'
test_dir = os.path.dirname(os.path.abspath(__file__))
# Získání absolutní cesty k nadřazenému adresáři (kořen projektu 'backend')
project_root = os.path.dirname(test_dir)
# Vložení kořenového adresáře na začátek sys.path
sys.path.insert(0, project_root)


# --- Pytest Fixtures ---


@pytest.fixture(scope='module')
def test_client():
    """
    Vytvoří a nakonfiguruje testovacího klienta Flask aplikace.
    Spouští se jednou pro celý testovací modul.
    """
    print(f"\n[DEBUG] test_client: Test config override dict = {test_config}")

    # --- Vytvoření aplikace s PŘEDÁNÍM testovací konfigurace ---
    # Voláme create_app bez explicitního config_name, spoléháme na override
    flask_app = create_app(config="testing")

    # Zkontrolujeme, zda aplikace existuje (create_app nevrátila None)
    if flask_app is None:
        pytest.fail("create_app returned None, check config name and setup.")

    # # Vytvoření testovacího klienta
    # testing_client = flask_app.test_client()

    # # Vytvoření kontextu aplikace - nutné pro operace závislé na aplikaci (např. db)
    # ctx = flask_app.app_context()
    # ctx.push()

    # # Předání klienta testům
    # yield testing_client

    # # Úklid po testech modulu
    # ctx.pop()


@pytest.fixture(scope='module')
def init_database(test_client):
    """
    Inicializuje databázi (vytvoří tabulky) před spuštěním testů modulu.
    Vymaže tabulky po skončení testů modulu.
    """
    # Vytvoření všech tabulek definovaných v modelech
    db.create_all()

    yield db  # Předání instance db testům (pokud je potřeba)

    # Úklid po všech testech v modulu
    db.drop_all()


@pytest.fixture(scope='function')
def seed_db(init_database):
    """
    Naplní databázi testovacími daty před každým testem.
    Vymaže data po každém testu (rollback).
    Závisí na init_database.
    """
    # Začátek "vnořené" transakce nebo použití savepointu
    connection = db.engine.connect()
    transaction = connection.begin()
    # Použití savepointu pro izolaci testů v rámci session
    # Umožňuje přidávat data a pak je snadno vrátit zpět (rollback)
    # bez ovlivnění ostatních testů.
    db.session.begin_nested()

    # Přidání ukázkových uživatelů
    user1 = User(username='testuser1', email='test1@example.com')
    # !!! Důležité: Při reálném použití zde zavolejte metodu pro nastavení hesla!
    # user1.set_password('password123')
    user2 = User(username='testuser2', email='test2@example.com')
    # user2.set_password('password456')

    db.session.add(user1)
    db.session.add(user2)
    # Commit v rámci savepointu (ještě není v hlavní transakci)
    db.session.commit()

    yield db  # Předání instance db testům

    # Rollback k savepointu po každém testu - odstraní data přidaná v testu
    db.session.rollback()
    # Uzavření hlavní transakce a spojení
    transaction.rollback()
    connection.close()


# --- Testovací funkce ---

def test_get_users_list(test_client, seed_db):
    """
    Testuje endpoint GET /api/v1/users pro získání seznamu uživatelů.
    """
    response = test_client.get('/api/v1/users')  # Použijte správný prefix API
    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data, list)
    assert len(json_data) == 2  # Očekáváme 2 uživatele ze seed_db
    assert json_data[0]['username'] == 'testuser1'
    assert json_data[1]['username'] == 'testuser2'
    # Ověření, že hash hesla není v odpovědi
    assert 'password_hash' not in json_data[0]


# Používáme init_database, ne seed_db, pro čistý stav
def test_create_user_success(test_client, init_database):
    """
    Testuje úspěšné vytvoření nového uživatele přes POST /api/v1/users.
    """
    new_user_data = {
        'username': 'newuser',
        'email': 'new@example.com',
        # 'password': 'newpassword' # Heslo by mělo být posláno, pokud je v UserCreateSchema
    }
    response = test_client.post('/api/v1/users', json=new_user_data)

    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['username'] == new_user_data['username']
    assert json_data['email'] == new_user_data['email']
    assert 'id' in json_data
    assert 'password_hash' not in json_data  # Hash hesla by neměl být v odpovědi

    # Ověření, že uživatel byl skutečně uložen v DB
    # Použijeme db.session.get pro moderní SQLAlchemy styl
    user_from_db = db.session.get(User, json_data['id'])
    # Alternativa: user_from_db = User.query.filter_by(username=new_user_data['username']).first()
    assert user_from_db is not None
    assert user_from_db.username == new_user_data['username']
    # Zde by se dalo ověřit i heslo, pokud máte metodu check_password
    # assert user_from_db.check_password('newpassword')


def test_create_user_duplicate_username(test_client, seed_db):
    """
    Testuje vytvoření uživatele s již existujícím uživatelským jménem.
    Očekáváme chybu 409 Conflict.
    """
    duplicate_user_data = {
        'username': 'testuser1',  # Toto jméno již existuje v seed_db
        'email': 'unique@example.com',
        # 'password': 'password'
    }
    response = test_client.post('/api/v1/users', json=duplicate_user_data)
    # Očekáváme 409 Conflict, jak je definováno v API endpointu
    assert response.status_code == 409


def test_create_user_duplicate_email(test_client, seed_db):
    """
    Testuje vytvoření uživatele s již existujícím emailem.
    Očekáváme chybu 409 Conflict.
    """
    duplicate_user_data = {
        'username': 'anotheruser',
        'email': 'test1@example.com',  # Tento email již existuje v seed_db
        # 'password': 'password'
    }
    response = test_client.post('/api/v1/users', json=duplicate_user_data)
    # Očekáváme 409 Conflict
    assert response.status_code == 409


def test_create_user_missing_field(test_client, init_database):
    """
    Testuje vytvoření uživatele s chybějícím povinným polem (např. username).
    Očekáváme chybu 422 Unprocessable Entity (díky validaci Marshmallow/Smorest).
    """
    invalid_data = {
        'email': 'incomplete@example.com',
        # 'password': 'password'
        # Chybí 'username'
    }
    response = test_client.post('/api/v1/users', json=invalid_data)
    # Flask-Smorest by měl automaticky vrátit 422 při selhání validace schématu
    assert response.status_code == 422


def test_get_single_user_success(test_client, seed_db):
    """
    Testuje získání existujícího uživatele přes GET /api/v1/users/<user_id>.
    """
    # Získáme ID prvního uživatele přidaného v seed_db
    user = User.query.filter_by(username='testuser1').first()
    assert user is not None

    response = test_client.get(f'/api/v1/users/{user.id}')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == user.id
    assert json_data['username'] == user.username
    assert json_data['email'] == user.email


def test_get_single_user_not_found(test_client, seed_db):
    """
    Testuje získání neexistujícího uživatele.
    Očekáváme chybu 404 Not Found.
    """
    non_existent_id = 9999
    response = test_client.get(f'/api/v1/users/{non_existent_id}')
    # Očekáváme 404, jak je definováno pomocí abort(404) v endpointu
    assert response.status_code == 404


def test_update_user_success(test_client, seed_db):
    """
    Testuje úspěšnou aktualizaci uživatele přes PUT /api/v1/users/<user_id>.
    """
    user_to_update = User.query.filter_by(username='testuser1').first()
    assert user_to_update is not None
    user_id = user_to_update.id  # Uložíme si ID

    update_data = {
        'username': 'updateduser1',
        'email': 'updated1@example.com'
        # POZOR: Neaktualizujeme zde heslo, mělo by se řešit samostatně nebo opatrně
    }
    response = test_client.put(f'/api/v1/users/{user_id}', json=update_data)

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == user_id
    assert json_data['username'] == update_data['username']
    assert json_data['email'] == update_data['email']

    # Ověření změn v DB - získáme uživatele znovu podle ID
    updated_user_from_db = db.session.get(User, user_id)
    assert updated_user_from_db is not None
    assert updated_user_from_db.username == update_data['username']
    assert updated_user_from_db.email == update_data['email']


def test_update_user_not_found(test_client, seed_db):
    """
    Testuje aktualizaci neexistujícího uživatele.
    Očekáváme chybu 404 Not Found.
    """
    non_existent_id = 9999
    update_data = {'username': 'ghost', 'email': 'ghost@example.com'}
    response = test_client.put(
        f'/api/v1/users/{non_existent_id}', json=update_data)
    assert response.status_code == 404


def test_update_user_duplicate_username(test_client, seed_db):
    """
    Testuje aktualizaci uživatele na username, které již používá jiný uživatel.
    Očekáváme chybu integrity (např. 409 nebo 500, záleží na ošetření v endpointu).
    """
    user_to_update = User.query.filter_by(username='testuser1').first()
    assert user_to_update is not None
    existing_username = 'testuser2'  # Jméno druhého uživatele

    update_data = {
        'username': existing_username,  # Pokus o nastavení existujícího jména
        'email': 'updated1@example.com'  # Email je unikátní
    }
    response = test_client.put(
        f'/api/v1/users/{user_to_update.id}', json=update_data)
    # Očekávaný kód závisí na implementaci v PUT endpointu (ošetření IntegrityError)
    # Pokud není explicitně ošetřeno, SQLAlchemy/DB může vrátit chybu vedoucí k 500.
    # Pokud je ošetřeno, může to být 409 nebo 422.
    assert response.status_code in [409, 422, 500]


def test_delete_user_success(test_client, seed_db):
    """
    Testuje úspěšné smazání uživatele přes DELETE /api/v1/users/<user_id>.
    """
    user_to_delete = User.query.filter_by(username='testuser1').first()
    assert user_to_delete is not None
    user_id_to_delete = user_to_delete.id

    response = test_client.delete(f'/api/v1/users/{user_id_to_delete}')
    # Očekáváme 204 No Content při úspěšném smazání
    assert response.status_code == 204

    # Ověření, že uživatel byl skutečně smazán z DB
    deleted_user = db.session.get(User, user_id_to_delete)
    assert deleted_user is None


def test_delete_user_not_found(test_client, seed_db):
    """
    Testuje smazání neexistujícího uživatele.
    Očekáváme chybu 404 Not Found.
    """
    non_existent_id = 9999
    response = test_client.delete(f'/api/v1/users/{non_existent_id}')
    # Očekáváme 404, jak je definováno pomocí abort(404) v endpointu
    assert response.status_code == 404

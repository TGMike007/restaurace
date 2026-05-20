# Tento soubor definuje schémata pomocí knihovny Marshmallow.
# Schémata slouží k:
# 1. Serializaci: Převod komplexních objektů (např. SQLAlchemy modely) na jednoduché Python datové typy (slovníky, seznamy),
#    které lze snadno převést na JSON pro API odpovědi.
# 2. Deserializaci: Převod jednoduchých datových typů (např. z JSON těla požadavku) na Python objekty.
# 3. Validaci: Kontrola, zda data (přijatá v požadavku nebo před serializací) splňují definovaná pravidla
#    (např. typ, povinnost, délka, formát).
# Flask-Smorest tato schémata využívá pro automatickou validaci požadavků (@arguments)
# a formátování odpovědí (@response).

from marshmallow import Schema, fields, validate

# --- User ---


class UserSchema(Schema):
    user_id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=15))
    role = fields.Str(required=True, validate=validate.Length(max=10))


class UserCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=15))
    password = fields.Str(required=True, load_only=True,
                          validate=validate.Length(min=8))
    role = fields.Str(required=True, validate=validate.Length(max=10))


class UserLoginSchema(Schema):
    name = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)


# --- TableUnit ---

class TableUnitSchema(Schema):
    table_unit_id = fields.Int(dump_only=True)
    seats = fields.Int(required=True)


class TableUnitCreateSchema(Schema):
    seats = fields.Int(required=True, validate=validate.Range(min=1))


# --- Customer ---

class CustomerSchema(Schema):
    customer_id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=20))
    contact = fields.Str(validate=validate.Length(max=30))


class CustomerCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=20))
    contact = fields.Str(validate=validate.Length(max=30))


# --- Reservation ---

class ReservationSchema(Schema):
    reservation_id = fields.Int(dump_only=True)
    date = fields.Date(required=True)
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    person_count = fields.Int(required=True)
    customer_id = fields.Int(required=True)
    table_unit_id = fields.Int(required=True)


class ReservationCreateSchema(Schema):
    date = fields.Date(required=True)
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    person_count = fields.Int(required=True)
    customer_id = fields.Int(required=True)
    table_unit_id = fields.Int(required=True)


# --- Order ---

class OrderSchema(Schema):
    order_id = fields.Int(dump_only=True)
    price = fields.Decimal(as_string=True)
    status = fields.Str(validate=validate.Length(max=20))
    table_unit_id = fields.Int(required=True)
    user_id = fields.Int(required=True)


class OrderCreateSchema(Schema):
    price = fields.Decimal(as_string=True)
    status = fields.Str(validate=validate.Length(max=20))
    table_unit_id = fields.Int(required=True)
    user_id = fields.Int(required=True)


# --- MenuItem ---

class MenuItemSchema(Schema):
    menuitem_id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    price = fields.Decimal(required=True, as_string=True)
    available = fields.Bool()


class MenuItemCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    price = fields.Decimal(required=True, as_string=True)
    available = fields.Bool()


# --- OrderItem ---

class OrderItemSchema(Schema):
    orderitem_id = fields.Int(dump_only=True)
    quantity = fields.Int(required=True)
    price = fields.Decimal(required=True, as_string=True)
    note = fields.Str(validate=validate.Length(max=255))
    order_id = fields.Int(required=True)
    menuitem_id = fields.Int(required=True)


class OrderItemCreateSchema(Schema):
    quantity = fields.Int(required=True)
    price = fields.Decimal(required=True, as_string=True)
    note = fields.Str(validate=validate.Length(max=255))
    order_id = fields.Int(required=True)
    menuitem_id = fields.Int(required=True)


# --- Payment ---

class PaymentSchema(Schema):
    payment_id = fields.Int(dump_only=True)
    amount = fields.Decimal(required=True, as_string=True)
    type = fields.Str(validate=validate.Length(max=50))
    status = fields.Str(validate=validate.Length(max=50))
    order_id = fields.Int(required=True)


class PaymentCreateSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True)
    type = fields.Str(validate=validate.Length(max=50))
    status = fields.Str(validate=validate.Length(max=50))
    order_id = fields.Int(required=True)


# --- Shift ---

class ShiftSchema(Schema):
    shift_id = fields.Int(dump_only=True)
    date = fields.Date(required=True)
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    status = fields.Str(validate=validate.Length(max=50))


class ShiftCreateSchema(Schema):
    date = fields.Date(required=True)
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    status = fields.Str(validate=validate.Length(max=50))


# --- UserShift ---

class UserShiftSchema(Schema):
    user_id = fields.Int(required=True)
    shift_id = fields.Int(required=True)


# --- Day ---

class DaySchema(Schema):
    date = fields.Date(dump_only=True)
    status = fields.Str(validate=validate.Length(max=50))
    user_id = fields.Int()


class DayCreateSchema(Schema):
    date = fields.Date(required=True)
    status = fields.Str(validate=validate.Length(max=50))
    user_id = fields.Int()


# --- Report ---

class ReportSchema(Schema):
    report_id = fields.Int(dump_only=True)
    content = fields.Str()
    date = fields.Date()


class ReportCreateSchema(Schema):
    content = fields.Str()
    date = fields.Date(required=True)
    """
    Schéma specificky navržené pro deserializaci a validaci dat
    při vytváření nového uživatele (POST požadavek).
    Může se lišit od UserSchema (např. může obsahovat pole pro heslo).
    """
    # Pole jsou stejná jako v UserSchema, protože pro vytvoření potřebujeme username a email.
    # username = fields.Str(required=True, validate=validate.Length(min=3))
    # email = fields.Email(required=True)

    # `load_only=True`: Toto pole bude očekáváno a zpracováno POUZE při deserializaci (loading)
    # dat z požadavku (např. JSON z POST). Nebude nikdy zahrnuto v odpovědi API (dumping).
    # Ideální pro hesla nebo jiná data, která přijímáme, ale nechceme je posílat zpět.
    # password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8)) # Příklad s validací délky hesla


# --- Schémata pro další modely ---
# Zde přidejte schémata pro vaše další modely (Event, Registration, atd.)

# class EventSchema(Schema):
#     """Schéma pro serializaci a základní validaci události."""
#     id = fields.Int(dump_only=True)
#     name = fields.Str(required=True, validate=validate.Length(min=5))
#     date = fields.Date(required=True)
#     description = fields.Str() # Popis může být nepovinný
#     created_at = fields.DateTime(dump_only=True)

# class EventCreateSchema(Schema):
#     """Schéma pro vytváření nové události."""
#     name = fields.Str(required=True, validate=validate.Length(min=5))
#     date = fields.Date(required=True)
#     description = fields.Str()

# class RegistrationSchema(Schema):
#     """Schéma pro serializaci registrace."""
#     id = fields.Int(dump_only=True)
#     user_id = fields.Int(required=True) # Můžeme nechat jen ID nebo vnořit UserSchema
#     event_id = fields.Int(required=True) # Můžeme nechat jen ID nebo vnořit EventSchema
#     registration_time = fields.DateTime(dump_only=True)
#     status = fields.Str(dump_only=True) # Status typicky nastavuje logika aplikace

    # Příklad vnořeného schématu (pokud chceme v odpovědi celé objekty User a Event):
    # user = fields.Nested(UserSchema, dump_only=True)
    # event = fields.Nested(EventSchema, dump_only=True)

# class RegistrationCreateSchema(Schema):
#      """Schéma pro vytvoření nové registrace."""
#      # Typicky potřebujeme jen ID uživatele a události, které přijdou v požadavku
#      user_id = fields.Int(required=True, load_only=True)
#      event_id = fields.Int(required=True, load_only=True)

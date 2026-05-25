# Zde můžete přidat další Resources pro jiné části vašeho API
# např. Events, Registrations, atd.
# @api_v1_bp.route("/events")
# class EventsResource(MethodView): ...
from flask import jsonify
from flask.views import MethodView
from flask_smorest import abort
from sqlalchemy.exc import IntegrityError

from ..models import (
    User, TableUnit, Customer, Reservation,
    Order, MenuItem, OrderItem, Payment,
    Shift, UserShift, Day, Report, UserRole
)
from ..schemas import (
    UserLoginSchema, UserSchema, UserCreateSchema,
    TableUnitSchema, TableUnitCreateSchema,
    CustomerSchema, CustomerCreateSchema,
    ReservationSchema, ReservationCreateSchema,
    OrderSchema, OrderCreateSchema,
    MenuItemSchema, MenuItemCreateSchema,
    OrderItemSchema, OrderItemCreateSchema,
    PaymentSchema, PaymentCreateSchema,
    ShiftSchema, ShiftCreateSchema,
    UserShiftSchema,
    DaySchema, DayCreateSchema,
    ReportSchema, ReportCreateSchema,
)
from ..db import db
from . import api_v1_bp
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from ..utils.decorators import roles_required


# --- TableUnit ---


@api_v1_bp.route("/tables")
class TableUnitsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, TableUnitSchema(many=True))
    def get(self):
        """Získat seznam všech stolů."""
        return db.session.scalars(db.select(TableUnit)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(TableUnitCreateSchema)
    @api_v1_bp.response(201, TableUnitSchema)
    def post(self, data):
        """Vytvořit nový stůl."""
        table = TableUnit(**data)
        try:
            db.session.add(table)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return table


@api_v1_bp.route("/tables/<int:table_unit_id>")
class TableUnitResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, TableUnitSchema)
    def get(self, table_unit_id):
        """Získat stůl podle ID."""
        table = db.session.get(TableUnit, table_unit_id)
        if table is None:
            abort(404, message="Stůl nebyl nalezen.")
        return table

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(TableUnitCreateSchema)
    @api_v1_bp.response(200, TableUnitSchema)
    def put(self, data, table_unit_id):
        """Aktualizovat stůl."""
        table = db.session.get(TableUnit, table_unit_id)
        if table is None:
            abort(404, message="Stůl nebyl nalezen.")
        for key, value in data.items():
            setattr(table, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return table

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, table_unit_id):
        """Smazat stůl."""
        table = db.session.get(TableUnit, table_unit_id)
        if table is None:
            abort(404, message="Stůl nebyl nalezen.")
        try:
            db.session.delete(table)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Customer ---

@api_v1_bp.route("/customers")
class CustomersResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, CustomerSchema(many=True))
    def get(self):
        """Získat seznam všech zákazníků."""
        return db.session.scalars(db.select(Customer)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(CustomerCreateSchema)
    @api_v1_bp.response(201, CustomerSchema)
    def post(self, data):
        """Vytvořit nového zákazníka."""
        customer = Customer(**data)
        try:
            db.session.add(customer)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return customer


@api_v1_bp.route("/customers/<int:customer_id>")
class CustomerResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, CustomerSchema)
    def get(self, customer_id):
        """Získat zákazníka podle ID."""
        customer = db.session.get(Customer, customer_id)
        if customer is None:
            abort(404, message="Zákazník nebyl nalezen.")
        return customer

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(CustomerCreateSchema)
    @api_v1_bp.response(200, CustomerSchema)
    def put(self, data, customer_id):
        """Aktualizovat zákazníka."""
        customer = db.session.get(Customer, customer_id)
        if customer is None:
            abort(404, message="Zákazník nebyl nalezen.")
        for key, value in data.items():
            setattr(customer, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return customer

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, customer_id):
        """Smazat zákazníka."""
        customer = db.session.get(Customer, customer_id)
        if customer is None:
            abort(404, message="Zákazník nebyl nalezen.")
        try:
            db.session.delete(customer)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Reservation ---

@api_v1_bp.route("/reservations")
class ReservationsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ReservationSchema(many=True))
    def get(self):
        """Získat seznam všech rezervací."""
        return db.session.scalars(db.select(Reservation)).all()

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ReservationCreateSchema)
    @api_v1_bp.response(201, ReservationSchema)
    def post(self, data):
        """Vytvořit novou rezervaci."""
        reservation = Reservation(**data)
        try:
            db.session.add(reservation)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return reservation


@api_v1_bp.route("/reservations/<int:reservation_id>")
class ReservationResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ReservationSchema)
    def get(self, reservation_id):
        """Získat rezervaci podle ID."""
        reservation = db.session.get(Reservation, reservation_id)
        if reservation is None:
            abort(404, message="Rezervace nebyla nalezena.")
        return reservation

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ReservationCreateSchema)
    @api_v1_bp.response(200, ReservationSchema)
    def put(self, data, reservation_id):
        """Aktualizovat rezervaci."""
        reservation = db.session.get(Reservation, reservation_id)
        if reservation is None:
            abort(404, message="Rezervace nebyla nalezena.")
        for key, value in data.items():
            setattr(reservation, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return reservation

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, reservation_id):
        """Smazat rezervaci."""
        reservation = db.session.get(Reservation, reservation_id)
        if reservation is None:
            abort(404, message="Rezervace nebyla nalezena.")
        try:
            db.session.delete(reservation)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Order ---

@api_v1_bp.route("/orders")
class OrdersResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, OrderSchema(many=True))
    def get(self):
        """Získat seznam všech objednávek."""
        return db.session.scalars(db.select(Order)).all()

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(OrderCreateSchema)
    @api_v1_bp.response(201, OrderSchema)
    def post(self, data):
        """Vytvořit novou objednávku."""
        order = Order(**data)
        try:
            db.session.add(order)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return order


@api_v1_bp.route("/orders/<int:order_id>")
class OrderResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, OrderSchema)
    def get(self, order_id):
        """Získat objednávku podle ID."""
        order = db.session.get(Order, order_id)
        if order is None:
            abort(404, message="Objednávka nebyla nalezena.")
        return order

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(OrderCreateSchema)
    @api_v1_bp.response(200, OrderSchema)
    def put(self, data, order_id):
        """Aktualizovat objednávku."""
        order = db.session.get(Order, order_id)
        if order is None:
            abort(404, message="Objednávka nebyla nalezena.")
        for key, value in data.items():
            setattr(order, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return order

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, order_id):
        """Smazat objednávku."""
        order = db.session.get(Order, order_id)
        if order is None:
            abort(404, message="Objednávka nebyla nalezena.")
        try:
            db.session.delete(order)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- MenuItem ---

@api_v1_bp.route("/menu-items")
class MenuItemsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, MenuItemSchema(many=True))
    def get(self):
        """Získat seznam všech položek menu."""
        return db.session.scalars(db.select(MenuItem)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(MenuItemCreateSchema)
    @api_v1_bp.response(201, MenuItemSchema)
    def post(self, data):
        """Vytvořit novou položku menu."""
        item = MenuItem(**data)
        try:
            db.session.add(item)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return item


@api_v1_bp.route("/menu-items/<int:menuitem_id>")
class MenuItemResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, MenuItemSchema)
    def get(self, menuitem_id):
        """Získat položku menu podle ID."""
        item = db.session.get(MenuItem, menuitem_id)
        if item is None:
            abort(404, message="Položka menu nebyla nalezena.")
        return item

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(MenuItemCreateSchema)
    @api_v1_bp.response(200, MenuItemSchema)
    def put(self, data, menuitem_id):
        """Aktualizovat položku menu."""
        item = db.session.get(MenuItem, menuitem_id)
        if item is None:
            abort(404, message="Položka menu nebyla nalezena.")
        for key, value in data.items():
            setattr(item, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return item

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, menuitem_id):
        """Smazat položku menu."""
        item = db.session.get(MenuItem, menuitem_id)
        if item is None:
            abort(404, message="Položka menu nebyla nalezena.")
        try:
            db.session.delete(item)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- OrderItem ---

@api_v1_bp.route("/order-items")
class OrderItemsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, OrderItemSchema(many=True))
    def get(self):
        """Získat seznam všech položek objednávek."""
        return db.session.scalars(db.select(OrderItem)).all()

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(OrderItemCreateSchema)
    @api_v1_bp.response(201, OrderItemSchema)
    def post(self, data):
        """Vytvořit novou položku objednávky."""
        item = OrderItem(**data)
        try:
            db.session.add(item)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return item


@api_v1_bp.route("/order-items/<int:orderitem_id>")
class OrderItemResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, OrderItemSchema)
    def get(self, orderitem_id):
        """Získat položku objednávky podle ID."""
        item = db.session.get(OrderItem, orderitem_id)
        if item is None:
            abort(404, message="Položka objednávky nebyla nalezena.")
        return item

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(OrderItemCreateSchema)
    @api_v1_bp.response(200, OrderItemSchema)
    def put(self, data, orderitem_id):
        """Aktualizovat položku objednávky."""
        item = db.session.get(OrderItem, orderitem_id)
        if item is None:
            abort(404, message="Položka objednávky nebyla nalezena.")
        for key, value in data.items():
            setattr(item, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return item

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, orderitem_id):
        """Smazat položku objednávky."""
        item = db.session.get(OrderItem, orderitem_id)
        if item is None:
            abort(404, message="Položka objednávky nebyla nalezena.")
        try:
            db.session.delete(item)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Payment ---

@api_v1_bp.route("/payments")
class PaymentsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, PaymentSchema(many=True))
    def get(self):
        """Získat seznam všech plateb."""
        return db.session.scalars(db.select(Payment)).all()

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(PaymentCreateSchema)
    @api_v1_bp.response(201, PaymentSchema)
    def post(self, data):
        """Vytvořit novou platbu."""
        payment = Payment(**data)
        try:
            db.session.add(payment)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(409, message="K této objednávce již platba existuje.")
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return payment


@api_v1_bp.route("/payments/<int:payment_id>")
class PaymentResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, PaymentSchema)
    def get(self, payment_id):
        """Získat platbu podle ID."""
        payment = db.session.get(Payment, payment_id)
        if payment is None:
            abort(404, message="Platba nebyla nalezena.")
        return payment

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(PaymentCreateSchema)
    @api_v1_bp.response(200, PaymentSchema)
    def put(self, data, payment_id):
        """Aktualizovat platbu."""
        payment = db.session.get(Payment, payment_id)
        if payment is None:
            abort(404, message="Platba nebyla nalezena.")
        for key, value in data.items():
            setattr(payment, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return payment

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, payment_id):
        """Smazat platbu."""
        payment = db.session.get(Payment, payment_id)
        if payment is None:
            abort(404, message="Platba nebyla nalezena.")
        try:
            db.session.delete(payment)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Shift ---

@api_v1_bp.route("/shifts")
class ShiftsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ShiftSchema(many=True))
    def get(self):
        """Získat seznam všech směn."""
        return db.session.scalars(db.select(Shift)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ShiftCreateSchema)
    @api_v1_bp.response(201, ShiftSchema)
    def post(self, data):
        """Vytvořit novou směnu."""
        shift = Shift(**data)
        try:
            db.session.add(shift)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return shift


@api_v1_bp.route("/shifts/<int:shift_id>")
class ShiftResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ShiftSchema)
    def get(self, shift_id):
        """Získat směnu podle ID."""
        shift = db.session.get(Shift, shift_id)
        if shift is None:
            abort(404, message="Směna nebyla nalezena.")
        return shift

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ShiftCreateSchema)
    @api_v1_bp.response(200, ShiftSchema)
    def put(self, data, shift_id):
        """Aktualizovat směnu."""
        shift = db.session.get(Shift, shift_id)
        if shift is None:
            abort(404, message="Směna nebyla nalezena.")
        for key, value in data.items():
            setattr(shift, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return shift

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, shift_id):
        """Smazat směnu."""
        shift = db.session.get(Shift, shift_id)
        if shift is None:
            abort(404, message="Směna nebyla nalezena.")
        try:
            db.session.delete(shift)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- UserShift ---

@api_v1_bp.route("/user-shifts")
class UserShiftsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, UserShiftSchema(many=True))
    def get(self):
        """Získat seznam všech přiřazení uživatelů ke směnám."""
        return db.session.scalars(db.select(UserShift)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(UserShiftSchema)
    @api_v1_bp.response(201, UserShiftSchema)
    def post(self, data):
        """Přiřadit uživatele ke směně."""
        user_shift = UserShift(**data)
        try:
            db.session.add(user_shift)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(409, message="Toto přiřazení již existuje.")
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return user_shift


@api_v1_bp.route("/user-shifts/<int:user_id>/<int:shift_id>")
class UserShiftResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, user_id, shift_id):
        """Odebrat uživatele ze směny."""
        user_shift = db.session.get(UserShift, (user_id, shift_id))
        if user_shift is None:
            abort(404, message="Přiřazení nebylo nalezeno.")
        try:
            db.session.delete(user_shift)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Day ---

@api_v1_bp.route("/days")
class DaysResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, DaySchema(many=True))
    def get(self):
        """Získat seznam všech dní."""
        return db.session.scalars(db.select(Day)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(DayCreateSchema)
    @api_v1_bp.response(201, DaySchema)
    def post(self, data):
        """Vytvořit nový den."""
        day = Day(**data)
        try:
            db.session.add(day)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(409, message="Den s tímto datem již existuje.")
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return day


@api_v1_bp.route("/days/<string:date>")
class DayResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, DaySchema)
    def get(self, date):
        """Získat den podle data."""
        day = db.session.get(Day, date)
        if day is None:
            abort(404, message="Den nebyl nalezen.")
        return day

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(DayCreateSchema)
    @api_v1_bp.response(200, DaySchema)
    def put(self, data, date):
        """Aktualizovat den."""
        day = db.session.get(Day, date)
        if day is None:
            abort(404, message="Den nebyl nalezen.")
        for key, value in data.items():
            setattr(day, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return day

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, date):
        """Smazat den."""
        day = db.session.get(Day, date)
        if day is None:
            abort(404, message="Den nebyl nalezen.")
        try:
            db.session.delete(day)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Report ---

@api_v1_bp.route("/reports")
class ReportsResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ReportSchema(many=True))
    def get(self):
        """Získat seznam všech reportů."""
        return db.session.scalars(db.select(Report)).all()

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ReportCreateSchema)
    @api_v1_bp.response(201, ReportSchema)
    def post(self, data):
        """Vytvořit nový report."""
        report = Report(**data)
        try:
            db.session.add(report)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(409, message="Report pro tento den již existuje.")
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return report


@api_v1_bp.route("/reports/<int:report_id>")
class ReportResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, ReportSchema)
    def get(self, report_id):
        """Získat report podle ID."""
        report = db.session.get(Report, report_id)
        if report is None:
            abort(404, message="Report nebyl nalezen.")
        return report

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.arguments(ReportCreateSchema)
    @api_v1_bp.response(200, ReportSchema)
    def put(self, data, report_id):
        """Aktualizovat report."""
        report = db.session.get(Report, report_id)
        if report is None:
            abort(404, message="Report nebyl nalezen.")
        for key, value in data.items():
            setattr(report, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return report

    @jwt_required()
    @roles_required(UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, report_id):
        """Smazat report."""
        report = db.session.get(Report, report_id)
        if report is None:
            abort(404, message="Report nebyl nalezen.")
        try:
            db.session.delete(report)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- User ---

@api_v1_bp.route("/users")
class UsersResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.cisnik.value, UserRole.vedouci.value, UserRole.admin.value)
    @api_v1_bp.response(200, UserSchema(many=True))
    def get(self):
        """Získat seznam všech uživatelů."""
        return db.session.scalars(db.select(User)).all()

    @jwt_required()
    @roles_required(UserRole.admin.value)
    @api_v1_bp.arguments(UserCreateSchema)
    @api_v1_bp.response(201, UserSchema)
    def post(self, data):
        """Vytvořit nového uživatele."""
        user = User(**data)
        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(409, message="Uživatel s tímto jménem již existuje.")
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return user


@api_v1_bp.route("/users/<int:user_id>")
class UserResource(MethodView):

    @jwt_required()
    @roles_required(UserRole.admin.value)
    @api_v1_bp.response(200, UserSchema)
    def get(self, user_id):
        """Získat uživatele podle ID."""
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, message="Uživatel nebyl nalezen.")
        return user

    @jwt_required()
    @roles_required(UserRole.admin.value)
    @api_v1_bp.arguments(UserCreateSchema)
    @api_v1_bp.response(200, UserSchema)
    def put(self, data, user_id):
        """Aktualizovat uživatele."""
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, message="Uživatel nebyl nalezen.")
        for key, value in data.items():
            setattr(user, key, value)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return user

    @jwt_required()
    @roles_required(UserRole.admin.value)
    @api_v1_bp.response(204)
    def delete(self, user_id):
        """Smazat uživatele."""
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, message="Uživatel nebyl nalezen.")
        try:
            db.session.delete(user)
            db.session.commit()
        except Exception:
            db.session.rollback()
            abort(500, message="Interní chyba serveru.")
        return ""


# --- Auth ---

@api_v1_bp.route("/register")
class UserRegister(MethodView):
    @api_v1_bp.arguments(UserCreateSchema)
    @api_v1_bp.response(201, UserSchema)
    def post(self, user_data):
        """Registruje nového uživatele."""
        if db.session.execute(db.select(User).where(User.name == user_data["name"])).scalar_one_or_none():
            abort(409, message="Uživatel s tímto jménem již existuje.")

        user = User(
            name=user_data["name"],
            role=user_data["role"],
            password=user_data["password"]
        )

        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(500, message="Chyba při ukládání uživatele.")
        except Exception as e:
            db.session.rollback()
            abort(500, message=str(e))
        return user


@api_v1_bp.route("/login")
class UserLogin(MethodView):
    @api_v1_bp.arguments(UserLoginSchema)
    def post(self, user_data):
        """Přihlásí uživatele a vrátí JWT tokeny."""
        name = user_data["name"]
        password = user_data["password"]

        user = db.session.execute(
            db.select(User).where(User.name == name)
        ).scalar_one_or_none()

        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.user_id))
            refresh_token = create_refresh_token(identity=str(user.user_id))
            return jsonify(access_token=access_token, refresh_token=refresh_token), 200

        abort(401, message="Nesprávné uživatelské jméno nebo heslo.")


@api_v1_bp.route("/refresh")
class TokenRefresh(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        current_user_id = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user_id)
        return jsonify(access_token=new_access_token), 200

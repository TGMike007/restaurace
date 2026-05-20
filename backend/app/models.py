# Tento soubor definuje databázové modely pomocí SQLAlchemy ORM.
# Každá třída zde reprezentuje jednu tabulku v databázi.

from .db import db  # Import instance SQLAlchemy z db.py
from sqlalchemy.sql import func  # Import SQL funkcí (např. pro server_default)
# Import modulu datetime (i když není přímo použitý, může se hodit)
import datetime
from passlib.hash import pbkdf2_sha256 as sha256
import enum
# from werkzeug.security import generate_password_hash, check_password_hash # Příklad pro hashování hesel

# Model pro uživatele (User)


class UserRole(enum.Enum):
    cisnik = "cisnik"
    vedouci = "vedouci"
    admin = "admin"


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(15), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False,
                     default=UserRole.cisnik)

    orders = db.relationship('Order', backref='user', lazy=True)
    shifts = db.relationship('UserShift', backref='user', lazy=True)

    def __repr__(self):
        return f"<User {self.name}>"

    @property
    def password(self):
        raise AttributeError('password is not a readible attribute')

    @password.setter
    def password(self, password):
        self.password_hash = sha256.hash(password)

    def check_password(self, password):
        return sha256.verify(password, self.password_hash)


class TableUnit(db.Model):
    __tablename__ = "table_units"

    table_unit_id = db.Column(db.Integer, primary_key=True)

    seats = db.Column(db.Integer, nullable=False)

    orders = db.relationship('Order', backref='table_unit', lazy=True)
    reservations = db.relationship(
        'Reservation', backref='table_unit', lazy=True)

    def __repr__(self):
        return f"<Table {self.table_unit_id}>"


class Customer(db.Model):
    __tablename__ = "customers"

    customer_id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(20), nullable=False)
    contact = db.Column(db.String(30))

    reservations = db.relationship(
        'Reservation', backref='customer', lazy=True)

    def __repr__(self):
        return f"<Customer {self.name}>"


class Reservation(db.Model):
    __tablename__ = "reservations"

    reservation_id = db.Column(db.Integer, primary_key=True)

    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    person_count = db.Column(db.Integer, nullable=False)

    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id"))
    table_unit_id = db.Column(
        db.Integer, db.ForeignKey("table_units.table_unit_id"))

    def __repr__(self):
        return f"<Reservation {self.reservation_id}>"


class Order(db.Model):
    __tablename__ = "orders"

    order_id = db.Column(db.Integer, primary_key=True)

    price = db.Column(db.Numeric(12, 2))
    status = db.Column(db.String(20))

    table_unit_id = db.Column(
        db.Integer, db.ForeignKey("table_units.table_unit_id"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))

    items = db.relationship('OrderItem', backref='order', lazy=True)
    payment = db.relationship('Payment', backref='order', uselist=False)

    def __repr__(self):
        return f"<Order {self.order_id}>"


class MenuItem(db.Model):
    __tablename__ = "menu_items"

    menuitem_id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    available = db.Column(db.Boolean, default=True)

    items = db.relationship('OrderItem', backref='menu_item', lazy=True)

    def __repr__(self):
        return f"<MenuItem {self.name}>"


class OrderItem(db.Model):
    __tablename__ = "order_items"

    orderitem_id = db.Column(db.Integer, primary_key=True)

    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    note = db.Column(db.String(255))

    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"))
    menuitem_id = db.Column(
        db.Integer, db.ForeignKey("menu_items.menuitem_id"))

    def __repr__(self):
        return f"<OrderItem {self.orderitem_id}>"


class Payment(db.Model):
    __tablename__ = "payments"

    payment_id = db.Column(db.Integer, primary_key=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(50))
    status = db.Column(db.String(50))

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.order_id"),
        unique=True
    )

    def __repr__(self):
        return f"<Payment {self.payment_id}>"


class Shift(db.Model):
    __tablename__ = "shifts"

    shift_id = db.Column(db.Integer, primary_key=True)

    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(50))

    users = db.relationship('UserShift', backref='shift', lazy=True)

    def __repr__(self):
        return f"<Shift {self.shift_id}>"


class UserShift(db.Model):
    __tablename__ = "user_shifts"

    user_id = db.Column(db.Integer, db.ForeignKey(
        "users.user_id"), primary_key=True)
    shift_id = db.Column(db.Integer, db.ForeignKey(
        "shifts.shift_id"), primary_key=True)

    def __repr__(self):
        return f"<UserShift user={self.user_id} shift={self.shift_id}>"


class Day(db.Model):
    __tablename__ = "days"

    date = db.Column(db.Date, primary_key=True)
    status = db.Column(db.String(50))

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))

    report = db.relationship('Report', backref='day', uselist=False)

    def __repr__(self):
        return f"<Day {self.date}>"


class Report(db.Model):
    __tablename__ = "reports"

    report_id = db.Column(db.Integer, primary_key=True)

    content = db.Column(db.Text)

    date = db.Column(
        db.Date,
        db.ForeignKey("days.date"),
        unique=True
    )

    def __repr__(self):
        return f"<Report {self.report_id}>"

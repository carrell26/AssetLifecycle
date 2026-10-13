"""
Inisialisasi ekstensi Flask (database, migration) di sini,
supaya bisa di-import dari mana saja tanpa circular import.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
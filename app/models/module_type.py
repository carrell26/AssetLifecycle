from datetime import datetime
from ..extensions import db


class ModuleType(db.Model):
    __tablename__ = "module_types"

    module_type_id = db.Column(db.Integer, primary_key=True)
    nama_tipe = db.Column(db.String(100), nullable=False)
    vendor = db.Column(db.String(100))
    deskripsi = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    modules = db.relationship("Module", backref="module_type")
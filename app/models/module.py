from datetime import datetime
from ..extensions import db


class Module(db.Model):
    """
    Modul fisik individual. TIDAK menyimpan lokasi/slot/approval/hash di sini
    -- itu semua ada di ModulePosition, ModuleRequest/RequestApproval, dan
    AuditLog masing-masing, supaya tidak ada 2 sumber kebenaran.
    """
    __tablename__ = "modules"

    modul_id = db.Column(db.Integer, primary_key=True)
    module_type_id = db.Column(db.Integer, db.ForeignKey("module_types.module_type_id"))
    serial_number = db.Column(db.String(100))
    unit_part_number = db.Column(db.String(100))
    original_date = db.Column(db.String(50))
    kondisi = db.Column(db.String(20), default="AKTIF")  # RUSAK / IDLE / AKTIF
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    positions = db.relationship("ModulePosition", back_populates="module", cascade="all, delete-orphan")
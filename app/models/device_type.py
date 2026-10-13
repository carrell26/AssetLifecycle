from datetime import datetime
from ..extensions import db


class DeviceType(db.Model):
    __tablename__ = "device_types"

    device_type_id = db.Column(db.Integer, primary_key=True)
    nama_tipe = db.Column(db.String(100), nullable=False)  # 'OTN PSS24', 'Metro'
    vendor = db.Column(db.String(100))
    deskripsi = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    slot_definitions = db.relationship("SlotDefinition", backref="device_type")
    devices = db.relationship("Device", backref="device_type")
from datetime import datetime
from ..extensions import db


class Device(db.Model):
    __tablename__ = "devices"

    device_id = db.Column(db.Integer, primary_key=True)
    device_type_id = db.Column(db.Integer, db.ForeignKey("device_types.device_type_id"))
    location_id = db.Column(db.Integer, db.ForeignKey("locations.location_id"))
    nama_perangkat = db.Column(db.String(150))
    serial_number = db.Column(db.String(100))
    hostname = db.Column(db.String(150))
    status = db.Column(db.String(50))
    keterangan = db.Column(db.Text)
    import_id = db.Column(db.Integer, db.ForeignKey("data_imports.import_id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    data_import = db.relationship("DataImport", back_populates="devices")
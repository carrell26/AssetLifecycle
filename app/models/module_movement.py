from datetime import datetime
from ..extensions import db


class ModuleMovement(db.Model):
    """Histori resmi perpindahan modul YANG SUDAH DISETUJUI (append-only)."""
    __tablename__ = "module_movements"

    movement_id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.modul_id"))
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"))
    from_device_id = db.Column(db.Integer, db.ForeignKey("devices.device_id"), nullable=True)
    from_slot_definition_id = db.Column(db.Integer, db.ForeignKey("slot_definitions.slot_definition_id"), nullable=True)
    to_device_id = db.Column(db.Integer, db.ForeignKey("devices.device_id"), nullable=True)
    to_slot_definition_id = db.Column(db.Integer, db.ForeignKey("slot_definitions.slot_definition_id"), nullable=True)
    jenis_perubahan = db.Column(db.String(20))
    tanggal = db.Column(db.DateTime, default=datetime.utcnow)
    keterangan = db.Column(db.Text)

    module = db.relationship("Module", foreign_keys=[module_id])
    actor = db.relationship("User", foreign_keys=[user_id])
    from_device = db.relationship("Device", foreign_keys=[from_device_id])
    to_device = db.relationship("Device", foreign_keys=[to_device_id])
    from_slot_definition = db.relationship("SlotDefinition", foreign_keys=[from_slot_definition_id])
    to_slot_definition = db.relationship("SlotDefinition", foreign_keys=[to_slot_definition_id])
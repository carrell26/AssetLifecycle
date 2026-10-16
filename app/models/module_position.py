from datetime import datetime
from ..extensions import db


class ModulePosition(db.Model):
    """
    Posisi TERKINI modul: 1 slot cuma boleh 1 modul aktif (divalidasi di
    aplikasi), tapi 1 modul boleh punya banyak baris di sini sekaligus
    (menempati banyak slot).
    """
    __tablename__ = "module_positions"

    position_id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.modul_id"))
    device_id = db.Column(db.Integer, db.ForeignKey("devices.device_id"))
    slot_definition_id = db.Column(db.Integer, db.ForeignKey("slot_definitions.slot_definition_id"))
    installed_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="aktif")
    shelf = db.Column(db.String(20))
    port = db.Column(db.String(50))

    module = db.relationship("Module", foreign_keys=[module_id], back_populates="positions")
    device = db.relationship("Device", foreign_keys=[device_id])
    slot_definition = db.relationship("SlotDefinition", foreign_keys=[slot_definition_id])
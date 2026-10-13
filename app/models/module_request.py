from datetime import datetime
from ..extensions import db


class ModuleRequest(db.Model):
    """
    Pengajuan perubahan (pasang/pindah/lepas) -- belum tentu disetujui.
    from_*/to_* nullable & kondisional mengikuti jenis_perubahan:
      - 'pasang' -> from_* kosong
      - 'pindah' -> from_* dan to_* wajib diisi
      - 'lepas'  -> to_* kosong
    """
    __tablename__ = "module_requests"

    request_id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.modul_id"))
    requested_by = db.Column(db.Integer, db.ForeignKey("user.user_id"))
    jenis_perubahan = db.Column(db.String(20))  # pasang / pindah / lepas
    from_device_id = db.Column(db.Integer, db.ForeignKey("devices.device_id"), nullable=True)
    from_slot_definition_id = db.Column(db.Integer, db.ForeignKey("slot_definitions.slot_definition_id"), nullable=True)
    to_device_id = db.Column(db.Integer, db.ForeignKey("devices.device_id"), nullable=True)
    to_slot_definition_id = db.Column(db.Integer, db.ForeignKey("slot_definitions.slot_definition_id"), nullable=True)
    alasan = db.Column(db.Text)
    status = db.Column(db.String(20), default="PENDING")  # AUTO_APPROVED / PENDING / APPROVED / REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    module = db.relationship("Module", foreign_keys=[module_id])
    requester = db.relationship("User", foreign_keys=[requested_by])
    from_device = db.relationship("Device", foreign_keys=[from_device_id])
    to_device = db.relationship("Device", foreign_keys=[to_device_id])
    from_slot_definition = db.relationship("SlotDefinition", foreign_keys=[from_slot_definition_id])
    to_slot_definition = db.relationship("SlotDefinition", foreign_keys=[to_slot_definition_id])
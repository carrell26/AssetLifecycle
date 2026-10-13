from ..extensions import db


class SlotDefinition(db.Model):
    __tablename__ = "slot_definitions"

    slot_definition_id = db.Column(db.Integer, primary_key=True)
    device_type_id = db.Column(db.Integer, db.ForeignKey("device_types.device_type_id"))
    nomor_slot = db.Column(db.String(20), nullable=False)
    nama_slot = db.Column(db.String(100))
    posisi = db.Column(db.String(100))
    keterangan = db.Column(db.Text)
from datetime import datetime
from ..extensions import db


class DataImport(db.Model):
    __tablename__ = "data_imports"

    import_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"))
    nama_file = db.Column(db.String(255))
    jenis_data = db.Column(db.String(100))
    jumlah_data = db.Column(db.Integer)
    jumlah_berhasil = db.Column(db.Integer)
    jumlah_gagal = db.Column(db.Integer)
    status = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
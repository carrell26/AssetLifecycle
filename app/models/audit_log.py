from datetime import datetime
from ..extensions import db


class AuditLog(db.Model):
    """SATU-SATUNYA ledger/hash chain di sistem. Append-only, tidak pernah di-UPDATE."""
    __tablename__ = "audit_logs"

    audit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"))
    aksi = db.Column(db.String(50))
    table_name = db.Column(db.String(100))
    record_id = db.Column(db.Integer)
    data_snapshot = db.Column(db.Text)
    hash = db.Column(db.String(64), nullable=False)
    previous_hash = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship("User", foreign_keys=[user_id])
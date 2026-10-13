from ..extensions import db


class RequestApproval(db.Model):
    __tablename__ = "request_approvals"

    approval_id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("module_requests.request_id"))
    approved_by = db.Column(db.Integer, db.ForeignKey("user.user_id"))
    status = db.Column(db.String(20))  # APPROVED / REJECTED
    catatan = db.Column(db.Text)
    approved_at = db.Column(db.DateTime)
"""
Utility untuk hash chain (FR-6) -- satu-satunya ledger di sistem, lewat
tabel audit_logs. Generik: bisa dipakai buat mengaudit tabel manapun,
tidak cuma module_movements.
"""
import hashlib
import json

from ..models import AuditLog

GENESIS_HASH = "0" * 64


def get_latest_hash():
    """Hash dari entry audit_logs paling akhir, atau GENESIS_HASH kalau belum ada entry sama sekali."""
    last = AuditLog.query.order_by(AuditLog.audit_id.desc()).first()
    return last.hash if last else GENESIS_HASH


def compute_hash(data_snapshot: str, previous_hash: str) -> str:
    payload = (previous_hash + data_snapshot).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def append_audit_log(db, user_id, aksi, table_name, record_id, data_dict):
    """
    Tambah 1 baris audit_logs baru, terhubung ke hash entry sebelumnya.
    TIDAK melakukan db.session.commit() -- biar tetap 1 transaction dengan
    perubahan data lain (module_positions, module_movements dst), sesuai FR-6.4.
    """
    data_snapshot = json.dumps(data_dict, sort_keys=True, default=str)
    previous_hash = get_latest_hash()
    new_hash = compute_hash(data_snapshot, previous_hash)

    entry = AuditLog(
        user_id=user_id,
        aksi=aksi,
        table_name=table_name,
        record_id=record_id,
        data_snapshot=data_snapshot,
        hash=new_hash,
        previous_hash=previous_hash,
    )
    db.session.add(entry)
    return entry


def verify_chain():
    """
    FR-6.3: hitung ulang seluruh audit_logs, cek apakah hash-nya konsisten.
    Return (is_valid: bool, broken_at_audit_id: int | None).
    """
    entries = AuditLog.query.order_by(AuditLog.audit_id.asc()).all()
    expected_previous = GENESIS_HASH

    for entry in entries:
        if entry.previous_hash != expected_previous:
            return False, entry.audit_id

        recomputed = compute_hash(entry.data_snapshot, entry.previous_hash)
        if recomputed != entry.hash:
            return False, entry.audit_id

        expected_previous = entry.hash

    return True, None
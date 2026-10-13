"""
Modul AR (versi web) -- FR-12 (Desain AR/VR, Fase 2).

Alur: tiap Device punya QR code yang mengarah ke halaman "panduan slot".
Teknisi scan QR pakai kamera HP (browser) -> diarahkan ke halaman yang
menampilkan peta slot device itu, warna-warna: slot terisi (merah, ada
modul aktif) vs slot kosong (hijau, tersedia dipasangi modul).

CATATAN: ini pendekatan web-based, BUKAN Unity/Unreal Engine seperti yang
diminta literal di RPS Sub-CPMK 5 -- dibangun sambil menunggu konfirmasi
dosen apakah versi web ini bisa diterima untuk rekognisi MK AR/VR.
"""
from io import BytesIO

import qrcode
from flask import Blueprint, render_template, url_for, send_file
from flask_login import login_required

from ...models import Device, SlotDefinition, ModulePosition
from ...utils.decorators import role_required

ar_bp = Blueprint("ar", __name__, url_prefix="/ar", template_folder="../../templates/ar")


@ar_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def index():
    devices = Device.query.order_by(Device.nama_perangkat).all()
    return render_template("ar/index.html", devices=devices)


@ar_bp.route("/scan")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def scan():
    return render_template("ar/scan.html")


@ar_bp.route("/device/<int:device_id>")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def device_guide(device_id):
    device = Device.query.get_or_404(device_id)

    slot_defs = SlotDefinition.query.filter_by(device_type_id=device.device_type_id).order_by(
        SlotDefinition.nomor_slot
    ).all()

    slot_rows = []
    for slot_def in slot_defs:
        position = ModulePosition.query.filter_by(
            device_id=device.device_id, slot_definition_id=slot_def.slot_definition_id, status="aktif"
        ).first()
        slot_rows.append({
            "slot_def": slot_def,
            "occupied": position is not None,
            "module": position.module if position else None,
        })

    return render_template("ar/device_guide.html", device=device, slot_rows=slot_rows)


@ar_bp.route("/device/<int:device_id>/qr.png")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def device_qr(device_id):
    Device.query.get_or_404(device_id)

    target_url = url_for("ar.device_guide", device_id=device_id, _external=True)
    img = qrcode.make(target_url)

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png")
"""
Modul Export -- FR-7.3 (Export riwayat modul ke Excel, dengan filter
lokasi, tipe perangkat, dan rentang tanggal, dibuat server-side pakai openpyxl).
"""
from datetime import datetime, timedelta
from io import BytesIO

import openpyxl
from flask import Blueprint, render_template, request, send_file
from flask_login import login_required

from ...models import ModuleMovement, DeviceType, Location
from ...utils.decorators import role_required

export_bp = Blueprint("export", __name__, url_prefix="/export", template_folder="../../templates/export")


def _movement_matches_filter(movement, location_id, device_type_id):
    """Movement dianggap cocok kalau lokasi/tipe perangkat cocok di SALAH SATU dari from_device atau to_device."""
    devices = [d for d in (movement.from_device, movement.to_device) if d is not None]

    if location_id and not any(d.location_id == location_id for d in devices):
        return False
    if device_type_id and not any(d.device_type_id == device_type_id for d in devices):
        return False
    return True


def _get_filtered_movements():
    location_id = request.args.get("location_id", type=int)
    device_type_id = request.args.get("device_type_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    query = ModuleMovement.query
    if date_from:
        query = query.filter(ModuleMovement.tanggal >= datetime.strptime(date_from, "%Y-%m-%d"))
    if date_to:
        end = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(ModuleMovement.tanggal < end)

    movements = query.order_by(ModuleMovement.tanggal.desc()).all()
    movements = [m for m in movements if _movement_matches_filter(m, location_id, device_type_id)]
    return movements


@export_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif")
def index():
    all_types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    all_locations = Location.query.order_by(Location.nama_lokasi).all()
    return render_template("export/index.html", all_types=all_types, all_locations=all_locations)


@export_bp.route("/download")
@login_required
@role_required("admin", "karyawan_tif")
def download():
    movements = _get_filtered_movements()

    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Riwayat Modul"

    headers = [
        "Waktu", "Jenis Perubahan", "Serial Number Modul", "Tipe Modul",
        "Dari Perangkat", "Dari Slot", "Ke Perangkat", "Ke Slot",
        "Dilakukan Oleh", "Keterangan",
    ]
    sheet.append(headers)

    for m in movements:
        sheet.append([
            m.tanggal.strftime("%Y-%m-%d %H:%M:%S") if m.tanggal else "",
            m.jenis_perubahan or "",
            m.module.serial_number if m.module else "",
            m.module.module_type.nama_tipe if m.module and m.module.module_type else "",
            m.from_device.nama_perangkat if m.from_device else "",
            m.from_slot_definition.nomor_slot if m.from_slot_definition else "",
            m.to_device.nama_perangkat if m.to_device else "",
            m.to_slot_definition.nomor_slot if m.to_slot_definition else "",
            m.actor.name if m.actor else "",
            m.keterangan or "",
        ])

    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)

    filename = f"riwayat_modul_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
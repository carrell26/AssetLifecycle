"""
Modul Export -- FR-7.3 (Export riwayat modul ke Excel dari tabel module_movements,
dengan filter lokasi, tipe perangkat, tipe modul, dan rentang tanggal, dibuat server-side pakai openpyxl).
"""
import csv
import io
import os
from datetime import datetime, timedelta
from io import BytesIO

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from flask import Blueprint, render_template, request, send_file, jsonify, current_app
from flask_login import login_required, current_user

from ...extensions import db
from ...models import (
    ModuleMovement,
    ModulePosition,
    ModuleRequest,
    RequestApproval,
    AuditLog,
    User,
    Device,
    DeviceType,
    Location,
    Module,
    ModuleType,
    SlotDefinition,
)
from ...utils.decorators import role_required

export_bp = Blueprint("export", __name__, url_prefix="/export", template_folder="../../templates/export")


def _is_api_request():
    return (
        request.headers.get("Accept") == "application/json"
        or request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or request.args.get("format") == "json"
    )


def _format_port_shelf_slot(slot_def, port=None, shelf=None):
    """
    Format kombinasi Port, Shelf, dan Slot.
    Jika port/shelf belum tercatat pada histori, tampilkan informasi slot yang tersedia.
    """
    if not slot_def and not port and not shelf:
        return "-"

    slot_num = slot_def.nomor_slot if slot_def else ""
    p_val = str(port).strip() if port else ""
    s_val = str(shelf).strip() if shelf else ""
    sl_val = str(slot_num).strip() if slot_num else ""

    if not sl_val and not p_val and not s_val:
        return "-"

    parts = []
    if p_val:
        parts.append(f"Port {p_val}")
    if s_val:
        parts.append(f"Shelf {s_val}")
    if sl_val:
        if not sl_val.lower().startswith("slot"):
            parts.append(f"Slot {sl_val}")
        else:
            parts.append(sl_val)

    return ", ".join(parts) if parts else "-"


def _get_historical_slot_info(movement, direction="from"):
    """
    Mengambil format Port, Shelf, dan Slot historis untuk asal ('from') atau tujuan ('to').
    Posisi historis asal/tujuan tetap konsisten dan tidak berubah mengikuti posisi modul saat ini.
    """
    if direction == "from":
        slot_def = movement.from_slot_definition
        device_id = movement.from_device_id
        slot_def_id = movement.from_slot_definition_id
    else:
        slot_def = movement.to_slot_definition
        device_id = movement.to_device_id
        slot_def_id = movement.to_slot_definition_id

    if not slot_def and not device_id:
        return "-"

    # Cari data posisi historis (shelf, port) untuk modul pada perangkat & slot spesifik ini
    port = None
    shelf = None
    if movement.module_id and device_id and slot_def_id:
        pos = ModulePosition.query.filter_by(
            module_id=movement.module_id,
            device_id=device_id,
            slot_definition_id=slot_def_id,
        ).first()
        if pos:
            port = pos.port
            shelf = pos.shelf

    return _format_port_shelf_slot(slot_def, port=port, shelf=shelf)


def _get_movement_actor_name(movement):
    """
    Mengambil nama pengguna yang benar-benar melakukan atau mencatat perpindahan.
    Mengecek:
    1. AuditLog aksi APPROVE_MOVEMENT untuk record movement ini (menyimpan actor sejati)
    2. RequestApproval (approved_by)
    3. User dari relasi actor pada movement
    """
    # 1. Cek dari audit log APPROVE_MOVEMENT
    audit = AuditLog.query.filter_by(
        table_name="module_movements",
        record_id=movement.movement_id,
        aksi="APPROVE_MOVEMENT",
    ).first()
    if audit and audit.actor:
        return audit.actor.name
    elif audit and audit.user_id:
        u = db.session.get(User, audit.user_id)
        if u:
            return u.name

    # 2. Cek RequestApproval terkait
    approval = db.session.query(RequestApproval).join(
        ModuleRequest, RequestApproval.request_id == ModuleRequest.request_id
    ).filter(
        ModuleRequest.module_id == movement.module_id,
        RequestApproval.status == "APPROVED",
    ).order_by(RequestApproval.approved_at.desc()).first()
    if approval and approval.approved_by:
        approver = db.session.get(User, approval.approved_by)
        if approver:
            return approver.name

    # 3. Fallback ke relasi actor movement
    if movement.actor:
        return movement.actor.name
    elif movement.user_id:
        u = db.session.get(User, movement.user_id)
        if u:
            return u.name

    return "-"


def _get_filtered_movements():
    """
    Query riwayat modul dari tabel module_movements dengan filter opsional:
    - location_id   : filter bila lokasi perangkat asal atau tujuan sesuai
    - device_type_id: filter bila tipe perangkat asal atau tujuan sesuai
    - module_type_id: filter tipe modul
    - date_from     : filter tanggal awal
    - date_to       : filter tanggal akhir
    """
    location_id = request.args.get("location_id", type=int)
    device_type_id = request.args.get("device_type_id", type=int)
    module_type_id = request.args.get("module_type_id", type=int)
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    query = ModuleMovement.query

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(ModuleMovement.tanggal >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(ModuleMovement.tanggal < dt_to)
        except ValueError:
            pass

    movements = query.order_by(ModuleMovement.tanggal.desc(), ModuleMovement.movement_id.desc()).all()

    # Filter berdasarkan relasi database
    filtered = []
    for m in movements:
        devices = [d for d in (m.from_device, m.to_device) if d is not None]
        if location_id and not any(d.location_id == location_id for d in devices):
            continue
        if device_type_id and not any(d.device_type_id == device_type_id for d in devices):
            continue
        if module_type_id and (not m.module or m.module.module_type_id != module_type_id):
            continue
        filtered.append(m)

    return filtered


@export_bp.route("/")
@login_required
@role_required("admin", "karyawan_tif")
def index():
    if not _is_api_request():
        react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
        if os.path.exists(react_template_path) and not request.args.get("legacy"):
            return render_template("react_index.html", current_user=current_user)

    all_types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    all_locations = Location.query.order_by(Location.nama_lokasi).all()
    all_module_types = ModuleType.query.order_by(ModuleType.nama_tipe).all()
    total_movements = ModuleMovement.query.count()

    filtered_movements = _get_filtered_movements()
    filtered_count = len(filtered_movements)

    # Estimasi ukuran file berdasarkan jumlah baris
    if filtered_count == 0:
        estimated_size = "< 1 MB"
    else:
        approx_kb = max(5, int((filtered_count * 250) / 1024))
        if approx_kb < 1024:
            estimated_size = "< 1 MB"
        else:
            estimated_size = f"~{(approx_kb / 1024):.1f} MB"

    if _is_api_request():
        return jsonify({
            "success": True,
            "locations": [
                {"location_id": l.location_id, "nama_lokasi": l.nama_lokasi}
                for l in all_locations
            ],
            "device_types": [
                {"device_type_id": t.device_type_id, "nama_tipe": t.nama_tipe}
                for t in all_types
            ],
            "module_types": [
                {"module_type_id": mt.module_type_id, "nama_tipe": mt.nama_tipe}
                for mt in all_module_types
            ],
            "total_movements": total_movements,
            "filtered_count": filtered_count,
            "estimated_size": estimated_size,
        })

    return render_template(
        "export/index.html",
        all_types=all_types,
        all_locations=all_locations,
        all_module_types=all_module_types,
        total_movements=total_movements,
    )


@export_bp.route("/download")
@login_required
@role_required("admin", "karyawan_tif")
def download():
    movements = _get_filtered_movements()
    file_format = (request.args.get("format") or request.args.get("file_format") or "xlsx").lower().strip()

    headers = [
        "Nomor",
        "Waktu Aktivitas",
        "Serial Number",
        "Unit Type",
        "Lokasi Asal",
        "Perangkat Asal",
        "Port, Shelf, dan Slot Asal",
        "Lokasi Tujuan",
        "Perangkat Tujuan",
        "Port, Shelf, dan Slot Tujuan",
        "Jenis Aktivitas",
        "Pengguna yang Melakukan Perpindahan",
    ]

    # Handler format CSV
    if file_format == "csv":
        output = io.StringIO()
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)

        for row_idx, m in enumerate(movements, start=1):
            waktu_str = m.tanggal.strftime("%Y-%m-%d %H:%M:%S") if m.tanggal else "-"
            serial_number = m.module.serial_number if m.module and m.module.serial_number else "-"
            unit_type = (
                m.module.module_type.nama_tipe
                if m.module and m.module.module_type and m.module.module_type.nama_tipe
                else "-"
            )

            # Asal
            lokasi_asal = (
                m.from_device.location.nama_lokasi
                if m.from_device and m.from_device.location and m.from_device.location.nama_lokasi
                else "-"
            )
            perangkat_asal = m.from_device.nama_perangkat if m.from_device and m.from_device.nama_perangkat else "-"
            slot_asal = _get_historical_slot_info(m, direction="from")

            # Tujuan
            lokasi_tujuan = (
                m.to_device.location.nama_lokasi
                if m.to_device and m.to_device.location and m.to_device.location.nama_lokasi
                else "-"
            )
            perangkat_tujuan = m.to_device.nama_perangkat if m.to_device and m.to_device.nama_perangkat else "-"
            slot_tujuan = _get_historical_slot_info(m, direction="to")

            # Jenis Aktivitas
            jenis_aktivitas = m.jenis_perubahan.capitalize() if m.jenis_perubahan else "-"

            # Pengguna yang melakukan perpindahan
            pengguna = _get_movement_actor_name(m)

            writer.writerow([
                row_idx,
                waktu_str,
                serial_number,
                unit_type,
                lokasi_asal,
                perangkat_asal,
                slot_asal,
                lokasi_tujuan,
                perangkat_tujuan,
                slot_tujuan,
                jenis_aktivitas,
                pengguna,
            ])

        writer.writerow([f"Total: {len(movements)} aktivitas perpindahan"])

        buffer = io.BytesIO(output.getvalue().encode("utf-8-sig"))
        buffer.seek(0)

        filename = f"riwayat_modul_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="text/csv",
        )

    # Handler format XLSX
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Riwayat Modul"

    # Style header
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    # Tulis header
    for col_idx, header in enumerate(headers, start=1):
        cell = sheet.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # Lebar kolom yang proporsional
    col_widths = [8, 20, 22, 18, 20, 24, 26, 20, 24, 26, 16, 26]
    for i, width in enumerate(col_widths, start=1):
        sheet.column_dimensions[sheet.cell(row=1, column=i).column_letter].width = width

    # Freeze baris header
    sheet.freeze_panes = "A2"

    # Warna alternating rows
    fill_even = PatternFill(start_color="EBF3FB", end_color="EBF3FB", fill_type="solid")
    fill_odd = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    for row_idx, m in enumerate(movements, start=1):
        row_num = row_idx + 1
        fill = fill_even if row_idx % 2 == 0 else fill_odd

        waktu_str = m.tanggal.strftime("%Y-%m-%d %H:%M:%S") if m.tanggal else "-"
        serial_number = m.module.serial_number if m.module and m.module.serial_number else "-"
        unit_type = (
            m.module.module_type.nama_tipe
            if m.module and m.module.module_type and m.module.module_type.nama_tipe
            else "-"
        )

        # Asal
        lokasi_asal = (
            m.from_device.location.nama_lokasi
            if m.from_device and m.from_device.location and m.from_device.location.nama_lokasi
            else "-"
        )
        perangkat_asal = m.from_device.nama_perangkat if m.from_device and m.from_device.nama_perangkat else "-"
        slot_asal = _get_historical_slot_info(m, direction="from")

        # Tujuan
        lokasi_tujuan = (
            m.to_device.location.nama_lokasi
            if m.to_device and m.to_device.location and m.to_device.location.nama_lokasi
            else "-"
        )
        perangkat_tujuan = m.to_device.nama_perangkat if m.to_device and m.to_device.nama_perangkat else "-"
        slot_tujuan = _get_historical_slot_info(m, direction="to")

        # Jenis Aktivitas
        jenis_aktivitas = m.jenis_perubahan.capitalize() if m.jenis_perubahan else "-"

        # Pengguna yang melakukan perpindahan
        pengguna = _get_movement_actor_name(m)

        row_data = [
            row_idx,
            waktu_str,
            serial_number,
            unit_type,
            lokasi_asal,
            perangkat_asal,
            slot_asal,
            lokasi_tujuan,
            perangkat_tujuan,
            slot_tujuan,
            jenis_aktivitas,
            pengguna,
        ]

        for col_idx, value in enumerate(row_data, start=1):
            cell = sheet.cell(row=row_num, column=col_idx, value=value)
            cell.fill = fill
            cell.border = thin_border
            if col_idx in (1, 2, 4, 11):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(vertical="center")

    # Baris total summary di akhir data
    total_row = len(movements) + 2
    total_cell = sheet.cell(row=total_row, column=1, value=f"Total: {len(movements)} aktivitas perpindahan")
    total_cell.font = Font(bold=True)

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
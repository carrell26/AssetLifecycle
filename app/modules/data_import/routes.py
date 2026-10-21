"""
Modul Data Import -- FR-8 (Import Data Awal dari Excel).

Rute yang tersedia:
  GET/POST /import/  -> form upload Excel + pilih Device Type tujuan,
                         lalu daftar histori import sebelumnya (data_imports).

Strategi mapping (sesuai kesepakatan): field yang tidak ada di skema kita
(Shelf, Port, Software Load, CLEI, dst) diabaikan. EquipmentServiceState
diterjemahkan ke kondisi RUSAK/IDLE/AKTIF lewat status_mapping.py.

PENTING: Lokasi TIDAK dipilih manual -- diambil otomatis dari kolom
"Location" di tiap baris Excel. Semua pencocokan (lokasi, NE, tipe modul,
serial number) memakai key TERNORMALISASI (huruf besar semua, spasi
dirapikan) supaya variasi penulisan seperti "PALU BIROBUL" vs
"Palu Birobul" vs "PALU  BIROBUL" tidak dianggap sebagai data yang beda.
"""
import io
import os
import openpyxl
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file, current_app
from flask_login import login_required, current_user

from ...extensions import db
from ...models import (
    DeviceType, Location, Device, ModuleType, Module, ModulePosition,
    SlotDefinition, DataImport, ModuleRequest, RequestApproval, ModuleMovement
)
from ...utils.decorators import role_required
from ...utils.status_mapping import map_equipment_status

data_import_bp = Blueprint(
    "data_import", __name__, url_prefix="/import", template_folder="../../templates/data_import"
)

REQUIRED_COLUMNS = ["NE", "Location", "Mnemonic", "Slot", "Serial Number"]


def _is_api_request():
    return (
        request.headers.get("Accept") == "application/json"
        or request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or request.args.get("format") == "json"
    )


def _respond_error(msg, status_code=400):
    if _is_api_request():
        return jsonify({"success": False, "error": msg}), status_code
    flash(msg, "error")
    return redirect(url_for("data_import.index"))


def _read_column(row, col_index, col_name):
    idx = col_index.get(col_name)
    if idx is None or idx >= len(row):
        return None
    val = row[idx]
    if val is None:
        return None
    return str(val).strip()


def _normalize_key(value):
    """
    Rapikan teks untuk keperluan PENCOCOKAN saja (bukan buat disimpan):
    hilangkan spasi ganda, jadikan huruf besar semua. Ini supaya
    "PALU BIROBUL", "Palu Birobul", "PALU  BIROBUL" (spasi ganda)
    dianggap SATU lokasi yang sama, bukan 3 lokasi terpisah.
    """
    if not value:
        return ""
    return " ".join(value.split()).upper()


@data_import_bp.route("/", methods=["GET", "POST"])
@login_required
@role_required("admin", "karyawan_tif")
def index():
    if request.method == "POST":
        file = request.files.get("file")
        device_type_id = request.form.get("device_type_id")

        if not file or file.filename == "":
            return _respond_error("Pilih file Excel terlebih dahulu.", 400)

        if not device_type_id:
            return _respond_error("Device Type tujuan wajib dipilih.", 400)

        file_bytes = file.read()
        if not file_bytes:
            return _respond_error("File kosong.", 400)

        # Simpan file Excel asli di server
        upload_folder = os.path.join(current_app.instance_path, "uploads", "imports")
        os.makedirs(upload_folder, exist_ok=True)
        from datetime import datetime
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = os.path.basename(file.filename)
        saved_filename = f"{timestamp_str}_{safe_name}"
        saved_path = os.path.abspath(os.path.join(upload_folder, saved_filename))
        try:
            with open(saved_path, "wb") as f_out:
                f_out.write(file_bytes)
        except Exception as e:
            current_app.logger.error(f"Gagal menyimpan file Excel: {e}")
            return _respond_error("Gagal menyimpan file Excel di server.", 500)

        try:
            workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            sheet = workbook.active
        except Exception:
            if os.path.exists(saved_path):
                os.remove(saved_path)
            return _respond_error("File tidak bisa dibaca. Pastikan formatnya .xlsx.", 400)

        # Pilih sheet: utamakan 'Gabungan Palu' jika ada, selain itu sheet aktif
        if "Gabungan Palu" in workbook.sheetnames:
            sheet = workbook["Gabungan Palu"]
        else:
            sheet = workbook.active

        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            return _respond_error("File kosong.", 400)

        header = [str(c).strip() if c is not None else "" for c in rows[0]]
        header_map = {col.upper(): idx for idx, col in enumerate(header) if col}

        def _get_field(row, *aliases):
            for a in aliases:
                idx = header_map.get(a.upper())
                if idx is not None and idx < len(row):
                    val = row[idx]
                    if val is not None:
                        s = str(val).strip()
                        if s:
                            return s, val
            return "", None

        # Validasi kolom minimum
        has_ne = any(a.upper() in header_map for a in ["NE", "NAMA PERANGKAT", "NAMA PERANGKAT/NE"])
        has_type = any(a.upper() in header_map for a in ["UNIT TYPE", "MNEMONIC", "JENIS MODUL", "TIPE MODUL"])
        has_sn = any(a.upper() in header_map for a in ["SERIAL NUMBER", "SN", "SERIAL_NUMBER"])

        if not (has_ne and has_type and has_sn):
            return _respond_error("Kolom wajib tidak ditemukan di file. Pastikan terdapat kolom NE, Unit Type, dan Serial Number.", 400)

        from datetime import datetime
        jumlah_data = 0
        jumlah_berhasil = 0
        jumlah_gagal = 0

        # Inisialisasi record DataImport agar import_id tersedia untuk data yang diimport
        data_import = DataImport(
            user_id=current_user.user_id,
            nama_file=file.filename,
            file_path=saved_path,
            jenis_data="module_excel",
            jumlah_data=0,
            jumlah_berhasil=0,
            jumlah_gagal=0,
            status="proses",
        )
        db.session.add(data_import)
        db.session.flush()

        # Preload data & cache
        locations_cache = {_normalize_key(l.nama_lokasi): l for l in Location.query.all()}
        
        # Pastikan lokasi STO PALU 1 dan STO PALU 2 tersedia
        sto_palu1 = locations_cache.get(_normalize_key("STO PALU 1"))
        if not sto_palu1:
            sto_palu1 = Location.query.filter(
                (Location.nama_lokasi == "STO PALU 1") | (Location.nama_lokasi == "PALU BIROBULI") | (Location.nama_lokasi == "PALU1")
            ).first()
            if sto_palu1:
                sto_palu1.nama_lokasi = "STO PALU 1"
                sto_palu1.district = "PALU"
            else:
                sto_palu1 = Location(nama_lokasi="STO PALU 1", district="PALU")
                db.session.add(sto_palu1)
            db.session.flush()
            locations_cache[_normalize_key("STO PALU 1")] = sto_palu1

        sto_palu2 = locations_cache.get(_normalize_key("STO PALU 2"))
        if not sto_palu2:
            sto_palu2 = Location.query.filter(
                (Location.nama_lokasi == "STO PALU 2") | (Location.nama_lokasi == "PALU 2")
            ).first()
            if sto_palu2:
                sto_palu2.nama_lokasi = "STO PALU 2"
                sto_palu2.district = "PALU"
            else:
                sto_palu2 = Location(nama_lokasi="STO PALU 2", district="PALU")
                db.session.add(sto_palu2)
            db.session.flush()
            locations_cache[_normalize_key("STO PALU 2")] = sto_palu2

        module_type_cache = {_normalize_key(mt.nama_tipe): mt for mt in ModuleType.query.all()}
        module_cache = {_normalize_key(m.serial_number): m for m in Module.query.all()}
        device_cache = {d.hostname: d for d in Device.query.all()}

        for row in rows[1:]:
            if row is None or all(c is None for c in row):
                continue
            jumlah_data += 1

            ne, _ = _get_field(row, "NE", "Nama Perangkat", "Nama Perangkat/NE")
            unit_type, _ = _get_field(row, "Unit Type", "Mnemonic", "Jenis Modul", "Tipe Modul")
            shelf, _ = _get_field(row, "Shelf")
            slot, _ = _get_field(row, "Slot")
            port, _ = _get_field(row, "Port")
            part_no, _ = _get_field(row, "Unit Part Number", "Part Number", "Part_Number")
            sn, _ = _get_field(row, "Serial Number", "SN", "Serial_Number")
            company, _ = _get_field(row, "Company", "Vendor")
            equipment_state, _ = _get_field(row, "EquipmentServiceState", "Status")
            _, raw_date = _get_field(row, "Date (DD/MM/YYYY)", "Date", "Tanggal")

            if not ne or not unit_type or not sn:
                jumlah_gagal += 1
                continue

            # Format slot, port, shelf
            if slot.endswith(".0"):
                slot = slot[:-2]
            if port.endswith(".0"):
                port = port[:-2]
            if shelf.endswith(".0"):
                shelf = shelf[:-2]

            # Format tanggal DD/MM/YYYY
            date_str = ""
            if isinstance(raw_date, datetime):
                date_str = raw_date.strftime("%d/%m/%Y")
            elif raw_date is not None:
                d_val = str(raw_date).strip()
                try:
                    dt = datetime.strptime(d_val[:10], "%Y-%m-%d")
                    date_str = dt.strftime("%d/%m/%Y")
                except Exception:
                    date_str = d_val

            # Pemetaan Lokasi
            ne_upper = ne.upper()
            if "PAL11" in ne_upper:
                location = sto_palu1
            elif "PAL211" in ne_upper:
                location = sto_palu2
            else:
                loc_name, _ = _get_field(row, "Location", "Lokasi")
                loc_key = _normalize_key(loc_name)
                location = locations_cache.get(loc_key)
                if not location and loc_name:
                    location = Location(nama_lokasi=loc_name, district=loc_name, import_id=data_import.import_id)
                    db.session.add(location)
                    db.session.flush()
                    locations_cache[loc_key] = location
                elif not location:
                    location = sto_palu1

            # Pemetaan Perangkat
            device = device_cache.get(ne)
            if not device:
                device = Device.query.filter_by(hostname=ne).first()
                if not device:
                    device = Device(
                        device_type_id=device_type_id,
                        location_id=location.location_id,
                        nama_perangkat=ne,
                        hostname=ne,
                        status="aktif",
                        import_id=data_import.import_id,
                    )
                    db.session.add(device)
                    db.session.flush()
                device_cache[ne] = device
            else:
                if device.location_id != location.location_id:
                    device.location_id = location.location_id
                if device_type_id and str(device.device_type_id) != str(device_type_id):
                    device.device_type_id = device_type_id

            # Pemetaan Tipe Modul
            mt_key = _normalize_key(unit_type)
            module_type = module_type_cache.get(mt_key)
            if not module_type:
                module_type = ModuleType(nama_tipe=unit_type, vendor=company or "Nokia")
                db.session.add(module_type)
                db.session.flush()
                module_type_cache[mt_key] = module_type

            # Kondisi modul
            kondisi = map_equipment_status(equipment_state) if equipment_state else "AKTIF"

            # Pemetaan Modul Fisik (Serial Number unik)
            sn_key = _normalize_key(sn)
            module = module_cache.get(sn_key)
            if not module:
                module = Module.query.filter_by(serial_number=sn).first()
                if not module:
                    module = Module(
                        module_type_id=module_type.module_type_id,
                        serial_number=sn,
                        unit_part_number=part_no,
                        original_date=date_str,
                        kondisi=kondisi,
                        import_id=data_import.import_id,
                    )
                    db.session.add(module)
                    db.session.flush()
                else:
                    module.module_type_id = module_type.module_type_id
                    if part_no:
                        module.unit_part_number = part_no
                    if date_str:
                        module.original_date = date_str
                    module.kondisi = kondisi
                    if not module.import_id:
                        module.import_id = data_import.import_id
                module_cache[sn_key] = module
            else:
                module.module_type_id = module_type.module_type_id
                if part_no:
                    module.unit_part_number = part_no
                if date_str:
                    module.original_date = date_str
                module.kondisi = kondisi
                if not module.import_id:
                    module.import_id = data_import.import_id

            # Pemetaan Slot Definition
            slot_label = slot if slot and slot.upper() != "N/A" else "N/A"
            slot_def = SlotDefinition.query.filter_by(
                device_type_id=device_type_id, nomor_slot=slot_label
            ).first()
            if not slot_def:
                slot_def = SlotDefinition(device_type_id=device_type_id, nomor_slot=slot_label)
                db.session.add(slot_def)
                db.session.flush()

            # Pemetaan Posisi Modul (membedakan port jika ada)
            pos_query = ModulePosition.query.filter_by(
                module_id=module.modul_id,
                device_id=device.device_id,
                slot_definition_id=slot_def.slot_definition_id,
            )
            if port:
                pos_query = pos_query.filter_by(port=port)

            existing_position = pos_query.first()
            if not existing_position:
                position = ModulePosition(
                    module_id=module.modul_id,
                    device_id=device.device_id,
                    slot_definition_id=slot_def.slot_definition_id,
                    shelf=shelf,
                    port=port,
                    status="aktif",
                )
                db.session.add(position)
            else:
                existing_position.shelf = shelf
                existing_position.port = port
                existing_position.status = "aktif"

            jumlah_berhasil += 1

        data_import.jumlah_data = jumlah_data
        data_import.jumlah_berhasil = jumlah_berhasil
        data_import.jumlah_gagal = jumlah_gagal
        data_import.status = "selesai"
        db.session.commit()

        success_msg = (
            f"Import selesai: {jumlah_berhasil} berhasil, {jumlah_gagal} gagal, dari total {jumlah_data} baris."
        )
        if _is_api_request():
            return jsonify({
                "success": True,
                "message": success_msg,
                "data": {
                    "import_id": data_import.import_id,
                    "nama_file": file.filename,
                    "jenis_data": "module_excel",
                    "jumlah_data": jumlah_data,
                    "jumlah_berhasil": jumlah_berhasil,
                    "jumlah_gagal": jumlah_gagal,
                    "status": "selesai",
                    "created_at": data_import.created_at.strftime("%d %b %Y %H:%M") if data_import.created_at else "-",
                },
            })

        flash(success_msg, "success")
        return redirect(url_for("data_import.index"))

    all_types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    imports = DataImport.query.order_by(DataImport.created_at.desc()).all()

    if _is_api_request():
        return jsonify({
            "success": True,
            "device_types": [
                {
                    "device_type_id": t.device_type_id,
                    "nama_tipe": t.nama_tipe,
                    "vendor": t.vendor or "",
                    "deskripsi": t.deskripsi or "",
                }
                for t in all_types
            ],
            "imports": [
                {
                    "import_id": imp.import_id,
                    "nama_file": imp.nama_file,
                    "jenis_data": imp.jenis_data or "module_excel",
                    "jumlah_data": imp.jumlah_data or 0,
                    "jumlah_berhasil": imp.jumlah_berhasil or 0,
                    "jumlah_gagal": imp.jumlah_gagal or 0,
                    "status": imp.status or "selesai",
                    "created_at": imp.created_at.strftime("%d %b %Y %H:%M") if imp.created_at else "-",
                    "created_at_iso": imp.created_at.isoformat() if imp.created_at else None,
                    "download_url": f"/import/{imp.import_id}/download",
                }
                for imp in imports
            ],
        })

    react_template_path = os.path.join(current_app.root_path, "templates", "react_index.html")
    if os.path.exists(react_template_path) and not request.args.get("legacy"):
        return render_template("react_index.html", current_user=current_user)

    return render_template("data_import/index.html", all_types=all_types, imports=imports)


@data_import_bp.route("/<int:import_id>/download", methods=["GET"])
@login_required
@role_required("admin", "karyawan_tif")
def download_import_file(import_id):
    item = DataImport.query.get_or_404(import_id)
    file_path = item.file_path

    abs_file_path = None
    if file_path:
        if os.path.isabs(file_path) and os.path.exists(file_path):
            abs_file_path = file_path
        else:
            for base in [current_app.instance_path, os.path.dirname(current_app.instance_path), current_app.root_path]:
                cand = os.path.abspath(os.path.join(base, file_path))
                if os.path.exists(cand):
                    abs_file_path = cand
                    break

    if not abs_file_path:
        upload_folder = os.path.join(current_app.instance_path, "uploads", "imports")
        if os.path.exists(upload_folder):
            for fname in os.listdir(upload_folder):
                if fname.endswith(item.nama_file) or fname.startswith(f"{item.import_id}_"):
                    potential_path = os.path.abspath(os.path.join(upload_folder, fname))
                    if os.path.exists(potential_path):
                        abs_file_path = potential_path
                        item.file_path = abs_file_path
                        db.session.commit()
                        break

    if not abs_file_path or not os.path.exists(abs_file_path):
        return _respond_error(f"File '{item.nama_file}' tidak ditemukan di server.", 404)

    return send_file(
        abs_file_path,
        as_attachment=True,
        download_name=item.nama_file or f"import_{item.import_id}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@data_import_bp.route("/<int:import_id>", methods=["DELETE"])
@login_required
@role_required("admin", "karyawan_tif")
def delete_import(import_id):
    item = DataImport.query.get_or_404(import_id)
    nama = item.nama_file

    try:
        # 1. Hapus Modul yang berasal dari import ini beserta posisi, permohonan, dan pergerakannya
        modules_to_delete = Module.query.filter_by(import_id=import_id).all()
        modul_ids = [m.modul_id for m in modules_to_delete]

        if modul_ids:
            # Hapus posisi modul
            ModulePosition.query.filter(ModulePosition.module_id.in_(modul_ids)).delete(synchronize_session=False)

            # Hapus request modul dan approvals terkait
            requests = ModuleRequest.query.filter(ModuleRequest.module_id.in_(modul_ids)).all()
            req_ids = [r.request_id for r in requests]
            if req_ids:
                RequestApproval.query.filter(RequestApproval.request_id.in_(req_ids)).delete(synchronize_session=False)
                ModuleRequest.query.filter(ModuleRequest.request_id.in_(req_ids)).delete(synchronize_session=False)

            # Hapus histori pergerakan modul
            ModuleMovement.query.filter(ModuleMovement.module_id.in_(modul_ids)).delete(synchronize_session=False)

            # Hapus data modul fisik
            Module.query.filter(Module.modul_id.in_(modul_ids)).delete(synchronize_session=False)

        # 2. Hapus Perangkat yang dibuat oleh import ini JIKA tidak memiliki modul/posisi lain yang tersisa
        devices_to_check = Device.query.filter_by(import_id=import_id).all()
        for dev in devices_to_check:
            remaining_positions = ModulePosition.query.filter_by(device_id=dev.device_id).count()
            remaining_requests = ModuleRequest.query.filter(
                (ModuleRequest.from_device_id == dev.device_id) | (ModuleRequest.to_device_id == dev.device_id)
            ).count()
            remaining_movements = ModuleMovement.query.filter(
                (ModuleMovement.from_device_id == dev.device_id) | (ModuleMovement.to_device_id == dev.device_id)
            ).count()

            if remaining_positions == 0 and remaining_requests == 0 and remaining_movements == 0:
                db.session.delete(dev)

        # 3. Hapus Lokasi khusus yang dibuat oleh import ini JIKA tidak ada perangkat lagi yang menggunakannya
        locations_to_check = Location.query.filter_by(import_id=import_id).all()
        for loc in locations_to_check:
            norm = _normalize_key(loc.nama_lokasi)
            if "STO PALU 1" in norm or "STO PALU 2" in norm or "PALU" in norm:
                continue
            if Device.query.filter_by(location_id=loc.location_id).count() == 0:
                db.session.delete(loc)

        # 4. Hapus file Excel asli di server
        if item.file_path:
            abs_del_path = os.path.abspath(item.file_path) if not os.path.isabs(item.file_path) else item.file_path
            if os.path.exists(abs_del_path):
                import gc
                gc.collect()
                deleted = False
                for _ in range(3):
                    try:
                        os.remove(abs_del_path)
                        deleted = True
                        break
                    except Exception:
                        import time
                        time.sleep(0.1)
                if not deleted:
                    current_app.logger.warning(f"Gagal menghapus file fisik {abs_del_path}")

        # 5. Hapus catatan histori import
        db.session.delete(item)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Histori import '{nama}' beserta seluruh data terkait di database berhasil dihapus."
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Gagal menghapus histori import {import_id}: {e}")
        return jsonify({
            "success": False,
            "error": f"Gagal menghapus histori import: {str(e)}"
        }), 500


@data_import_bp.route("/template", methods=["GET"])
@login_required
@role_required("admin", "karyawan_tif")
def download_template():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gabungan Palu"
    headers = [
        "NE",
        "Location",
        "Unit Type",
        "Shelf",
        "Slot",
        "Port",
        "Unit Part Number",
        "Serial Number",
        "Company",
        "EquipmentServiceState",
        "Date",
    ]
    ws.append(headers)
    ws.append([
        "WN-24X-SUL-PAL11",
        "STO PALU 1",
        "E100G",
        "1",
        "1",
        "1",
        "3HE00027AA",
        "NS12345678",
        "Nokia",
        "IS-NR",
        "20/10/2026",
    ])
    ws.append([
        "WN-24X-SUL-PAL211",
        "STO PALU 2",
        "E100G",
        "1",
        "2",
        "1",
        "3HE00027AA",
        "NS87654321",
        "Nokia",
        "IS-NR",
        "20/10/2026",
    ])
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return send_file(
        out,
        as_attachment=True,
        download_name="Template_Import_Modul.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
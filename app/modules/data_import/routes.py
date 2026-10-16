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
import openpyxl
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

from ...extensions import db
from ...models import DeviceType, Location, Device, ModuleType, Module, ModulePosition, SlotDefinition, DataImport
from ...utils.decorators import role_required
from ...utils.status_mapping import map_equipment_status

data_import_bp = Blueprint(
    "data_import", __name__, url_prefix="/import", template_folder="../../templates/data_import"
)

REQUIRED_COLUMNS = ["NE", "Location", "Mnemonic", "Slot", "Serial Number"]


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
            flash("Pilih file Excel terlebih dahulu.", "error")
            return redirect(url_for("data_import.index"))

        if not device_type_id:
            flash("Device Type tujuan wajib dipilih.", "error")
            return redirect(url_for("data_import.index"))

        try:
            workbook = openpyxl.load_workbook(file, data_only=True)
            sheet = workbook.active
        except Exception:
            flash("File tidak bisa dibaca. Pastikan formatnya .xlsx.", "error")
            return redirect(url_for("data_import.index"))

        # Pilih sheet: utamakan 'Gabungan Palu' jika ada, selain itu sheet aktif
        if "Gabungan Palu" in workbook.sheetnames:
            sheet = workbook["Gabungan Palu"]
        else:
            sheet = workbook.active

        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            flash("File kosong.", "error")
            return redirect(url_for("data_import.index"))

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
            flash("Kolom wajib tidak ditemukan di file. Pastikan terdapat kolom NE, Unit Type, dan Serial Number.", "error")
            return redirect(url_for("data_import.index"))

        from datetime import datetime
        jumlah_data = 0
        jumlah_berhasil = 0
        jumlah_gagal = 0

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
                    location = Location(nama_lokasi=loc_name, district=loc_name)
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
                module_cache[sn_key] = module
            else:
                module.module_type_id = module_type.module_type_id
                if part_no:
                    module.unit_part_number = part_no
                if date_str:
                    module.original_date = date_str
                module.kondisi = kondisi

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

        data_import = DataImport(
            user_id=current_user.user_id,
            nama_file=file.filename,
            jenis_data="module_excel",
            jumlah_data=jumlah_data,
            jumlah_berhasil=jumlah_berhasil,
            jumlah_gagal=jumlah_gagal,
            status="selesai",
        )
        db.session.add(data_import)
        db.session.commit()

        flash(
            f"Import selesai: {jumlah_berhasil} berhasil, {jumlah_gagal} gagal, dari total {jumlah_data} baris.",
            "success",
        )
        return redirect(url_for("data_import.index"))

    all_types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    imports = DataImport.query.order_by(DataImport.created_at.desc()).all()
    return render_template("data_import/index.html", all_types=all_types, imports=imports)
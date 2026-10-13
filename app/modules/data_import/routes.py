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

        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            flash("File kosong.", "error")
            return redirect(url_for("data_import.index"))

        header = [str(c).strip() if c is not None else "" for c in rows[0]]
        col_index = {name: i for i, name in enumerate(header)}

        missing = [c for c in REQUIRED_COLUMNS if c not in col_index]
        if missing:
            flash(f"Kolom wajib tidak ditemukan di file: {', '.join(missing)}.", "error")
            return redirect(url_for("data_import.index"))

        jumlah_data = 0
        jumlah_berhasil = 0
        jumlah_gagal = 0

        # Preload semua data yang sudah ada, dengan KEY ternormalisasi -- supaya
        # "Palu Birobul" dan "PALU BIROBUL" dianggap sama, dan supaya tidak
        # query database berulang-ulang untuk tiap baris (lebih cepat juga).
        location_cache = {_normalize_key(l.nama_lokasi): l for l in Location.query.all()}
        module_type_cache = {_normalize_key(mt.nama_tipe): mt for mt in ModuleType.query.all()}
        module_cache = {_normalize_key(m.serial_number): m for m in Module.query.all()}
        device_cache = {}  # (NE ternormalisasi, location_id) -> Device, diisi sambil jalan

        for row in rows[1:]:
            if row is None or all(c is None for c in row):
                continue
            jumlah_data += 1

            ne = _read_column(row, col_index, "NE")
            location_name = _read_column(row, col_index, "Location")
            mnemonic = _read_column(row, col_index, "Mnemonic")
            slot = _read_column(row, col_index, "Slot")
            serial_number = _read_column(row, col_index, "Serial Number")
            company = _read_column(row, col_index, "Company")
            equipment_state = _read_column(row, col_index, "EquipmentServiceState")

            if not ne or not mnemonic or not serial_number or not location_name:
                jumlah_gagal += 1
                continue

            loc_key = _normalize_key(location_name)
            location = location_cache.get(loc_key)
            if not location:
                # District tidak ada kolom terpisah di Excel -- kolom "Location" di data ini
                # merepresentasikan nama kabupaten/wilayah (district), jadi diisi sama.
                location = Location(nama_lokasi=location_name, district=location_name)
                db.session.add(location)
                db.session.flush()
                location_cache[loc_key] = location

            device_key = (_normalize_key(ne), location.location_id)
            device = device_cache.get(device_key)
            if not device:
                device = Device.query.filter_by(hostname=ne, location_id=location.location_id).first()
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
                device_cache[device_key] = device

            mt_key = _normalize_key(mnemonic)
            module_type = module_type_cache.get(mt_key)
            if not module_type:
                module_type = ModuleType(nama_tipe=mnemonic, vendor=company)
                db.session.add(module_type)
                db.session.flush()
                module_type_cache[mt_key] = module_type

            kondisi = map_equipment_status(equipment_state)
            sn_key = _normalize_key(serial_number)
            module = module_cache.get(sn_key)
            if not module:
                module = Module(module_type_id=module_type.module_type_id, serial_number=serial_number, kondisi=kondisi)
                db.session.add(module)
                db.session.flush()
                module_cache[sn_key] = module
            else:
                module.kondisi = kondisi

            slot_label = slot if slot and slot.upper() != "N/A" else "N/A"
            slot_def = SlotDefinition.query.filter_by(
                device_type_id=device_type_id, nomor_slot=slot_label
            ).first()
            if not slot_def:
                slot_def = SlotDefinition(device_type_id=device_type_id, nomor_slot=slot_label)
                db.session.add(slot_def)
                db.session.flush()

            existing_position = ModulePosition.query.filter_by(
                module_id=module.modul_id,
                device_id=device.device_id,
                slot_definition_id=slot_def.slot_definition_id,
            ).first()
            if not existing_position:
                position = ModulePosition(
                    module_id=module.modul_id,
                    device_id=device.device_id,
                    slot_definition_id=slot_def.slot_definition_id,
                    status="aktif",
                )
                db.session.add(position)

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
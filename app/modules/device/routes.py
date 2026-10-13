"""
Modul Device -- FR-2 (Device Type & Slot Definition) dan FR-3 (Devices & Locations).

Rute yang tersedia:
  GET/POST /device/types                          -> Admin kelola Device Type
  GET/POST /device/types/<id>/slots                -> Admin kelola Slot Definition per Device Type
  GET/POST /device/locations                       -> Admin/Karyawan TIF kelola Location
  GET/POST /device/devices                         -> Admin/Karyawan TIF kelola Devices, dengan filter (FR-3.2)
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required

from ...extensions import db
from ...models import DeviceType, SlotDefinition, Location, Device
from ...utils.decorators import role_required

device_bp = Blueprint("device", __name__, url_prefix="/device", template_folder="../../templates/device")


# ---------------- Device Type (FR-2.1, khusus Admin) ----------------

@device_bp.route("/types", methods=["GET", "POST"])
@login_required
@role_required("admin")
def device_types():
    if request.method == "POST":
        nama_tipe = request.form.get("nama_tipe", "").strip()
        vendor = request.form.get("vendor", "").strip()
        deskripsi = request.form.get("deskripsi", "").strip()

        if not nama_tipe:
            flash("Nama tipe wajib diisi.", "error")
        else:
            dt = DeviceType(nama_tipe=nama_tipe, vendor=vendor, deskripsi=deskripsi)
            db.session.add(dt)
            db.session.commit()
            flash(f"Device Type '{nama_tipe}' berhasil ditambahkan.", "success")
        return redirect(url_for("device.device_types"))

    types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    return render_template("device/device_types.html", types=types)


# ---------------- Slot Definition (FR-2.2, khusus Admin) ----------------

@device_bp.route("/types/<int:device_type_id>/slots", methods=["GET", "POST"])
@login_required
@role_required("admin")
def slot_definitions(device_type_id):
    device_type = DeviceType.query.get_or_404(device_type_id)

    if request.method == "POST":
        nomor_slot = request.form.get("nomor_slot", "").strip()
        nama_slot = request.form.get("nama_slot", "").strip()
        posisi = request.form.get("posisi", "").strip()
        keterangan = request.form.get("keterangan", "").strip()

        if not nomor_slot:
            flash("Nomor slot wajib diisi.", "error")
        else:
            slot = SlotDefinition(
                device_type_id=device_type_id,
                nomor_slot=nomor_slot,
                nama_slot=nama_slot,
                posisi=posisi,
                keterangan=keterangan,
            )
            db.session.add(slot)
            db.session.commit()
            flash(f"Slot '{nomor_slot}' berhasil ditambahkan ke {device_type.nama_tipe}.", "success")
        return redirect(url_for("device.slot_definitions", device_type_id=device_type_id))

    slots = (
        SlotDefinition.query.filter_by(device_type_id=device_type_id)
        .order_by(SlotDefinition.nomor_slot)
        .all()
    )
    return render_template("device/slot_definitions.html", device_type=device_type, slots=slots)


# ---------------- Locations (FR-3.1, Admin & Karyawan TIF) ----------------

@device_bp.route("/locations", methods=["GET", "POST"])
@login_required
@role_required("admin", "karyawan_tif")
def locations():
    if request.method == "POST":
        nama_lokasi = request.form.get("nama_lokasi", "").strip()
        alamat = request.form.get("alamat", "").strip()
        district = request.form.get("district", "").strip()
        area = request.form.get("area", "").strip()
        latitude_raw = request.form.get("latitude", "").strip()
        longitude_raw = request.form.get("longitude", "").strip()

        if not nama_lokasi or not district:
            flash("Nama lokasi dan district wajib diisi.", "error")
            return redirect(url_for("device.locations"))

        try:
            latitude = float(latitude_raw) if latitude_raw else None
            longitude = float(longitude_raw) if longitude_raw else None
        except ValueError:
            flash("Latitude/longitude harus berupa angka.", "error")
            return redirect(url_for("device.locations"))

        loc = Location(
            nama_lokasi=nama_lokasi,
            alamat=alamat,
            district=district,
            area=area,
            latitude=latitude,
            longitude=longitude,
        )
        db.session.add(loc)
        db.session.commit()
        flash(f"Lokasi '{nama_lokasi}' berhasil ditambahkan.", "success")
        return redirect(url_for("device.locations"))

    locs = Location.query.order_by(Location.nama_lokasi).all()
    return render_template("device/locations.html", locations=locs)


# ---------------- Devices (FR-3.1, FR-3.2, Admin & Karyawan TIF) ----------------

@device_bp.route("/devices", methods=["GET", "POST"])
@login_required
@role_required("admin", "karyawan_tif")
def devices():
    if request.method == "POST":
        device_type_id = request.form.get("device_type_id")
        location_id = request.form.get("location_id")
        nama_perangkat = request.form.get("nama_perangkat", "").strip()
        serial_number = request.form.get("serial_number", "").strip()
        hostname = request.form.get("hostname", "").strip()
        status = request.form.get("status", "").strip() or "aktif"

        if not device_type_id or not location_id or not nama_perangkat:
            flash("Tipe perangkat, lokasi, dan nama perangkat wajib diisi.", "error")
            return redirect(url_for("device.devices"))

        dev = Device(
            device_type_id=int(device_type_id),
            location_id=int(location_id),
            nama_perangkat=nama_perangkat,
            serial_number=serial_number,
            hostname=hostname,
            status=status,
        )
        db.session.add(dev)
        db.session.commit()
        flash(f"Perangkat '{nama_perangkat}' berhasil ditambahkan.", "success")
        return redirect(url_for("device.devices"))

    # FR-3.2: filter berdasarkan lokasi dan device type
    location_filter = request.args.get("location_id", type=int)
    device_type_filter = request.args.get("device_type_id", type=int)

    query = Device.query
    if location_filter:
        query = query.filter_by(location_id=location_filter)
    if device_type_filter:
        query = query.filter_by(device_type_id=device_type_filter)

    devices_list = query.order_by(Device.nama_perangkat).all()
    all_types = DeviceType.query.order_by(DeviceType.nama_tipe).all()
    all_locations = Location.query.order_by(Location.nama_lokasi).all()

    return render_template(
        "device/devices.html",
        devices=devices_list,
        all_types=all_types,
        all_locations=all_locations,
        selected_location=location_filter,
        selected_type=device_type_filter,
    )
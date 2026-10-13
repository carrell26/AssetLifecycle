"""
Modul Module Request -- FR-4 (Pengajuan & Posisi Modul), FR-5 (Alur Approval),
dan FR-6 (Hash Chain via audit_logs, terhubung otomatis saat request disetujui).

Rute yang tersedia:
  GET/POST /modules/new           -> ajukan pemasangan/perpindahan/pelepasan modul
  GET      /modules/requests      -> daftar pengajuan (difilter sesuai role)
  POST     /modules/requests/<id>/approve  -> PJ/Admin menyetujui
  POST     /modules/requests/<id>/reject   -> PJ/Admin menolak
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

from ...extensions import db
from ...models import (
    Device, SlotDefinition, ModuleType, Module, ModulePosition,
    ModuleRequest, RequestApproval, ModuleMovement, User,
)
from ...utils.decorators import role_required
from ...utils.hashing import append_audit_log

module_request_bp = Blueprint(
    "module_request", __name__, url_prefix="/modules", template_folder="../../templates/module_request"
)


def _get_or_create_slot(device, nomor_slot):
    nomor_slot = nomor_slot.strip()
    slot_def = SlotDefinition.query.filter_by(
        device_type_id=device.device_type_id, nomor_slot=nomor_slot
    ).first()
    if not slot_def:
        slot_def = SlotDefinition(device_type_id=device.device_type_id, nomor_slot=nomor_slot)
        db.session.add(slot_def)
        db.session.flush()
    return slot_def


def _slot_is_occupied(device_id, slot_definition_id, exclude_module_id=None):
    """FR-4.3 / FR-9.1 (smart contract): cek apakah slot ini sudah ada modul AKTIF lain."""
    query = ModulePosition.query.filter_by(
        device_id=device_id, slot_definition_id=slot_definition_id, status="aktif"
    )
    if exclude_module_id is not None:
        query = query.filter(ModulePosition.module_id != exclude_module_id)
    return query.first() is not None


def _apply_approved_request(module_request, actor_user):
    jenis = module_request.jenis_perubahan

    if jenis in ("pasang", "pindah"):
        if _slot_is_occupied(
            module_request.to_device_id, module_request.to_slot_definition_id,
            exclude_module_id=module_request.module_id,
        ):
            return False, "Slot tujuan sudah ditempati modul aktif lain."

    if jenis in ("pindah", "lepas"):
        old_position = ModulePosition.query.filter_by(
            module_id=module_request.module_id,
            device_id=module_request.from_device_id,
            slot_definition_id=module_request.from_slot_definition_id,
            status="aktif",
        ).first()
        if old_position:
            old_position.status = "dilepas"

    if jenis in ("pasang", "pindah"):
        new_position = ModulePosition(
            module_id=module_request.module_id,
            device_id=module_request.to_device_id,
            slot_definition_id=module_request.to_slot_definition_id,
            status="aktif",
        )
        db.session.add(new_position)

    movement = ModuleMovement(
        module_id=module_request.module_id,
        user_id=module_request.requested_by,
        from_device_id=module_request.from_device_id,
        from_slot_definition_id=module_request.from_slot_definition_id,
        to_device_id=module_request.to_device_id,
        to_slot_definition_id=module_request.to_slot_definition_id,
        jenis_perubahan=jenis,
        keterangan=module_request.alasan,
    )
    db.session.add(movement)
    db.session.flush()

    append_audit_log(
        db,
        user_id=actor_user.user_id,
        aksi="APPROVE_MOVEMENT",
        table_name="module_movements",
        record_id=movement.movement_id,
        data_dict={
            "module_id": movement.module_id,
            "jenis_perubahan": movement.jenis_perubahan,
            "from_device_id": movement.from_device_id,
            "from_slot_definition_id": movement.from_slot_definition_id,
            "to_device_id": movement.to_device_id,
            "to_slot_definition_id": movement.to_slot_definition_id,
            "requested_by": module_request.requested_by,
            "approved_by": actor_user.user_id,
        },
    )

    return True, None


@module_request_bp.route("/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def new_request():
    if request.method == "POST":
        jenis = request.form.get("jenis_perubahan")
        alasan = request.form.get("alasan", "").strip()

        module_mode = request.form.get("module_mode")
        module = None

        if module_mode == "baru":
            module_type_id = request.form.get("module_type_id")
            serial_number = request.form.get("serial_number", "").strip()
            if not module_type_id or not serial_number:
                flash("Tipe modul dan Serial Number wajib diisi untuk modul baru.", "error")
                return redirect(url_for("module_request.new_request"))

            module = Module.query.filter_by(serial_number=serial_number).first()
            if not module:
                module = Module(module_type_id=module_type_id, serial_number=serial_number, kondisi="AKTIF")
                db.session.add(module)
                db.session.flush()
        else:
            module_id = request.form.get("module_id")
            if not module_id:
                flash("Pilih modul yang sudah ada.", "error")
                return redirect(url_for("module_request.new_request"))
            module = Module.query.get(module_id)
            if not module:
                flash("Modul tidak ditemukan.", "error")
                return redirect(url_for("module_request.new_request"))

        from_device_id = from_slot_def_id = to_device_id = to_slot_def_id = None

        if jenis in ("pindah", "lepas"):
            from_device_id = request.form.get("from_device_id")
            from_slot_raw = request.form.get("from_slot", "").strip()
            if not from_device_id or not from_slot_raw:
                flash("Perangkat & slot asal wajib diisi untuk perpindahan/pelepasan.", "error")
                return redirect(url_for("module_request.new_request"))
            from_device = Device.query.get(from_device_id)
            from_slot_def_id = _get_or_create_slot(from_device, from_slot_raw).slot_definition_id

        if jenis in ("pasang", "pindah"):
            to_device_id = request.form.get("to_device_id")
            to_slot_raw = request.form.get("to_slot", "").strip()
            if not to_device_id or not to_slot_raw:
                flash("Perangkat & slot tujuan wajib diisi untuk pemasangan/perpindahan.", "error")
                return redirect(url_for("module_request.new_request"))
            to_device = Device.query.get(to_device_id)
            to_slot_def_id = _get_or_create_slot(to_device, to_slot_raw).slot_definition_id

        if to_device_id and _slot_is_occupied(to_device_id, to_slot_def_id, exclude_module_id=module.modul_id):
            flash("Slot tujuan sudah ditempati modul aktif lain. Pilih slot lain.", "error")
            return redirect(url_for("module_request.new_request"))

        auto_approve = current_user.role in ("admin", "karyawan_tif")
        status = "AUTO_APPROVED" if auto_approve else "PENDING"

        module_request = ModuleRequest(
            module_id=module.modul_id,
            requested_by=current_user.user_id,
            jenis_perubahan=jenis,
            from_device_id=from_device_id,
            from_slot_definition_id=from_slot_def_id,
            to_device_id=to_device_id,
            to_slot_definition_id=to_slot_def_id,
            alasan=alasan,
            status=status,
        )
        db.session.add(module_request)
        db.session.flush()

        if auto_approve:
            success, error = _apply_approved_request(module_request, current_user)
            if not success:
                db.session.rollback()
                flash(f"Pengajuan ditolak sistem: {error}", "error")
                return redirect(url_for("module_request.new_request"))
            db.session.commit()
            flash("Pengajuan otomatis disetujui dan langsung tercatat.", "success")
        else:
            db.session.commit()
            flash("Pengajuan berhasil dikirim, menunggu persetujuan PJ district kamu.", "success")

        return redirect(url_for("module_request.list_requests"))

    devices = Device.query.order_by(Device.nama_perangkat).all()
    module_types = ModuleType.query.order_by(ModuleType.nama_tipe).all()
    existing_modules = Module.query.order_by(Module.serial_number).all()
    return render_template(
        "module_request/new_request.html",
        devices=devices, module_types=module_types, existing_modules=existing_modules,
    )


@module_request_bp.route("/requests")
@login_required
@role_required("admin", "karyawan_tif", "teknisi")
def list_requests():
    if current_user.role == "teknisi":
        requests_list = (
            ModuleRequest.query.filter_by(requested_by=current_user.user_id)
            .order_by(ModuleRequest.created_at.desc())
            .all()
        )
    elif current_user.role == "karyawan_tif":
        pending_district_ids = [
            u.user_id for u in User.query.filter_by(district=current_user.district, role="teknisi").all()
        ]
        requests_list = (
            ModuleRequest.query.filter(
                (ModuleRequest.requested_by == current_user.user_id)
                | (ModuleRequest.requested_by.in_(pending_district_ids))
            )
            .order_by(ModuleRequest.created_at.desc())
            .all()
        )
    else:
        requests_list = ModuleRequest.query.order_by(ModuleRequest.created_at.desc()).all()

    can_approve = current_user.role == "admin" or (current_user.role == "karyawan_tif" and current_user.is_pj)
    return render_template("module_request/list_requests.html", requests=requests_list, can_approve=can_approve)


@module_request_bp.route("/requests/<int:request_id>/approve", methods=["POST"])
@login_required
@role_required("admin", "karyawan_tif")
def approve_request(request_id):
    if current_user.role == "karyawan_tif" and not current_user.is_pj:
        flash("Kamu bukan PJ, tidak bisa menyetujui pengajuan.", "error")
        return redirect(url_for("module_request.list_requests"))

    module_request = ModuleRequest.query.get_or_404(request_id)
    if module_request.status != "PENDING":
        flash("Pengajuan ini sudah diproses sebelumnya.", "error")
        return redirect(url_for("module_request.list_requests"))

    if current_user.role == "karyawan_tif":
        pemohon = User.query.get(module_request.requested_by)
        if pemohon.district != current_user.district:
            flash("Kamu hanya bisa menyetujui pengajuan dari district kamu sendiri.", "error")
            return redirect(url_for("module_request.list_requests"))

    success, error = _apply_approved_request(module_request, current_user)
    if not success:
        module_request.status = "REJECTED"
        approval = RequestApproval(
            request_id=module_request.request_id,
            approved_by=current_user.user_id,
            status="REJECTED",
            catatan=f"Ditolak otomatis oleh sistem: {error}",
        )
        db.session.add(approval)
        db.session.commit()
        flash(f"Pengajuan ditolak sistem saat approval: {error}", "error")
        return redirect(url_for("module_request.list_requests"))

    module_request.status = "APPROVED"
    approval = RequestApproval(
        request_id=module_request.request_id,
        approved_by=current_user.user_id,
        status="APPROVED",
    )
    db.session.add(approval)
    db.session.commit()
    flash("Pengajuan disetujui dan tercatat.", "success")
    return redirect(url_for("module_request.list_requests"))


@module_request_bp.route("/requests/<int:request_id>/reject", methods=["POST"])
@login_required
@role_required("admin", "karyawan_tif")
def reject_request(request_id):
    if current_user.role == "karyawan_tif" and not current_user.is_pj:
        flash("Kamu bukan PJ, tidak bisa menolak pengajuan.", "error")
        return redirect(url_for("module_request.list_requests"))

    module_request = ModuleRequest.query.get_or_404(request_id)
    if module_request.status != "PENDING":
        flash("Pengajuan ini sudah diproses sebelumnya.", "error")
        return redirect(url_for("module_request.list_requests"))

    catatan = request.form.get("catatan", "").strip()
    module_request.status = "REJECTED"
    approval = RequestApproval(
        request_id=module_request.request_id,
        approved_by=current_user.user_id,
        status="REJECTED",
        catatan=catatan,
    )
    db.session.add(approval)
    db.session.commit()
    flash("Pengajuan ditolak.", "success")
    return redirect(url_for("module_request.list_requests"))
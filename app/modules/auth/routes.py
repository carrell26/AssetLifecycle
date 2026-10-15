"""
Modul Auth -- FR-1 (Manajemen User & Autentikasi).

Rute yang tersedia:
  GET/POST /auth/login              -> login semua role
  GET      /auth/logout             -> logout
  GET/POST /auth/register           -> self-registration Teknisi (FR-1.2), status jadi 'pending'
  GET/POST /auth/register-teknisi   -> Karyawan TIF daftarkan Teknisi baru (FR-1.4), langsung 'aktif'
  GET/POST /auth/admin/register-karyawan  -> Admin daftarkan Karyawan TIF (FR-1.3)
  GET      /auth/admin/users        -> Admin lihat & kelola semua user (approve pending, toggle is_pj)
  POST     /auth/admin/users/<id>/approve  -> Admin approve akun Teknisi yang masih pending
  POST     /auth/admin/users/<id>/toggle-pj -> Admin tandai/lepas status PJ pada Karyawan TIF (FR-1.5)
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user

from ...extensions import db
from ...models import User
from ...utils.decorators import role_required

auth_bp = Blueprint("auth", __name__, url_prefix="/auth", template_folder="../../templates/auth")


@auth_bp.route("/login", methods=["GET"])
def login():
    """Serve React SPA untuk halaman login."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    return render_template("react_index.html")


@auth_bp.route("/admin-contact-api", methods=["GET"])
def admin_contact_api():
    """Mengembalikan data kontak admin resmi sistem untuk modal bantuan login."""
    admin = User.query.filter_by(role="admin", status="aktif").first()
    if not admin:
        admin = User.query.filter_by(role="admin").first()

    return jsonify(
        success=True,
        admin={
            "name": admin.name if admin else "Admin Asset",
            "email": admin.email if admin else "adminasset@gmail.com",
            "role": "Administrator Sistem",
        }
    )



@auth_bp.route("/login-api", methods=["POST"], endpoint="api_login")
def api_login():
    """API endpoint JSON untuk proses login dari React.
    Dipanggil sebagai: POST /auth/login-api
    Di-proxy React sebagai: POST /api/auth/login  (lihat vite.config.js)
    """
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify(success=False, message="Email atau password salah."), 401

    if user.status != "aktif":
        return jsonify(success=False, message="Akun kamu masih menunggu persetujuan Admin."), 403

    login_user(user, remember=data.get("remember", False))
    return jsonify(success=True, redirect="/")



@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Kamu sudah keluar.", "success")
    return redirect(url_for("auth.login"))


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Self-registration untuk Teknisi (FR-1.2) via React SPA."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))

    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        password = data.get("password") or ""
        confirm_password = data.get("confirm_password") or ""
        district = (data.get("district") or "").strip()
        is_json = request.is_json or request.headers.get("Content-Type") == "application/json"

        if not name or not email or not password or not district:
            if is_json:
                return jsonify(success=False, message="Semua kolom wajib diisi."), 400
            flash("Semua kolom wajib diisi.", "error")
            return render_template("react_index.html")

        if confirm_password and password != confirm_password:
            if is_json:
                return jsonify(success=False, message="Konfirmasi password tidak sesuai."), 400
            flash("Konfirmasi password tidak cocok.", "error")
            return render_template("react_index.html")

        if len(password) < 8:
            if is_json:
                return jsonify(success=False, message="Password minimal 8 karakter."), 400
            flash("Password minimal 8 karakter.", "error")
            return render_template("react_index.html")

        if User.query.filter_by(email=email).first():
            if is_json:
                return jsonify(success=False, message="Email sudah terdaftar. Silakan gunakan email lain atau masuk."), 400
            flash("Email sudah terdaftar.", "error")
            return render_template("react_index.html")

        user = User(
            name=name,
            email=email,
            role="teknisi",
            district=district,
            status="pending",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        if is_json:
            return jsonify(
                success=True,
                message="Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin sebelum dapat masuk.",
                redirect="/auth/login",
            )

        flash("Pendaftaran berhasil. Akun kamu menunggu persetujuan Admin sebelum bisa login.", "success")
        return redirect(url_for("auth.login"))

    return render_template("react_index.html")


@auth_bp.route("/register-api", methods=["POST"], endpoint="api_register")
def api_register():
    """API endpoint JSON untuk registrasi akun teknisi dari React."""
    data = request.get_json(silent=True) or request.form
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    district = (data.get("district") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""
    terms = data.get("terms")

    if not name or not email or not district or not password:
        return jsonify(success=False, message="Semua kolom wajib diisi."), 400

    if not terms:
        return jsonify(success=False, message="Anda harus menyetujui Syarat dan Ketentuan & Kebijakan Privasi."), 400

    if confirm_password and password != confirm_password:
        return jsonify(success=False, message="Konfirmasi password tidak sesuai."), 400

    if len(password) < 8:
        return jsonify(success=False, message="Password minimal 8 karakter."), 400

    if User.query.filter_by(email=email).first():
        return jsonify(success=False, message="Email sudah terdaftar. Silakan gunakan email lain atau masuk."), 400

    user = User(
        name=name,
        email=email,
        role="teknisi",
        district=district,
        status="pending",
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify(
        success=True,
        message="Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin sebelum dapat masuk.",
        redirect="/auth/login",
    )


@auth_bp.route("/register-teknisi", methods=["GET", "POST"])
@login_required
@role_required("karyawan_tif")
def register_teknisi():
    """Karyawan TIF daftarkan Teknisi baru dalam district yang sama (FR-1.4). Langsung aktif."""
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not name or not email or not password:
            flash("Semua kolom wajib diisi.", "error")
            return render_template("auth/register_teknisi.html")

        if User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "error")
            return render_template("auth/register_teknisi.html")

        user = User(
            name=name,
            email=email,
            role="teknisi",
            district=current_user.district,  # otomatis samakan district dengan Karyawan TIF yang mendaftarkan
            status="aktif",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash(f"Teknisi {name} berhasil didaftarkan untuk district {current_user.district}.", "success")
        return redirect(url_for("auth.register_teknisi"))

    return render_template("auth/register_teknisi.html")


@auth_bp.route("/admin/register-karyawan", methods=["GET", "POST"])
@login_required
@role_required("admin")
def register_karyawan():
    """Admin daftarkan akun Karyawan TIF baru (FR-1.3)."""
    from datetime import datetime, timezone
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        district = request.form.get("district", "").strip()

        if not name or not email or not password or not district:
            flash("Semua kolom wajib diisi.", "error")
            recent_users = User.query.filter_by(role="karyawan_tif").order_by(User.created_at.desc()).limit(10).all()
            return render_template("auth/register_karyawan.html", recent_users=recent_users)

        if User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "error")
            recent_users = User.query.filter_by(role="karyawan_tif").order_by(User.created_at.desc()).limit(10).all()
            return render_template("auth/register_karyawan.html", recent_users=recent_users)

        user = User(
            name=name,
            email=email,
            role="karyawan_tif",
            district=district,
            status="aktif",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash(f"Karyawan TIF {name} berhasil didaftarkan.", "success")
        return redirect(url_for("auth.register_karyawan"))

    recent_users = User.query.filter_by(role="karyawan_tif").order_by(User.created_at.desc()).limit(10).all()
    return render_template("auth/register_karyawan.html", recent_users=recent_users)


@auth_bp.route("/admin/users")
@login_required
@role_required("admin")
def manage_users():
    """Admin lihat semua user, approve yang pending, toggle status PJ (FR-1.5)."""
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template("auth/manage_users.html", users=users)


@auth_bp.route("/admin/users/<int:user_id>/approve", methods=["POST"])
@login_required
@role_required("admin")
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    user.status = "aktif"
    db.session.commit()
    flash(f"Akun {user.name} sudah diaktifkan.", "success")
    return redirect(url_for("auth.manage_users"))


@auth_bp.route("/admin/users/<int:user_id>/toggle-pj", methods=["POST"])
@login_required
@role_required("admin")
def toggle_pj(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != "karyawan_tif":
        flash("Status PJ hanya berlaku untuk Karyawan TIF.", "error")
        return redirect(url_for("auth.manage_users"))

    user.is_pj = not user.is_pj
    db.session.commit()
    status_text = "ditandai sebagai PJ" if user.is_pj else "dilepas status PJ-nya"
    flash(f"{user.name} {status_text}.", "success")
    return redirect(url_for("auth.manage_users"))
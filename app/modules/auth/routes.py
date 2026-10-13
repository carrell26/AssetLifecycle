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
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user

from ...extensions import db
from ...models import User
from ...utils.decorators import role_required

auth_bp = Blueprint("auth", __name__, url_prefix="/auth", template_folder="../../templates/auth")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("index"))

    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        user = User.query.filter_by(email=email).first()

        if user is None or not user.check_password(password):
            flash("Email atau password salah.", "error")
            return render_template("auth/login.html")

        if user.status != "aktif":
            flash("Akun kamu masih menunggu persetujuan Admin.", "error")
            return render_template("auth/login.html")

        login_user(user)
        flash(f"Selamat datang, {user.name}.", "success")
        return redirect(url_for("index"))

    return render_template("auth/login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Kamu sudah keluar.", "success")
    return redirect(url_for("auth.login"))


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Self-registration untuk Teknisi (FR-1.2). Status langsung 'pending'."""
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        district = request.form.get("district", "").strip()

        if not name or not email or not password or not district:
            flash("Semua kolom wajib diisi.", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "error")
            return render_template("auth/register.html")

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

        flash("Pendaftaran berhasil. Akun kamu menunggu persetujuan Admin sebelum bisa login.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html")


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
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        district = request.form.get("district", "").strip()

        if not name or not email or not password or not district:
            flash("Semua kolom wajib diisi.", "error")
            return render_template("auth/register_karyawan.html")

        if User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "error")
            return render_template("auth/register_karyawan.html")

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

    return render_template("auth/register_karyawan.html")


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
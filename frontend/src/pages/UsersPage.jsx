import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

const DISTRICT_OPTIONS = [
  "PALU1",
  "PALU2",
  "PALU3",
  "DONGGALA",
  "SIGI",
  "PARIGI",
  "TOLITOLI",
  "BUOL",
];

export default function UsersPage({ user: currentUser, searchValue, onSearchChange }) {
  const { isDark } = useTheme();

  // State Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Filter State
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // View Mode: 'list' | 'register'
  const [viewMode, setViewMode] = useState("list");

  // Registration Form State
  const [regRole, setRegRole] = useState("karyawan_tif");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  // Modals State
  const [detailUser, setDetailUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", district: "", status: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Toast auto-hide
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setErrorMsg("Akses ditolak. Fitur ini hanya dapat dibuka oleh Admin.");
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setErrorMsg(data.error || "Gagal memuat daftar pengguna.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = (searchValue || "").toLowerCase();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q));

      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchValue, roleFilter, statusFilter]);

  // Handle Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regDistrict || !regPassword) {
      setRegError("Semua field bertanda bintang (*) wajib diisi.");
      return;
    }

    if (regPassword.length < 8) {
      setRegError("Password awal minimal harus 8 karakter.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi password tidak sesuai.");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          role: regRole,
          district: regDistrict,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Akun ${regName} berhasil didaftarkan.`);
        // Reset form
        setRegName("");
        setRegEmail("");
        setRegDistrict("");
        setRegPassword("");
        setRegConfirmPassword("");
        setViewMode("list");
        fetchUsers();
      } else {
        setRegError(data.error || "Gagal mendaftarkan user baru.");
      }
    } catch {
      setRegError("Terjadi kesalahan jaringan saat mendaftarkan user.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      district: u.district === "-" ? "" : u.district,
      status: u.status,
    });
    setEditError("");
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError("");

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.district) {
      setEditError("Nama, Email, dan District wajib diisi.");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || "Data user berhasil diperbarui.");
        setEditUser(null);
        fetchUsers();
      } else {
        setEditError(data.error || "Gagal memperbarui data user.");
      }
    } catch {
      setEditError("Terjadi kendala jaringan saat memperbarui data user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError("");

    if (!newPassword || newPassword.length < 8) {
      setResetError("Password baru minimal harus 8 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUser.user_id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Password untuk ${resetUser.name} berhasil direset.`);
        setResetUser(null);
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setResetError(data.error || "Gagal mereset password pengguna.");
      }
    } catch {
      setResetError("Terjadi kendala koneksi saat mereset password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Handle Quick Approve
  const handleApproveUser = async (u) => {
    try {
      const res = await fetch(`/api/admin/users/${u.user_id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Akun ${u.name} berhasil disetujui.`);
        fetchUsers();
      } else {
        alert(data.error || "Gagal menyetujui akun.");
      }
    } catch {
      alert("Terjadi kendala jaringan saat menyetujui akun.");
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deleteUser) return;
    setDeleteError("");
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.user_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `Pengguna ${deleteUser.name} berhasil dihapus.`);
        setDeleteUser(null);
        fetchUsers();
      } else {
        setDeleteError(data.error || "Gagal menghapus pengguna.");
      }
    } catch {
      setDeleteError("Terjadi gangguan koneksi ke server saat menghapus.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Helper for password strength calculation
  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const pwScore = getPasswordStrength(regPassword);

  return (
    <div className="space-y-6">
      {/* ── TOAST NOTIFICATION ── */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-xl backdrop-blur-md animate-bounce-short">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{successToast}</span>
          <button
            onClick={() => setSuccessToast("")}
            className="text-emerald-400 hover:text-emerald-200 ml-2"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── TOP HEADER / ACTION BAR ── */}
      <div
        className={`p-6 rounded-2xl border transition-colors duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isDark
                ? "bg-gradient-to-br from-[#1677FF]/30 to-[#071426] border border-[#1677FF]/40 text-[#38BDF8]"
                : "bg-blue-50 border border-blue-200 text-[#1677FF]"
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-xl font-bold tracking-tight ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-900"
                }`}
              >
                Kelola User
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isDark
                    ? "bg-[#1677FF]/15 text-[#38BDF8] border-[#1677FF]/30"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {users.length} Akun Terdaftar
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
              Pusat kendali akun pengguna, otorisasi role, dan pendaftaran personil Telkom
            </p>
          </div>
        </div>

        {/* Primary Action Button: Daftarkan User */}
        <div className="flex items-center gap-3">
          {viewMode === "register" ? (
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setRegError("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-[#E6EDF7] hover:border-[#38BDF8]"
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Kembali ke Daftar Akun</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-daftarkan-user"
              onClick={() => {
                setViewMode("register");
                setRegError("");
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-[#1677FF]/30 transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px]">person_add</span>
              <span>Daftarkan User</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          MODE 1: FORMULIR DAFTARKAN USER (INTEGRATED FORM)
          ======================================================== */}
      {viewMode === "register" && (
        <div
          className={`relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
          }`}
        >
          {/* Header Form */}
          <div
            className={`px-7 py-5 border-b flex items-center justify-between ${
              isDark ? "border-[#1A2E4C] bg-[#071426]/50" : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark
                    ? "bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8]"
                    : "bg-blue-100 text-[#1677FF]"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h2
                  className={`text-base font-bold ${
                    isDark ? "text-[#E6EDF7]" : "text-slate-900"
                  }`}
                >
                  Formulir Pendaftaran Pengguna Baru
                </h2>
                <p className={`text-xs ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                  Akun yang dibuat Admin akan langsung berstatus aktif dan siap digunakan login
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? "text-[#64748B] hover:text-[#E6EDF7] hover:bg-[#1E3A5F]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Error Banner */}
          {regError && (
            <div className="mx-7 mt-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-rose-400">error</span>
              <span>{regError}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleRegisterSubmit} className="p-7 space-y-5" noValidate>
            {/* 1. Pilihan Role */}
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                  isDark ? "text-[#94A3B8]" : "text-slate-600"
                }`}
              >
                Role Pengguna *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Opsi Karyawan TIF */}
                <div
                  onClick={() => setRegRole("karyawan_tif")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    regRole === "karyawan_tif"
                      ? isDark
                        ? "bg-[#1677FF]/15 border-[#1677FF] ring-1 ring-[#1677FF]"
                        : "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                      : isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-slate-600"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      regRole === "karyawan_tif"
                        ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30"
                        : isDark
                        ? "bg-[#0D1F36] text-[#64748B]"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">engineering</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          regRole === "karyawan_tif"
                            ? isDark
                              ? "text-white"
                              : "text-blue-900"
                            : isDark
                            ? "text-[#E6EDF7]"
                            : "text-slate-700"
                        }`}
                      >
                        Karyawan TIF
                      </span>
                      {regRole === "karyawan_tif" && (
                        <span className="material-symbols-outlined text-[18px] text-[#1677FF]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Akses penuh inventaris, mutasi modul langsung, import & export data
                    </p>
                  </div>
                </div>

                {/* Opsi Teknisi */}
                <div
                  onClick={() => setRegRole("teknisi")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    regRole === "teknisi"
                      ? isDark
                        ? "bg-[#38BDF8]/15 border-[#38BDF8] ring-1 ring-[#38BDF8]"
                        : "bg-sky-50 border-sky-500 ring-1 ring-sky-500"
                      : isDark
                      ? "bg-[#071426] border-[#1E3A5F] hover:border-slate-600"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      regRole === "teknisi"
                        ? "bg-[#38BDF8] text-slate-900 shadow-md shadow-[#38BDF8]/30"
                        : isDark
                        ? "bg-[#0D1F36] text-[#64748B]"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">construction</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          regRole === "teknisi"
                            ? isDark
                              ? "text-white"
                              : "text-sky-900"
                            : isDark
                            ? "text-[#E6EDF7]"
                            : "text-slate-700"
                        }`}
                      >
                        Teknisi
                      </span>
                      {regRole === "teknisi" && (
                        <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}>
                      Akses operasional view-only untuk perangkat, modul, dan lokasi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Baris Nama & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    person
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition-all outline-none ${
                      isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Email / Akun *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    mail
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@telkom.co.id"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition-all outline-none ${
                      isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. District Penugasan */}
            <div>
              <label
                htmlFor="reg-district"
                className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                  isDark ? "text-[#94A3B8]" : "text-slate-600"
                }`}
              >
                District Penugasan *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                  location_on
                </span>
                <select
                  id="reg-district"
                  required
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs transition-all outline-none cursor-pointer appearance-none ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                  }`}
                >
                  <option value="" disabled>
                    Pilih District Penugasan
                  </option>
                  {DISTRICT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* 4. Password Awal & Konfirmasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-password"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Password Awal *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs transition-all outline-none ${
                      isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showRegPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>

                {/* Password strength bar */}
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwScore >= step
                          ? pwScore <= 2
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                          : isDark
                          ? "bg-[#1A2E4C]"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi password di atas"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition-all outline-none ${
                      isDark
                        ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                        : "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                    }`}
                  />
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Konfirmasi password tidak cocok.</p>
                )}
              </div>
            </div>

            {/* Info Keamanan */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
                isDark
                  ? "bg-[#071426]/70 border-[#1E3A5F] text-[#94A3B8]"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-[#38BDF8] shrink-0">
                security
              </span>
              <p className="text-[11px] leading-relaxed">
                Password awal yang ditentukan akan di-hash secara aman menggunakan algoritma standar
                PBKDF2/Werkzeug sebelum disimpan ke database. Password tidak pernah disimpan dalam
                bentuk teks biasa.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A2E4C]">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-[#E6EDF7]"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={regSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-[#1677FF]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {regSubmitting ? "sync" : "person_add"}
                </span>
                <span>{regSubmitting ? "Menyimpan Akun..." : "Daftarkan User Sekarang"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODE 2: TABEL DAFTAR PENGGUNA (MAIN VIEW)
          ======================================================== */}
      {viewMode === "list" && (
        <div
          className={`rounded-2xl border transition-colors duration-300 overflow-hidden shadow-xl ${
            isDark ? "bg-[#0D1F36] border-[#1E3A5F]" : "bg-white border-slate-200"
          }`}
        >
          {/* Bar Filter & Search */}
          <div
            className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3 ${
              isDark ? "border-[#1A2E4C] bg-[#071426]/40" : "border-slate-100 bg-slate-50/50"
            }`}
          >
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Cari nama, email, atau district..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                    : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                }`}
              />
            </div>

            {/* Filter Role & Status */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-44">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`w-full pl-3 pr-8 py-2 rounded-xl border text-xs outline-none cursor-pointer appearance-none ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Super Admin</option>
                  <option value="karyawan_tif">Karyawan TIF</option>
                  <option value="teknisi">Teknisi</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-slate-400 pointer-events-none">
                  filter_alt
                </span>
              </div>

              <div className="relative flex-1 md:w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full pl-3 pr-8 py-2 rounded-xl border text-xs outline-none cursor-pointer appearance-none ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="pending">Pending</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Loading or Error */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[28px] animate-spin text-[#1677FF]">
                sync
              </span>
              <span>Memuat data pengguna...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center text-xs text-rose-400 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[28px]">gpp_bad</span>
              <span>{errorMsg}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-slate-500">
                group_off
              </span>
              <span>Tidak ada akun pengguna yang sesuai dengan filter pencarian.</span>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark
                        ? "border-[#1A2E4C] bg-[#071426]/60 text-[#94A3B8]"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <th className="py-3 px-5">Nama & Identitas</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dibuat Pada</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-xs ${
                    isDark ? "divide-[#1A2E4C]" : "divide-slate-100"
                  }`}
                >
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser && currentUser.id === u.user_id;

                    return (
                      <tr
                        key={u.user_id}
                        className={`transition-colors ${
                          isDark ? "hover:bg-[#12243C]" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Nama & Email */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                                u.avatar_url
                                  ? ""
                                  : isDark
                                  ? "bg-gradient-to-br from-[#1677FF] to-[#0D1F36] text-white"
                                  : "bg-blue-100 text-[#1677FF]"
                              }`}
                            >
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt={u.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                u.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold truncate max-w-[180px] ${
                                    isDark ? "text-[#E6EDF7]" : "text-slate-900"
                                  }`}
                                >
                                  {u.name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#1677FF]/20 text-[#38BDF8]">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] block truncate max-w-[200px] ${
                                  isDark ? "text-[#64748B]" : "text-slate-400"
                                }`}
                              >
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.role === "admin" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Super Admin
                            </span>
                          )}
                          {u.role === "karyawan_tif" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1677FF]/15 text-[#38BDF8] border border-[#1677FF]/30">
                              Karyawan TIF
                            </span>
                          )}
                          {u.role === "teknisi" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              Teknisi
                            </span>
                          )}
                        </td>

                        {/* District */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`font-mono text-[11px] ${isDark ? "text-[#94A3B8]" : "text-slate-600"}`}>
                            {u.district || "-"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.status === "aktif" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Aktif
                            </span>
                          )}
                          {u.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Menunggu
                            </span>
                          )}
                          {u.status === "nonaktif" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Nonaktif
                            </span>
                          )}
                        </td>

                        {/* Tanggal Dibuat */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[11px] ${isDark ? "text-[#64748B]" : "text-slate-400"}`}>
                            {u.created_at || "-"}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Setujui jika status pending */}
                            {u.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u)}
                                title="Setujui Akun"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-all cursor-pointer"
                              >
                                Setujui
                              </button>
                            )}

                            {/* Detail */}
                            <button
                              type="button"
                              onClick={() => setDetailUser(u)}
                              title="Lihat Detail Akun"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isDark
                                  ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-[#38BDF8] hover:border-[#38BDF8]"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[17px]">visibility</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              title="Edit Pengguna"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isDark
                                  ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-[#1677FF] hover:border-[#1677FF]"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setResetUser(u);
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setResetError("");
                              }}
                              title="Reset Password Akun"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isDark
                                  ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-amber-400 hover:border-amber-400"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-400"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[17px]">key</span>
                            </button>

                            {/* Delete (kecuali akun sendiri) */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteUser(u);
                                  setDeleteError("");
                                }}
                                title="Hapus Akun Pengguna"
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isDark
                                    ? "bg-[#071426] border-[#1E3A5F] text-[#94A3B8] hover:text-rose-400 hover:border-rose-400"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-400"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: DETAIL PENGGUNA (TANPA MENAMPILKAN PASSWORD)
          ======================================================== */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDetailUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1A2E4C]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Detail Akun Pengguna</h3>
                  <p className="text-xs text-slate-400">Informasi profil dan penugasan personil</p>
                </div>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-5 space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">ID Pengguna</span>
                <span className="font-mono font-semibold">#{detailUser.user_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Nama Lengkap</span>
                <span className="font-semibold">{detailUser.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Email Akun</span>
                <span className="font-mono font-semibold">{detailUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Role Otorisasi</span>
                <span className="font-semibold capitalize">{detailUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">District Penugasan</span>
                <span className="font-semibold">{detailUser.district || "-"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Status Akun</span>
                <span className="font-semibold capitalize">{detailUser.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Tanggal Didaftarkan</span>
                <span className="text-slate-300">{detailUser.created_at || "-"}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">shield_locked</span>
                <span>Password dienkripsi secara aman dan tidak dapat dilihat oleh siapa pun demi keamanan.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A2E4C] flex justify-end">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="px-5 py-2 rounded-xl bg-[#1677FF] text-white text-xs font-semibold hover:bg-blue-600 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT PENGGUNA
          ======================================================== */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditUser(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1A2E4C]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1677FF]/20 border border-[#1677FF]/40 text-[#38BDF8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Akun Pengguna</h3>
                  <p className="text-xs text-slate-400">Ubah informasi akun #{editUser.user_id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="py-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Email Akun *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Role Otorisasi *</label>
                  <select
                    value={editForm.role}
                    disabled={currentUser && currentUser.id === editUser.user_id}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="admin">Super Admin</option>
                    <option value="karyawan_tif">Karyawan TIF</option>
                    <option value="teknisi">Teknisi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Status Akun *</label>
                  <select
                    value={editForm.status}
                    disabled={currentUser && currentUser.id === editUser.user_id}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                      isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pending">Pending</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">District Penugasan *</label>
                <select
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="" disabled>
                    Pilih District
                  </option>
                  {DISTRICT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#1A2E4C] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1677FF] text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: RESET PASSWORD (ADMIN MENETAPKAN PASSWORD BARU)
          ======================================================== */}
      {resetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setResetUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1A2E4C]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </div>
                <div>
                  <h3 className="text-base font-bold">Reset Password Pengguna</h3>
                  <p className="text-xs text-slate-400">Tetapkan password baru untuk {resetUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {resetError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="py-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                Password lama pengguna tidak dapat dilihat dan langsung digantikan dengan password baru
                yang di-hash sebelum disimpan.
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Password Baru *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none pr-10 ${
                      isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Konfirmasi Password Baru *</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDark ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="pt-4 border-t border-[#1A2E4C] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50"
                >
                  {resetSubmitting ? "Mereset..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: HAPUS PENGGUNA (DENGAN PROTEKSI RELASI DB)
          ======================================================== */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDeleteUser(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#1A2E4C]">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-400">Konfirmasi Hapus Pengguna</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="py-5 text-xs space-y-3 leading-relaxed">
              <p>
                Apakah Anda yakin ingin menghapus akun pengguna <strong>{deleteUser.name}</strong> (
                {deleteUser.email})?
              </p>
              <div className="p-3 rounded-xl bg-[#071426] border border-[#1E3A5F] text-[11px] text-slate-400">
                💡 <strong>Catatan Integritas:</strong> Sistem akan memeriksa apakah pengguna memiliki
                riwayat transaksi modul, mutasi, atau audit log. Jika ada, penghapusan permanen akan
                dicegah agar riwayat audit sistem tetap utuh.
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A2E4C] flex justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50"
              >
                {deleteSubmitting ? "Memeriksa & Menghapus..." : "Ya, Hapus Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

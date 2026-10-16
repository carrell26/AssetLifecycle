import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ user }) {
  const { isDark } = useTheme();

  const role = user?.role;
  const isPj = Boolean(user?.is_pj);

  let navItems = [];

  if (role === "teknisi") {
    // 4. TEKNISI: Dashboard, Modul (view-only), Pengajuan, dan AR/VR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: true },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/" },
      { id: "pengajuan", label: "Pengajuan Perpindahan", icon: "assignment", href: "/modules/requests" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else if (role === "karyawan_tif" && isPj) {
    // 2. KARYAWAN TIF (PJ): Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Daftarkan Teknisi, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: true },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices" },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/" },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations" },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "daftarkan-teknisi", label: "Daftarkan Teknisi", icon: "person_add", href: "/auth/register-teknisi" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/" },
      { id: "export", label: "Export Data", icon: "download", href: "/export/" },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else if (role === "karyawan_tif" && !isPj) {
    // 3. KARYAWAN TIF BIASA: Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: true },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices" },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/" },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations" },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/" },
      { id: "export", label: "Export Data", icon: "download", href: "/export/" },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else {
    // 1. ADMIN: Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Kelola User, Daftarkan Karyawan, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: true },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices" },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/" },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations" },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "kelola-user", label: "Kelola User", icon: "manage_accounts", href: "/auth/admin/users" },
      { id: "daftarkan-karyawan", label: "Daftarkan Karyawan", icon: "badge", href: "/auth/admin/register-karyawan" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/" },
      { id: "export", label: "Export Data", icon: "download", href: "/export/" },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  }

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 w-[240px] z-50 flex flex-col justify-between border-r transition-colors duration-300 ${
        isDark
          ? "bg-[#071426] border-[#1A2E4C]"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex flex-col">
        {/* Logo Header */}
        <div
          className={`h-[64px] px-5 border-b flex flex-col justify-center transition-colors duration-300 ${
            isDark ? "bg-[#071426] border-[#1A2E4C]" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-colors ${
                isDark ? "bg-gradient-to-br from-[#1677FF] to-[#0D1F36]" : "bg-gradient-to-br from-[#EE2E24] to-[#C51A12]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold tracking-tight leading-none ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-900"
                }`}
              >
                AssetLifecycle
              </span>
              <span
                className={`text-[10px] font-medium leading-tight mt-1 ${
                  isDark ? "text-[#38BDF8]" : "text-[#EE2E24]"
                }`}
              >
                Telkom Infrastructure
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-6 pb-3">
          {navItems.map((item) => {
            const isActive = item.active;
            let activeClass = "";
            let inactiveClass = "";

            if (isDark) {
              activeClass =
                "bg-[#1677FF] text-[#E6EDF7] shadow-lg shadow-[#1677FF]/25 font-semibold";
              inactiveClass =
                "text-[#94A3B8] hover:text-[#E6EDF7] hover:bg-[#0D1F36] font-medium";
            } else {
              activeClass =
                "bg-[#EE2E24] text-white shadow-md shadow-[#EE2E24]/20 font-semibold";
              inactiveClass =
                "text-slate-600 hover:text-slate-900 hover:bg-red-50 hover:text-[#EE2E24] font-medium";
            }

            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[19px] ${
                    isActive
                      ? "text-white"
                      : isDark
                      ? "text-[#64748B]"
                      : "text-slate-400 group-hover:text-[#EE2E24]"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div
        className={`p-4 mx-3 mb-4 rounded-xl border transition-colors ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] text-[#94A3B8]"
            : "bg-slate-50 border-slate-200 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              isDark ? "bg-emerald-400" : "bg-emerald-500"
            }`}
          ></span>
          <span className={isDark ? "text-[#E6EDF7]" : "text-slate-800"}>
            Sistem Aktif
          </span>
        </div>
        <p className="text-[11px] mt-1 leading-relaxed">
          v2.4.0 • Enterprise Edition
        </p>
      </div>
    </aside>
  );
}

import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ user }) {
  const { isDark } = useTheme();

  const role = user?.role;
  const isPj = Boolean(user?.is_pj);

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const isModulActive = currentPath.startsWith("/modules");
  const isLokasiActive = currentPath.startsWith("/device/locations");
  const isPerangkatActive = currentPath.startsWith("/device/devices") || currentPath.startsWith("/devices");
  const isImportActive = currentPath.startsWith("/import");
  const isExportActive = currentPath.startsWith("/export");
  const isDashboardActive = (currentPath === "/" || currentPath === "") && !isModulActive && !isLokasiActive && !isPerangkatActive && !isImportActive && !isExportActive;

  let navItems = [];

  if (role === "teknisi") {
    // 4. TEKNISI: Dashboard, Modul (view-only), Pengajuan, dan AR/VR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: isDashboardActive },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/", active: isModulActive },
      { id: "pengajuan", label: "Pengajuan Perpindahan", icon: "assignment", href: "/modules/requests" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else if (role === "karyawan_tif" && isPj) {
    // 2. KARYAWAN TIF (PJ): Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Daftarkan Teknisi, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: isDashboardActive },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices", active: isPerangkatActive },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/", active: isModulActive },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations", active: isLokasiActive },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "daftarkan-teknisi", label: "Daftarkan Teknisi", icon: "person_add", href: "/auth/register-teknisi" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/", active: isImportActive },
      { id: "export", label: "Export Data", icon: "download", href: "/export/", active: isExportActive },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else if (role === "karyawan_tif" && !isPj) {
    // 3. KARYAWAN TIF BIASA: Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: isDashboardActive },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices", active: isPerangkatActive },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/", active: isModulActive },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations", active: isLokasiActive },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/", active: isImportActive },
      { id: "export", label: "Export Data", icon: "download", href: "/export/", active: isExportActive },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  } else {
    // 1. ADMIN: Dashboard, Perangkat, Modul, Lokasi, Pengajuan, Kelola User, Daftarkan Karyawan, Import, Export, Audit, AR
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/", active: isDashboardActive },
      { id: "perangkat", label: "Perangkat", icon: "router", href: "/device/devices", active: isPerangkatActive },
      { id: "modul", label: "Modul", icon: "memory", href: "/modules/", active: isModulActive },
      { id: "lokasi", label: "Lokasi", icon: "location_on", href: "/device/locations", active: isLokasiActive },
      { id: "pengajuan", label: "Pengajuan Modul", icon: "assignment", href: "/modules/requests" },
      { id: "kelola-user", label: "Kelola User", icon: "manage_accounts", href: "/auth/admin/users" },
      { id: "daftarkan-karyawan", label: "Daftarkan Karyawan", icon: "badge", href: "/auth/admin/register-karyawan" },
      { id: "import", label: "Import Data", icon: "upload_file", href: "/import/", active: isImportActive },
      { id: "export", label: "Export Data", icon: "download", href: "/export/", active: isExportActive },
      { id: "audit", label: "Audit Log", icon: "history", href: "/audit/" },
      { id: "ar", label: "AR/VR", icon: "view_in_ar", href: "/ar/" },
    ];
  }

  return (
    <aside
      className="app-sidebar w-[240px] h-screen shrink-0 z-50 flex flex-col justify-between border-r select-none"
      style={{ backgroundColor: "#071426", borderColor: "#1A2E4C" }}
    >
      <div className="flex flex-col">
        {/* Logo Header */}
        <div
          className="sidebar-header h-[64px] px-5 border-b flex flex-col justify-center"
          style={{ backgroundColor: "#071426", borderColor: "#1A2E4C" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-[#1677FF] to-[#0D1F36]">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <div className="flex flex-col">
              <span className="sidebar-logo-text text-sm font-bold tracking-tight leading-none text-[#E6EDF7]">
                AssetLifecycle
              </span>
              <span className="sidebar-sublogo-text text-[10px] font-medium leading-tight mt-1 text-[#38BDF8]">
                Telkom Infrastructure
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-6 pb-3">
          {navItems.map((item) => {
            const isActive = item.active;
            const activeClass =
              "sidebar-link-active bg-[#1677FF] text-white shadow-lg shadow-[#1677FF]/25 font-semibold";
            const inactiveClass =
              "sidebar-link-inactive text-[#94A3B8] hover:text-[#E6EDF7] hover:bg-[#0D1F36] font-medium";

            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${
                  isActive ? activeClass : inactiveClass
                }`}
                style={
                  isActive
                    ? { backgroundColor: "#1677FF", color: "#FFFFFF" }
                    : { color: "#94A3B8" }
                }
              >
                <span
                  className={`material-symbols-outlined text-[19px] ${
                    isActive
                      ? "text-white"
                      : "text-[#64748B] group-hover:text-[#E6EDF7]"
                  }`}
                  style={isActive ? { color: "#FFFFFF" } : undefined}
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
        className="sidebar-footer p-4 mx-3 mb-4 rounded-xl border"
        style={{
          backgroundColor: "#0D1F36",
          borderColor: "#1E3A5F",
          color: "#94A3B8",
        }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="sidebar-footer-title text-[#E6EDF7]">
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

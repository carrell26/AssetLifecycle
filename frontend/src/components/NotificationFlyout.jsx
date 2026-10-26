import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    category: "approval",
    icon: "swap_horiz",
    iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30",
    title: "Mutasi Modul Baru (PSS24-003)",
    desc: "Karyawan TIF mencatat mutasi modul di STO Palu 1.",
    time: "10 menit yang lalu",
    actions: [
      { label: "Buku Mutasi", href: "/modules/requests", primary: true },
      { label: "Detail", href: "/modules/requests", primary: false },
    ],
  },
  {
    id: 2,
    category: "system",
    icon: "warning",
    iconColor: "text-rose-400 bg-rose-500/15 border-rose-500/30",
    title: "Peringatan Kerusakan Modul",
    desc: "Modul PSS24-002 pada Slot #04 terdeteksi offline / rusak.",
    time: "1 jam yang lalu",
    actions: [{ label: "Investigasi", href: "/device/devices", primary: true }],
  },
  {
    id: 3,
    category: "system",
    icon: "verified_user",
    iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    title: "Integritas Ledger Terverifikasi",
    desc: "Pengecekan hash chain SHA-256 berhasil (100% konsisten).",
    time: "3 jam yang lalu",
    badge: "Blok #4812",
  },
  {
    id: 4,
    category: "system",
    icon: "upload_file",
    iconColor: "text-[#38BDF8] bg-[#1677FF]/15 border-[#1677FF]/30",
    title: "Import Data Selesai",
    desc: "Sinkronisasi 29 data perangkat telah dimasukkan ke dalam basis data.",
    time: "5 jam yang lalu",
    badge: "29 Data",
  },
  {
    id: 5,
    category: "approval",
    icon: "check_circle",
    iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    title: "Mutasi Langsung Berhasil",
    desc: "Mutasi modul Metro-002 Port 4 telah dicatat oleh Karyawan TIF.",
    time: "1 hari yang lalu",
    badge: "Tercatat",
  },
];

export default function NotificationFlyout() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(3);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  const filteredNotifs = INITIAL_NOTIFICATIONS.filter((n) => {
    if (filter === "all") return true;
    return n.category === filter;
  });

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifikasi"
        className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer border ${
          isDark
            ? "text-[#94A3B8] hover:text-[#E6EDF7] hover:bg-[#0D1F36] border-transparent hover:border-[#1E3A5F]"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200"
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ${
              isDark
                ? "bg-[#1677FF] ring-[#071426]"
                : "bg-[#EE2E24] ring-white"
            }`}
          ></span>
        )}
      </button>

      {/* Flyout Panel Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 top-12 mt-2 w-[390px] rounded-2xl shadow-2xl z-50 border backdrop-blur-md overflow-hidden flex flex-col transition-all duration-200 ${
            isDark
              ? "bg-[#0D1F36]/95 border-[#1E3653] text-[#E6EDF7]"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200"
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3.5 border-b flex items-center justify-between ${
              isDark ? "bg-[#071426]/70 border-[#1A2E4C]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifikasi</h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  unreadCount > 0
                    ? isDark
                      ? "bg-[#1677FF]/20 text-[#38BDF8] border-[#1677FF]/40"
                      : "bg-red-50 text-[#EE2E24] border-red-200"
                    : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                }`}
              >
                {unreadCount > 0 ? `${unreadCount} Baru` : "0 Baru"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className={`text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 hover:underline ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              Semua Dibaca
            </button>
          </div>

          {/* Filter Tabs */}
          <div
            className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto whitespace-nowrap ${
              isDark ? "bg-[#0A172A] border-[#1A2E4C]" : "bg-slate-100 border-slate-200"
            }`}
          >
            {[
              { id: "all", label: "Semua (5)" },
              { id: "approval", label: "Mutasi (2)" },
              { id: "system", label: "Sistem (3)" },
            ].map((t) => {
              const active = filter === t.id;
              let btnClass = "";
              if (active) {
                btnClass = isDark
                  ? "bg-[#1677FF] text-[#E6EDF7]"
                  : "bg-[#EE2E24] text-white";
              } else {
                btnClass = isDark
                  ? "text-[#94A3B8] hover:text-[#E6EDF7] hover:bg-[#122846]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200";
              }
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${btnClass}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Notif List */}
          <div
            className={`max-h-[380px] overflow-y-auto divide-y custom-scrollbar ${
              isDark ? "divide-[#1A2E4C]/60" : "divide-slate-100"
            }`}
          >
            {filteredNotifs.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 transition-colors relative flex items-start gap-3 group cursor-pointer ${
                  isDark ? "hover:bg-[#122846]/60" : "hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${item.iconColor}`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {item.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold truncate">{item.title}</p>
                  <p
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isDark ? "text-[#94A3B8]" : "text-slate-500"
                    }`}
                  >
                    {item.desc}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span
                      className={`text-[10px] font-mono flex items-center gap-1 ${
                        isDark ? "text-[#64748B]" : "text-slate-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        schedule
                      </span>
                      {item.time}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.actions &&
                        item.actions.map((act, i) => (
                          <a
                            key={i}
                            href={act.href}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                              act.primary
                                ? isDark
                                  ? "bg-[#1677FF]/20 hover:bg-[#1677FF] text-[#38BDF8] hover:text-white border border-[#1677FF]/40"
                                  : "bg-red-50 hover:bg-[#EE2E24] text-[#EE2E24] hover:text-white border border-red-200"
                                : isDark
                                ? "bg-[#071426] hover:bg-[#1E3A5F] text-[#94A3B8] hover:text-white border border-[#1A2E4C]"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200"
                            }`}
                          >
                            {act.label}
                          </a>
                        ))}
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono font-medium ${
                            isDark ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

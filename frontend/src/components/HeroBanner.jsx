import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function HeroBanner({ userName, userRole }) {
  const { isDark } = useTheme();
  const isTeknisi = userRole === "teknisi";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-lg border min-h-[120px] flex items-center justify-between transition-colors duration-300 ${
        isDark
          ? "border-[#1E3A5F] bg-[#071426]"
          : "border-slate-200 bg-white"
      }`}
    >
      <img
        alt="Telecommunications Fiber Optic Infrastructure Data Center"
        className="absolute inset-0 w-full h-full object-cover object-center"
        src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200"
      />

      {/* Gradient Overlays */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isDark
            ? "bg-gradient-to-r from-[#071426] via-[#071426]/85 to-transparent"
            : "bg-gradient-to-r from-white via-white/90 to-transparent"
        }`}
      ></div>

      {/* Ambient Glow */}
      <div
        className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-[#1677FF]/20" : "bg-[#EE2E24]/15"
        }`}
      ></div>

      <div className="relative z-10 px-6 py-5 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xs font-normal ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Selamat Datang,
          </span>
          <span
            className={`text-2xl font-bold tracking-tight ${
              isDark ? "text-[#E6EDF7]" : "text-slate-900"
            }`}
          >
            {userName || "User"}
          </span>
        </div>
        <p
          className={`text-xs mt-1 max-w-xl font-normal leading-relaxed ${
            isDark ? "text-[#94A3B8]" : "text-slate-600"
          }`}
        >
          {isTeknisi
            ? "Kelola pengajuan perpindahan modul dan pantau statusnya melalui sistem."
            : "Kelola data perangkat, modul, dan lokasi Telkom secara terintegrasi, aman, dan efisien dengan teknologi ledger audit modern."}
        </p>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Header({
  user,
  onAvatarUpdated,
  onOpenLogoutModal,
  onOpenAvatarModal,
  searchValue = "",
  onSearchChange,
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultAvatar =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256";
  const avatarSrc = user?.avatar_url || defaultAvatar;

  return (
    <header
      className={`w-full h-[64px] shrink-0 z-40 px-6 flex items-center justify-between border-b gap-6 transition-colors duration-300 ${
        isDark
          ? "bg-[#071426] border-[#1A2E4C] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      {/* Search Input - Expanding to fill available space */}
      <div className="relative flex items-center w-full flex-1">
        <span
          className={`material-symbols-outlined absolute left-3.5 text-[20px] pointer-events-none ${
            isDark ? "text-[#64748B]" : "text-slate-400"
          }`}
        >
          search
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Cari perangkat, modul, lokasi, atau nomor seri..."
          className={`w-full h-10 pl-10 pr-4 rounded-full text-xs transition-all focus:outline-none ${
            isDark
              ? "bg-[#0D1F36] border border-[#1E3A5F] text-[#E6EDF7] placeholder:text-[#64748B] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
              : "bg-slate-100 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
          }`}
        />
      </div>

      {/* Right Action Items */}
      <div className="flex items-center gap-4 relative shrink-0">

        {/* THEME SWITCHER: Dark Mode / Light Mode */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleTheme}
            title={
              isDark
                ? "Beralih ke Tema Terang"
                : "Beralih ke Tema Gelap"
            }
            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 border cursor-pointer group ${
              isDark
                ? "bg-[#0D1F36] border-[#1E3A5F] text-amber-400 hover:border-amber-400/50 hover:bg-[#122846] shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-amber-500 shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            }`}
          >
            {isDark ? (
              <span className="material-symbols-outlined text-[21px] transition-transform group-hover:rotate-45">
                light_mode
              </span>
            ) : (
              <span className="material-symbols-outlined text-[21px] transition-transform group-hover:-rotate-12">
                dark_mode
              </span>
            )}
            {/* Pulsing indicator */}
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ${
                isDark
                  ? "bg-amber-400 ring-[#071426]"
                  : "bg-amber-400 ring-white"
              }`}
            ></span>
          </button>
        </div>

        <div
          className={`h-5 w-px ${isDark ? "bg-[#1A2E4C]" : "bg-slate-200"}`}
        ></div>

        {/* User Profile & Avatar Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2.5 p-1 rounded-full transition-colors cursor-pointer ${
              isDark ? "hover:bg-[#0D1F36]" : "hover:bg-slate-100"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={user?.name || "User Avatar"}
                className="w-9 h-9 rounded-full object-cover ring-2 shadow-sm ring-[#1677FF]"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="flex flex-col text-left justify-center min-w-0 pr-1">
              <div className="flex items-center gap-1 leading-tight">
                <span
                  className={`text-xs font-semibold max-w-[130px] truncate ${
                    isDark ? "text-[#E6EDF7]" : "text-slate-800"
                  }`}
                >
                  {user?.name || "Memuat..."}
                </span>
                <span
                  className={`material-symbols-outlined text-[17px] transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  } ${isDark ? "text-[#94A3B8]" : "text-slate-500"}`}
                >
                  expand_more
                </span>
              </div>
              <span
                className={`text-[11px] leading-none mt-0.5 capitalize ${
                  isDark ? "text-[#38BDF8]" : "text-blue-600"
                }`}
              >
                {user?.role?.replace("_", " ") || "Admin"}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown Card */}
          {dropdownOpen && (
            <div
              className={`absolute right-0 top-12 mt-2 w-[340px] rounded-2xl shadow-2xl p-5 z-50 border backdrop-blur-md transition-all duration-200 ${
                isDark
                  ? "bg-[#0D1F36]/95 border-[#1E3653] text-[#E6EDF7]"
                  : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200"
              }`}
            >
              {/* Header inside dropdown with Avatar */}
              <div
                className={`flex items-center gap-3.5 pb-4 border-b relative ${
                  isDark ? "border-[#1A2E4C]" : "border-slate-100"
                }`}
              >
                <div className="relative group">
                  <img
                    src={avatarSrc}
                    alt={user?.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 shadow-md ring-[#1677FF]/40"
                  />
                  {/* Camera action button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAvatarModal();
                    }}
                    title="Ubah Foto Profil (Kamera / Galeri)"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md border transition-transform hover:scale-110 cursor-pointer bg-[#1677FF] hover:bg-[#38BDF8] border-white"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      photo_camera
                    </span>
                  </button>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h4
                    className={`text-sm font-semibold truncate ${
                      isDark ? "text-[#E6EDF7]" : "text-slate-900"
                    }`}
                  >
                    {user?.name}
                  </h4>
                  <p
                    className={`text-[11px] font-medium leading-tight mt-0.5 capitalize ${
                      isDark ? "text-[#38BDF8]" : "text-blue-600"
                    }`}
                  >
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Account Information Details */}
              <div className="py-3.5 space-y-2.5">
                <span
                  className={`text-[10px] font-semibold tracking-wide uppercase font-mono ${
                    isDark ? "text-[#94A3B8]" : "text-slate-500"
                  }`}
                >
                  Informasi Akun
                </span>
                <div
                  className={`rounded-xl p-3 border space-y-2 text-xs ${
                    isDark
                      ? "bg-[#071426] border-[#1A2E4C]"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[11px] shrink-0 ${
                        isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}
                    >
                      Regional
                    </span>
                    <span className="font-medium text-right truncate text-[11px]">
                      {user?.district || "Witel Donggala / Palu"}
                    </span>
                  </div>
                  <div
                    className={`flex items-start justify-between gap-2 pt-1 border-t ${
                      isDark ? "border-[#1A2E4C]/60" : "border-slate-200"
                    }`}
                  >
                    <span
                      className={`text-[11px] shrink-0 ${
                        isDark ? "text-[#94A3B8]" : "text-slate-500"
                      }`}
                    >
                      Email
                    </span>
                    <span
                      className={`font-mono text-right truncate text-[11px] ${
                        isDark ? "text-[#38BDF8]" : "text-blue-600"
                      }`}
                    >
                      {user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className={`pt-3 border-t flex flex-col gap-2 ${
                  isDark ? "border-[#1A2E4C]" : "border-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAvatarModal();
                  }}
                  className={`rounded-xl px-4 py-2 w-full flex items-center justify-center gap-2 font-medium text-xs transition-colors cursor-pointer border ${
                    isDark
                      ? "bg-[#1677FF]/15 text-[#38BDF8] border-[#1677FF]/30 hover:bg-[#1677FF]/25"
                      : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    photo_camera
                  </span>
                  Ganti Foto Profil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenLogoutModal();
                  }}
                  className="text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/25 rounded-xl px-4 py-2 w-full flex items-center justify-center gap-2 font-medium text-xs transition duration-200 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    logout
                  </span>
                  Keluar dari akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

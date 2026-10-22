import React, { useState, useRef, useEffect } from "react";

export default function TableColumnFilter({
  title,
  columnKey,
  type = "text",
  options = [],
  value = "",
  onChange,
  onReset,
  isDark = true,
  align = "left",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  const isActive = Boolean(value && String(value).trim() !== "");

  const updateCoords = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popoverWidth = 240;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) left = 12;

    setCoords({
      top: rect.bottom + 6,
      left,
    });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click, window resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleReposition = () => {
      updateCoords();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    // Auto-focus input
    const timer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
      clearTimeout(timer);
    };
  }, [isOpen]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 w-full ${
        align === "center"
          ? "justify-center"
          : align === "right"
          ? "justify-end"
          : "justify-between"
      }`}
    >
      <span className="truncate">{title}</span>

      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        title={`Filter kolom ${title}`}
        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
          isActive
            ? isDark
              ? "bg-[#1677FF] text-white shadow-sm ring-1 ring-[#38BDF8]/50"
              : "bg-blue-600 text-white shadow-sm ring-1 ring-blue-300"
            : isDark
            ? "text-[#64748B] hover:text-[#38BDF8] hover:bg-[#132B4F]/60"
            : "text-slate-400 hover:text-blue-600 hover:bg-slate-100"
        }`}
      >
        <span className="material-symbols-outlined text-[15px]">
          {isActive ? "filter_alt" : "filter_list"}
        </span>
      </button>

      {/* Floating Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
          }}
          className={`w-60 rounded-xl border p-3 shadow-2xl backdrop-blur-md normal-case font-normal text-xs transition-all ${
            isDark
              ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
              : "bg-white border-slate-200 text-slate-800 shadow-xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
            <span
              className={`font-semibold text-[11px] uppercase tracking-wider ${
                isDark ? "text-[#38BDF8]" : "text-blue-600"
              }`}
            >
              Filter: {title}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          {/* Filter Body */}
          {type === "select" ? (
            <div className="space-y-2">
              <label className="block text-[10px] text-[#94A3B8]">
                Pilih opsi nilai:
              </label>
              <select
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-8 px-2.5 rounded-lg border text-xs focus:outline-none cursor-pointer transition-colors ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                    : "bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500"
                }`}
              >
                <option value="">Semua {title}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[10px] text-[#94A3B8]">
                Cari kata kunci:
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Cari ${title.toLowerCase()}...`}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={`w-full h-8 pl-2.5 pr-7 rounded-lg border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7] placeholder-[#64748B] focus:border-[#1677FF]"
                      : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500"
                  }`}
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      close
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-inherit">
            <button
              type="button"
              disabled={!isActive}
              onClick={() => {
                if (onReset) onReset();
                else onChange("");
              }}
              className={`text-[11px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? "text-rose-400 hover:text-rose-300 underline"
                  : "text-[#64748B] opacity-50 cursor-not-allowed"
              }`}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-md bg-[#1677FF] hover:bg-[#0E65D9] text-white text-[11px] font-semibold cursor-pointer transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

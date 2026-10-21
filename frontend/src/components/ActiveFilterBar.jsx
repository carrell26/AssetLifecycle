import React from "react";

export default function ActiveFilterBar({
  filters = {},
  labels = {},
  onResetFilter,
  onResetAll,
  isDark = true,
}) {
  const activeEntries = Object.entries(filters).filter(
    ([_, val]) => val !== undefined && val !== null && String(val).trim() !== ""
  );

  if (activeEntries.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 pt-1 pb-3 text-xs animate-fadeIn ${
        isDark ? "text-[#94A3B8]" : "text-slate-600"
      }`}
    >
      <span className="flex items-center gap-1 font-medium">
        <span className="material-symbols-outlined text-[15px] text-[#38BDF8]">
          filter_alt
        </span>
        <span>Filter kolom aktif:</span>
      </span>

      {activeEntries.map(([key, val]) => {
        const label = labels[key] || key;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
              isDark
                ? "bg-[#0D264A] border-[#164375] text-[#38BDF8]"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <span>
              {label}: <strong className="font-bold text-white font-mono">{val}</strong>
            </span>
            <button
              type="button"
              onClick={() => onResetFilter(key)}
              title={`Hapus filter ${label}`}
              className={`rounded-full p-0.5 hover:scale-110 transition-transform cursor-pointer ${
                isDark ? "hover:text-white" : "hover:text-blue-900"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={onResetAll}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 ml-1 underline cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">restart_alt</span>
        <span>Reset Semua Filter</span>
      </button>
    </div>
  );
}

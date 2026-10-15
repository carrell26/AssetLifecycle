import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const CONDITION_COLORS = {
  Aktif: "#10B981", // Emerald
  Idle: "#F59E0B",  // Amber
  Rusak: "#EF4444", // Red
};

export default function ModuleConditionChart({ data }) {
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const items = data && data.length > 0 ? data : [
    { kondisi: "Aktif", count: 756 },
    { kondisi: "Idle", count: 62 },
    { kondisi: "Rusak", count: 158 },
  ];

  const total = items.reduce((acc, curr) => acc + curr.count, 0);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = items.map((item) => {
    const percent = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;
    const color = CONDITION_COLORS[item.kondisi] || "#64748B";

    return {
      ...item,
      color,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const handleMouseMove = (e, slice) => {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 38,
    });
    setHovered(slice);
  };

  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between relative transition-colors duration-300 ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Kondisi Modul</h2>
        <p
          className={`text-[11px] mt-0.5 ${
            isDark ? "text-[#94A3B8]" : "text-slate-500"
          }`}
        >
          Status operasional keseluruhan modul fisik
        </p>
      </div>

      <div className="py-5 flex items-center justify-center relative min-h-[190px]">
        {/* Floating Tooltip */}
        {hovered && (
          <div
            className={`pointer-events-none absolute z-30 transition-all duration-75 text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-xl border whitespace-nowrap flex items-center gap-2 ${
              isDark
                ? "bg-[#071426] border-[#1E3A5F] text-[#E6EDF7]"
                : "bg-white border-slate-200 text-slate-800 shadow-slate-200"
            }`}
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: hovered.color }}
            ></span>
            <span>
              <strong>{hovered.kondisi}:</strong> {hovered.count} Modul ({hovered.percent}%)
            </span>
          </div>
        )}

        {/* Donut Chart SVG */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 overflow-visible"
            viewBox="0 0 120 120"
          >
            {slices.map((slice, i) => (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hovered?.kondisi === slice.kondisi ? 17 : 14}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="donut-slice transition-all duration-200"
                onMouseMove={(e) => handleMouseMove(e, slice)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-bold leading-none">{total}</span>
            <span
              className={`text-[10px] mt-0.5 font-medium ${
                isDark ? "text-[#94A3B8]" : "text-slate-500"
              }`}
            >
              Modul
            </span>
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div
        className={`grid grid-cols-3 gap-2 pt-3 border-t ${
          isDark ? "border-[#1A2E4C]" : "border-slate-100"
        }`}
      >
        {slices.map((slice, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
              hovered?.kondisi === slice.kondisi
                ? isDark
                  ? "bg-[#122846]"
                  : "bg-slate-100"
                : ""
            }`}
            onMouseEnter={() => setHovered(slice)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: slice.color }}
            ></span>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[11px] font-medium truncate">
                {slice.kondisi}
              </span>
              <span
                className={`text-[10px] ${
                  isDark ? "text-[#94A3B8]" : "text-slate-500"
                }`}
              >
                {slice.count} Modul
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

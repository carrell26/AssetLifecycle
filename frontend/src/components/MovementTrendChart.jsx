import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function MovementTrendChart({ data, onPeriodChange, currentPeriod = "30d" }) {
  const { isDark } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const points = data && data.length > 0 ? data : [
    { date: "01 Sep", count: 4 },
    { date: "06 Sep", count: 6 },
    { date: "11 Sep", count: 9 },
    { date: "16 Sep", count: 5 },
    { date: "21 Sep", count: 12 },
    { date: "26 Sep", count: 14 },
    { date: "30 Sep", count: 8 },
  ];

  const maxVal = Math.max(...points.map((p) => p.count), 15);
  const yMax = Math.ceil(maxVal / 3) * 3 || 15;

  // Chart coordinates: width=800, height=210, padLeft=60, padRight=760, padTop=30, padBottom=180
  const width = 800;
  const chartHeight = 150; // 180 - 30
  const baseline = 180;
  const startX = 60;
  const endX = 760;

  const coords = points.map((p, idx) => {
    const x =
      points.length > 1
        ? startX + (idx / (points.length - 1)) * (endX - startX)
        : width / 2;
    const yRatio = p.count / yMax;
    const y = baseline - yRatio * chartHeight;
    return { ...p, x, y };
  });

  // Generate SVG path command with smooth Catmull-Rom or Bezier interpolation
  let pathD = "";
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y} ${cpX} ${p1.y} ${p1.x} ${p1.y}`;
    }
  }

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`
    : "";

  const strokeColor = "#1677FF";
  const pointHaloColor = isDark ? "#38BDF8" : "#3B82F6";

  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 transition-colors duration-300 ${
        isDark
          ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Header Section */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
          isDark ? "border-[#1A2E4C]" : "border-slate-100"
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold">Tren Perpindahan Modul</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isDark
                  ? "bg-[#1677FF]/15 text-[#38BDF8] border-[#1677FF]/30"
                  : "bg-blue-50 text-blue-600 border-blue-200"
              }`}
            >
              Module Movements &amp; Requests
            </span>
          </div>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? "text-[#94A3B8]" : "text-slate-500"
            }`}
          >
            Frekuensi mutasi dan instalasi modul per periode (Data aktual audit ledger).
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div
          className={`inline-flex items-center p-1 border gap-1 rounded-xl shadow-inner ${
            isDark
              ? "bg-[#071426] border-[#1E3653]"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          {["7d", "30d", "90d"].map((period) => {
            const label =
              period === "7d" ? "7 Hari" : period === "30d" ? "30 Hari" : "90 Hari";
            const isActive = currentPeriod === period;
            let activeStyle = "";
            let inactiveStyle = "";

            if (isDark) {
              activeStyle = "bg-[#1677FF] text-[#E6EDF7] shadow-sm shadow-[#1677FF]/40 font-semibold";
              inactiveStyle = "text-[#94A3B8] hover:text-[#E6EDF7]";
            } else {
              activeStyle = "bg-[#1677FF] text-white shadow-sm shadow-[#1677FF]/30 font-semibold";
              inactiveStyle = "text-slate-600 hover:text-slate-900";
            }

            return (
              <button
                key={period}
                type="button"
                onClick={() => onPeriodChange && onPeriodChange(period)}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive ? activeStyle : inactiveStyle
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="pt-4 relative">
        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className={`pointer-events-none absolute z-30 transition-all duration-75 text-[11px] font-medium py-1.5 px-3.5 rounded-full shadow-2xl border whitespace-nowrap flex items-center gap-2.5 ${
              isDark
                ? "bg-[#071426] text-[#E6EDF7] border-[#1E3653]"
                : "bg-white text-slate-800 border-slate-200 shadow-slate-200"
            }`}
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: strokeColor }}
            ></span>
            <span>
              <span className={isDark ? "text-[#94A3B8]" : "text-slate-400"}>
                {hoveredPoint.date}:
              </span>{" "}
              <strong className="font-semibold ml-1">
                {hoveredPoint.count} Mutasi Modul
              </strong>
            </span>
          </div>
        )}

        <div className="w-full h-56 relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 800 210"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? "0.38" : "0.25"} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <g
              stroke={isDark ? "#1A2E4C" : "#E2E8F0"}
              strokeDasharray="4 4"
              strokeWidth="1"
            >
              <line x1="45" x2="780" y1="30" y2="30" />
              <line x1="45" x2="780" y1="80" y2="80" />
              <line x1="45" x2="780" y1="130" y2="130" />
            </g>
            <line
              x1="45"
              x2="780"
              y1="180"
              y2="180"
              stroke={isDark ? "#1E3A5F" : "#CBD5E1"}
              strokeWidth="1.5"
            />

            {/* Y-Axis Labels */}
            <g
              fill={isDark ? "#64748B" : "#94A3B8"}
              fontSize="10"
              fontWeight="500"
              textAnchor="end"
            >
              <text x="38" y="34">{yMax}</text>
              <text x="38" y="84">{Math.round((yMax * 2) / 3)}</text>
              <text x="38" y="134">{Math.round(yMax / 3)}</text>
              <text x="38" y="184">0</text>
            </g>

            {/* Area and Line Path */}
            {areaD && (
              <path
                d={areaD}
                fill="url(#trendGradient)"
                className="transition-all duration-300"
              />
            )}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Interactive Data Points */}
            <g>
              {coords.map((point, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                    const pt = e.currentTarget.ownerSVGElement.createSVGPoint();
                    pt.x = point.x;
                    pt.y = point.y;
                    const screenPt = pt.matrixTransform(e.currentTarget.ownerSVGElement.getScreenCTM());
                    setTooltipPos({
                      x: screenPt.x - rect.left,
                      y: screenPt.y - rect.top - 12,
                    });
                    setHoveredPoint(point);
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={point.x} cy={point.y} r="16" fill="transparent" />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint?.date === point.date ? "12" : "7"}
                    fill={pointHaloColor}
                    opacity={hoveredPoint?.date === point.date ? "0.45" : "0.2"}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint?.date === point.date ? "5.5" : "4"}
                    fill={pointHaloColor}
                    stroke={isDark ? "#071426" : "#FFFFFF"}
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* X-Axis Date Labels */}
        <div
          className={`relative w-full h-7 pt-2 text-[11px] font-mono border-t flex justify-between px-10 ${
            isDark
              ? "text-[#94A3B8] border-[#1A2E4C]"
              : "text-slate-500 border-slate-100"
          }`}
        >
          {coords.map((c, i) => (
            <span key={i} className="text-center">
              {c.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

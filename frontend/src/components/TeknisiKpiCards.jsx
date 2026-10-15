import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function TeknisiKpiCards({ data }) {
  const { isDark } = useTheme();

  const total = data?.total_requests ?? 5;
  const pending = data?.pending_requests ?? 2;
  const approved = data?.approved_requests ?? 2;
  const rejected = data?.rejected_requests ?? 1;

  // Color configs per card
  const cards = [
    {
      id: "total",
      title: "Total Pengajuan Saya",
      value: total,
      unit: "Unit",
      footer: "Jumlah pengajuan perpindahan yang Anda ajukan",
      icon: "send",
      color: "#1677FF",
      glowRgba: isDark ? "rgba(22,119,255,0.30)" : "rgba(22,119,255,0.15)",
      borderHover: isDark ? "#1677FF" : "#3b82f6",
      shadowHover: isDark
        ? "0 10px 25px rgba(22,119,255,0.30)"
        : "0 10px 25px rgba(37,99,235,0.18)",
    },
    {
      id: "pending",
      title: "Menunggu Persetujuan",
      value: pending,
      unit: "Pengajuan",
      footer: "Pengajuan yang masih diproses",
      icon: "schedule",
      color: "#F59E0B",
      glowRgba: isDark ? "rgba(245,158,11,0.30)" : "rgba(245,158,11,0.15)",
      borderHover: "#F59E0B",
      shadowHover: isDark
        ? "0 10px 25px rgba(245,158,11,0.30)"
        : "0 10px 25px rgba(245,158,11,0.18)",
    },
    {
      id: "approved",
      title: "Disetujui",
      value: approved,
      unit: "Pengajuan",
      footer: "Pengajuan yang telah disetujui",
      icon: "check_circle",
      color: "#10B981",
      glowRgba: isDark ? "rgba(16,185,129,0.30)" : "rgba(16,185,129,0.15)",
      borderHover: "#10B981",
      shadowHover: isDark
        ? "0 10px 25px rgba(16,185,129,0.30)"
        : "0 10px 25px rgba(16,185,129,0.18)",
    },
    {
      id: "rejected",
      title: "Ditolak",
      value: rejected,
      unit: "Pengajuan",
      footer: "Pengajuan yang ditolak",
      icon: "cancel",
      color: "#EF4444",
      glowRgba: isDark ? "rgba(239,68,68,0.30)" : "rgba(239,68,68,0.15)",
      borderHover: "#EF4444",
      shadowHover: isDark
        ? "0 10px 25px rgba(239,68,68,0.30)"
        : "0 10px 25px rgba(239,68,68,0.18)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <TeknisiStatCard key={card.id} card={card} isDark={isDark} />
      ))}
    </div>
  );
}

function TeknisiStatCard({ card, isDark }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between group transition-all duration-300"
      style={{
        background: isDark ? "#0D1F36" : "#ffffff",
        border: `1.5px solid ${hovered ? card.color : isDark ? "#1E3A5F" : "#e2e8f0"}`,
        boxShadow: hovered
          ? card.shadowHover
          : isDark
          ? "none"
          : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
        color: isDark ? "#E6EDF7" : "#0f172a",
      }}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300"
        style={{
          background: card.glowRgba,
          opacity: hovered ? 0.85 : 0.25,
        }}
      />

      {/* Top row: label dot + title + icon */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1 flex-1 min-w-0">
          {/* Dot + Label */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 pulse-glow"
              style={{ background: card.color }}
            />
            <span
              className="text-[11px] font-semibold tracking-wide uppercase truncate"
              style={{ color: isDark ? "#94A3B8" : "#64748b" }}
            >
              {card.title}
            </span>
          </div>

          {/* Value + Unit */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className="text-2xl font-bold tracking-tight leading-none"
              style={{ color: isDark ? "#E6EDF7" : "#0f172a" }}
            >
              {card.value}
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: card.color }}
            >
              {card.unit}
            </span>
          </div>
        </div>

        {/* Glowing icon bubble */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: `${card.color}22`,
            border: `1.5px solid ${card.color}55`,
            color: card.color,
            boxShadow: hovered
              ? `0 0 18px ${card.glowRgba}, 0 0 6px ${card.color}55`
              : `0 0 8px ${card.glowRgba}`,
          }}
        >
          <span className="material-symbols-outlined text-[22px]">
            {card.icon}
          </span>
        </div>
      </div>

      {/* Bottom footer */}
      <div
        className="mt-3 pt-2.5 border-t relative z-10"
        style={{ borderColor: isDark ? "#1A2E4C" : "#f1f5f9" }}
      >
        <span
          className="text-[11px] truncate block"
          style={{ color: isDark ? "#64748B" : "#94a3b8" }}
        >
          {card.footer}
        </span>
      </div>
    </div>
  );
}

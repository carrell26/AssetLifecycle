/**
 * Theme-aware class generator for Asset Lifecycle Dashboard.
 * All pages share the same Light/Dark visual language via this utility.
 *
 * Usage:
 *   import { t } from "../utils/themeClasses";
 *   className={t(isDark).card}
 */

export function t(isDark) {
  return {
    // ====================== TOAST ======================
    toastSuccess: isDark
      ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
      : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-lg",
    toastError: isDark
      ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
      : "bg-rose-50 border-rose-400 text-rose-700 shadow-lg",

    // ====================== STAT CARD INNER ======================
    statDot: (color = "cyan") => {
      const map = {
        cyan: isDark
          ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"
          : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
        green: isDark
          ? "bg-[#10B981] shadow-[0_0_8px_#10B981]"
          : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
        purple: isDark
          ? "bg-[#C084FC] shadow-[0_0_8px_#C084FC]"
          : "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]",
      };
      return map[color] || map.cyan;
    },
    statTitle: (color = "cyan") => {
      const map = {
        cyan: isDark ? "text-[#38BDF8]" : "text-blue-600",
        green: isDark ? "text-[#34D399]" : "text-emerald-600",
        purple: isDark ? "text-[#C084FC]" : "text-purple-600",
      };
      return map[color] || map.cyan;
    },
    statValue: isDark ? "text-[#F8FAFC]" : "text-slate-900",
    statBadge: (color = "cyan") => {
      const map = {
        cyan: isDark
          ? "bg-[#0F294D] text-[#38BDF8] border border-[#1E4378]"
          : "bg-blue-50 text-blue-600 border border-blue-200",
        green: isDark
          ? "bg-[#0A2E24] text-[#6EE7B7] border border-[#15604B]"
          : "bg-emerald-50 text-emerald-600 border border-emerald-200",
        purple: isDark
          ? "bg-[#24133F] text-[#D8B4FE] border border-[#4C2880]"
          : "bg-purple-50 text-purple-600 border border-purple-200",
      };
      return map[color] || map.cyan;
    },
    statSubtitle: isDark ? "text-[#94A3B8]" : "text-slate-500",
    statImgContainer: (color = "cyan") => {
      const map = {
        cyan: isDark
          ? "bg-[#071527] border-[#00E5FF]/40 shadow-[0_0_18px_rgba(0,229,255,0.22)] group-hover:border-[#00E5FF]/80"
          : "bg-slate-100 border-blue-300/40 shadow-sm group-hover:border-blue-400/80",
        green: isDark
          ? "bg-[#061814] border-[#10B981]/40 shadow-[0_0_18px_rgba(16,185,129,0.22)] group-hover:border-[#10B981]/80"
          : "bg-slate-100 border-emerald-300/40 shadow-sm group-hover:border-emerald-400/80",
        purple: isDark
          ? "bg-[#0F0B1E] border-[#C084FC]/40 shadow-[0_0_18px_rgba(192,132,252,0.22)] group-hover:border-[#C084FC]/80"
          : "bg-slate-100 border-purple-300/40 shadow-sm group-hover:border-purple-400/80",
      };
      return map[color] || map.cyan;
    },

    // ====================== TABLE ======================
    tableBorder: isDark ? "border-[#162F52]" : "border-slate-200",
    tableHeadRow: isDark
      ? "bg-[#09172A] border-b border-[#18355C]"
      : "bg-slate-50/80 border-b border-slate-200",
    tableHeadTh: isDark ? "text-[#38BDF8]" : "text-blue-600",
    tableBody: isDark ? "divide-[#132845]" : "divide-slate-100",
    tableRowHover: isDark
      ? "hover:bg-[#102444]/60"
      : "hover:bg-blue-50/50",
    tableCellPrimary: isDark ? "text-[#E6EDF7]" : "text-slate-800",
    tableCellBold: isDark ? "text-white" : "text-slate-900",
    tableCellSecondary: isDark ? "text-[#CBD5E1]" : "text-slate-600",
    tableCellMuted: isDark ? "text-[#94A3B8]" : "text-slate-500",
    tableCellAccent: isDark ? "text-[#38BDF8]" : "text-blue-600",
    tableCellWhite: isDark ? "text-[#F8FAFC]" : "text-slate-900",
    tableIconBox: isDark
      ? "bg-[#0D264A] text-[#38BDF8] border border-[#164375]"
      : "bg-blue-50 text-blue-600 border border-blue-200",
    tableBadge: isDark
      ? "bg-[#0C2548] border border-[#1A4378] text-[#38BDF8]"
      : "bg-blue-50 border border-blue-200 text-blue-700",
    tableSlotBadge: isDark
      ? "bg-[#0D2F54] border border-[#174F88] text-[#38BDF8]"
      : "bg-blue-50 border border-blue-200 text-blue-700",
    tableEmpty: isDark ? "text-[#94A3B8]" : "text-slate-500",

    // ====================== ACTION BUTTONS ======================
    btnDetail: isDark
      ? "bg-[#07383E] hover:bg-[#0A4E57] text-[#00E5FF] border border-[#0A545E]"
      : "bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200",
    btnEdit: isDark
      ? "bg-[#3D2C0D] hover:bg-[#523B11] text-[#FBBF24] border border-[#5E4413]"
      : "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200",
    btnDelete: isDark
      ? "bg-[#3C1318] hover:bg-[#541B22] text-[#F43F5E] border border-[#5C1D25]"
      : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200",

    // ====================== INFO BANNER ======================
    infoBannerText: isDark ? "text-[#38BDF8]" : "text-blue-600",
    infoBannerIcon: isDark ? "text-[#00E5FF]" : "text-blue-500",
    infoBannerValue: isDark ? "text-white" : "text-slate-900",

    // ====================== PAGINATION ======================
    paginText: isDark ? "text-[#94A3B8]" : "text-slate-500",
    paginValue: isDark ? "text-white" : "text-slate-900",
    paginDivider: isDark ? "text-[#1E3A5F]" : "text-slate-300",
    paginSelect: isDark
      ? "bg-[#0A182B] border border-[#1E3A5F] text-[#E6EDF7]"
      : "bg-white border border-slate-300 text-slate-700",
    paginBorder: isDark ? "border-[#162F52]" : "border-slate-200",
    paginBtn: isDark
      ? "bg-[#0A182B] border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50",
    paginBtnActive:
      "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30 border border-[#1677FF]",
    paginBtnInactive: isDark
      ? "bg-[#0A182B] border border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50",

    // ====================== MODAL ======================
    modalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn",
    modalBox: isDark
      ? "bg-[#0D1F36] border border-[#1E3A5F]"
      : "bg-white border border-slate-200 shadow-xl",
    modalDeleteBox: isDark
      ? "bg-[#0D1F36] border border-rose-500/40"
      : "bg-white border border-rose-300 shadow-xl",
    modalHeaderBorder: isDark ? "border-[#1A2E4C]" : "border-slate-200",
    modalTitle: isDark ? "text-white" : "text-slate-900",
    modalSubtitle: isDark ? "text-[#94A3B8]" : "text-slate-500",
    modalCloseBtn: isDark
      ? "text-[#94A3B8] hover:text-white hover:bg-[#1A2E4C]"
      : "text-slate-400 hover:text-slate-800 hover:bg-slate-100",
    modalInfoBg: isDark
      ? "bg-[#071426] border border-[#1A2E4C] text-[#CBD5E1]"
      : "bg-slate-50 border border-slate-200 text-slate-600",
    modalInfoLabel: isDark ? "text-[#94A3B8]" : "text-slate-500",
    modalInfoValue: isDark ? "text-white" : "text-slate-900",
    modalInfoAccent: isDark ? "text-[#38BDF8]" : "text-blue-600",
    modalFooterBorder: isDark ? "border-[#1A2E4C]" : "border-slate-200",
    modalCancelBtn: isDark
      ? "border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
      : "border-slate-300 text-slate-600 hover:bg-slate-100",
    modalDescText: isDark ? "text-[#94A3B8]" : "text-slate-500",

    // ====================== FORM ======================
    formLabel: isDark ? "text-[#CBD5E1]" : "text-slate-700",
    formInput: isDark
      ? "bg-[#071426] border-[#1E3A5F] text-white placeholder-[#64748B]"
      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400",
    formSelect: isDark
      ? "bg-[#071426] border-[#1E3A5F] text-white"
      : "bg-slate-50 border-slate-300 text-slate-900",
    formSelectPlaceholder: isDark ? "text-[#64748B]" : "text-slate-400",
    formSelectOption: isDark
      ? "text-white bg-[#071426]"
      : "text-slate-900 bg-white",

    // ====================== AUTOCOMPLETE ======================
    autocompleteBg: isDark
      ? "bg-[#0A182B] border-[#1E3A5F]"
      : "bg-white border-slate-200",
    autocompleteItem: isDark
      ? "hover:bg-[#122846] text-[#CBD5E1] hover:text-[#38BDF8]"
      : "hover:bg-blue-50 text-slate-600 hover:text-blue-600",
    autocompleteMuted: isDark ? "text-[#64748B]" : "text-slate-400",
    autocompleteManual: isDark ? "text-white" : "text-slate-900",

    // ====================== ERROR ALERT ======================
    errorAlert: isDark
      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
      : "bg-rose-50 border-rose-300 text-rose-600",

    // ====================== DETAIL MODAL SPEC ======================
    specGrid: isDark
      ? "bg-[#071426] border border-[#1A2E4C]"
      : "bg-slate-50 border border-slate-200",
    specLabel: isDark ? "text-[#94A3B8]" : "text-slate-500",
    specValue: isDark ? "text-white" : "text-slate-900",
    specAccent: isDark ? "text-[#38BDF8]" : "text-blue-600",
    specMono: isDark ? "text-[#38BDF8]" : "text-blue-600",
    specSecondary: isDark ? "text-[#CBD5E1]" : "text-slate-600",

    // ====================== DETAIL MODULE TABLE ======================
    detailTableHead: isDark
      ? "bg-[#09172A] text-[#94A3B8]"
      : "bg-slate-50 text-slate-500",
    detailTableBody: isDark
      ? "divide-[#132845] text-[#CBD5E1]"
      : "divide-slate-100 text-slate-600",
    detailTableRowHover: isDark
      ? "hover:bg-[#102444]/40"
      : "hover:bg-blue-50/40",
    detailEmpty: isDark
      ? "bg-[#071426] border border-[#1A2E4C] text-[#94A3B8]"
      : "bg-slate-50 border border-slate-200 text-slate-500",

    // ====================== SECTION TITLE ======================
    sectionTitle: isDark ? "text-[#38BDF8]" : "text-blue-600",

    // ====================== KONDISI BADGES ======================
    badgeAktif: isDark
      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
      : "bg-emerald-50 text-emerald-600 border border-emerald-200",
    badgeInactive: isDark
      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      : "bg-amber-50 text-amber-600 border border-amber-200",
  };
}

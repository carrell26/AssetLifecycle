import React from "react";

export default function TablePagination({
  page = 1,
  perPage = 15,
  totalCount = 0,
  onPageChange,
  onPerPageChange,
  isDark = true,
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalCount === 0 ? 0 : (safePage - 1) * perPage + 1;
  const endItem = Math.min(totalCount, safePage * perPage);

  // Generate page numbers (max 5 visible)
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (safePage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      safePage - 2,
      safePage - 1,
      safePage,
      safePage + 1,
      safePage + 2,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-3 border-t text-xs ${
        isDark ? "border-[#162F52] text-[#94A3B8]" : "border-slate-200 text-slate-500"
      }`}
    >
      {/* Range Info & Per Page selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span>Menampilkan baris</span>
        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
          {startItem} - {endItem}
        </span>
        <span>dari</span>
        <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
          {totalCount}
        </span>
        <span>data</span>

        <span className={`mx-2 ${isDark ? "text-[#1E3A5F]" : "text-slate-300"}`}>|</span>

        <label className="flex items-center gap-1.5">
          <span>Per halaman:</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className={`rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer border ${
              isDark
                ? "bg-[#0A182B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF]"
                : "bg-white border-slate-300 text-slate-800 focus:border-blue-500"
            }`}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {/* Pagination page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          title="Halaman Sebelumnya"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">chevron_left</span>
        </button>

        {pageNumbers.map((p) => {
          const isActive = p === safePage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/30 border border-[#1677FF]"
                  : isDark
                  ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          title="Halaman Berikutnya"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-[#0A182B] border-[#1E3A5F] text-[#CBD5E1] hover:bg-[#122846]"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

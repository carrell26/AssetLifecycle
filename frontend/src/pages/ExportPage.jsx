import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ExportPage({ user }) {
  const { isDark } = useTheme();

  // Filter States
  const [locations, setLocations] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [moduleTypes, setModuleTypes] = useState([]);

  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState("");
  const [selectedModuleTypeId, setSelectedModuleTypeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Summary & Format States
  const [totalMovements, setTotalMovements] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState("< 1 MB");
  const [fileFormat, setFileFormat] = useState("xlsx"); // "xlsx" | "csv"

  // UI States
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch initial master data & count
  const fetchFilterData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const params = new URLSearchParams();
      params.append("format", "json");
      if (selectedLocationId) params.append("location_id", selectedLocationId);
      if (selectedDeviceTypeId) params.append("device_type_id", selectedDeviceTypeId);
      if (selectedModuleTypeId) params.append("module_type_id", selectedModuleTypeId);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const res = await fetch(`/export/?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      const data = await res.json();
      if (data.success) {
        if (isInitial) {
          setLocations(data.locations || []);
          setDeviceTypes(data.device_types || []);
          setModuleTypes(data.module_types || []);
          setTotalMovements(data.total_movements || 0);
        }
        setFilteredCount(data.filtered_count ?? data.total_movements ?? 0);
        setEstimatedSize(data.estimated_size || "< 1 MB");
      } else {
        showToast(data.error || "Gagal memuat data filter export.", "error");
      }
    } catch (err) {
      console.error("Gagal mengambil data export:", err);
      showToast("Terjadi gangguan koneksi saat mengambil data export.", "error");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [selectedLocationId, selectedDeviceTypeId, selectedModuleTypeId, dateFrom, dateTo]);

  // Initial load
  useEffect(() => {
    fetchFilterData(true);
  }, []);

  // Update count when filters change
  useEffect(() => {
    fetchFilterData(false);
  }, [selectedLocationId, selectedDeviceTypeId, selectedModuleTypeId, dateFrom, dateTo, fetchFilterData]);

  // Handle Reset Filter
  const handleResetFilter = () => {
    setSelectedLocationId("");
    setSelectedDeviceTypeId("");
    setSelectedModuleTypeId("");
    setDateFrom("");
    setDateTo("");
    setFileFormat("xlsx");
    showToast("Filter berhasil dikembalikan ke kondisi awal.", "info");
  };

  // Handle Download (Excel or CSV)
  const handleDownload = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      showToast("Rentang tanggal tidak valid: 'Dari Tanggal' melebihi 'Sampai Tanggal'.", "error");
      return;
    }

    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.append("format", fileFormat);
      if (selectedLocationId) params.append("location_id", selectedLocationId);
      if (selectedDeviceTypeId) params.append("device_type_id", selectedDeviceTypeId);
      if (selectedModuleTypeId) params.append("module_type_id", selectedModuleTypeId);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const downloadUrl = `/export/download?${params.toString()}`;

      // Trigger native browser download via anchor element
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Mengunduh data riwayat modul (${fileFormat.toUpperCase()})...`, "success");
    } catch (err) {
      console.error("Gagal mengunduh file:", err);
      showToast("Gagal mengunduh file ekspor.", "error");
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 pb-12 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slideIn ${
            toast.type === "success"
              ? isDark
                ? "bg-[#06241E] border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-lg"
              : toast.type === "info"
              ? isDark
                ? "bg-[#0A2540] border-cyan-500/50 text-cyan-300 shadow-cyan-950/40"
                : "bg-blue-50 border-blue-400 text-blue-700 shadow-lg"
              : isDark
              ? "bg-[#2A0E12] border-rose-500/50 text-rose-300 shadow-rose-950/40"
              : "bg-rose-50 border-rose-400 text-rose-700 shadow-lg"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success"
              ? "check_circle"
              : toast.type === "info"
              ? "info"
              : "error"}
          </span>
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2-Column Layout Sesuai Screenshot Referensi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ======================================================== */}
        {/* KOLOM KIRI: FILTER EXPORT                                */}
        {/* ======================================================== */}
        <div
          className={`rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div>
            {/* Header Filter Export */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="material-symbols-outlined text-[22px] text-[#38BDF8]">
                settings
              </span>
              <h2
                className={`text-base font-bold tracking-tight ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-800"
                }`}
              >
                Filter Export
              </h2>
            </div>

            {/* Kotak Bagian 1: Dropdown Filters (Lokasi, Tipe Perangkat, Tipe Modul) */}
            <div
              className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                isDark
                  ? "bg-[#071426]/75 border-[#1E3A5F]"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              {/* Field 1: Lokasi */}
              <div>
                <label
                  htmlFor="export-location"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Lokasi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B] pointer-events-none">
                    location_on
                  </span>
                  <select
                    id="export-location"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Semua lokasi</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.nama_lokasi}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#64748B] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Field 2: Tipe Perangkat */}
              <div>
                <label
                  htmlFor="export-device-type"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Tipe Perangkat
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B] pointer-events-none">
                    router
                  </span>
                  <select
                    id="export-device-type"
                    value={selectedDeviceTypeId}
                    onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Semua tipe perangkat</option>
                    {deviceTypes.map((type) => (
                      <option key={type.device_type_id} value={type.device_type_id}>
                        {type.nama_tipe}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#64748B] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Field 3: Tipe Modul */}
              <div>
                <label
                  htmlFor="export-module-type"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#94A3B8]" : "text-slate-600"
                  }`}
                >
                  Tipe Modul
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B] pointer-events-none">
                    memory
                  </span>
                  <select
                    id="export-module-type"
                    value={selectedModuleTypeId}
                    onChange={(e) => setSelectedModuleTypeId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                        : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Semua tipe modul</option>
                    {moduleTypes.map((mt) => (
                      <option key={mt.module_type_id} value={mt.module_type_id}>
                        {mt.nama_tipe}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#64748B] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Kotak Bagian 2: Rentang Tanggal (Dari Tanggal, Sampai Tanggal) */}
            <div
              className={`mt-4 rounded-2xl border p-5 transition-colors ${
                isDark
                  ? "bg-[#071426]/75 border-[#1E3A5F]"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dari Tanggal */}
                <div>
                  <label
                    htmlFor="export-date-from"
                    className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? "text-[#94A3B8]" : "text-slate-600"
                    }`}
                  >
                    Dari Tanggal
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B] pointer-events-none">
                      calendar_today
                    </span>
                    <input
                      type="date"
                      id="export-date-from"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={`w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${
                        isDark
                          ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                          : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Sampai Tanggal */}
                <div>
                  <label
                    htmlFor="export-date-to"
                    className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? "text-[#94A3B8]" : "text-slate-600"
                    }`}
                  >
                    Sampai Tanggal
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B] pointer-events-none">
                      calendar_today
                    </span>
                    <input
                      type="date"
                      id="export-date-to"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={`w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${
                        isDark
                          ? "bg-[#0B172B] border-[#1E3A5F] text-[#E6EDF7] focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]"
                          : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM KANAN: PRATINJAU & RINGKASAN                       */}
        {/* ======================================================== */}
        <div
          className={`rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between ${
            isDark
              ? "bg-[#0D1F36] border-[#1E3A5F] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div>
            {/* Header Pratinjau & Ringkasan */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="material-symbols-outlined text-[22px] text-[#38BDF8]">
                visibility
              </span>
              <h2
                className={`text-base font-bold tracking-tight ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-800"
                }`}
              >
                Pratinjau &amp; Ringkasan
              </h2>
            </div>

            {/* Kotak Pratinjau Utama: Count + Info Card */}
            <div
              className={`rounded-2xl border p-6 transition-colors ${
                isDark
                  ? "bg-[#071426]/75 border-[#1E3A5F]"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Bagian Kiri Kotak: Pratinjau Status Riwayat & Angka */}
                <div className="flex flex-col justify-center">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? "text-[#94A3B8]" : "text-slate-500"
                    }`}
                  >
                    Pratinjau Status Riwayat
                  </span>
                  <div className="text-5xl font-black text-[#38BDF8] tracking-tight my-2">
                    {loading ? (
                      <span className="animate-pulse opacity-60">...</span>
                    ) : (
                      filteredCount
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isDark ? "text-[#94A3B8]" : "text-slate-500"
                    }`}
                  >
                    Total Aktivitas Tercatat
                  </span>
                </div>

                {/* Bagian Kanan Kotak: Info Card Notifikasi */}
                <div
                  className={`rounded-xl p-4 border flex flex-col justify-center transition-all ${
                    isDark
                      ? "bg-[#0B1A30]/80 border-[#1E3A5F]/80 text-[#94A3B8]"
                      : "bg-blue-50/70 border-blue-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#38BDF8]">
                      info
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isDark ? "text-[#E6EDF7]" : "text-slate-800"
                      }`}
                    >
                      Info
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Membatasi data berdasarkan rentang waktu dapat mempercepat pengunduhan.
                  </p>
                </div>
              </div>
            </div>

            {/* Estimasi Ukuran File */}
            <div className="mt-6 flex items-center text-xs font-medium text-[#94A3B8]">
              <span>Estimasi Ukuran File:&nbsp;</span>
              <strong className={isDark ? "text-[#E6EDF7]" : "text-slate-800"}>
                {estimatedSize}
              </strong>
            </div>

            {/* Pilihan Format File: XLSX | CSV */}
            <div className="mt-5 flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  isDark ? "text-[#E6EDF7]" : "text-slate-700"
                }`}
              >
                Format File
              </span>
              <div
                className={`inline-flex rounded-xl p-1 border transition-colors ${
                  isDark
                    ? "bg-[#071426] border-[#1E3A5F]"
                    : "bg-slate-100 border-slate-300"
                }`}
              >
                <button
                  type="button"
                  id="btn-format-xlsx"
                  onClick={() => setFileFormat("xlsx")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fileFormat === "xlsx"
                      ? "bg-[#1677FF] text-white shadow-[0_0_15px_rgba(22,119,255,0.6)]"
                      : isDark
                      ? "text-[#94A3B8] hover:text-[#E6EDF7]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  XLSX
                </button>
                <button
                  type="button"
                  id="btn-format-csv"
                  onClick={() => setFileFormat("csv")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fileFormat === "csv"
                      ? "bg-[#1677FF] text-white shadow-[0_0_15px_rgba(22,119,255,0.6)]"
                      : isDark
                      ? "text-[#94A3B8] hover:text-[#E6EDF7]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Tombol Aksi: + Download Excel / CSV & Reset Filter */}
          <div className="mt-8 pt-4 flex items-center justify-end gap-3 border-t border-transparent">
            <button
              type="button"
              id="btn-download-export"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1677FF] hover:bg-[#1677FF]/90 shadow-[0_0_20px_rgba(22,119,255,0.45)] hover:shadow-[0_0_25px_rgba(22,119,255,0.65)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">
                {downloading ? "hourglass_top" : "add"}
              </span>
              <span>
                {downloading
                  ? "Mengunduh..."
                  : fileFormat === "csv"
                  ? "+ Download CSV"
                  : "+ Download Excel"}
              </span>
            </button>
            <button
              type="button"
              id="btn-reset-filter"
              onClick={handleResetFilter}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? "bg-[#0B172B] hover:bg-[#162C4E] border-[#1E3A5F] text-[#94A3B8] hover:text-[#E6EDF7]"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              }`}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  Settings,
  Eye,
  MapPin,
  Server,
  Cpu,
  Calendar,
  ChevronDown,
  Info,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

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

  // Refs for Date Inputs
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);

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

  // Fetch initial master data & count from backend API
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
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : toast.type === "info" ? (
            <Info className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 cursor-pointer text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column Layout Sesuai Patokan Desain Gambar 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ======================================================== */}
        {/* KOLOM KIRI: FILTER EXPORT                                */}
        {/* ======================================================== */}
        <div
          className={`rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between h-full ${
            isDark
              ? "bg-[#09172B] border-[#133A63] shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_20px_rgba(14,64,115,0.15)]"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div>
            {/* Header Filter Export */}
            <div className="flex items-center gap-2.5 mb-5">
              <Settings className="w-5 h-5 text-[#38BDF8]" />
              <h2
                className={`text-[15px] font-bold tracking-tight ${
                  isDark ? "text-[#F1F5F9]" : "text-slate-800"
                }`}
              >
                Filter Export
              </h2>
            </div>

            {/* Kotak Bagian 1: Dropdown Filters (Lokasi, Tipe Perangkat, Tipe Modul) */}
            <div
              className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                isDark
                  ? "bg-[#061222]/95 border-[#143255]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {/* Field 1: Lokasi */}
              <div>
                <label
                  htmlFor="export-location"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#8FA0B5]" : "text-slate-600"
                  }`}
                >
                  Lokasi
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#476A8F] pointer-events-none" />
                  <select
                    id="export-location"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#071629] border-[#163861] text-[#C5D3E8] hover:border-[#225088] focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]"
                        : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="" className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}>
                      Semua lokasi
                    </option>
                    {locations.map((loc) => (
                      <option
                        key={loc.location_id}
                        value={loc.location_id}
                        className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}
                      >
                        {loc.nama_lokasi}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6F86] pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Tipe Perangkat (Icon Server Rack) */}
              <div>
                <label
                  htmlFor="export-device-type"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#8FA0B5]" : "text-slate-600"
                  }`}
                >
                  Tipe Perangkat
                </label>
                <div className="relative flex items-center">
                  <Server className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#476A8F] pointer-events-none" />
                  <select
                    id="export-device-type"
                    value={selectedDeviceTypeId}
                    onChange={(e) => setSelectedDeviceTypeId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#071629] border-[#163861] text-[#C5D3E8] hover:border-[#225088] focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]"
                        : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="" className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}>
                      Semua tipe perangkat
                    </option>
                    {deviceTypes.map((type) => (
                      <option
                        key={type.device_type_id}
                        value={type.device_type_id}
                        className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}
                      >
                        {type.nama_tipe}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6F86] pointer-events-none" />
                </div>
              </div>

              {/* Field 3: Tipe Modul (Icon CPU Microchip) */}
              <div>
                <label
                  htmlFor="export-module-type"
                  className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-[#8FA0B5]" : "text-slate-600"
                  }`}
                >
                  Tipe Modul
                </label>
                <div className="relative flex items-center">
                  <Cpu className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#476A8F] pointer-events-none" />
                  <select
                    id="export-module-type"
                    value={selectedModuleTypeId}
                    onChange={(e) => setSelectedModuleTypeId(e.target.value)}
                    className={`w-full h-11 pl-10 pr-9 rounded-xl border text-xs font-medium transition-all appearance-none cursor-pointer outline-none ${
                      isDark
                        ? "bg-[#071629] border-[#163861] text-[#C5D3E8] hover:border-[#225088] focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]"
                        : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    }`}
                  >
                    <option value="" className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}>
                      Semua tipe modul
                    </option>
                    {moduleTypes.map((mt) => (
                      <option
                        key={mt.module_type_id}
                        value={mt.module_type_id}
                        className={isDark ? "bg-[#071629] text-[#C5D3E8]" : "bg-white text-slate-800"}
                      >
                        {mt.nama_tipe}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6F86] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Kotak Bagian 2: Rentang Tanggal (Dari Tanggal, Sampai Tanggal) */}
            <div
              className={`mt-4 rounded-2xl border p-5 transition-colors ${
                isDark
                  ? "bg-[#061222]/95 border-[#143255]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dari Tanggal: SATU-SATUNYA IKON DI KIRI, WARNA SESUAI TEMA */}
                <div>
                  <label
                    htmlFor="export-date-from"
                    className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? "text-[#8FA0B5]" : "text-slate-600"
                    }`}
                  >
                    Dari Tanggal
                  </label>
                  <div className="relative flex items-center group">
                    <Calendar
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                        isDark ? "text-[#476A8F] group-hover:text-[#38BDF8]" : "text-slate-400 group-hover:text-blue-500"
                      }`}
                    />
                    <input
                      type="date"
                      id="export-date-from"
                      ref={dateFromRef}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className={`export-date-input w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${
                        isDark
                          ? "bg-[#071629] border-[#163861] text-[#C5D3E8] hover:border-[#225088] focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]"
                          : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Sampai Tanggal: SATU-SATUNYA IKON DI KIRI, WARNA SESUAI TEMA */}
                <div>
                  <label
                    htmlFor="export-date-to"
                    className={`block text-xs font-semibold mb-1.5 ${
                      isDark ? "text-[#8FA0B5]" : "text-slate-600"
                    }`}
                  >
                    Sampai Tanggal
                  </label>
                  <div className="relative flex items-center group">
                    <Calendar
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                        isDark ? "text-[#476A8F] group-hover:text-[#38BDF8]" : "text-slate-400 group-hover:text-blue-500"
                      }`}
                    />
                    <input
                      type="date"
                      id="export-date-to"
                      ref={dateToRef}
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className={`export-date-input w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-medium transition-all outline-none cursor-pointer ${
                        isDark
                          ? "bg-[#071629] border-[#163861] text-[#C5D3E8] hover:border-[#225088] focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF]"
                          : "bg-white border-slate-300 text-slate-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
          className={`rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between h-full ${
            isDark
              ? "bg-[#09172B] border-[#133A63] shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_20px_rgba(14,64,115,0.15)]"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div>
            {/* Header Pratinjau & Ringkasan */}
            <div className="flex items-center gap-2.5 mb-5">
              <Eye className="w-5 h-5 text-[#38BDF8]" />
              <h2
                className={`text-[15px] font-bold tracking-tight ${
                  isDark ? "text-[#F1F5F9]" : "text-slate-800"
                }`}
              >
                Pratinjau &amp; Ringkasan
              </h2>
            </div>

            {/* Kotak Pratinjau Utama: Count + Info Card */}
            <div
              className={`rounded-2xl border p-6 transition-colors ${
                isDark
                  ? "bg-[#061222]/95 border-[#143255]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Bagian Kiri Kotak: Pratinjau Status Riwayat & Angka */}
                <div className="flex flex-col justify-center">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? "text-[#8FA0B5]" : "text-slate-500"
                    }`}
                  >
                    Pratinjau Status Riwayat
                  </span>
                  <div className="text-[52px] font-black text-[#00BFFF] tracking-tight my-1.5 leading-none">
                    {loading ? (
                      <span className="animate-pulse opacity-60">...</span>
                    ) : (
                      filteredCount
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isDark ? "text-[#8FA0B5]" : "text-slate-500"
                    }`}
                  >
                    Total Aktivitas Tercatat
                  </span>
                </div>

                {/* Bagian Kanan Kotak: Info Card Notifikasi */}
                <div
                  className={`rounded-xl p-4 border flex flex-col justify-center transition-all ${
                    isDark
                      ? "bg-[#071933]/90 border-[#133A63] text-[#7E95AD]"
                      : "bg-blue-50/70 border-blue-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Info className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span
                      className={`text-xs font-bold ${
                        isDark ? "text-[#F1F5F9]" : "text-slate-800"
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
            <div className="mt-6 flex items-center text-xs font-medium text-[#8FA0B5]">
              <span>Estimasi Ukuran File:&nbsp;</span>
              <strong className={isDark ? "text-[#F1F5F9] font-bold" : "text-slate-800 font-bold"}>
                {estimatedSize}
              </strong>
            </div>

            {/* Pilihan Format File: XLSX | CSV */}
            <div className="mt-5 flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  isDark ? "text-[#F1F5F9]" : "text-slate-700"
                }`}
              >
                Format File
              </span>
              <div
                className={`inline-flex rounded-xl p-1 border transition-colors ${
                  isDark
                    ? "bg-[#050E1B] border-[#143255]"
                    : "bg-slate-100 border-slate-300"
                }`}
              >
                <button
                  type="button"
                  id="btn-format-xlsx"
                  onClick={() => setFileFormat("xlsx")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fileFormat === "xlsx"
                      ? "bg-[#0088FF] text-white shadow-[0_0_16px_rgba(0,136,255,0.65)]"
                      : isDark
                      ? "text-[#64748B] hover:text-[#94A3B8]"
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
                      ? "bg-[#0088FF] text-white shadow-[0_0_16px_rgba(0,136,255,0.65)]"
                      : isDark
                      ? "text-[#64748B] hover:text-[#94A3B8]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Tombol Aksi: + Download Excel / CSV & Reset Filter */}
          <div className="mt-8 pt-4 flex items-center justify-end gap-3.5 border-t border-transparent">
            <button
              type="button"
              id="btn-download-export"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0088FF] hover:bg-[#007AE6] shadow-[0_0_20px_rgba(0,136,255,0.5)] hover:shadow-[0_0_26px_rgba(0,136,255,0.7)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {downloading
                  ? "Mengunduh..."
                  : fileFormat === "csv"
                  ? "Download CSV"
                  : "Download Excel"}
              </span>
            </button>
            <button
              type="button"
              id="btn-reset-filter"
              onClick={handleResetFilter}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? "bg-[#071629] hover:bg-[#0D2442] border-[#163861] hover:border-[#225088] text-[#8FA0B5] hover:text-[#F1F5F9]"
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

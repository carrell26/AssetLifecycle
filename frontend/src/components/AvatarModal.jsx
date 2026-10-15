import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function AvatarModal({ isOpen, onClose, onAvatarUpdated }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'file'
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up camera stream on unmount or close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg("Tidak dapat mengakses kamera. Pastikan izin kamera aktif.");
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    // Crop center square
    const vWidth = videoRef.current.videoWidth;
    const vHeight = videoRef.current.videoHeight;
    const size = Math.min(vWidth, vHeight);
    const startX = (vWidth - size) / 2;
    const startY = (vHeight - size) / 2;

    ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let res;
      if (activeTab === "camera" && capturedImage) {
        res = await fetch("/api/me/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: capturedImage }),
        });
      } else if (activeTab === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        res = await fetch("/api/me/avatar", {
          method: "POST",
          body: formData,
        });
      } else {
        setErrorMsg("Pilih gambar terlebih dahulu");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Foto profil berhasil diperbarui!");
        if (onAvatarUpdated) {
          onAvatarUpdated(data.avatar_url);
        }
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Gagal mengunggah foto profil");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all transform ${
          isDark
            ? "bg-[#0D1F36] border-[#1E3A5F] text-[#E6EDF7]"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[22px] ${
                isDark ? "text-[#38BDF8]" : "text-[#EE2E24]"
              }`}
            >
              photo_camera
            </span>
            <h3 className="text-base font-semibold">Ubah Foto Profil</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              setCapturedImage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "camera"
                ? isDark
                  ? "bg-[#1677FF] text-white"
                  : "bg-[#EE2E24] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            Kamera Langsung
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
              stopCamera();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "file"
                ? isDark
                  ? "bg-[#1677FF] text-white"
                  : "bg-[#EE2E24] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Unggah File / Galeri
          </button>
        </div>

        {/* Content Area */}
        <div className="my-5 flex flex-col items-center justify-center">
          {activeTab === "camera" ? (
            <div className="w-full flex flex-col items-center">
              {capturedImage ? (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Snapshot Preview"
                    className="w-48 h-48 rounded-full object-cover ring-4 ring-[#1677FF] shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                    className="mt-3 px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-1 mx-auto"
                  >
                    <span className="material-symbols-outlined text-[14px]">replay</span>
                    Ambil Ulang
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-56 h-56 rounded-full overflow-hidden bg-black ring-2 ring-slate-600 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraActive && (
                      <span className="absolute text-xs text-slate-400 px-4 text-center">
                        Mengaktifkan kamera...
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={!cameraActive}
                    className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
                      isDark
                        ? "bg-[#1677FF] hover:bg-[#38BDF8] text-white"
                        : "bg-[#EE2E24] hover:bg-[#D31F17] text-white"
                    } disabled:opacity-50`}
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Ambil Foto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview File"
                    className="w-48 h-48 rounded-full object-cover ring-4 ring-[#1677FF] shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Ganti File
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDark
                      ? "border-slate-700 hover:border-[#1677FF] bg-slate-800/20"
                      : "border-slate-300 hover:border-[#EE2E24] bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px] text-slate-400">
                    add_photo_alternate
                  </span>
                  <p className="text-xs font-medium mt-2">Klik untuk memilih foto</p>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau WEBP</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/30">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isSubmitting ||
              (activeTab === "camera" && !capturedImage) ||
              (activeTab === "file" && !selectedFile)
            }
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isDark
                ? "bg-[#1677FF] hover:bg-blue-600 text-white shadow-lg shadow-[#1677FF]/30"
                : "bg-[#EE2E24] hover:bg-red-700 text-white shadow-lg shadow-[#EE2E24]/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin material-symbols-outlined text-[16px]">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Simpan Foto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

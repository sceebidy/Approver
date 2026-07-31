"use client";

import { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calculator, AlertCircle } from "lucide-react";
import { getXsrfToken } from "@/lib/csrf";

export interface VerfAnggaranData {
  id?: number;
  ppab_id?: number;
  no_ppab?: string;
  sumber_rek: string;
  beban_rek: string;
  rkap_1_tahun: number | string;
  realisasi: number | string;
  permintaan: number | string;
  sisa_anggaran: number | string;
}

interface VerfAnggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  ppabId: number;
  existingData?: VerfAnggaranData | null;
  onSuccess: (updatedData: VerfAnggaranData) => void;
}

export default function VerfAnggaranModal({
  isOpen,
  onClose,
  ppabId,
  existingData,
  onSuccess,
}: VerfAnggaranModalProps) {
  const [formData, setFormData] = useState<VerfAnggaranData>({
    sumber_rek: "investasi",
    beban_rek: "",
    rkap_1_tahun: "",
    realisasi: "",
    permintaan: "",
    sisa_anggaran: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingData) {
      setFormData({
        sumber_rek: existingData.sumber_rek || "investasi",
        beban_rek: existingData.beban_rek || "",
        rkap_1_tahun: existingData.rkap_1_tahun ?? "",
        realisasi: existingData.realisasi ?? "",
        permintaan: existingData.permintaan ?? "",
        sisa_anggaran: existingData.sisa_anggaran ?? "",
      });
    } else {
      setFormData({
        sumber_rek: "investasi",
        beban_rek: "",
        rkap_1_tahun: "",
        realisasi: "",
        permintaan: "",
        sisa_anggaran: "",
      });
    }
    setError(null);
  }, [existingData, isOpen]);

  // Otomatis hitung sisa anggaran = RKAP - Realisasi - Permintaan (opsional pertolongan hitung)
  const calculateSisa = () => {
    const rkap = parseFloat(String(formData.rkap_1_tahun)) || 0;
    const realisasi = parseFloat(String(formData.realisasi)) || 0;
    const permintaan = parseFloat(String(formData.permintaan)) || 0;
    const sisa = rkap - realisasi - permintaan;
    setFormData((prev) => ({ ...prev, sisa_anggaran: sisa }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.beban_rek.trim()) {
      setError("Beban Rekening wajib diisi.");
      return;
    }
    if (formData.rkap_1_tahun === "" || formData.realisasi === "" || formData.permintaan === "" || formData.sisa_anggaran === "") {
      setError("Semua nilai angka anggaran wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";
      const res = await fetch(`${apiUrl}/ppab/${ppabId}/verf-anggaran`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        body: JSON.stringify({
          sumber_rek: formData.sumber_rek,
          beban_rek: formData.beban_rek.trim(),
          rkap_1_tahun: parseFloat(String(formData.rkap_1_tahun)) || 0,
          realisasi: parseFloat(String(formData.realisasi)) || 0,
          permintaan: parseFloat(String(formData.permintaan)) || 0,
          sisa_anggaran: parseFloat(String(formData.sisa_anggaran)) || 0,
        }),
        credentials: "include",
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || `Gagal menyimpan Verifikasi Anggaran (${res.status})`);
      }

      onSuccess(resData.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" aria-modal role="dialog">
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Form Verifikasi Anggaran</h3>
              <p className="text-xs text-slate-500">Lengkapi rincian anggaran untuk dokumen PPAB ini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sumber Rekening */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Sumber Rekening <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs font-medium transition-all ${
                  formData.sumber_rek === "investasi"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="sumber_rek"
                  value="investasi"
                  checked={formData.sumber_rek === "investasi"}
                  onChange={(e) => setFormData({ ...formData, sumber_rek: e.target.value })}
                  className="sr-only"
                />
                Investasi
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs font-medium transition-all ${
                  formData.sumber_rek === "eksploitasi"
                    ? "border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="sumber_rek"
                  value="eksploitasi"
                  checked={formData.sumber_rek === "eksploitasi"}
                  onChange={(e) => setFormData({ ...formData, sumber_rek: e.target.value })}
                  className="sr-only"
                />
                Eksploitasi
              </label>
            </div>
          </div>

          {/* Beban Rekening */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Beban Rekening <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.beban_rek}
              onChange={(e) => setFormData({ ...formData, beban_rek: e.target.value })}
              placeholder="Masukkan kode/pos beban rekening..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Grid Anggaran (RKAP, Realisasi, Permintaan, Sisa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RKAP 1 Tahun <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rkap_1_tahun}
                  onChange={(e) => setFormData({ ...formData, rkap_1_tahun: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Realisasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.realisasi}
                  onChange={(e) => setFormData({ ...formData, realisasi: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permintaan Saat Ini <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.permintaan}
                  onChange={(e) => setFormData({ ...formData, permintaan: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Sisa Anggaran <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={calculateSisa}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  title="Hitung otomatis: RKAP - Realisasi - Permintaan"
                >
                  <Calculator size={11} /> Hitung Sisa
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sisa_anggaran}
                  onChange={(e) => setFormData({ ...formData, sisa_anggaran: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Simpan Verifikasi Anggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

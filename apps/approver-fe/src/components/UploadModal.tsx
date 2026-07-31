"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X, UploadCloud, Loader2, AlertCircle, FileText, CheckCircle2, FileUp, Plus } from "lucide-react";
import SsoUserPicker from "@/components/SsoUserPicker";
import {
  collectApproversFromData,
  formatApproverFieldLabel,
  isApproverFieldKey,
} from "@/lib/employees";
import { refreshCsrfCookie } from "@/lib/csrf";

/**
 * Cek apakah field merepresentasikan nominal uang agar bisa diformat.
 */
function isMoneyField(key?: string) {
  if (!key) return false;
  const k = key.toLowerCase();
  return k.includes('harga') || k.includes('jumlah') || k.includes('amount') || k.includes('total') || k.includes('ppn') || k.includes('subtotal') || k.includes('nominal');
}

/**
 * Format angka ke format uang dengan pemisah ribuan (titik).
 */
function formatMoney(value: any) {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? Number(value.replace(/[^0-9.-]+/g, "")) : Number(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parsing kembali dari string berformat uang ke string angka agar mudah disimpan/dihitung.
 */
function parseMoney(value: string) {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Menormalisasi payload hasil ekstraksi PDF ke format yang diharapkan backend.
 * Setiap docType memiliki mapping field yang berbeda antara extractor dan controller.
 */
function buildPayload(docType: 'ppab' | 'po' | 'mis', raw: any): any {
  if (docType === 'mis') {
    // Extractor output: { nomor_mis, tgl_mis, items: [{no, desc, satuan, qty (string)}], approval, ... }
    // Backend expects: { nomor_mis (required string), tgl_mis (required string dd/mm/YYYY or Y-m-d),
    //                    items: [{desc (required), satuan (required), qty (required numeric), remark (nullable)}] }
    const items = Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          desc: item.desc ?? '',
          satuan: item.satuan ?? '',
          // qty bisa berupa string "10.000" (Indonesia ribuan) atau "10,000" dari extractor.
          // Logika: jika ada koma → koma=desimal, titik=ribuan (Indonesia)
          //         jika hanya titik → cek posisinya: jika tepat 3 digit setelah titik → ribuan, jika tidak → desimal
          qty: (() => {
            const raw = String(item.qty ?? '0');
            if (!raw || raw === '0') return 0;
            if (raw.includes(',') && raw.includes('.')) {
              // Format Indonesia: 10.000,50 → hapus titik, ganti koma jadi titik
              return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
            }
            if (raw.includes(',') && !raw.includes('.')) {
              // Mungkin: 10,000 (English) atau 10,5 (Indonesia desimal)
              const commaIdx = raw.lastIndexOf(',');
              const afterComma = raw.slice(commaIdx + 1);
              if (afterComma.length === 3 && !afterComma.includes(',')) {
                // 10,000 → English ribuan
                return parseFloat(raw.replace(/,/g, '')) || 0;
              }
              // 10,5 → Indonesia desimal
              return parseFloat(raw.replace(',', '.')) || 0;
            }
            if (raw.includes('.') && !raw.includes(',')) {
              const dotIdx = raw.lastIndexOf('.');
              const afterDot = raw.slice(dotIdx + 1);
              if (afterDot.length === 3) {
                // "10.000" → titik adalah ribuan → 10000
                return parseFloat(raw.replace(/\./g, '')) || 0;
              }
              // "10.5" → titik adalah desimal
              return parseFloat(raw) || 0;
            }
            return parseFloat(raw) || 0;
          })(),
          remark: item.remark ?? null,
        }))
      : [];

    return {
      nomor_mis: raw.nomor_mis ?? '',
      tgl_mis: raw.tgl_mis ?? '',
      items,
      // approver_lines tidak di-include dari hasil ekstraksi (nullable di backend)
    };
  }

  if (docType === 'ppab') {
    // Extractor output: { nomor_ppab, kebun_unit, rencana_selesai, sumber_anggaran,
    //                     items: [{no, deskripsi, satuan, qty, harga_satuan, jumlah}],
    //                     jumlah_excl_ppn, ppn_11_persen, jumlah_incl_ppn, approval_roles }
    // Backend expects: { nomor_ppab (required), deskripsi (required — tidak ada di extractor, pakai sumber_anggaran atau placeholder),
    //                    items: [{deskripsi (required), satuan (required), qty (required numeric),
    //                             harga_satuan (required numeric), kategori (nullable), currency (nullable)}] }
    const items = Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          deskripsi: item.deskripsi ?? '',
          satuan: item.satuan ?? '',
          qty: Number(item.qty ?? 0),
          harga_satuan: Number(item.harga_satuan ?? 0),
          kategori: item.kategori ?? null,
          currency: item.currency ?? 'IDR',
          line_specs: item.detail_lisensi 
            ? Object.entries(item.detail_lisensi).map(([k, v]) => ({ deskripsi: `${k.toUpperCase()} : ${v}` }))
            : [],
        }))
      : [];

    const subtotals = [];
    if (raw.jumlah_excl_ppn) subtotals.push({ deskripsi: `Jumlah Excl. PPN 11% : Rp ${Number(raw.jumlah_excl_ppn).toLocaleString('id-ID')}` });
    if (raw.ppn_11_persen) subtotals.push({ deskripsi: `PPN 11% : Rp ${Number(raw.ppn_11_persen).toLocaleString('id-ID')}` });
    if (raw.jumlah_incl_ppn) subtotals.push({ deskripsi: `Jumlah Incl. PPN 11% : Rp ${Number(raw.jumlah_incl_ppn).toLocaleString('id-ID')}` });

    // Deskripsi PPAB tidak ada di extractor — gunakan sumber_anggaran jika ada,
    // atau kebun_unit, atau string kosong (user bisa edit di UI sebelum submit)
    const deskripsi = raw.deskripsi
      ?? raw.sumber_anggaran
      ?? raw.kebun_unit
      ?? '';

    return {
      nomor_ppab: raw.nomor_ppab ?? '',
      deskripsi,
      items,
      subtotals,
    };
  }

  if (docType === 'po') {
    // Extractor output: { nomor_po, nomor_ppab (nullable), vendor: {nama, alamat},
    //                     items: [{no, deskripsi, satuan, qty, harga_satuan, amount}],
    //                     subtotal, ppn_11_persen, grand_total, approval_roles }
    // Backend expects: { nomor_po (required string), vendor (required string — bukan object!),
    //                    nomor_ppab (nullable string),
    //                    items: [{deskripsi (required), satuan (required), qty (required numeric),
    //                             harga_satuan (required numeric), spec (nullable)}] }
    // Tangani 2 varian PO:
    // - PURCHASE_ORDER: vendor = { nama, alamat }
    // - PURCHASE_ORDER_V2: vendor_nama = string langsung
    const vendorRaw = raw.vendor;
    const vendor: string = typeof vendorRaw === 'string'
      ? vendorRaw
      : (vendorRaw?.nama ?? raw.vendor_nama ?? '');

    const items = Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          deskripsi: item.deskripsi ?? '',
          satuan: item.satuan ?? '',
          qty: Number(item.qty ?? 0),
          harga_satuan: Number(item.harga_satuan ?? 0),
          spec: item.spec ?? null,
        }))
      : [];

    const subtotals = [];
    if (raw.subtotal) subtotals.push({ deskripsi: 'Subtotal', value: Number(raw.subtotal) });
    if (raw.ppn_11_persen) subtotals.push({ deskripsi: 'PPN 11%', value: Number(raw.ppn_11_persen) });
    if (raw.grand_total) subtotals.push({ deskripsi: 'Grand Total', value: Number(raw.grand_total) });

    return {
      nomor_po: raw.nomor_po ?? '',
      vendor,
      nomor_ppab: raw.nomor_ppab ?? null,
      items,
      subtotals,
    };
  }

  // Fallback: kirim raw as-is
  return raw;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  docType?: 'ppab' | 'po' | 'mis';
  /** Dipanggil setelah simpan berhasil — gunakan untuk refresh list di parent */
  onSaved?: () => void;
}

export default function UploadModal({ isOpen, onClose, title = "Upload PDF", docType, onSaved }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [editableResult, setEditableResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourcePdfPath, setSourcePdfPath] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const unsupportedFieldKeys = new Set(['required_for', 'time', 'section']);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setStatus(null);
      setErrorMessage(null);
      setValidationErrors(null);
      setSuccessMessage(null);
      setResult(null);
      setEditableResult(null);
      setUploading(false);
      setSubmitting(false);
      setSourcePdfPath(null);
      setShowPreview(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset all extraction-related states when a new file is chosen or cleared
    setStatus(null);
    setErrorMessage(null);
    setValidationErrors(null);
    setSuccessMessage(null);
    setResult(null);
    setEditableResult(null);
    setSourcePdfPath(null);
    setShowPreview(false);
  }, [file]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Pilih file PDF terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Mengunggah dan memproses PDF...");
    setResult(null);
    setUploading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/extract-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Response bukan JSON saat ekstraksi: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        setStatus(`Gagal: ${data.message || res.statusText}`);
        setErrorMessage(data.message || `Ekstraksi gagal (${res.status}).`);
        setUploading(false);
        return;
      }

      setStatus('Sukses: Dokumen berhasil diekstrak.');
      setErrorMessage(null);
      setSuccessMessage('Dokumen berhasil diekstrak.');
      const extracted = data?.data ?? data;
      setResult(extracted);
      setEditableResult(extracted);
      // Simpan path PDF asli dari response
      if (data?.source_pdf_path) {
        setSourcePdfPath(data.source_pdf_path);
      }
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
      setErrorMessage(`Error koneksi: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editableResult) {
      setStatus('Tidak ada data untuk disimpan.');
      return;
    }

    const approvers = collectApproversFromData(editableResult as Record<string, unknown>);
    if (approvers.length === 0) {
      setStatus("Pilih minimal satu approver dari field seperti Prepared By / Checked By / Approved By.");
      return;
    }

    let type = docType;
    if (!type) {
      if (editableResult.nomor_ppab || editableResult.nomorPpab) type = "ppab";
      else if (editableResult.nomor_po || editableResult.nomorPo) type = "po";
      else type = "mis";
    }

    setSubmitting(true);
    setStatus('Menyimpan pengajuan...');
    setErrorMessage(null);
    setValidationErrors(null);

    try {
      // Transformasi data hasil ekstraksi ke format yang diharapkan backend
      const payload = buildPayload(type, editableResult);
      // Sertakan path PDF asli agar bisa di-stamp (bukan di-generate ulang)
      if (sourcePdfPath) {
        payload.source_pdf_path = sourcePdfPath;
      }

      // Pastikan XSRF-TOKEN cookie selalu fresh sebelum POST (Sanctum stateful)
      const xsrfToken = await refreshCsrfCookie();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': xsrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          data: payload,
          approvers,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Response bukan JSON saat simpan: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        const message = data.message || data.error || 'Gagal menyimpan pengajuan.';
        // Tampilkan validasi errors per-field dari Laravel (422)
        if (data.errors && typeof data.errors === 'object') {
          setValidationErrors(data.errors);
        }
        setStatus(`Gagal: ${message}`);
        setErrorMessage(message);
        return;
      }

      setStatus('Sukses: Pengajuan berhasil disimpan.');
      setErrorMessage(null);
      setSuccessMessage('Pengajuan berhasil disimpan.');
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 2000);
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
      setErrorMessage(`Error koneksi: ${String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-modal role="dialog">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-[#E3E6EA] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {(uploading || submitting) && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center border border-[#E3E6EA]">
              <Loader2 size={40} className="animate-spin text-[#1F3A5F] mb-4" />
              <p className="text-[16px] font-bold text-slate-900">
                {uploading ? "Mengekstrak Dokumen..." : "Menyimpan Pengajuan..."}
              </p>
              <p className="text-[13px] text-slate-500 mt-1">Mohon tunggu sebentar, proses ini memakan waktu.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#E3E6EA] px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Unggah dokumen untuk diekstrak secara otomatis.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-[#F8F9FB] hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FB]/50">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative group mb-4">
              <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${file ? 'border-[#1F3A5F] bg-[#F8F9FB] shadow-inner' : 'border-[#E3E6EA] bg-white hover:bg-[#F8F9FB] hover:border-[#1F3A5F]/50 shadow-sm'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <div className="bg-[#1F3A5F]/10 p-3 rounded-full mb-3 text-[#1F3A5F] shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FB] border border-[#E3E6EA] group-hover:bg-[#1F3A5F]/5 p-3 rounded-full mb-3 text-slate-400 group-hover:text-[#1F3A5F] transition-colors">
                      <FileUp className="w-6 h-6" />
                    </div>
                  )}
                  <p className="mb-1 text-sm text-slate-600 text-center px-4">
                    {file ? (
                      <span className="font-semibold text-[#1F3A5F] block truncate max-w-xs">{file.name}</span>
                    ) : (
                      <><span className="font-semibold text-[#1F3A5F]">Klik untuk upload</span> atau drag and drop PDF ke sini</>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">Format PDF (Max. 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A5F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a3350] hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                {uploading ? 'Memproses Dokumen...' : 'Upload & Ekstrak'}
              </button>
              {file && !uploading && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setStatus(null); setErrorMessage(null); setResult(null); setEditableResult(null); setSourcePdfPath(null); }}
                  className="rounded-lg border border-[#E3E6EA] bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-[#F8F9FB] hover:text-slate-900"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {errorMessage ? (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold mb-1.5 text-red-700">
                <AlertCircle size={16} />
                Terjadi Kesalahan
              </div>
              <div className="pl-6">{errorMessage}</div>
              {validationErrors && (
                <ul className="mt-3 space-y-1 pl-6 list-disc list-outside text-red-600 font-medium">
                  {Object.entries(validationErrors).map(([field, messages]) =>
                    (messages as string[]).map((msg, i) => (
                      <li key={`${field}-${i}`}>
                        <span className="capitalize">{field.replace(/_/g, ' ')}:</span> {msg}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold mb-1 text-emerald-700">
                <CheckCircle2 size={16} />
                Berhasil
              </div>
              <div className="pl-6">{successMessage}</div>
            </div>
          ) : null}

          {status && !errorMessage && !successMessage && (
            <div className="mb-6 rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-sm text-blue-700 animate-in fade-in flex items-center gap-2">
              {uploading || submitting ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              {status}
            </div>
          )}

          {result ? (
            <div className="rounded-xl border border-[#E3E6EA] bg-white shadow-sm ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-4">
              <div className="border-b border-[#E3E6EA] bg-[#F8F9FB] px-6 py-4 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#1F3A5F] shadow-sm border border-[#E3E6EA]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Hasil Ekstraksi Data</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Mohon periksa kembali data di bawah. Klik field approver untuk memilih user dari SSO.
                    </p>
                  </div>
                </div>
                {fileUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1F3A5F] bg-[#1F3A5F]/10 hover:bg-[#1F3A5F]/20 border border-[#1F3A5F]/20 rounded-lg shadow-sm transition-all duration-200"
                  >
                    <FileText size={16} />
                    Lihat PDF Asli
                  </button>
                )}
              </div>
              <div className="p-6">
                <EditableResultView value={editableResult} onChange={setEditableResult} unsupportedKeys={unsupportedFieldKeys} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#E3E6EA] bg-white px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 z-20 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E3E6EA] bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#F8F9FB] hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!editableResult || submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#10B981]"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Pengajuan'
            )}
          </button>
        </div>
      </div>

      {/* Modal Preview PDF */}
      {showPreview && fileUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-full max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E3E6EA] px-5 py-3 bg-[#F8F9FB]">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-[#1F3A5F]" />
                Preview Dokumen Asli
              </h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                title="Tutup Preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-100">
              <iframe 
                src={fileUrl} 
                className="w-full h-full border-none" 
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableResultView({ value, onChange, unsupportedKeys }: { value: any; onChange: (v: any) => void; unsupportedKeys: Set<string> }) {
  const [local, setLocal] = useState<any>(value ?? null);

  useEffect(() => setLocal(value ?? null), [value]);

  if (!local || typeof local !== "object") {
    return <div className="text-sm text-slate-800 font-medium">{String(local ?? "")}</div>;
  }

  return (
    <div className="space-y-0 divide-y divide-[#E3E6EA]">
      {local && typeof local === 'object' ? (
        Object.keys(local).filter((k) => !unsupportedKeys.has(k)).map((k) => (
          <div key={k} className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-6 py-4 group">
            <div className="lg:w-1/4 shrink-0 flex flex-col justify-start pt-1">
              <label className="text-[13px] font-semibold text-slate-700 capitalize tracking-tight">
                {k === "approval_roles" ? "Approval Roles" : formatApproverFieldLabel(k)}
              </label>
            </div>
            <div className="min-w-0 flex-1 w-full">
              <EditableValue
                fieldKey={k}
                value={local[k]}
                onChange={(nv) => {
                  const next = { ...local, [k]: nv };
                  setLocal(next);
                  onChange(next);
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-slate-800 font-medium">{String(local)}</div>
      )}
    </div>
  );
}

function EditableValue({
  fieldKey,
  value,
  onChange,
  inApprovalRoles = false,
}: {
  fieldKey?: string;
  value: any;
  onChange: (v: any) => void;
  inApprovalRoles?: boolean;
}) {
  const isMoney = isMoneyField(fieldKey);

  if (fieldKey === "approval_roles" && value && typeof value === "object" && !Array.isArray(value)) {
    return (
      <div className="space-y-0 divide-y divide-[#E3E6EA] rounded-xl border border-[#E3E6EA] bg-[#F8F9FB]/50 overflow-hidden">
        {Object.entries(value as Record<string, unknown>).map(([roleKey, roleValue]) => (
          <div key={roleKey} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-white transition-colors">
            <div className="sm:w-1/3 shrink-0 text-xs font-semibold text-slate-700 capitalize tracking-tight">
              {formatApproverFieldLabel(roleKey)}
            </div>
            <div className="min-w-0 flex-1">
              <EditableValue
                fieldKey={roleKey}
                value={roleValue}
                inApprovalRoles
                onChange={(nv) => onChange({ ...value, [roleKey]: nv })}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (inApprovalRoles || (fieldKey && isApproverFieldKey(fieldKey))) {
    // Pastikan value selalu berupa array agar bisa multi-select
    const arr = Array.isArray(value) ? value : [value];

    return (
      <div className="space-y-2">
        {arr.map((val, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1 relative min-w-0">
              <SsoUserPicker
                value={val}
                onChange={(nv) => {
                  const newArr = [...arr];
                  newArr[idx] = nv;
                  // Jika hanya 1 item dan dihapus (kosong), tetap biarkan sebagai array atau string kosong
                  // agar collectApprovers bisa memprosesnya
                  onChange(newArr);
                }}
                placeholder={`Pilih ${formatApproverFieldLabel(fieldKey || "")}`}
              />
            </div>
            {arr.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const newArr = arr.filter((_, i) => i !== idx);
                  onChange(newArr);
                }}
                className="mt-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Hapus approver"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...arr, ""])}
          className="text-[12px] font-medium text-[#1F3A5F] hover:text-[#2B5284] flex items-center gap-1 mt-1 bg-white px-2 py-1 rounded border border-transparent hover:border-[#E3E6EA] transition-colors"
        >
          <Plus size={14} /> Tambah Approver Lain
        </button>
      </div>
    );
  }

  if (value === null || value === undefined) {
    return (
      <div className="relative">
        {isMoney && <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>}
        <input
          className={`w-full rounded-lg border border-[#E3E6EA] px-3 py-2 text-sm text-slate-900 transition-all focus:border-[#1F3A5F] focus:outline-none focus:ring-4 focus:ring-[#1F3A5F]/10 hover:border-slate-400 bg-white placeholder:text-slate-400 shadow-sm ${isMoney ? 'pl-9 text-right font-mono' : ''}`}
          value=""
          onChange={(e) => onChange(isMoney ? parseMoney(e.target.value) : e.target.value)}
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <div className="text-sm text-slate-400 italic bg-[#F8F9FB] px-3 py-2 rounded-lg border border-dashed border-[#E3E6EA] w-max">(Tidak ada item)</div>;
    if (value.every((item) => typeof item !== "object")) {
      return (
        <ul className="space-y-2 mt-1">
          {value.map((item, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F8F9FB] text-[11px] font-bold text-slate-500 shrink-0 border border-[#E3E6EA]">
                {index + 1}
              </span>
              <input
                className="w-full rounded-lg border border-[#E3E6EA] px-3 py-2 text-sm text-slate-900 transition-all focus:border-[#1F3A5F] focus:outline-none focus:ring-4 focus:ring-[#1F3A5F]/10 hover:border-slate-400 bg-white shadow-sm"
                value={String(item)}
                onChange={(e) => {
                  const next = [...value];
                  next[index] = e.target.value;
                  onChange(next);
                }}
              />
            </li>
          ))}
        </ul>
      );
    }

    const keys = Array.from(new Set(value.flatMap((row: any) => Object.keys(row || {}))));
    return (
      <div className="overflow-hidden rounded-xl border border-[#E3E6EA] shadow-sm mt-1 bg-white ring-1 ring-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#F8F9FB] text-slate-600 border-b border-[#E3E6EA]">
              <tr>
                {keys.map((key) => (
                  <th key={key} className={`px-4 py-3 font-semibold whitespace-nowrap text-xs uppercase tracking-wider ${isMoneyField(key) ? 'text-right' : ''}`}>
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EA] bg-white">
              {value.map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="hover:bg-[#F8F9FB]/50 transition-colors group">
                  {keys.map((key) => {
                    const isMoneyCol = isMoneyField(key);
                    return (
                      <td key={key} className="p-2 align-top min-w-[120px]">
                        <div className="relative">
                          {isMoneyCol && <span className="absolute left-2.5 top-2 text-[11px] text-slate-400 font-medium">Rp</span>}
                          <input
                            className={`w-full rounded-md border border-transparent px-2 py-1.5 text-sm text-slate-800 transition-all focus:border-[#1F3A5F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 hover:border-slate-300 bg-transparent group-hover:bg-white focus:bg-white ${isMoneyCol ? 'pl-8 text-right font-mono' : ''}`}
                            value={isMoneyCol ? formatMoney(row?.[key]) : (row?.[key] ?? "")}
                            onChange={(e) => {
                              const val = isMoneyCol ? parseMoney(e.target.value) : e.target.value;
                              const next = value.map((current: any, index: number) =>
                                index === rowIndex ? { ...current, [key]: val } : current,
                              );
                              onChange(next);
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-3 p-4 rounded-xl border border-[#E3E6EA] bg-[#F8F9FB]/50">
        {Object.keys(value).map((key) => (
          <div key={key} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <div className="sm:w-1/3 text-xs font-semibold text-slate-600 capitalize tracking-tight shrink-0">
              {formatApproverFieldLabel(key)}
            </div>
            <div className="min-w-0 flex-1 w-full">
              <EditableValue
                fieldKey={key}
                value={value[key]}
                onChange={(nextValue) => onChange({ ...value, [key]: nextValue })}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {isMoney && <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>}
      <input
        className={`w-full rounded-lg border border-[#E3E6EA] px-3 py-2 text-sm text-slate-900 transition-all focus:border-[#1F3A5F] focus:outline-none focus:ring-4 focus:ring-[#1F3A5F]/10 hover:border-slate-400 bg-white shadow-sm font-medium ${isMoney ? 'pl-9 text-right font-mono' : ''}`}
        value={isMoney ? formatMoney(value) : String(value)}
        onChange={(e) => onChange(isMoney ? parseMoney(e.target.value) : e.target.value)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { refreshCsrfCookie } from "@/lib/csrf";
import SsoUserPicker from "@/components/SsoUserPicker";
import {
  collectApproversFromData,
  formatApproverFieldLabel,
  isApproverFieldKey,
} from "@/lib/employees";

/**
 * Menormalisasi payload hasil ekstraksi PDF ke format yang diharapkan backend.
 * Setiap docType memiliki mapping field yang berbeda antara extractor dan controller.
 */
function buildPayload(docType: 'ppab' | 'po' | 'mis', raw: any): any {
  if (docType === 'mis') {
    const items = Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          desc: item.desc ?? '',
          satuan: item.satuan ?? '',
          qty: parseFloat(String(item.qty ?? '0').replace(/\./g, '').replace(',', '.')) || 0,
          remark: item.remark ?? null,
        }))
      : [];

    return {
      nomor_mis: raw.nomor_mis ?? '',
      tgl_mis: raw.tgl_mis ?? '',
      items,
    };
  }

  if (docType === 'ppab') {
    const items = Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          deskripsi: item.deskripsi ?? '',
          satuan: item.satuan ?? '',
          qty: Number(item.qty ?? 0),
          harga_satuan: Number(item.harga_satuan ?? 0),
          kategori: item.kategori ?? null,
          currency: item.currency ?? 'IDR',
        }))
      : [];

    const deskripsi = raw.deskripsi
      ?? raw.sumber_anggaran
      ?? raw.kebun_unit
      ?? '';

    return {
      nomor_ppab: raw.nomor_ppab ?? '',
      deskripsi,
      items,
    };
  }

  if (docType === 'po') {
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

    return {
      nomor_po: raw.nomor_po ?? '',
      vendor,
      nomor_ppab: raw.nomor_ppab ?? null,
      items,
    };
  }

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
  const [saving, setSaving] = useState(false);
  const unsupportedFieldKeys = new Set(['required_for', 'time', 'section']);

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
      setSaving(false);
    }
  }, [isOpen]);

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

    if (!docType) {
      setStatus('Jenis dokumen tidak diketahui.');
      return;
    }

    setSaving(true);
    setStatus('Menyimpan pengajuan...');
    setErrorMessage(null);
    setValidationErrors(null);

    try {
      const payload = buildPayload(docType, editableResult);
      const xsrfToken = await refreshCsrfCookie();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/${docType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': xsrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
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
      onSaved?.();
      onClose();
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
      setErrorMessage(`Error koneksi: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 mx-4 w-full max-w-2xl">
        <div className="flex max-h-[85vh] flex-col rounded-lg bg-white shadow-lg">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E3E6EA] bg-white px-4 py-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="p-1 text-slate-600 hover:text-slate-900">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Pilih file PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-md border border-[#E3E6EA] p-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md bg-[#1F3A5F] px-4 py-2 text-white hover:bg-[#1a3350] disabled:opacity-60"
                >
                  <UploadCloud size={16} />
                  Upload dan Ekstrak
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-[#E3E6EA] px-3 py-2 hover:bg-[#F1F3F6]"
                >
                  Batal
                </button>
              </div>
            </form>

            {errorMessage ? (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <AlertCircle size={14} />
                  Terjadi kesalahan
                </div>
                <div>{errorMessage}</div>
                {validationErrors && (
                  <ul className="mt-2 space-y-0.5 list-disc list-inside text-red-600">
                    {Object.entries(validationErrors).map(([field, messages]) =>
                      (messages as string[]).map((msg, i) => (
                        <li key={`${field}-${i}`}>
                          <span className="font-medium">{field}:</span> {msg}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                <div className="font-semibold">Berhasil</div>
                <div>{successMessage}</div>
              </div>
            ) : null}

            {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

            {result ? (
              <div className="mt-4 rounded-md bg-[#F8F9FB] p-4 text-sm">
                <h4 className="mb-1 font-semibold">Hasil Ekstraksi</h4>
                <p className="mb-3 text-xs text-[#6B7280]">
                  Klik field approver (mis. Accepted By) untuk mencari dan memilih user dari SSO.
                </p>
                <EditableResultView value={editableResult} onChange={setEditableResult} unsupportedKeys={unsupportedFieldKeys} />
              </div>
            ) : null}
          </div>

          <div className="px-4 py-3 border-t border-[#E3E6EA] bg-white sticky bottom-0">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-md text-sm font-medium text-[#1F3A5F] border border-[#D1D5DB] hover:bg-[#F1F3F6]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editableResult || saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1F3A5F] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-200 transition hover:bg-[#172f4d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan sebagai Pengajuan'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableResultView({ value, onChange, unsupportedKeys }: { value: any; onChange: (v: any) => void; unsupportedKeys?: Set<string> }) {
  const [local, setLocal] = useState<any>(value ?? null);

  useEffect(() => setLocal(value ?? null), [value]);

  if (!local || typeof local !== "object") {
    return <div className="text-sm text-[#111827]">{String(local ?? "")}</div>;
  }

  return (
    <div className="space-y-3">
      {Object.keys(local).map((key) => {
        const isUnsupported = unsupportedKeys?.has(key);
        return (
          <div key={key} className="flex gap-3 items-start">
            <div className="w-44 shrink-0 text-[13px] text-[#6B7280]">
              {key === "approval_roles" ? "Approval Roles" : formatApproverFieldLabel(key)}
              {isUnsupported ? (
                <div className="text-[11px] text-[#9CA3AF]">tidak akan disimpan</div>
              ) : null}
            </div>
            <div className={`min-w-0 flex-1 ${isUnsupported ? 'opacity-70' : ''}`}>
              <EditableValue
                fieldKey={key}
                value={local[key]}
                onChange={(nextValue) => {
                  const next = { ...local, [key]: nextValue };
                  setLocal(next);
                  onChange(next);
                }}
              />
            </div>
          </div>
        );
      })}
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
  if (fieldKey === "approval_roles" && value && typeof value === "object" && !Array.isArray(value)) {
    return (
      <div className="space-y-2 rounded-md border border-[#E3E6EA] bg-white p-3">
        {Object.entries(value as Record<string, unknown>).map(([roleKey, roleValue]) => (
          <div key={roleKey} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <div className="w-36 shrink-0 text-[12px] font-medium text-[#374151]">
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
    return (
      <SsoUserPicker
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${formatApproverFieldLabel(fieldKey)}`}
      />
    );
  }

  if (value === null || value === undefined) {
    return (
      <input
        className="w-full rounded border p-1"
        value=""
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <div className="text-sm text-[#6B7280]">(kosong)</div>;
    if (value.every((item) => typeof item !== "object")) {
      return (
        <ul className="ml-5 list-decimal space-y-1">
          {value.map((item, index) => (
            <li key={index}>
              <input
                className="w-full rounded border p-1"
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[12px] text-[#6B7280]">
              {keys.map((key) => (
                <th key={key} className="px-2 py-1">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="border-t">
                {keys.map((key) => (
                  <td key={key} className="px-2 py-1 align-top">
                    <input
                      className="w-full rounded border p-1"
                      value={row?.[key] ?? ""}
                      onChange={(e) => {
                        const next = value.map((current: any, index: number) =>
                          index === rowIndex ? { ...current, [key]: e.target.value } : current,
                        );
                        onChange(next);
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-2">
        {Object.keys(value).map((key) => (
          <div key={key} className="flex gap-3">
            <div className="w-36 text-[13px] text-[#6B7280]">{formatApproverFieldLabel(key)}</div>
            <div className="min-w-0 flex-1">
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
    <input
      className="w-full rounded border p-1"
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

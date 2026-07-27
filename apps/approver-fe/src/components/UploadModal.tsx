"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X, UploadCloud } from "lucide-react";
import SsoUserPicker from "@/components/SsoUserPicker";
import {
  collectApproversFromData,
  formatApproverFieldLabel,
  isApproverFieldKey,
} from "@/lib/employees";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function UploadModal({ isOpen, onClose, title = "Upload PDF" }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [editableResult, setEditableResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setResult(null);
      setEditableResult(null);
      setUploading(false);
      setSubmitting(false);
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
      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`Gagal: ${data.message || res.statusText}`);
        setUploading(false);
        return;
      }

      setStatus("Sukses: Dokumen berhasil diekstrak.");
      const extracted = data?.data ?? data;
      setResult(extracted);
      setEditableResult(extracted);
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSimpanPengajuan = async () => {
    if (!editableResult) {
      setStatus("Tidak ada data untuk disimpan.");
      return;
    }

    const approvers = collectApproversFromData(editableResult as Record<string, unknown>);
    if (approvers.length === 0) {
      setStatus("Pilih minimal satu approver dari field seperti Accepted By / Approved By.");
      return;
    }

    setSubmitting(true);
    setStatus("Menyimpan pengajuan...");

    let type = "mis";
    if (editableResult.nomor_ppab || editableResult.nomorPpab) type = "ppab";
    else if (editableResult.nomor_po || editableResult.nomorPo) type = "po";

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          data: editableResult,
          approvers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Gagal menyimpan: ${data.message || res.statusText}`);
      } else {
        setStatus("Sukses: Pengajuan berhasil disimpan.");
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
    } finally {
      setSubmitting(false);
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

            {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

            {result ? (
              <div className="mt-4 rounded-md bg-[#F8F9FB] p-4 text-sm">
                <h4 className="mb-1 font-semibold">Hasil Ekstraksi</h4>
                <p className="mb-3 text-xs text-[#6B7280]">
                  Klik field approver (mis. Accepted By) untuk mencari dan memilih user dari SSO.
                </p>
                <EditableResultView value={editableResult} onChange={setEditableResult} />
              </div>
            ) : null}
          </div>

          <div className="sticky bottom-0 border-t border-[#E3E6EA] bg-white px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSimpanPengajuan}
                disabled={!result || submitting}
                className="rounded-md bg-[#10B981] px-3 py-2 text-white disabled:opacity-60"
              >
                {submitting ? "Menyimpan..." : "Simpan sebagai Pengajuan"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#E3E6EA] px-3 py-2 hover:bg-[#F1F3F6]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableResultView({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [local, setLocal] = useState<any>(value ?? null);

  useEffect(() => setLocal(value ?? null), [value]);

  if (!local || typeof local !== "object") {
    return <div className="text-sm text-[#111827]">{String(local ?? "")}</div>;
  }

  return (
    <div className="space-y-3">
      {Object.keys(local).map((key) => (
        <div key={key} className="flex gap-3">
          <div className="w-44 shrink-0 text-[13px] text-[#6B7280]">
            {key === "approval_roles" ? "Approval Roles" : formatApproverFieldLabel(key)}
          </div>
          <div className="min-w-0 flex-1">
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
      ))}
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

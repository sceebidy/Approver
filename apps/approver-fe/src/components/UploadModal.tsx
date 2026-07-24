"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X, UploadCloud } from "lucide-react";

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // reset state each time modal opens
      setFile(null);
      setStatus(null);
      setResult(null);
      setEditableResult(null);
      setUploading(false);
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
      // extraction controller returns { message, data }
      const extracted = data?.data ?? data;
      setResult(extracted);
      setEditableResult(extracted);
    } catch (error) {
      setStatus(`Error koneksi: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-lg max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E6EA] sticky top-0 bg-white z-10">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="p-1 text-slate-600 hover:text-slate-900">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih file PDF</label>
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
                <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">
                  Batal
                </button>
              </div>
            </form>

            {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

            {result ? (
              <div className="mt-4 rounded-md bg-[#F8F9FB] p-3 text-sm">
                <EditableResultView value={editableResult} onChange={setEditableResult} />
              </div>
            ) : null}
          </div>

          <div className="px-4 py-3 border-t border-[#E3E6EA] bg-white sticky bottom-0">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  setStatus('Simpan tidak tersedia: backend belum menyediakan endpoint create untuk pengajuan.');
                }}
                disabled
                className="px-3 py-2 rounded-md bg-[#10B981] text-white disabled:opacity-60"
              >
                Simpan sebagai Pengajuan
              </button>
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">Tutup</button>
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

  return (
    <div className="space-y-3">
      {local && typeof local === 'object' ? (
        Object.keys(local).map((k) => (
          <div key={k} className="flex gap-3">
            <div className="w-44 text-[13px] text-[#6B7280]">{k}</div>
            <div className="flex-1">
              <EditableValue value={local[k]} onChange={(nv) => {
                const next = { ...local, [k]: nv };
                setLocal(next);
                onChange(next);
              }} />
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-[#111827]">{String(local)}</div>
      )}
    </div>
  );
}

function EditableValue({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  if (value === null || value === undefined) return <input className="w-full p-1 border rounded" value={''} onChange={(e) => onChange(e.target.value)} />;
  if (Array.isArray(value)) {
    if (value.length === 0) return <div className="text-sm text-[#6B7280]">(kosong)</div>;
    if (value.every((v) => typeof v !== 'object')) {
      return (
        <ul className="list-decimal ml-5 space-y-1">
          {value.map((v, i) => (
            <li key={i}>
              <input className="w-full p-1 border rounded" value={String(v)} onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }} />
            </li>
          ))}
        </ul>
      );
    }
    const keys = Array.from(new Set(value.flatMap((v: any) => Object.keys(v || {}))));
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[12px] text-[#6B7280]">
              {keys.map((k) => (
                <th key={k} className="px-2 py-1">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row: any, i: number) => (
              <tr key={i} className="border-t">
                {keys.map((k) => (
                  <td key={k} className="px-2 py-1 align-top">
                    <input className="w-full p-1 border rounded" value={row?.[k] ?? ''} onChange={(e) => {
                      const next = value.map((r: any, idx: number) => idx === i ? { ...r, [k]: e.target.value } : r);
                      onChange(next);
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-2">
        {Object.keys(value).map((k) => (
          <div key={k} className="flex gap-3">
            <div className="w-36 text-[13px] text-[#6B7280]">{k}</div>
            <div className="flex-1">
              <EditableValue value={value[k]} onChange={(nv) => onChange({ ...value, [k]: nv })} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <input className="w-full p-1 border rounded" value={String(value)} onChange={(e) => onChange(e.target.value)} />;
}

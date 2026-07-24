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
      setResult(data);
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E6EA]">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="p-1 text-slate-600 hover:text-slate-900">
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
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
              <pre className="mt-4 rounded-md bg-[#F8F9FB] p-3 text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

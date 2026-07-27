"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface DocColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
  type?: "date" | "datetime" | "text" | "badge";
  defaultValue?: string;
}

export interface DocRow {
  id: string | number;
  status?: string;
  [key: string]: any;
}

interface Props {
  title: string;
  subtitle: string;
  createLabel?: string;
  createHref?: string;
  createNode?: React.ReactNode;
  columns: DocColumn[];
  rows: DocRow[];
  loading?: boolean;
  error?: string | null;
  /** Dipanggil ketika user mengonfirmasi pembatalan/penghapusan pengajuan */
  onDelete?: (row: DocRow) => Promise<void>;
}

const tabs = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

export default function DocumentListPage({ title, subtitle, createLabel, createHref, createNode, columns, rows, loading, error, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [deletingRow, setDeletingRow] = useState<DocRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = activeTab === "all" ? rows : rows.filter((r) => r.status === activeTab);

  /** Format nilai sel berdasarkan type kolom */
  function cellValue(row: DocRow, col: DocColumn): string {
    const raw = row[col.key];
    if (raw === null || raw === undefined || raw === '') {
      return col.defaultValue ?? '-';
    }
    if (col.type === 'datetime') {
      try { return new Date(raw).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch { return String(raw); }
    }
    if (col.type === 'date') {
      try { return new Date(raw).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
      catch { return String(raw); }
    }
    return String(raw);
  }

  const handleConfirmDelete = async () => {
    if (!deletingRow || !onDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(deletingRow);
      setDeletingRow(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal membatalkan pengajuan.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[#111827]">{title}</h1>
          <p className="text-[12px] text-[#9CA3AF]">{subtitle}</p>
        </div>
        {createNode ? (
          createNode
        ) : (
          <Link
            href={createHref ?? "/upload"}
            className="flex items-center gap-1.5 bg-[#1F3A5F] text-white text-[13px] font-medium px-3.5 py-2 rounded-md hover:bg-[#1a3350]"
          >
            <Plus size={15} strokeWidth={2} />
            {createLabel ?? "Upload PDF"}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-md border border-[#E3E6EA] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E6EA] gap-3">
          <div className="flex items-center gap-1 text-[13px]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === t.key ? "bg-[#1F3A5F] text-white" : "text-[#4B5563] hover:bg-[#F1F3F6]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                placeholder="Cari nomor / deskripsi"
                className="pl-8 pr-3 py-1.5 text-[13px] border border-[#E3E6EA] rounded-md w-56 outline-none focus:border-[#1F3A5F] placeholder:text-[#9CA3AF]"
              />
            </div>
            <button className="flex items-center gap-1 text-[13px] text-[#4B5563] border border-[#E3E6EA] rounded-md px-3 py-1.5 hover:bg-[#F1F3F6]">
              Tanggal
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-sm text-[#6B7280]">
            <Loader2 size={22} className="animate-spin text-[#1F3A5F]" />
            <span>Memuat data...</span>
          </div>
        ) : error ? (
          <div className="px-6 py-10 flex flex-col items-center justify-center gap-2 text-sm text-red-600">
            <AlertCircle size={20} />
            <span>Gagal memuat data: {error}</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#6B7280]">
            Belum ada data.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#E3E6EA]">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-4 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {onDelete && <th className="px-4 py-2.5 font-medium text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FB]">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3 ${
                          c.align === "right" ? "text-right" : ""
                        } ${
                          c.mono ? "font-mono text-[12.5px]" : ""
                        } text-[#111827]`}
                      >
                        {c.type === 'badge' ? (
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${
                            r[c.key] === 'Pengajuan Saya' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                            r[c.key] === 'Perlu Persetujuan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {r[c.key] || c.defaultValue || '-'}
                          </span>
                        ) : (
                          cellValue(r, c)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3"><StatusBadge status={r.status ?? 'pending'} /></td>
                    {onDelete && (
                      <td className="px-4 py-3 text-right">
                        {r.can_cancel !== false ? (
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingRow(r);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                          >
                            Batalkan
                          </button>
                        ) : (
                          <span
                            title="Pengajuan tidak dapat dibatalkan karena sudah ada approval yang disetujui"
                            className="px-2.5 py-1 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded cursor-not-allowed select-none"
                          >
                            Batalkan
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6EA] text-[12px] text-[#9CA3AF]">
              <span>Menampilkan {filtered.length} dari {rows.length} {title}</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">Sebelumnya</button>
                <button className="px-2.5 py-1 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">Selanjutnya</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Konfirmasi Batal / Hapus */}
      {deletingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Pembatalan</h3>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin membatalkan pengajuan <span className="font-semibold text-gray-800">{deletingRow.nomor_ppab || deletingRow.nomor_po || deletingRow.nomor_mis || deletingRow.id}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
              >
                Kembali
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  'Ya, Batalkan Pengajuan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}   
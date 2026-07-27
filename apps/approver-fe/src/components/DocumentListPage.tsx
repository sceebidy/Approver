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
  /** Dipanggil ketika baris dokumen diklik */
  onRowClick?: (row: DocRow) => void;
}

const tabs = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

export default function DocumentListPage({ title, subtitle, createLabel, createHref, createNode, columns, rows, loading, error, onDelete, onRowClick }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [deletingRow, setDeletingRow] = useState<DocRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = rows.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch = Object.values(r).some(
        (val) => val && String(val).toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    if (dateFilter !== "all" && r.created_at) {
      const rowDate = new Date(r.created_at);
      const today = new Date();
      if (dateFilter === "today") {
        if (rowDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        if (rowDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        if (rowDate.getMonth() !== today.getMonth() || rowDate.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

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
    <main className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-[#111827] tracking-tight">{title}</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">{subtitle}</p>
        </div>
        {createNode ? (
          createNode
        ) : (
          <Link
            href={createHref ?? "/upload"}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200"
          >
            <Plus size={16} strokeWidth={2} />
            {createLabel ?? "Upload PDF"}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all">
        {/* Filters and Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between px-5 py-4 border-b border-[#E3E6EA] gap-4">
          <div className="flex items-center p-1 bg-[#F8F9FB] rounded-lg border border-[#E3E6EA]/80 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-all duration-200 ${
                  activeTab === t.key 
                    ? "bg-white text-[#1F3A5F] shadow-sm border border-[#E3E6EA]/50" 
                    : "text-[#6B7280] hover:text-[#111827] border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                placeholder="Cari dokumen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-[13px] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg w-full sm:w-64 outline-none focus:bg-white focus:border-[#1F3A5F]/40 focus:ring-2 focus:ring-[#1F3A5F]/10 placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none text-[13px] text-[#4B5563] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg pl-4 pr-10 py-2 hover:bg-white hover:border-[#D1D5DB] focus:bg-white focus:border-[#1F3A5F]/40 focus:ring-2 focus:ring-[#1F3A5F]/10 outline-none cursor-pointer transition-all"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center gap-3 text-sm text-[#6B7280] bg-white">
            <Loader2 size={24} className="animate-spin text-[#1F3A5F]" />
            <span className="font-medium">Memuat data...</span>
          </div>
        ) : error ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center gap-2 text-sm text-red-600 bg-red-50/30">
            <AlertCircle size={24} />
            <span className="font-medium">Gagal memuat data: {error}</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center flex flex-col items-center justify-center gap-2 bg-white">
            <div className="w-12 h-12 rounded-full bg-[#F1F3F6] flex items-center justify-center mb-2">
              <Search size={20} className="text-[#9CA3AF]" />
            </div>
            <p className="text-[14px] font-medium text-[#4B5563]">Belum ada data</p>
            <p className="text-[12.5px] text-[#9CA3AF]">Data {title} yang sesuai tidak ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280] bg-gradient-to-r from-[#F8F9FB] to-white border-b border-[#E3E6EA]">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-5 py-3.5 ${c.align === "right" ? "text-right" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-5 py-3.5">Status</th>
                  {onDelete && <th className="px-5 py-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]/70 bg-white">
                {filtered.map((r) => (
                  <tr 
                    key={r.id} 
                    className={`hover:bg-[#F8F9FB] transition-colors duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(r)}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-5 py-3.5 ${
                          c.align === "right" ? "text-right" : ""
                        } ${
                          c.mono ? "font-mono text-[13px] text-[#4B5563]" : "text-[13.5px] text-[#111827]"
                        }`}
                      >
                        {c.type === 'badge' ? (
                          <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shadow-sm border ${
                            r[c.key] === 'Pengajuan Saya' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                            r[c.key] === 'Butuh Approval Anda' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {r[c.key] || c.defaultValue || '-'}
                          </span>
                        ) : (
                          cellValue(r, c)
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status ?? 'pending'} />
                    </td>
                    {onDelete && (
                      <td className="px-5 py-3.5 text-right">
                        {r.can_cancel !== false ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setDeletingRow(r);
                            }}
                            className="px-3 py-1.5 text-[12px] font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          >
                            Batalkan
                          </button>
                        ) : (
                          <span
                            title="Pengajuan tidak dapat dibatalkan karena sudah ada approval yang disetujui"
                            className="inline-block px-3 py-1.5 text-[12px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed select-none"
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

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-[#E3E6EA] bg-white text-[12.5px] text-[#6B7280] gap-4">
              <span>Menampilkan <span className="font-semibold text-[#111827]">{filtered.length}</span> dari <span className="font-semibold text-[#111827]">{rows.length}</span> {title}</span>
              <div className="flex items-center gap-2">
                <button className="px-3.5 py-1.5 rounded-lg border border-[#E3E6EA] hover:bg-[#F8F9FB] hover:text-[#111827] transition-colors font-medium text-[#4B5563] shadow-sm">Sebelumnya</button>
                <button className="px-3.5 py-1.5 rounded-lg border border-[#E3E6EA] hover:bg-[#F8F9FB] hover:text-[#111827] transition-colors font-medium text-[#4B5563] shadow-sm">Selanjutnya</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Batal / Hapus */}
      {deletingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E3E6EA]">
            <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Konfirmasi Pembatalan</h3>
            <p className="text-[13.5px] text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan <span className="font-bold text-gray-900">{deletingRow.nomor_ppab || deletingRow.nomor_po || deletingRow.nomor_mis || deletingRow.id}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div className="p-3 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E6EA] mt-6">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Kembali
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
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
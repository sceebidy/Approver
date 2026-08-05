"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown, Loader2, AlertCircle, FileText, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import DateRangeFilter from "./DateRangeFilter";
import { isDateInRange } from "@/lib/dateUtils";

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
  docType?: string;
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

export default function DocumentListPage({ title, subtitle, docType, createLabel, createHref, createNode, columns, rows, loading, error, onDelete, onRowClick }: Props) {
  // Compute default 30-day window (today and 30 days ago in YYYY-MM-DD)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const formatDateLocal = (d: Date) => d.toISOString().slice(0, 10);
  const defaultStart = formatDateLocal(thirtyDaysAgo);
  const defaultEnd = formatDateLocal(today);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  // Semua / Disetujui / Ditolak default to last 30 days; Menunggu shows all
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingRow, setDeletingRow] = useState<DocRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentDocType = (docType || title).toLowerCase();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "pending") {
      // Menunggu shows ALL — clear date filter
      setStartDate("");
      setEndDate("");
    } else {
      // Semua / Disetujui / Ditolak — reset to last 30 days
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
    }
  };

  const filtered = rows.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch = Object.values(r).some(
        (val) => val && String(val).toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    if (startDate || endDate) {
      const dateVal = r.created_at || r.tgl_mis || r.tgl_po || r.tgl_ppab;
      if (!isDateInRange(dateVal, startDate, endDate)) {
        return false;
      }
    }

    if (typeFilter !== "all" && r.request_type) {
      if (r.request_type !== typeFilter) return false;
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 relative pb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#111827] tracking-tight">{title}</h1>
          <p className="text-[13.5px] text-[#6B7280] font-medium">{subtitle}</p>
          <div className="absolute bottom-1 left-0 w-12 h-1 bg-[#1F3A5F] rounded-full"></div>
        </div>
        {createNode ? (
          createNode
        ) : (
          <Link
            href={createHref ?? "/upload"}
            className="flex items-center justify-center gap-2 bg-[#1F3A5F] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200"
          >
            <Plus size={16} strokeWidth={2} />
            {createLabel ?? "Upload PDF"}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all">
        {/* Filters and Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between px-5 py-4 border-b border-[#E3E6EA] gap-4 relative z-30 bg-white rounded-t-xl">
          <div className="w-full xl:w-auto overflow-x-auto pb-1 -mb-1 scrollbar-hide">
            <div className="flex items-center p-1 bg-[#F8F9FB] rounded-lg border border-[#E3E6EA]/80 w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
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
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none text-[13px] text-[#4B5563] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg pl-4 pr-10 py-2 hover:bg-white hover:border-[#D1D5DB] focus:bg-white focus:border-[#1F3A5F]/40 focus:ring-2 focus:ring-[#1F3A5F]/10 outline-none cursor-pointer transition-all"
              >
                <option value="all">Semua Tipe</option>
                <option value="Pengajuan Saya">Pengajuan Saya</option>
                <option value="Butuh Approval Anda">Butuh Approval Anda</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            </div>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
            <div className="relative w-full sm:w-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                placeholder="Cari dokumen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-[13px] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg w-full sm:w-64 outline-none focus:bg-white focus:border-[#1F3A5F]/40 focus:ring-2 focus:ring-[#1F3A5F]/10 placeholder:text-[#9CA3AF] transition-all"
              />
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
          <div className="overflow-x-auto rounded-b-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FB] border-b border-[#E3E6EA]">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-5 py-3.5 ${c.align === "right" ? "text-right" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
                            window.open(`${apiUrl}/${currentDocType}/${r.id}/signed-pdf`, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[#1F3A5F] bg-[#1F3A5F]/10 hover:bg-[#1F3A5F]/20 border border-[#1F3A5F]/20 rounded-md shadow-sm transition-all duration-200"
                        >
                          <FileText size={14} /> Lihat PDF
                        </button>

                        {onDelete && r.can_cancel !== false && r.status !== 'approved' && (
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
                        )}
                      </div>
                    </td>
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
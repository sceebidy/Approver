"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useDocumentList } from "@/lib/useDocumentList";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import DateRangeFilter from "@/components/DateRangeFilter";
import { isDateInRange } from "@/lib/dateUtils";

type DocTypeFilter = "ALL" | "PPAB" | "PO" | "MIS" | "FR" | "FS";
type DocStatusFilter = "ALL" | "approved" | "pending" | "rejected";

export default function HistoryPage() {
  const { rows: historyDocs, loading, error, refresh } = useDocumentList("submissions/history");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<DocTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<DocStatusFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<{ id: number; type: "ppab" | "po" | "mis" | "fr" | "fs" } | null>(null);

  // Filtered documents calculation
  const filteredDocs = useMemo(() => {
    return historyDocs.filter((doc: any) => {
      // Type filter
      if (selectedType !== "ALL" && doc.type?.toUpperCase() !== selectedType) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "ALL" && (doc.status || "pending").toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      // Date range filter
      if (startDate || endDate) {
        if (!isDateInRange(doc.created_at, startDate, endDate)) {
          return false;
        }
      }
      // Search term filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const numberMatch = doc.number?.toLowerCase().includes(query);
        const descMatch = doc.description?.toLowerCase().includes(query);
        const typeMatch = doc.type?.toLowerCase().includes(query);
        return numberMatch || descMatch || typeMatch;
      }
      return true;
    });
  }, [historyDocs, selectedType, selectedStatus, searchTerm, startDate, endDate]);

  // Counts for tabs
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: historyDocs.length };
    historyDocs.forEach((d: any) => {
      const t = d.type?.toUpperCase();
      if (t) {
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return counts;
  }, [historyDocs]);

  return (
    <main className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E3E6EA]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#1F3A5F] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
            <span className="text-[#9CA3AF] text-sm">/</span>
            <span className="text-[13px] font-semibold text-[#1F3A5F]">Riwayat Dokumen</span>
          </div>
          <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#111827] tracking-tight">
            Riwayat Dokumen
          </h1>
          <p className="text-[14px] text-[#6B7280]">
            Kelola dan pantau seluruh riwayat pengajuan serta persetujuan dokumen Anda.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#1F3A5F] bg-white border border-[#E3E6EA] hover:bg-[#F8F9FB] rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E3E6EA] p-4 md:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4 relative z-30">
        {/* Document Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          {(["ALL", "PPAB", "PO", "MIS", "FR", "FS"] as DocTypeFilter[]).map((type) => {
            const isActive = selectedType === type;
            const count = typeCounts[type] || 0;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all shrink-0 flex items-center gap-2 ${
                  isActive
                    ? "bg-[#1F3A5F] text-white shadow-sm"
                    : "bg-[#F8F9FB] text-[#4B5563] hover:bg-[#E3E6EA]/60 hover:text-[#111827]"
                }`}
              >
                <span>{type === "ALL" ? "Semua Dokumen" : type}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#E3E6EA] text-[#6B7280]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2 border-t border-[#E3E6EA]">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nomor dokumen, deskripsi, vendor..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg text-[13.5px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />

          {/* Status Select */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={16} className="text-[#6B7280]" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DocStatusFilter)}
              className="px-3 py-2 bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg text-[13.5px] font-semibold text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F] transition-all"
            >
              <option value="ALL">Semua Status</option>
              <option value="pending">Pending (Menunggu)</option>
              <option value="approved">Approved (Disetujui)</option>
              <option value="rejected">Rejected (Ditolak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      <section className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-3.5 bg-[#F8F9FB] border-b border-[#E3E6EA] flex items-center justify-between">
          <span className="text-[12.5px] font-bold text-[#6B7280] uppercase tracking-wider">
            Menampilkan {filteredDocs.length} Dokumen
          </span>
          {error && (
            <span className="text-[12px] text-red-600 font-medium">
              Gagal memuat: {error}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#E3E6EA]/70">
          {loading ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-[#1F3A5F]" />
              <span className="text-sm font-medium">Memuat riwayat dokumen...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#F1F3F6] flex items-center justify-center">
                <FileText size={24} className="text-[#9CA3AF]" />
              </div>
              <h4 className="text-[15px] font-bold text-[#111827]">Tidak Ada Dokumen Ditemukan</h4>
              <p className="text-[13px] text-[#6B7280] max-w-sm">
                {searchTerm || selectedType !== "ALL" || selectedStatus !== "ALL" || startDate || endDate
                  ? "Coba ubah kata kunci pencarian atau sesuaikan rentang tanggal, filter status, dan tipe dokumen."
                  : "Anda belum memiliki riwayat pengajuan atau persetujuan dokumen."}
              </p>
              {(searchTerm || selectedType !== "ALL" || selectedStatus !== "ALL" || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("ALL");
                    setSelectedStatus("ALL");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="mt-2 text-[13px] font-semibold text-[#1F3A5F] hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            filteredDocs.map((d: any) => {
              const lowerType = (d.type || "").toLowerCase();
              const status = (d.status || "pending").toLowerCase();

              return (
                <div
                  key={`${d.type}-${d.id}`}
                  onClick={() => {
                    if (["ppab", "po", "mis", "fr", "fs"].includes(lowerType)) {
                      setSelectedDoc({ id: d.id, type: lowerType as any });
                    }
                  }}
                  className="p-4 md:px-6 md:py-4 hover:bg-[#F8F9FB] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-[11px] text-[#1F3A5F] bg-[#1F3A5F]/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {d.type}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                        status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200/60' :
                        'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        {status === 'approved' && <CheckCircle2 size={12} />}
                        {status === 'rejected' && <XCircle size={12} />}
                        {status === 'pending' && <Clock size={12} />}
                        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </span>
                    </div>

                    <h3 className="text-[14.5px] font-bold text-[#111827] group-hover:text-[#1F3A5F] transition-colors truncate">
                      {d.number}
                    </h3>
                    <p className="text-[12.5px] text-[#6B7280] truncate">
                      {d.description || "Tidak ada deskripsi"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E3E6EA]">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] text-[#9CA3AF] uppercase font-semibold">Tanggal</span>
                      <span className="text-[12.5px] font-medium text-[#4B5563]">
                        {new Date(d.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <button
                      className="p-2 rounded-lg text-[#1F3A5F] bg-[#1F3A5F]/5 group-hover:bg-[#1F3A5F] group-hover:text-white transition-all shadow-sm"
                      title="Lihat Detail Dokumen"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Integration */}
      <DocumentDetailModal
        isOpen={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        docId={selectedDoc?.id || null}
        docType={selectedDoc?.type || "ppab"}
      />
    </main>
  );
}

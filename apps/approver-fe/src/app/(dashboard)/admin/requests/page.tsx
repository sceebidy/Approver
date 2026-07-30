"use client";

import { useState, useEffect, useMemo } from "react";
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
  ShieldAlert,
  ShieldCheck,
  User,
  Building2,
  Inbox,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import DateRangeFilter from "@/components/DateRangeFilter";
import { isDateInRange } from "@/lib/dateUtils";

type DocTypeFilter = "ALL" | "PPAB" | "PO" | "MIS" | "FR" | "FS";
type DocStatusFilter = "ALL" | "approved" | "pending" | "rejected";

interface RequestItem {
  id: number;
  type: string;
  number: string;
  description: string;
  created_at: string;
  status: string;
  requester?: {
    name: string;
    email: string;
    unit_nama: string;
  };
}

export default function AdminRequestsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<DocTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<DocStatusFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedDoc, setSelectedDoc] = useState<{ id: number; type: "ppab" | "po" | "mis" | "fr" | "fs" } | null>(null);

  // 1. Verify User Authentication & Admin Role
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.user) {
            const user = json.data.user;
            setCurrentUser(user);
            const userRole = (user.role || "").toLowerCase();
            if (userRole === "super_admin" || userRole === "admin") {
              setIsAuthorized(true);
            } else {
              setIsAuthorized(false);
            }
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthorized(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAdminAuth();
  }, []);

  // 2. Fetch Admin Requests Data if Authorized
  const fetchAdminRequests = async () => {
    if (!isAuthorized) return;
    setLoadingData(true);
    setErrorData(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/admin/requests`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRequests(json.data);
        } else {
          setErrorData(json.message || "Gagal memuat data request.");
        }
      } else if (res.status === 403) {
        setErrorData("Akses ditolak: Anda tidak memiliki izin untuk mengakses data ini.");
        setIsAuthorized(false);
      } else {
        setErrorData("Terjadi kesalahan saat menghubungi server.");
      }
    } catch (err: any) {
      console.error("Error fetching admin requests:", err);
      setErrorData("Gagal terhubung ke server backend.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminRequests();
    }
  }, [isAuthorized]);

  // 3. Filter calculation
  const filteredRequests = useMemo(() => {
    return requests.filter((doc) => {
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
        const requesterMatch = doc.requester?.name?.toLowerCase().includes(query);
        const unitMatch = doc.requester?.unit_nama?.toLowerCase().includes(query);
        return numberMatch || descMatch || typeMatch || requesterMatch || unitMatch;
      }
      return true;
    });
  }, [requests, selectedType, selectedStatus, searchTerm, startDate, endDate]);

  // Type counts for tabs
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: requests.length };
    requests.forEach((d) => {
      const t = d.type?.toUpperCase();
      if (t) {
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return counts;
  }, [requests]);

  // Stat summary counts
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    requests.forEach((r) => {
      const s = (r.status || "pending").toLowerCase();
      if (s === "approved") approved++;
      else if (s === "rejected") rejected++;
      else pending++;
    });
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  // Render Auth Loading State
  if (loadingAuth) {
    return (
      <main className="p-8 max-w-[1400px] mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 size={32} className="animate-spin text-[#1F3A5F]" />
        <p className="text-sm font-medium text-[#6B7280]">Memeriksa hak akses Administrator...</p>
      </main>
    );
  }

  // Render Access Denied Guard if Not Authorized
  if (!isAuthorized) {
    return (
      <main className="p-6 md:p-12 max-w-[800px] mx-auto w-full flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white border border-red-200 rounded-2xl p-8 md:p-10 shadow-lg text-center space-y-5 w-full">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={36} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">403 - Akses Ditolak</h1>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Halaman ini terlindungi dan khusus diperuntukkan bagi akun <strong>Administrator</strong>. Akun Anda tidak memiliki hak akses untuk melihat menu ini.
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3A5F] text-white text-sm font-semibold hover:bg-[#1F3A5F]/90 transition-all shadow-md"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Authorized Admin View
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
            <span className="text-[13px] font-semibold text-red-600">Admin</span>
            <span className="text-[#9CA3AF] text-sm">/</span>
            <span className="text-[13px] font-semibold text-[#1F3A5F]">Semua Request</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#111827] tracking-tight">
              Monitoring Semua Request
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              <ShieldCheck size={13} />
              <span>Admin Access</span>
            </span>
          </div>

          <p className="text-[14px] text-[#6B7280]">
            Pantau dan periksa seluruh pengajuan dokumen sistem dari semua user di perusahaan.
          </p>
        </div>

        <button
          onClick={fetchAdminRequests}
          disabled={loadingData}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-[#1F3A5F] bg-white border border-[#E3E6EA] hover:bg-[#F8F9FB] rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E3E6EA] p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] flex items-center justify-center shrink-0">
            <Inbox size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Total Request</span>
            <h3 className="text-xl font-black text-[#111827]">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E3E6EA] p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <h3 className="text-xl font-black text-amber-700">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E3E6EA] p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved</span>
            <h3 className="text-xl font-black text-emerald-700">{stats.approved}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E3E6EA] p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Rejected</span>
            <h3 className="text-xl font-black text-red-700">{stats.rejected}</h3>
          </div>
        </div>
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
                <span>{type === "ALL" ? "Semua Tipe" : type}</span>
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
              placeholder="Cari nomor dokumen, pembuat (requester), deskripsi, unit..."
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

      {/* Main Table */}
      <section className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-3.5 bg-[#F8F9FB] border-b border-[#E3E6EA] flex items-center justify-between">
          <span className="text-[12.5px] font-bold text-[#6B7280] uppercase tracking-wider">
            Menampilkan {filteredRequests.length} Request
          </span>
          {errorData && (
            <span className="text-[12px] text-red-600 font-medium">
              {errorData}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#E3E6EA]/70">
          {loadingData ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-[#1F3A5F]" />
              <span className="text-sm font-medium">Memuat data request sistem...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#F1F3F6] flex items-center justify-center">
                <FileText size={24} className="text-[#9CA3AF]" />
              </div>
              <h4 className="text-[15px] font-bold text-[#111827]">Tidak Ada Request Ditemukan</h4>
              <p className="text-[13px] text-[#6B7280] max-w-sm">
                {searchTerm || selectedType !== "ALL" || selectedStatus !== "ALL" || startDate || endDate
                  ? "Coba sesuaikan kata kunci pencarian atau reset filter."
                  : "Belum ada dokumen pengajuan di dalam sistem."}
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
            filteredRequests.map((d) => {
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
                  className="p-4 md:px-6 md:py-4 hover:bg-[#F8F9FB] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Badges & Numbers */}
                  <div className="min-w-0 flex-1 space-y-1.5">
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

                  {/* Middle Column: Requester Info */}
                  <div className="min-w-[200px] shrink-0 space-y-0.5 border-t md:border-t-0 md:border-l md:pl-4 border-[#E3E6EA] pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#111827]">
                      <User size={14} className="text-[#1F3A5F] shrink-0" />
                      <span className="truncate">{d.requester?.name || "N/A"}</span>
                    </div>
                    {d.requester?.unit_nama && (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#6B7280]">
                        <Building2 size={13} className="text-[#9CA3AF] shrink-0" />
                        <span className="truncate">{d.requester.unit_nama}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Date & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#E3E6EA]">
                    <div className="text-left md:text-right">
                      <span className="block text-[11px] text-[#9CA3AF] uppercase font-semibold">Tgl Pengajuan</span>
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

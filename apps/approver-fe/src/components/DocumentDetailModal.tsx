"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, FileText, User, Calendar, Tag, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getXsrfToken } from "@/lib/csrf";

interface ApproverLine {
  id: number;
  approver_id: number;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string | null;
  approver: {
    id: number;
    name: string;
  };
}

interface DocDetail {
  id: number;
  request_type: string;
  can_cancel: boolean;
  user?: { name: string };
  user_name?: string;
  created_at: string;
  approverLines?: ApproverLine[];
  approver_lines?: ApproverLine[];
  // PPAB specific
  nomor_ppab?: string;
  deskripsi?: string;
  items?: any[];
  subtotals?: any[];
  // PO specific
  nomor_po?: string;
  nomor_ppab_po?: string;
  vendor?: string;
  itemLines?: any[];
  item_lines?: any[];
  // MIS specific
  nomor_mis?: string;
  tgl_mis?: string;
  current_user_id?: number;
}

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: number | null;
  docType: 'ppab' | 'po' | 'mis';
}

export default function DocumentDetailModal({ isOpen, onClose, docId, docType }: DocumentDetailModalProps) {
  const [data, setData] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && docId) {
      fetchDetail();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, docId, docType]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/${docType}/${docId}`, {
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || `Gagal mengambil data (${res.status})`);
      }
      setData(resData.data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!data || !data.current_user_id) return;
    const actualApprovers = data.approverLines || data.approver_lines || [];
    const pendingLine = actualApprovers.find(l => l.approver_id === data.current_user_id && l.status === 'pending');
    if (!pendingLine) return;

    if (!confirm(`Apakah Anda yakin ingin me${action === 'approve' ? 'nyetujui' : 'nolak'} dokumen ini?`)) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/submissions/${docType.toLowerCase()}/${pendingLine.id}/${action}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        credentials: "include"
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server mengembalikan respon non-JSON (${res.status}): ${text.slice(0, 150)}`);
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Aksi gagal');
      fetchDetail(); // Refresh data to show updated status
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  const title = docType === 'ppab' ? 'Detail PPAB' : docType === 'po' ? 'Detail PO' : 'Detail MIS';
  const docNumber = data?.nomor_ppab || data?.nomor_po || data?.nomor_mis || '-';
  const actualItems = data?.items || data?.itemLines || data?.item_lines || [];
  const actualApprovers = data?.approverLines || data?.approver_lines || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" aria-modal role="dialog">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-white sm:rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E6EA] px-5 py-4 shrink-0 bg-[#F8F9FB] sm:rounded-t-lg">
          <div>
            <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
            {data && <p className="text-[13px] text-[#6B7280] font-mono mt-0.5">{docNumber}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-[#1F3A5F]" />
              <span className="text-sm font-medium">Memuat detail...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-600 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle size={32} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E3E6EA] rounded-lg p-4 space-y-3 shadow-sm">
                  <h4 className="text-[13px] font-semibold text-[#374151] flex items-center gap-2 mb-3 border-b pb-2">
                    <FileText size={16} className="text-[#9CA3AF]" />
                    Informasi Dokumen
                  </h4>
                  <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-2.5 text-[13px]">
                    <span className="text-[#6B7280]">Pembuat</span>
                    <span className="font-medium text-[#111827] flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      {data.user?.name || data.user_name || '-'}
                    </span>

                    <span className="text-[#6B7280]">Dibuat Pada</span>
                    <span className="font-medium text-[#111827] flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(data.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>

                    <span className="text-[#6B7280]">Tipe Request</span>
                    <span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${data.request_type === 'Pengajuan Saya' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          data.request_type === 'Butuh Approval Anda' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                        {data.request_type}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#E3E6EA] rounded-lg p-4 space-y-3 shadow-sm">
                  <h4 className="text-[13px] font-semibold text-[#374151] flex items-center gap-2 mb-3 border-b pb-2">
                    <Tag size={16} className="text-[#9CA3AF]" />
                    Rincian Spesifik
                  </h4>
                  <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-2.5 text-[13px]">
                    {docType === 'ppab' && (
                      <>
                        <span className="text-[#6B7280]">Deskripsi</span>
                        <span className="font-medium text-[#111827]">{data.deskripsi || '-'}</span>
                      </>
                    )}
                    {docType === 'po' && (
                      <>
                        <span className="text-[#6B7280]">Vendor</span>
                        <span className="font-medium text-[#111827]">{data.vendor || '-'}</span>
                        <span className="text-[#6B7280]">Ref. PPAB</span>
                        <span className="font-medium text-[#111827] font-mono text-[12px]">{data.nomor_ppab || data.nomor_ppab_po || '-'}</span>
                      </>
                    )}
                    {docType === 'mis' && (
                      <>
                        <span className="text-[#6B7280]">Tanggal MIS</span>
                        <span className="font-medium text-[#111827]">{data.tgl_mis ? new Date(data.tgl_mis).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-[#E3E6EA] rounded-lg overflow-hidden shadow-sm">
                <div className="bg-[#F8F9FB] px-4 py-2.5 border-b border-[#E3E6EA]">
                  <h4 className="text-[13px] font-semibold text-[#374151]">Daftar Item</h4>
                </div>
                {actualItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] text-left">
                      <thead className="text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E3E6EA] bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">No</th>
                          <th className="px-4 py-2.5 font-medium">Deskripsi / Item</th>
                          <th className="px-4 py-2.5 font-medium text-right">Qty</th>
                          <th className="px-4 py-2.5 font-medium">Satuan</th>
                          {docType !== 'mis' && (
                            <th className="px-4 py-2.5 font-medium text-right">Harga Satuan</th>
                          )}
                          {docType === 'mis' && (
                            <th className="px-4 py-2.5 font-medium">Remark</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3E6EA]">
                        {actualItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-[#6B7280]">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-[#111827]">
                              {item.deskripsi || item.desc || '-'}
                              {item.spec && <div className="text-[11px] text-[#6B7280] mt-0.5 font-normal whitespace-pre-wrap">{item.spec}</div>}
                              {item.line_specs && item.line_specs.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-[11px] text-[#6B7280] font-normal list-disc list-inside">
                                  {item.line_specs.map((spec: any, sIdx: number) => (
                                    <li key={sIdx}>{spec.deskripsi}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-[12px]">{Number(item.qty).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-2.5 text-[#6B7280]">{item.satuan || '-'}</td>
                            {docType !== 'mis' && (
                              <td className="px-4 py-2.5 text-right font-mono text-[12px] whitespace-nowrap">
                                {item.currency !== 'IDR' ? `${item.currency} ` : 'Rp '}
                                {Number(item.harga_satuan).toLocaleString('id-ID')}
                              </td>
                            )}
                            {docType === 'mis' && (
                              <td className="px-4 py-2.5 text-[#6B7280]">{item.remark || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-[#6B7280]">Tidak ada item ditemukan.</div>
                )}
                {/* Subtotals (for PPAB/PO) */}
                {data.subtotals && data.subtotals.length > 0 && (
                  <div className="border-t border-[#E3E6EA] bg-slate-50 p-4 flex justify-end">
                    <div className="w-full sm:w-1/2">
                      <table className="w-full text-[13px]">
                        <tbody className="divide-y divide-slate-200/60">
                          {data.subtotals.map((st, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 text-[#6B7280]">{st.deskripsi}</td>
                              <td className="py-1.5 text-right font-semibold text-[#111827] font-mono text-[12.5px]">
                                {st.value ? (
                                  <>
                                    <span className="text-[11px] text-[#9CA3AF] font-normal mr-1">{st.currency || 'IDR'}</span>
                                    {Number(st.value).toLocaleString('id-ID')}
                                  </>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Approvers Timeline */}
              <div className="bg-white border border-[#E3E6EA] rounded-lg shadow-sm">
                <div className="bg-[#F8F9FB] px-4 py-2.5 border-b border-[#E3E6EA] rounded-t-lg">
                  <h4 className="text-[13px] font-semibold text-[#374151]">Status Persetujuan</h4>
                </div>
                <div className="p-5">
                  {actualApprovers.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-6 pb-2">
                      {actualApprovers.map((line, idx) => {
                        const isApproved = line.status === 'approved';
                        const isRejected = line.status === 'rejected';
                        const isPending = line.status === 'pending';

                        return (
                          <div key={idx} className="relative pl-6">
                            <span className="absolute -left-[9px] top-1 bg-white">
                              {isApproved ? (
                                <CheckCircle2 size={16} className="text-emerald-500 bg-white" />
                              ) : isRejected ? (
                                <XCircle size={16} className="text-red-500 bg-white" />
                              ) : (
                                <Clock size={16} className="text-amber-500 bg-white" />
                              )}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                              <div>
                                <h5 className="text-[14px] font-semibold text-[#111827]">
                                  {line.approver?.name || `User #${line.approver_id}`}
                                </h5>
                                <p className="text-[12px] text-[#6B7280] uppercase tracking-wider font-medium mt-0.5">
                                  {line.role ? line.role.replace(/_/g, ' ') : 'APPROVER'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                                <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${isApproved ? 'bg-emerald-50 text-emerald-700' :
                                    isRejected ? 'bg-red-50 text-red-700' :
                                      'bg-amber-50 text-amber-700'
                                  }`}>
                                  {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                                </span>
                                {line.timestamp && (
                                  <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap mt-1 sm:mt-0">
                                    {new Date(line.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-[#6B7280] py-4">Tidak ada data approver.</div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E3E6EA] p-4 bg-[#F8F9FB] sm:rounded-b-lg flex items-center justify-between shrink-0">
          <div>
            {data && data.current_user_id && actualApprovers.some(l => l.approver_id === data.current_user_id && l.status === 'pending') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('approve')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 size={16} /> Setujui
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
                >
                  <XCircle size={16} /> Tolak
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D1D5DB] text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

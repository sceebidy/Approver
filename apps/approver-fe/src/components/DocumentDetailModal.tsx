"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, FileText, User, Calendar, Tag, CheckCircle2, Clock, XCircle, Calculator, FileSpreadsheet, Edit3, Paperclip, ExternalLink } from "lucide-react";
import { getXsrfToken } from "@/lib/csrf";
import VerfAnggaranModal, { VerfAnggaranData } from "./VerfAnggaranModal";

interface ApproverLine {
  id: number;
  approver_id: number;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string | null;
  signed_at?: string | null;
  updated_at?: string | null;
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
  verf_anggaran?: VerfAnggaranData | null;
  verfAnggaran?: VerfAnggaranData | null;
  // PO specific
  nomor_po?: string;
  nomor_ppab_po?: string;
  vendor?: string;
  itemLines?: any[];
  item_lines?: any[];
  // MIS specific
  nomor_mis?: string;
  tgl_mis?: string;
  // FR specific
  number_fr?: string;
  keterangan?: string;
  kategori_fr_name?: string;
  attachments?: Array<{ id: number; filename: string; url: string }>;
  // FS specific
  number_fs?: string;
  balance?: number;
  balance_due_to_employee?: number;
  balance_due_to_company?: number;
  fr_id?: number;
  current_user_id?: number;
  current_user_ids?: number[];
}

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: number | null;
  docType: 'ppab' | 'po' | 'mis' | 'fr' | 'fs';
  onSuccess?: () => void;
}

export default function DocumentDetailModal({ isOpen, onClose, docId, docType, onSuccess }: DocumentDetailModalProps) {
  const [data, setData] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerfModalOpen, setIsVerfModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject';
    lineId: number | null;
    isLoading: boolean;
    catatan: string;
  }>({
    isOpen: false,
    action: 'approve',
    lineId: null,
    isLoading: false,
    catatan: ''
  });

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

  const promptAction = (action: 'approve' | 'reject', lineId: number) => {
    setConfirmModal({
      isOpen: true,
      action,
      lineId,
      isLoading: false,
      catatan: ''
    });
  };

  const executeAction = async () => {
    if (!data || !data.current_user_id || !confirmModal.isOpen || !confirmModal.lineId) return;

    // Validasi: alasan wajib untuk reject
    if (confirmModal.action === 'reject' && !confirmModal.catatan.trim()) {
      return; // tombol confirm sudah di-disable, ini safety guard
    }

    setConfirmModal(prev => ({ ...prev, isLoading: true }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';

      const body: Record<string, string> = {};
      if (confirmModal.action === 'reject' && confirmModal.catatan.trim()) {
        body.catatan = confirmModal.catatan.trim();
      }

      const res = await fetch(`${apiUrl}/submissions/${docType.toLowerCase()}/${confirmModal.lineId}/${confirmModal.action}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        credentials: "include"
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || `Gagal memproses persetujuan (${res.status})`);
      }

      // Refresh detail setelah berhasil
      await fetchDetail();

      // Dispatch global refresh event
      window.dispatchEvent(new Event("refresh-document-list"));

      // Call parent success callback
      if (onSuccess) {
        onSuccess();
      }

      setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err: any) {
      alert(err.message || "Gagal memproses tindakan.");
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!isOpen) return null;

  const title = docType === 'ppab' 
    ? 'Detail PPAB' 
    : docType === 'po' 
      ? 'Detail PO' 
      : docType === 'mis' 
        ? 'Detail MIS' 
        : docType === 'fr' 
          ? 'Detail Fund Requisition (FR)' 
          : 'Detail Fund Settlement (FS)';

  const docNumber = data?.nomor_ppab || data?.nomor_po || data?.nomor_mis || data?.number_fr || data?.number_fs || '-';
  const actualItems = data?.items || data?.itemLines || data?.item_lines || [];
  const actualApprovers = data?.approverLines || data?.approver_lines || (data as any)?.approvers || [];

  const grandTotal = actualItems.reduce((acc, item) => {
    if (docType === 'fs') {
      return acc + (Number(item.total) || 0);
    }
    if (docType === 'fr') {
      let taxSum = 0;
      if (item.taxes && item.taxes.length > 0) {
        taxSum = item.taxes.reduce((tAcc: number, t: any) => tAcc + (Number(t.value) || 0), 0);
      }
      return acc + (Number(item.sub_total) || 0) + taxSum;
    }
    return acc + (Number(item.qty) * Number(item.harga_satuan) || 0);
  }, 0);

  const userPendingLines = data && data.current_user_id
    ? actualApprovers.filter((l: any) => l.approver_id === data.current_user_id && l.status === 'pending')
    : [];

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
                        <span className="text-[#6B7280]">Nomor MIS</span>
                        <span className="font-medium text-[#111827] font-mono text-[12px]">{data.nomor_mis || '-'}</span>

                        <span className="text-[#6B7280]">Tanggal MIS</span>
                        <span className="font-medium text-[#111827]">{data.tgl_mis ? new Date(data.tgl_mis).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</span>

                        <span className="text-[#6B7280]">Jumlah Item</span>
                        <span className="font-medium text-[#111827]">{actualItems.length} item</span>
                      </>
                    )}
                    {docType === 'fr' && (
                      <>
                        <span className="text-[#6B7280]">Kategori FR</span>
                        <span className="font-medium text-[#111827]">{data.kategori_fr_name || '-'}</span>
                        <span className="text-[#6B7280]">Keterangan</span>
                        <span className="font-medium text-[#111827]">{data.keterangan || '-'}</span>
                      </>
                    )}
                    {docType === 'fs' && (
                      <>
                        <span className="text-[#6B7280]">Ref. FR ID</span>
                        <span className="font-medium text-[#111827] font-mono">{data.fr_id || '-'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Lampiran & Dokumen Pendukung (FR / FS Attachments) */}
              {data.attachments && data.attachments.length > 0 && (
                <div className="bg-white border border-[#E3E6EA] rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-[#F8F9FB] px-4 py-2.5 border-b border-[#E3E6EA] flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-[#374151] flex items-center gap-2">
                      <Paperclip size={16} className="text-[#1F3A5F]" />
                      Lampiran & Dokumen Pendukung ({data.attachments.length})
                    </h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white">
                    {data.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:border-[#1F3A5F] hover:bg-blue-50/20 transition group text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText size={16} className="text-[#1F3A5F] shrink-0" />
                          <span className="font-semibold text-gray-800 truncate group-hover:text-[#1F3A5F]">
                            {att.filename}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#1F3A5F] group-hover:underline flex items-center gap-1 shrink-0 ml-2">
                          Buka <ExternalLink size={12} />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Verifikasi Anggaran Card (PPAB Specific) */}
              {docType === 'ppab' && (
                <div className="bg-white border border-[#E3E6EA] rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-[#F8F9FB] px-4 py-2.5 border-b border-[#E3E6EA] flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-[13px] font-semibold text-[#374151] flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-[#1F3A5F]" />
                      Stamp Verifikasi Anggaran
                    </h4>
                    <div className="flex items-center gap-2">
                      {(data?.verf_anggaran || data?.verfAnggaran) && (
                        <button
                          onClick={() => {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
                            window.open(`${apiUrl}/ppab/${data.id}/preview-pdf`, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-md transition-all shadow-xs"
                          title="Pratinjau PDF Asli dengan Stamp Verifikasi Anggaran"
                        >
                          <FileText size={13} /> Pratinjau PDF (Verifikasi Anggaran)
                        </button>
                      )}
                      {(userPendingLines.length > 0 || actualApprovers.some((l: any) => l.approver_id === data?.current_user_id)) && (
                        <button
                          onClick={() => setIsVerfModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F3A5F] hover:bg-[#152843] text-white text-[12px] font-semibold rounded-md transition-all shadow-xs"
                        >
                          <Edit3 size={13} />
                          {(data?.verf_anggaran || data?.verfAnggaran) ? "Edit Verifikasi Anggaran" : "Isi Verifikasi Anggaran"}
                        </button>
                      )}
                    </div>
                  </div>

                  {(data?.verf_anggaran || data?.verfAnggaran) ? (
                    (() => {
                      const verf = data.verf_anggaran || data.verfAnggaran!;
                      return (
                        <div className="p-4 space-y-3 text-[13px]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-[#6B7280] text-xs block mb-1">Sumber Rekening</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                String(verf.sumber_rek).toLowerCase() === 'investasi' ? 'bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {verf.sumber_rek}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6B7280] text-xs block mb-1">Beban Rekening</span>
                              <span className="font-semibold text-slate-900">{verf.beban_rek || '-'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                              <span className="text-[11px] text-slate-500 block uppercase font-medium">RKAP 1 Tahun</span>
                              <span className="text-[14px] font-bold font-mono text-slate-900">
                                Rp {Number(verf.rkap_1_tahun || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                              <span className="text-[11px] text-slate-500 block uppercase font-medium">Realisasi</span>
                              <span className="text-[14px] font-bold font-mono text-slate-900">
                                Rp {Number(verf.realisasi || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                              <span className="text-[11px] text-slate-500 block uppercase font-medium">Permintaan</span>
                              <span className="text-[14px] font-bold font-mono text-[#1F3A5F]">
                                Rp {Number(verf.permintaan || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                              <span className="text-[11px] text-slate-500 block uppercase font-medium">Sisa Anggaran</span>
                              <span className="text-[14px] font-bold font-mono text-emerald-700">
                                Rp {Number(verf.sisa_anggaran || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-4 text-center bg-slate-50/50">
                      <p className="text-xs text-slate-500 mb-2">Belum ada data Verifikasi Anggaran yang diisi untuk pengajuan PPAB ini.</p>
                      {(userPendingLines.length > 0 || actualApprovers.some((l: any) => l.approver_id === data?.current_user_id)) && (
                        <button
                          onClick={() => setIsVerfModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F3A5F] hover:bg-[#152843] text-white text-xs font-semibold rounded-md transition-all shadow-xs"
                        >
                          <Edit3 size={14} /> Isi Verifikasi Anggaran Sekarang
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="bg-white border border-[#E3E6EA] rounded-lg overflow-hidden shadow-sm">
                <div className="bg-[#F8F9FB] px-4 py-2.5 border-b border-[#E3E6EA]">
                  <h4 className="text-[13px] font-semibold text-[#374151]">Daftar Item</h4>
                </div>
                {actualItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    {docType === 'fr' ? (
                      <table className="w-full text-[13px] text-left">
                        <thead className="text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E3E6EA] bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">No</th>
                            <th className="px-4 py-2.5 font-medium">Deskripsi / Item</th>
                            <th className="px-4 py-2.5 font-medium text-right">Subtotal</th>
                            <th className="px-4 py-2.5 font-medium">Pajak</th>
                            <th className="px-4 py-2.5 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3E6EA]">
                          {actualItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 text-[#6B7280]">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-[#111827]">{item.deskripsi}</td>
                              <td className="px-4 py-2.5 text-right font-mono text-[12px]">Rp {Number(item.sub_total).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-[#6B7280]">
                                {item.taxes && item.taxes.length > 0 ? (
                                  <div className="flex flex-col gap-0.5 text-[11px]">
                                    {item.taxes.map((t: any, tIdx: number) => (
                                      <span key={tIdx} className={t.value < 0 ? 'text-rose-600 font-medium' : 'text-blue-600 font-medium'}>
                                        {t.name} ({t.value < 0 ? '-' : '+'} Rp {Math.abs(t.value).toLocaleString('id-ID')})
                                      </span>
                                    ))}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[12px] font-semibold text-[#111827]">Rp {Number(item.total || item.sub_total).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : docType === 'fs' ? (
                      <table className="w-full text-[13px] text-left">
                        <thead className="text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E3E6EA] bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">No</th>
                            <th className="px-4 py-2.5 font-medium">Deskripsi Pengeluaran</th>
                            <th className="px-4 py-2.5 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3E6EA]">
                          {actualItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 text-[#6B7280]">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-[#111827]">{item.deskripsi}</td>
                              <td className="px-4 py-2.5 text-right font-mono text-[12px] font-semibold text-[#111827]">Rp {Number(item.total).toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
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
                                  {item.currency && item.currency !== 'IDR' ? `${item.currency} ` : 'Rp '}
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
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-[#6B7280]">Tidak ada item ditemukan.</div>
                )}
                {/* Subtotals (for PPAB/PO/etc) */}
                {docType !== 'mis' && (actualItems.length > 0 || (data.subtotals && data.subtotals.length > 0)) && (
                  <div className="border-t border-[#E3E6EA] bg-slate-50 p-4 flex justify-end">
                    <div className="w-full sm:w-1/2">
                      <table className="w-full text-[13px]">
                        <tbody className="divide-y divide-slate-200/60">
                          {actualItems.length > 0 && (
                            <tr>
                              <td className="py-2 text-[#374151] font-semibold">Total Nilai Item</td>
                              <td className="py-2 text-right font-bold text-[#111827] font-mono text-[13.5px]">
                                {actualItems[0]?.currency && actualItems[0]?.currency !== 'IDR' ? `${actualItems[0]?.currency} ` : 'Rp '}
                                {Number(actualItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.harga_satuan) || 0)), 0)).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          )}
                          {data.subtotals && data.subtotals.length > 0 ? data.subtotals.map((st, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 text-[#6B7280]">{st.deskripsi}</td>
                              <td className="py-1.5 text-right font-medium text-[#111827] font-mono text-[12.5px]">
                                {st.value ? (
                                  <>
                                    <span className="text-[11px] text-[#9CA3AF] font-normal mr-1">{st.currency && st.currency !== 'IDR' ? st.currency : 'Rp'}</span>
                                    {Number(st.value).toLocaleString('id-ID')}
                                  </>
                                ) : '-'}
                              </td>
                            </tr>
                          )) : (
                            docType === 'po' && actualItems.length > 0 && (() => {
                              const totalItems = actualItems.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.harga_satuan) || 0)), 0);
                              const ppn = totalItems * 0.11;
                              const grandTotal = totalItems + ppn;
                              const cur = actualItems[0]?.currency && actualItems[0]?.currency !== 'IDR' ? actualItems[0].currency : 'Rp';
                              return (
                                <>
                                  <tr>
                                    <td className="py-1.5 text-[#6B7280]">PPN 11%</td>
                                    <td className="py-1.5 text-right font-medium text-[#111827] font-mono text-[12.5px]">
                                      <span className="text-[11px] text-[#9CA3AF] font-normal mr-1">{cur}</span>
                                      {Number(ppn).toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 text-[#374151] font-bold">Grand Total</td>
                                    <td className="py-2 text-right font-bold text-[#111827] font-mono text-[13.5px]">
                                      <span className="text-[11px] text-[#9CA3AF] font-normal mr-1">{cur}</span>
                                      {Number(grandTotal).toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                </>
                              );
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Grand Total for FR/FS */}
                {(docType === 'fr' || docType === 'fs') && (
                  <div className="border-t border-[#E3E6EA] bg-[#F8F9FB] p-4 flex justify-end">
                    <div className="text-right">
                      <span className="text-[12px] text-[#6B7280] block uppercase font-medium">Grand Total</span>
                      <span className="text-[16px] font-bold font-mono text-[#1F3A5F]">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}
                {/* Balance & Refunds for FS */}
                {docType === 'fs' && (
                  <div className="border-t border-[#E3E6EA] p-4 bg-slate-50 flex justify-end">
                    <div className="w-full sm:w-1/2 text-[13px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Total Saldo (Balance)</span>
                        <span className="font-semibold text-slate-800 font-mono">Rp {Number(data.balance || 0).toLocaleString('id-ID')}</span>
                      </div>
                      {Number(data.balance_due_to_employee || 0) > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>Kurang Bayar ke Pegawai</span>
                          <span className="font-semibold font-mono">Rp {Number(data.balance_due_to_employee).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {Number(data.balance_due_to_company || 0) > 0 && (
                        <div className="flex justify-between text-blue-700">
                          <span>Sisa Pengembalian ke Perusahaan</span>
                          <span className="font-semibold font-mono">Rp {Number(data.balance_due_to_company).toLocaleString('id-ID')}</span>
                        </div>
                      )}
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
                      {actualApprovers.map((line: any, idx: number) => {
                        const isApproved = line.status === 'approved';
                        const isRejected = line.status === 'rejected';
                        const isPending = line.status === 'pending';

                        const isUserPending = isPending && (
                          line.approver_id === data?.current_user_id ||
                          (Array.isArray(data?.current_user_ids) && data.current_user_ids.includes(line.approver_id))
                        );

                        return (
                          <div 
                            key={idx} 
                            className={`relative pl-6 py-2 transition-all rounded-r-lg ${
                              isUserPending 
                                ? 'bg-amber-50/50 border-l-2 border-amber-500 -ml-[2px]' 
                                : ''
                            }`}
                          >
                            <span className={`absolute ${isUserPending ? '-left-[7px]' : '-left-[9px]'} top-3.5 bg-white`}>
                              {isApproved ? (
                                <CheckCircle2 size={16} className="text-emerald-500 bg-white" />
                              ) : isRejected ? (
                                <XCircle size={16} className="text-red-500 bg-white" />
                              ) : (
                                <Clock size={16} className="text-amber-500 bg-white" />
                              )}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                              <div className="min-w-0">
                                <h5 className="text-[14px] font-semibold text-[#111827]">
                                  {line.approver?.name || `User #${line.approver_id}`}
                                </h5>
                                <p className="text-[12px] text-[#6B7280] uppercase tracking-wider font-medium mt-0.5 flex items-center gap-1.5">
                                  {line.role ? line.role.replace(/_/g, ' ') : 'APPROVER'}
                                  {(isUserPending || (line.approver_id === data?.current_user_id && (isApproved || isRejected))) && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded normal-case tracking-normal">
                                      (Anda)
                                    </span>
                                  )}
                                </p>
                              </div>
                              {/* Kanan: tombol aksi (jika user pending) atau badge status */}
                              <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end sm:gap-1">
                                {isUserPending ? (
                                  /* Ganti badge Pending dengan 3 tombol aksi jika PPAB */
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {docType === 'ppab' && (
                                      <button
                                        onClick={() => setIsVerfModalOpen(true)}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-[#1F3A5F] text-white text-[11px] font-semibold rounded-md hover:bg-[#152843] active:scale-95 transition-all shadow-sm"
                                        title="Isi data Verifikasi Anggaran"
                                      >
                                        <FileSpreadsheet size={12} strokeWidth={2.5} />
                                        {(data?.verf_anggaran || data?.verfAnggaran) ? "Edit Verf. Anggaran" : "Isi Verf. Anggaran"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => promptAction('approve', line.id)}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-semibold rounded-md hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
                                    >
                                      <CheckCircle2 size={12} strokeWidth={2.5} /> Setujui
                                    </button>
                                    <button
                                      onClick={() => promptAction('reject', line.id)}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-red-400 text-red-600 text-[11px] font-semibold rounded-md hover:bg-red-50 active:scale-95 transition-all shadow-sm"
                                    >
                                      <XCircle size={12} strokeWidth={2.5} /> Tolak
                                    </button>
                                  </div>
                                ) : (
                                  /* Badge status read-only untuk baris lain */
                                  <>
                                    <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                        isApproved ? 'bg-emerald-50 text-emerald-700' :
                                        isRejected ? 'bg-red-50 text-red-700' :
                                        'bg-amber-50 text-amber-700'
                                      }`}>
                                      {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                                    </span>
                                    {line.status !== 'pending' && (line.signed_at || line.updated_at || line.timestamp) && (
                                      <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap">
                                        {new Date((line.signed_at || line.updated_at || line.timestamp) as string).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                      </span>
                                    )}
                                  </>
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

        <div className="border-t border-[#E3E6EA] px-5 py-3 bg-[#F8F9FB] sm:rounded-b-lg flex items-center justify-between shrink-0">
          <div>
            {data && (
              <button
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
                  window.open(`${apiUrl}/${docType.toLowerCase()}/${data.id}/signed-pdf`, '_blank');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-bold text-white bg-[#1F3A5F] hover:bg-[#152843] rounded-md shadow-sm transition-all duration-200"
              >
                <FileText size={15} /> Lihat PDF
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D1D5DB] text-[13px] font-medium text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Inline Confirm/Reject Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-[#E3E6EA] animate-in zoom-in-95 duration-150">
            {confirmModal.action === 'approve' ? (
              <>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1">Konfirmasi Persetujuan</h3>
                <p className="text-[13px] text-slate-500 mb-6">Apakah Anda yakin ingin menyetujui pengajuan ini? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    disabled={confirmModal.isLoading}
                    className="px-4 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={confirmModal.isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 shadow-sm"
                  >
                    {confirmModal.isLoading && <Loader2 size={14} className="animate-spin" />}
                    Ya, Setujui
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1">Tolak Pengajuan</h3>
                <p className="text-[13px] text-slate-500 mb-3">Masukkan alasan penolakan. Alasan wajib diisi.</p>
                <textarea
                  value={confirmModal.catatan}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder="Tuliskan alasan penolakan..."
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none mb-4 transition-shadow"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    disabled={confirmModal.isLoading}
                    className="px-4 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={confirmModal.isLoading || !confirmModal.catatan.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {confirmModal.isLoading && <Loader2 size={14} className="animate-spin" />}
                    Ya, Tolak
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Form Verifikasi Anggaran (PPAB) */}
      {docType === 'ppab' && data && (
        <VerfAnggaranModal
          isOpen={isVerfModalOpen}
          onClose={() => setIsVerfModalOpen(false)}
          ppabId={data.id}
          existingData={data.verf_anggaran || data.verfAnggaran}
          onSuccess={(updatedVerf) => {
            setData((prev) => (prev ? { ...prev, verf_anggaran: updatedVerf, verfAnggaran: updatedVerf } : null));
            fetchDetail();
          }}
        />
      )}
    </div>
  );
}

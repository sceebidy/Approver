"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { getXsrfToken } from "@/lib/csrf";
import ConfirmActionModal from "./ConfirmActionModal";

export default function PendingApprovalsList({ onRowClick }: { onRowClick?: (id: number, type: string) => void }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: string;
    id: number;
    action: 'approve' | 'reject';
    isLoading: boolean;
  }>({
    isOpen: false,
    type: '',
    id: 0,
    action: 'approve',
    isLoading: false
  });

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/submissions/pending`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApprovals(data.data);
      } else {
        setError(data.message || "Gagal memuat data persetujuan");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();

    const handleRefresh = () => {
      fetchApprovals();
    };
    window.addEventListener("refresh-document-list", handleRefresh);
    return () => {
      window.removeEventListener("refresh-document-list", handleRefresh);
    };
  }, []);

  const promptAction = (type: string, id: number, action: 'approve' | 'reject') => {
    setConfirmModal({
      isOpen: true,
      type,
      id,
      action,
      isLoading: false
    });
  };

  const executeAction = async () => {
    if (!confirmModal.isOpen) return;
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
      const res = await fetch(`${apiUrl}/submissions/${confirmModal.type.toLowerCase()}/${confirmModal.id}/${confirmModal.action}`, {
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

      const data = await res.json();
      if (res.ok && data.success) {
        setApprovals(prev => prev.filter(item => item.id !== confirmModal.id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      } else {
        alert(data.message || "Aksi gagal");
        setConfirmModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      alert(String(err));
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-[13px] font-medium text-[#6B7280]">Memuat...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-[13px] font-medium text-red-500 bg-red-50/30">{error}</div>;
  }

  if (approvals.length === 0) {
    return <div className="p-10 text-center text-[13.5px] font-medium text-[#6B7280]">Tidak ada pengajuan yang menunggu persetujuan Anda.</div>;
  }

  return (
    <div className="divide-y divide-[#E3E6EA]/70">
      {approvals.map((item) => (
        <div 
          key={item.id} 
          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8F9FB] transition-colors duration-200 group cursor-pointer"
          onClick={() => onRowClick?.(item.document_id, item.type.toLowerCase())}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-bold text-[12px] text-[#1F3A5F] bg-[#1F3A5F]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.type}</span>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-[14px] font-bold text-[#111827] truncate group-hover:text-[#1F3A5F] transition-colors">{item.number}</p>
            <p className="text-[12.5px] text-[#6B7280] line-clamp-2 mt-0.5">{item.description}</p>
            <p className="text-[11px] font-medium text-[#9CA3AF] mt-2">Diajukan: {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                promptAction(item.type, item.id, 'approve');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-500 text-green-600 hover:bg-green-50 rounded-lg text-[12px] font-bold shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all"
            >
              <CheckCircle size={15} strokeWidth={2.5} /> Setujui
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                promptAction(item.type, item.id, 'reject');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-500 text-red-600 hover:bg-red-50 rounded-lg text-[12px] font-bold shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all"
            >
              <XCircle size={15} strokeWidth={2.5} /> Tolak
            </button>
          </div>
        </div>
      ))}

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title="Konfirmasi Persetujuan"
        message={`Apakah Anda yakin ingin me${confirmModal.action === 'approve' ? 'nyetujui' : 'nolak'} pengajuan ini?`}
        confirmText={confirmModal.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        isDestructive={confirmModal.action === 'reject'}
        isLoading={confirmModal.isLoading}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

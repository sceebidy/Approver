"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function PendingApprovalsList() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions/pending", {
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
  }, []);

  const handleAction = async (type: string, id: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/submissions/${type}/${id}/${action}`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        // Remove item from list
        setApprovals(prev => prev.filter(item => item.id !== id));
      } else {
        alert(data.message || "Aksi gagal");
      }
    } catch (err) {
      alert("Error: " + String(err));
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-sm text-[#6B7280]">Memuat...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-sm text-red-500">{error}</div>;
  }

  if (approvals.length === 0) {
    return <div className="p-6 text-center text-sm text-[#6B7280]">Tidak ada pengajuan yang menunggu persetujuan Anda.</div>;
  }

  return (
    <div className="divide-y divide-[#E3E6EA]">
      {approvals.map((item) => (
        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#111827] uppercase">{item.type}</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{item.status}</span>
            </div>
            <p className="text-sm font-medium text-[#374151] mt-1">{item.number}</p>
            <p className="text-xs text-[#6B7280]">{item.description}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-1">Diajukan pada: {new Date(item.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction(item.type, item.id, 'approve')}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium"
            >
              <CheckCircle size={14} /> Setujui
            </button>
            <button
              onClick={() => handleAction(item.type, item.id, 'reject')}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
            >
              <XCircle size={14} /> Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

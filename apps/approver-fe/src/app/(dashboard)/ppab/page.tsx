"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import { useDocumentList } from "@/lib/useDocumentList";
import { refreshCsrfCookie } from "@/lib/csrf";

export default function PpabListPage() {
  const [open, setOpen] = useState(false);
  const { rows, loading, error, refresh } = useDocumentList("ppab");

  const handleDelete = async (row: any) => {
    const xsrfToken = await refreshCsrfCookie();
    const res = await fetch(`/api/ppab/${row.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": xsrfToken,
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Gagal menghapus PPAB (${res.status})`);
    }
    refresh();
  };

  return (
    <>
      <DocumentListPage
        title="PPAB"
        subtitle="Pengajuan Pembelian Anggaran Biaya"
        createNode={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-[#1F3A5F] text-white text-[13px] font-medium px-3.5 py-2 rounded-md hover:bg-[#1a3350]"
          >
            <Plus size={15} strokeWidth={2} />
            Upload PDF
          </button>
        }
        columns={[
          { key: "nomor_ppab", label: "Nomor PPAB", mono: true },
          { key: "request_type", label: "Tipe", type: "badge" },
          { key: "deskripsi", label: "Deskripsi" },
          { key: "user_name", label: "Pemohon" },
          { key: "created_at", label: "Tanggal", type: "datetime" },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onDelete={handleDelete}
      />
      <UploadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        docType="ppab"
        onSaved={refresh}
      />
    </>
  );
}
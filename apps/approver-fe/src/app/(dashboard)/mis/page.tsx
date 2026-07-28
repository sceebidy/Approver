"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import { useDocumentList } from "@/lib/useDocumentList";
import { refreshCsrfCookie } from "@/lib/csrf";

export default function MisListPage() {
  const [open, setOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const { rows, loading, error, refresh } = useDocumentList("mis");

  const handleDelete = async (row: any) => {
    const xsrfToken = await refreshCsrfCookie();
    const res = await fetch(`/api/mis/${row.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": xsrfToken,
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Gagal menghapus MIS (${res.status})`);
    }
    refresh();
  };

  return (
    <>
      <DocumentListPage
        title="MIS"
        subtitle="Material Issue Slip — penerimaan & pengeluaran barang"
        docType="mis"
        createNode={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#1F3A5F] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200"
          >
            <Plus size={16} strokeWidth={2} />
            Upload PDF
          </button>
        }
        columns={[
          { key: "nomor_mis", label: "Nomor MIS", mono: true },
          { key: "request_type", label: "Tipe", type: "badge" },
          { key: "tgl_mis", label: "Tanggal MIS", type: "date" },
          { key: "user_name", label: "Pemohon" },
          { key: "created_at", label: "Dibuat", type: "datetime" },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onRowClick={(row) => setSelectedDocId(Number(row.id))}
      />
      <UploadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        docType="mis"
        onSaved={refresh}
      />
      <DocumentDetailModal
        isOpen={selectedDocId !== null}
        onClose={() => setSelectedDocId(null)}
        docId={selectedDocId}
        docType="mis"
        onSuccess={refresh}
      />
    </>
  );
}
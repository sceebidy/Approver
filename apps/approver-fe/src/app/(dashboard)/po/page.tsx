"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import { useDocumentList } from "@/lib/useDocumentList";
import { refreshCsrfCookie } from "@/lib/csrf";

export default function PoListPage() {
  const [open, setOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const { rows, loading, error, refresh } = useDocumentList("po");

  const handleDelete = async (row: any) => {
    const xsrfToken = await refreshCsrfCookie();
    const res = await fetch(`/api/po/${row.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": xsrfToken,
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Gagal menghapus PO (${res.status})`);
    }
    refresh();
  };

  return (
    <>
      <DocumentListPage
        title="Purchase Order"
        subtitle="Daftar pesanan pembelian ke vendor"
        createNode={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200"
          >
            <Plus size={16} strokeWidth={2} />
            Upload PDF
          </button>
        }
        columns={[
          { key: "nomor_po", label: "Nomor PO", mono: true },
          { key: "request_type", label: "Tipe", type: "badge" },
          { key: "nomor_ppab", label: "Nomor PPAB", defaultValue: "-" },
          { key: "vendor", label: "Vendor" },
          { key: "user_name", label: "Pemohon" },
          { key: "created_at", label: "Tanggal", type: "datetime" },
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
        docType="po"
        onSaved={refresh}
      />
      <DocumentDetailModal
        isOpen={selectedDocId !== null}
        onClose={() => setSelectedDocId(null)}
        docId={selectedDocId}
        docType="po"
      />
    </>
  );
}
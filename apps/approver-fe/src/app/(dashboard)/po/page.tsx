"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import { useDocumentList } from "@/lib/useDocumentList";

export default function PoListPage() {
  const [open, setOpen] = useState(false);
  const { rows, loading, error, refresh } = useDocumentList("po");

  return (
    <>
      <DocumentListPage
        title="Purchase Order"
        subtitle="Daftar pesanan pembelian ke vendor"
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
          { key: "nomor_po", label: "Nomor PO", mono: true },
          { key: "nomor_ppab", label: "Nomor PPAB", defaultValue: "-" },
          { key: "vendor", label: "Vendor" },
          { key: "user_name", label: "Pemohon" },
          { key: "created_at", label: "Tanggal", type: "datetime" },
        ]}
        rows={rows}
        loading={loading}
        error={error}
      />
      <UploadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        docType="po"
        onSaved={refresh}
      />
    </>
  );
}
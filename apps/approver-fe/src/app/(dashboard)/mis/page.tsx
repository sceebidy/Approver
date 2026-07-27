"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import { useDocumentList } from "@/lib/useDocumentList";

export default function MisListPage() {
  const [open, setOpen] = useState(false);
  const { rows, loading, error, refresh } = useDocumentList("mis");

  return (
    <>
      <DocumentListPage
        title="MIS"
        subtitle="Material Issue Slip — penerimaan & pengeluaran barang"
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
          { key: "nomor_mis", label: "Nomor MIS", mono: true },
          { key: "tgl_mis", label: "Tanggal MIS", type: "date" },
          { key: "user_name", label: "Pemohon" },
          { key: "created_at", label: "Dibuat", type: "datetime" },
        ]}
        rows={rows}
        loading={loading}
        error={error}
      />
      <UploadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        docType="mis"
        onSaved={refresh}
      />
    </>
  );
}
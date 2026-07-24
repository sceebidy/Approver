"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";

const rows: any[] = [];

export default function PoListPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DocumentListPage
        title="Purchase Order"
        subtitle="Daftar pesanan pembelian ke vendor"
        createNode={
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-[#1F3A5F] text-white text-[13px] font-medium px-3.5 py-2 rounded-md hover:bg-[#1a3350]">
            <Plus size={15} strokeWidth={2} />
            Upload PDF
          </button>
        }
        columns={[
          { key: "id", label: "Nomor", mono: true },
          { key: "deskripsi", label: "Deskripsi" },
          { key: "vendor", label: "Vendor" },
          { key: "tanggal", label: "Tanggal" },
          { key: "total", label: "Total", align: "right", mono: true },
        ]}
        rows={rows}
      />
      <UploadModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
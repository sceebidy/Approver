"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import UploadModal from "@/components/UploadModal";

const rows = [
  { id: "PPAB-2026-0114", deskripsi: "Pengadaan pupuk NPK - Blok C", pemohon: "Dedi Kurniawan", tanggal: "21 Jul 2026", status: "pending", total: "Rp 84.500.000" },
  { id: "PPAB-2026-0113", deskripsi: "Perbaikan pompa irigasi Blok B", pemohon: "Siti Aminah", tanggal: "20 Jul 2026", status: "approved", total: "Rp 12.750.000" },
  { id: "PPAB-2026-0112", deskripsi: "Pengadaan alat panen manual", pemohon: "Rian A.", tanggal: "19 Jul 2026", status: "rejected", total: "Rp 5.200.000" },
  { id: "PPAB-2026-0111", deskripsi: "Bahan bakar unit operasional", pemohon: "Dedi Kurniawan", tanggal: "18 Jul 2026", status: "draft", total: "Rp 31.000.000" },
  { id: "PPAB-2026-0110", deskripsi: "Pengadaan pupuk urea - Blok A", pemohon: "Siti Aminah", tanggal: "17 Jul 2026", status: "approved", total: "Rp 96.400.000" },
];

export default function PpabListPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DocumentListPage
      title="PPAB"
      subtitle="Pengajuan Pembelian Anggaran Biaya"
      createLabel="Upload PDF"
      createHref="/upload"
      createNode={
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-[#1F3A5F] text-white text-[13px] font-medium px-3.5 py-2 rounded-md hover:bg-[#1a3350]">
          <Plus size={15} strokeWidth={2} />
          Upload PDF
        </button>
      }
      columns={[
        { key: "id", label: "Nomor", mono: true },
        { key: "deskripsi", label: "Deskripsi" },
        { key: "pemohon", label: "Pemohon" },
        { key: "tanggal", label: "Tanggal" },
        { key: "total", label: "Total", align: "right", mono: true },
      ]}
      rows={rows}
      />
      <UploadModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
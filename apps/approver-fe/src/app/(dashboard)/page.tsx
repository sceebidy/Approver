import KpiCard from "@/components/KpiCard";
import DocumentRow, { DocumentItem } from "@/components/DocumentRow";
import { Clock, ClipboardList, FileText, Wallet } from "lucide-react";

const kpis = [
  { label: "Menunggu approval saya", value: 7, icon: Clock, tone: "accent" as const },
  { label: "PPAB aktif", value: 12, icon: ClipboardList, tone: "ink" as const },
  { label: "PO berjalan", value: 9, icon: FileText, tone: "ink" as const },
  { label: "FR/FS bulan ini", value: 18, icon: Wallet, tone: "ink" as const },
];

const documents: DocumentItem[] = [
  { id: "PPAB-2026-0114", title: "Pengadaan pupuk NPK - Blok C", stage: "PO", updated: "2j lalu", amount: "Rp 84.500.000" },
  { id: "FR-2026-0089", title: "Fund Request - Perbaikan mesin press", stage: "PPAB", updated: "5j lalu", amount: "Rp 22.300.000" },
  { id: "PO-2026-0201", title: "PO Suku cadang traktor - Vendor Sinar Jaya", stage: "MIS", updated: "1h lalu", amount: "Rp 156.000.000" },
  { id: "MIS-2026-0067", title: "Penerimaan barang - Blok A gudang 2", stage: "done", updated: "1h lalu", amount: "Rp 41.200.000" },
];

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="bg-white rounded-md border border-[#E3E6EA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E3E6EA] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-[#111827]">Dokumen terbaru</h3>
            <p className="text-[12px] text-[#9CA3AF]">Daftar aktivitas terkini yang sedang berjalan</p>
          </div>
          <button className="text-[12px] text-[#1F3A5F] font-medium hover:underline">
            Lihat semua
          </button>
        </div>
        <div className="divide-y divide-[#E3E6EA]">
          {documents.map((d) => (
            <DocumentRow key={d.id} doc={d} />
          ))}
        </div>
      </div>
    </main>
  );
}
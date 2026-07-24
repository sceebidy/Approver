import KpiCard from "@/components/KpiCard";
import DocumentRow, { DocumentItem } from "@/components/DocumentRow";
import { Clock, ClipboardList, FileText, Wallet } from "lucide-react";

const kpis: any[] = [];

const documents: DocumentItem[] = [];

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div className="grid grid-cols-4 gap-4">
        {kpis.length === 0 ? (
          <div className="col-span-4 bg-white rounded-md border border-[#E3E6EA] p-6 text-center text-sm text-[#6B7280]">Belum ada data KPI.</div>
        ) : (
          kpis.map((k) => <KpiCard key={k.label} {...k} />)
        )}
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
          {documents.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#6B7280]">Belum ada data.</div>
          ) : (
            documents.map((d) => <DocumentRow key={d.id} doc={d} />)
          )}
        </div>
      </div>
    </main>
  );
}
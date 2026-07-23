import Topbar from "@/components/Topbar";
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
    <>
      <Topbar />
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7f8fc_0%,#f0f4f8_100%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A9601A]">
                  Ringkasan operasional
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Dashboard approval dan procurement
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Pantau dokumen yang menunggu tindakan, status pengadaan, dan perkembangan transaksi secara terpusat.
                </p>
              </div>
              <div className="rounded-xl border border-[#E4E1DA] bg-[#FCFAF7] px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">3 dokumen</span> butuh perhatian hari ini
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">Dokumen terbaru</h3>
                <p className="text-sm text-slate-500">Daftar aktivitas terkini yang sedang berjalan</p>
              </div>
              <button className="rounded-full border border-[#E4E1DA] px-3 py-1.5 text-[12px] font-medium text-[#A9601A] transition hover:bg-[#FFF7ED]">
                Lihat semua
              </button>
            </div>
            <div className="divide-y divide-slate-200/80">
              {documents.map((d) => (
                <DocumentRow key={d.id} doc={d} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
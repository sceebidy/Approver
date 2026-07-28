"use client";

import { useState } from "react";
import { Clock, ClipboardList, FileText, Wallet } from "lucide-react";
import PendingApprovalsList from "@/components/PendingApprovalsList";
import DocumentRow, { DocumentItem } from "@/components/DocumentRow";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import Link from "next/link";

const documents: DocumentItem[] = [];

const QuickActionCard = ({ href, icon: Icon, label, desc }: any) => (
  <Link href={href} className="group flex items-center p-4 bg-white rounded-xl border border-[#E3E6EA] hover:border-[#1F3A5F]/30 hover:shadow-[0_4px_12px_-4px_rgba(31,58,95,0.1)] transition-all duration-300">
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1F3A5F] to-[#2B5284] text-white flex items-center justify-center shadow-sm shrink-0">
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="ml-4">
      <h4 className="text-[14px] font-bold text-[#111827] group-hover:text-[#1F3A5F] transition-colors">{label}</h4>
      <p className="text-[12px] text-[#6B7280] leading-tight mt-0.5">{desc}</p>
    </div>
  </Link>
);

export default function DashboardPage() {
  const [selectedDoc, setSelectedDoc] = useState<{ id: number; type: "ppab" | "po" | "mis" } | null>(null);

  return (
    <main className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col gap-1.5 relative pb-5">
        <h1 className="text-[24px] md:text-[28px] font-extrabold text-[#111827] tracking-tight">Dashboard</h1>
        <p className="text-[14px] text-[#6B7280] font-medium">Selamat datang kembali, berikut adalah ringkasan aktivitas Anda.</p>
        <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] rounded-full"></div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickActionCard href="/ppab" icon={ClipboardList} label="Buat PPAB" desc="Pengajuan Pembelian" />
          <QuickActionCard href="/po" icon={FileText} label="Buat PO" desc="Purchase Order" />
          <QuickActionCard href="/mis" icon={Clock} label="Buat MIS" desc="Material Issue" />
          <QuickActionCard href="/fr" icon={Wallet} label="Buat FR" desc="Fund Request" />
          <QuickActionCard href="/fs" icon={Wallet} label="Buat FS" desc="Fund Settlement" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pending Approvals */}
        <section className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E6EA] bg-gradient-to-r from-[#F8F9FB] to-white flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#111827]">Menunggu Persetujuan Anda</h3>
              <p className="text-[12.5px] text-[#6B7280] mt-0.5">Daftar pengajuan yang memerlukan tindakan</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100 shrink-0">
              <Clock size={16} strokeWidth={2.5} />
            </div>
          </div>
          <PendingApprovalsList
            onRowClick={(id, type) => {
              const lowerType = type.toLowerCase();
              if (["ppab", "po", "mis"].includes(lowerType)) {
                setSelectedDoc({ id, type: lowerType as "ppab" | "po" | "mis" });
              }
            }}
          />
        </section>

        {/* Recent Documents */}
        <section className="bg-white rounded-xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E6EA] bg-gradient-to-r from-[#F8F9FB] to-white flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#111827]">Dokumen Terbaru</h3>
              <p className="text-[12.5px] text-[#6B7280] mt-0.5">Aktivitas terkini yang sedang berjalan</p>
            </div>
            <button className="text-[12.5px] text-[#1F3A5F] font-bold hover:underline transition-all">
              Lihat semua
            </button>
          </div>
          <div className="divide-y divide-[#E3E6EA]/70">
            {documents.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#F1F3F6] flex items-center justify-center mb-1">
                  <FileText size={20} className="text-[#9CA3AF]" />
                </div>
                <p className="text-[13.5px] font-medium text-[#4B5563]">Belum ada aktivitas</p>
              </div>
            ) : (
              documents.map((d) => <DocumentRow key={d.id} doc={d} />)
            )}
          </div>
        </section>
      </div>

      <DocumentDetailModal
        isOpen={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        docId={selectedDoc?.id || null}
        docType={selectedDoc?.type || "ppab"}
      />
    </main>
  );
}
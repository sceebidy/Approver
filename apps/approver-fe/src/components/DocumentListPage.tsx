"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface DocColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
}

export interface DocRow {
  id: string;
  status: string;
  [key: string]: string;
}

interface Props {
  title: string;
  subtitle: string;
  createLabel?: string;
  createHref?: string;
  createNode?: React.ReactNode;
  columns: DocColumn[];
  rows: DocRow[];
}

const tabs = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

export default function DocumentListPage({ title, subtitle, createLabel, createHref, createNode, columns, rows }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const filtered = activeTab === "all" ? rows : rows.filter((r) => r.status === activeTab);

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[#111827]">{title}</h1>
          <p className="text-[12px] text-[#9CA3AF]">{subtitle}</p>
        </div>
        {createNode ? (
          createNode
        ) : (
          <Link
            href={createHref ?? "/upload"}
            className="flex items-center gap-1.5 bg-[#1F3A5F] text-white text-[13px] font-medium px-3.5 py-2 rounded-md hover:bg-[#1a3350]"
          >
            <Plus size={15} strokeWidth={2} />
            {createLabel ?? "Upload PDF"}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-md border border-[#E3E6EA] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E6EA] gap-3">
          <div className="flex items-center gap-1 text-[13px]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === t.key ? "bg-[#1F3A5F] text-white" : "text-[#4B5563] hover:bg-[#F1F3F6]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                placeholder="Cari nomor / deskripsi"
                className="pl-8 pr-3 py-1.5 text-[13px] border border-[#E3E6EA] rounded-md w-56 outline-none focus:border-[#1F3A5F] placeholder:text-[#9CA3AF]"
              />
            </div>
            <button className="flex items-center gap-1 text-[13px] text-[#4B5563] border border-[#E3E6EA] rounded-md px-3 py-1.5 hover:bg-[#F1F3F6]">
              Tanggal
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#6B7280]">
            Belum ada data.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#E3E6EA]">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-4 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FB] cursor-pointer">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""} ${
                          c.mono ? "font-mono text-[12.5px]" : ""
                        } ${c.key === "id" ? "text-[#4B5563] text-[12px]" : "text-[#111827]"}`}
                      >
                        {r[c.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6EA] text-[12px] text-[#9CA3AF]">
              <span>Menampilkan {filtered.length} dari {rows.length} {title}</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">Sebelumnya</button>
                <button className="px-2.5 py-1 rounded-md border border-[#E3E6EA] hover:bg-[#F1F3F6]">Selanjutnya</button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}   
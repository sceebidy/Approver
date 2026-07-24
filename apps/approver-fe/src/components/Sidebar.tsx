"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ClipboardList, FileText, CheckCircle2, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

function NavItem({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] transition-colors ${
        active ? "bg-[#1F3A5F] text-white font-medium" : "text-[#4B5563] hover:bg-[#F1F3F6]"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-[#E3E6EA] bg-white flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-[#E3E6EA]">
        <div className="w-6 h-6 rounded bg-[#1F3A5F] flex items-center justify-center text-white text-[11px] font-semibold">A</div>
        <span className="ml-2 text-[14px] font-semibold text-[#111827]">Approver</span>
      </div>
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 text-sm">
        <NavItem icon={LayoutGrid} label="Dashboard" href="/" />
        <div className="pt-3 pb-1 px-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Procurement</div>
        <NavItem icon={ClipboardList} label="PPAB" href="/ppab" />
        <NavItem icon={FileText} label="Purchase Order" href="/po" />
        <NavItem icon={CheckCircle2} label="MIS" href="/mis" />
        <div className="pt-3 pb-1 px-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Financial</div>
        <NavItem icon={Wallet} label="Fund Request" href="/fr" />
        <NavItem icon={Wallet} label="Fund Settlement" href="/fs" />
      </nav>
      <div className="p-2.5 border-t border-[#E3E6EA]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-[#E3E6EA] text-[#4B5563] flex items-center justify-center text-[11px] font-medium">RA</div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium truncate text-[#111827]">Rian A.</div>
            <div className="text-[11px] text-[#9CA3AF] truncate">Estate Finance</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
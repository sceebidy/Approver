import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A9601A]">
            Approver
          </p>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard utama</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600 md:inline-flex">
            Kamis, 23 Juli 2026
          </span>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#E4E1DA] hover:bg-[#FFF7ED]">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#B54708]" />
          </button>
        </div>
      </div>
    </header>
  );
}
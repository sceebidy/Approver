import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-14 border-b border-[#E3E6EA] bg-white flex items-center justify-end px-6 gap-3">
      <span className="text-[12px] text-[#9CA3AF]">Kamis, 23 Juli 2026</span>
      <button className="relative w-8 h-8 rounded-md hover:bg-[#F1F3F6] flex items-center justify-center">
        <Bell size={16} className="text-[#4B5563]" strokeWidth={1.75} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#B54708]" />
      </button>
    </header>
  );
}
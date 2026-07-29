"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X, RotateCcw, Check } from "lucide-react";
import { 
  formatDateRangeLabel, 
  getDatePreset, 
  DatePreset 
} from "@/lib/dateUtils";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  onReset?: () => void;
  className?: string;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  onReset,
  className = "",
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = Boolean(startDate || endDate);
  const label = formatDateRangeLabel(startDate, endDate);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleApplyPreset = (preset: DatePreset) => {
    const range = getDatePreset(preset);
    onChange(range.startDate, range.endDate);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("", "");
    if (onReset) onReset();
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg border transition-all duration-200 cursor-pointer ${
            isActive
              ? "bg-[#1F3A5F]/10 border-[#1F3A5F]/30 text-[#1F3A5F] font-bold shadow-sm"
              : "bg-[#F8F9FB] border-[#E3E6EA] text-[#4B5563] font-medium hover:bg-white hover:border-[#D1D5DB]"
          }`}
          title="Filter rentang tanggal"
        >
          <Calendar size={15} className={isActive ? "text-[#1F3A5F]" : "text-[#6B7280]"} />
          <span>{label}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isActive && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
            title="Hapus filter tanggal"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl border border-[#E3E6EA] shadow-[0_12px_30px_-5px_rgba(0,0,0,0.18)] p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#E3E6EA] pb-2.5">
            <h4 className="text-[13.5px] font-bold text-[#111827] flex items-center gap-2">
              <Calendar size={15} className="text-[#1F3A5F]" />
              <span>Rentang Tanggal</span>
            </h4>
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11.5px] font-semibold text-red-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Pilihan Cepat
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "today", label: "Hari Ini" },
                  { id: "last_7_days", label: "7 Hari Terakhir" },
                  { id: "last_30_days", label: "30 Hari Terakhir" },
                  { id: "this_month", label: "Bulan Ini" },
                ] as const
              ).map((p) => {
                const presetRange = getDatePreset(p.id);
                const isCurrent =
                  startDate === presetRange.startDate && endDate === presetRange.endDate;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id)}
                    className={`px-2.5 py-1.5 text-[12px] font-semibold rounded-md transition-all text-left truncate ${
                      isCurrent
                        ? "bg-[#1F3A5F] text-white shadow-sm"
                        : "bg-[#F8F9FB] text-[#4B5563] hover:bg-[#E3E6EA]/70"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="space-y-2 pt-2 border-t border-[#E3E6EA]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Kustom Rentang
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onChange(e.target.value, endDate)}
                  className="w-full text-[12.5px] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#1F3A5F] focus:ring-1 focus:ring-[#1F3A5F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onChange(startDate, e.target.value)}
                  className="w-full text-[12.5px] bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:border-[#1F3A5F] focus:ring-1 focus:ring-[#1F3A5F]"
                />
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-[#1F3A5F] text-white text-[12.5px] font-semibold rounded-lg hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check size={14} />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

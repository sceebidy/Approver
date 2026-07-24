import type { LucideIcon } from "lucide-react";

export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "accent" | "ink";
}) {
  const isAccent = tone === "accent";

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.35)] ${
        isAccent ? "bg-gradient-to-br from-[#FFF7F0] to-white" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`rounded-full p-2 ${isAccent ? "bg-[#FFF0E3] text-[#B54708]" : "bg-slate-100 text-slate-500"}`}
          >
            <Icon size={16} strokeWidth={1.75} />
          </div>
          <span className="text-[12px] font-medium text-slate-600">{label}</span>
        </div>
      </div>
      <div className="mt-4 text-[24px] font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
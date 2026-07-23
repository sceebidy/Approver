const stageOrder = ["PPAB", "PO", "MIS"];

export default function StageTracker({ stage }: { stage: string }) {
  if (stage === "done") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-medium text-[#065F46]">
        Selesai
      </span>
    );
  }
  const currentIdx = stageOrder.indexOf(stage);
  return (
    <div className="flex items-center gap-1.5">
      {stageOrder.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
              i === currentIdx
                ? "bg-[#1F3A5F] text-white"
                : i < currentIdx
                ? "text-[#4B5563]"
                : "text-[#9CA3AF]"
            }`}
          >
            {s}
          </span>
          {i < stageOrder.length - 1 && <span className="text-[#E3E6EA]">—</span>}
        </div>
      ))}
    </div>
  );
}
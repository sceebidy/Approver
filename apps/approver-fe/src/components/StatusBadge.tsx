const statusStyles: Record<string, string> = {
  pending: "bg-[#FEF6E7] text-[#92400E]",
  approved: "bg-[#ECFDF3] text-[#065F46]",
  rejected: "bg-[#FEF2F2] text-[#B42318]",
  draft: "bg-[#F1F3F6] text-[#4B5563]",
};

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  draft: "Draft",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[status] ?? statusStyles.draft}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}
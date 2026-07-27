import StageTracker from "./StageTracker";

export interface DocumentItem {
  id: string;
  title: string;
  stage: string;
  amount: string;
  updated: string;
}

export default function DocumentRow({ doc }: { doc: DocumentItem }) {
  return (
    <div className="grid cursor-pointer grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-[#F8F9FB] md:grid-cols-[1.1fr_1.8fr_1fr_1fr_0.7fr] md:items-center group">
      <div className="text-[12.5px] font-bold text-[#6B7280] group-hover:text-[#1F3A5F] transition-colors uppercase tracking-wider">{doc.id}</div>
      <div className="min-w-0 text-[13.5px] font-bold text-[#111827] truncate group-hover:text-[#1F3A5F] transition-colors">{doc.title}</div>
      <div className="md:justify-self-start">
        <StageTracker stage={doc.stage} />
      </div>
      <div className="text-[13px] font-semibold text-[#374151] tabular-nums md:text-right">
        {doc.amount}
      </div>
      <div className="text-[11.5px] font-medium text-[#9CA3AF] md:text-right">{doc.updated}</div>
    </div>
  );
}
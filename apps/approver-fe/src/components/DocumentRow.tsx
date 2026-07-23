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
    <div className="grid cursor-pointer grid-cols-1 gap-3 px-5 py-4 text-sm transition-colors hover:bg-[#F8FAFC] md:grid-cols-[1.1fr_1.8fr_1fr_1fr_0.7fr] md:items-center">
      <div className="text-[12px] font-medium text-slate-500">{doc.id}</div>
      <div className="min-w-0 text-[13px] font-medium text-slate-900">{doc.title}</div>
      <div className="md:justify-self-start">
        <StageTracker stage={doc.stage} />
      </div>
      <div className="text-[12.5px] font-medium text-slate-700 tabular-nums md:text-right">
        {doc.amount}
      </div>
      <div className="text-[11px] text-slate-400 md:text-right">{doc.updated}</div>
    </div>
  );
}
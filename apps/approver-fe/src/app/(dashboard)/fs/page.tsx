"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useDocumentList } from "@/lib/useDocumentList";

export default function FsListPage() {
  const { rows, loading, error } = useDocumentList("fs");

  return (
    <DocumentListPage
      title="Fund Settlement"
      subtitle="Pertanggungjawaban penggunaan dana"
      createLabel="Buat FS"
      createHref="/fs/new"
      columns={[
        { key: "number_fs", label: "Nomor FS", mono: true },
        { key: "requester_name", label: "Pemohon" },
        { key: "fr_id", label: "FR ID", mono: true },
        { key: "requester_date_time", label: "Tanggal Request", type: "datetime" },
        { key: "balance", label: "Balance", align: "right", mono: true, defaultValue: "-" },
        { key: "status", label: "Status" },
      ]}
      rows={rows}
      loading={loading}
      error={error}
    />
  );
}
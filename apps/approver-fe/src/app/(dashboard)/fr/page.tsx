"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useDocumentList } from "@/lib/useDocumentList";

export default function FrListPage() {
  const { rows, loading, error } = useDocumentList("fr");

  return (
    <DocumentListPage
      title="Fund Request"
      subtitle="Pengajuan permintaan dana"
      createLabel="Buat FR"
      createHref="/fr/new"
      columns={[
        { key: "number_fr", label: "Nomor FR", mono: true },
        { key: "requester_name", label: "Pemohon" },
        { key: "kategori_fr_name", label: "Kategori" },
        { key: "request_date_time", label: "Tanggal Request", type: "datetime" },
        { key: "status", label: "Status" },
        { key: "keterangan", label: "Keterangan", defaultValue: "-" },
      ]}
      rows={rows}
      loading={loading}
      error={error}
    />
  );
}
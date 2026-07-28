"use client";

import DocumentListPage from "@/components/DocumentListPage";
import { useDocumentList } from "@/lib/useDocumentList";
import { refreshCsrfCookie } from "@/lib/csrf";

export default function FrListPage() {
  const { rows, loading, error, refresh } = useDocumentList("fr");

  const handleDelete = async (row: any) => {
    const xsrfToken = await refreshCsrfCookie();
    const res = await fetch(`/api/fr/${row.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-XSRF-TOKEN": xsrfToken,
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Gagal menghapus FR (${res.status})`);
    }
    refresh();
  };

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
        { key: "keterangan", label: "Keterangan", defaultValue: "-" },
      ]}
      rows={rows}
      loading={loading}
      error={error}
      onDelete={handleDelete}
    />
  );
}
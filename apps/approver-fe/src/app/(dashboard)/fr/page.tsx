"use client";

import { useState } from "react";
import DocumentListPage from "@/components/DocumentListPage";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import { useDocumentList } from "@/lib/useDocumentList";
import { refreshCsrfCookie } from "@/lib/csrf";

export default function FrListPage() {
  const { rows, loading, error, refresh } = useDocumentList("fr");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <>
      <DocumentListPage
        title="Fund Request"
        subtitle="Pengajuan permintaan dana"
        docType="fr"
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
        onRowClick={(row) => {
          setSelectedDocId(Number(row.id));
          setIsModalOpen(true);
        }}
      />
      <DocumentDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocId(null);
          refresh();
        }}
        docId={selectedDocId}
        docType="fr"
      />
    </>
  );
}
"use client";

import { useState } from "react";
import DocumentListPage from "@/components/DocumentListPage";
import DocumentDetailModal from "@/components/DocumentDetailModal";
import { useDocumentList } from "@/lib/useDocumentList";
import { getXsrfToken } from "@/lib/csrf";

export default function FsListPage() {
  const { rows, loading, error, refresh } = useDocumentList("fs");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (row: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api';
    const res = await fetch(`${apiUrl}/fs/${row.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getXsrfToken()
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Gagal membatalkan pengajuan FS.');
    }
    refresh();
  };

  return (
    <>
      <DocumentListPage
        title="Fund Settlement"
        subtitle="Pertanggungjawaban penggunaan dana"
        docType="fs"
        createLabel="Buat FS"
        createHref="/fs/new"
        columns={[
          { key: "number_fs", label: "Nomor FS", mono: true },
          { key: "requester_name", label: "Pemohon" },
          { key: "fr_id", label: "FR ID", mono: true },
          { key: "requester_date_time", label: "Tanggal Request", type: "datetime" },
          { key: "balance", label: "Balance", align: "right", mono: true, defaultValue: "-" },
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
        docType="fs"
        onSuccess={refresh}
      />
    </>
  );
}
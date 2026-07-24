import DocumentListPage from "@/components/DocumentListPage";

const rows = [
  { id: "FR-2026-0089", deskripsi: "Fund Request - Perbaikan mesin press", pemohon: "Dedi Kurniawan", tanggal: "23 Jul 2026", status: "pending", total: "Rp 22.300.000" },
];

export default function FrListPage() {
  return (
    <DocumentListPage
      title="Fund Request"
      subtitle="Pengajuan permintaan dana"
      createLabel="Buat FR"
      createHref="/upload"
      columns={[
        { key: "id", label: "Nomor", mono: true },
        { key: "deskripsi", label: "Deskripsi" },
        { key: "pemohon", label: "Pemohon" },
        { key: "tanggal", label: "Tanggal" },
        { key: "total", label: "Nominal", align: "right", mono: true },
      ]}
      rows={rows}
    />
  );
}
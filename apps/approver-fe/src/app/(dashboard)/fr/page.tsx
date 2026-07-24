import DocumentListPage from "@/components/DocumentListPage";

const rows: any[] = [];

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
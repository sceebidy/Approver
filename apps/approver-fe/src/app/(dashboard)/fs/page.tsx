import DocumentListPage from "@/components/DocumentListPage";

const rows: any[] = [];

export default function FsListPage() {
  return (
    <DocumentListPage
      title="Fund Settlement"
      subtitle="Pertanggungjawaban penggunaan dana"
      createLabel="Buat FS"
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
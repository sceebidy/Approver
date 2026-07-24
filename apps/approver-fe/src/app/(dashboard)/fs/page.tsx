import DocumentListPage from "@/components/DocumentListPage";

const rows = [
  { id: "FS-2026-0033", deskripsi: "Fund Settlement - Perjalanan dinas Q3", pemohon: "Siti Aminah", tanggal: "22 Jul 2026", status: "approved", total: "Rp 6.750.000" },
];

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
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { refreshCsrfCookie } from "@/lib/csrf";
import SsoUserPicker from "@/components/SsoUserPicker";
import { approverPayloadFromSelection } from "@/lib/employees";

interface Category {
  id: number;
  nama: string;
  min_app: number;
  max_amount: number;
}

interface Tax {
  id: number;
  name: string;
  value: number; // persentase, misal 11 = 11%
}

// Klasifikasi jenis pajak untuk logika akuntansi yang benar
type TaxType = "ppn" | "pph";

interface ItemLine {
  id: string;
  deskripsi: string;
  sub_total: number;
  selectedTaxIds: number[];
}

// ─── Helper: tentukan apakah suatu tax adalah PPh (pengurang) atau PPN (penambah) ──────────────
function getTaxType(taxName: string): TaxType {
  const lower = taxName.toLowerCase();
  if (lower.includes("pph")) return "pph";
  return "ppn"; // default: PPN atau sejenisnya = penambah
}

// ─── Helper: hitung semua komponen pajak per item ───────────────────────────────────────────────
function calcItemBreakdown(item: ItemLine, taxes: Tax[]) {
  const subtotal = Number(item.sub_total) || 0;

  let ppnAmount = 0;
  let pphAmount = 0;

  item.selectedTaxIds.forEach((tId) => {
    const tax = taxes.find((t) => t.id === tId);
    if (!tax) return;
    const rate = Number(tax.value) || 0;
    const nominal = subtotal * (rate / 100);

    if (getTaxType(tax.name) === "pph") {
      // PPh — pemotongan (mengurangi net yang diterima vendor)
      pphAmount += nominal;
    } else {
      // PPN — ditambahkan ke total tagihan
      ppnAmount += nominal;
    }
  });

  const totalTagihan = subtotal + ppnAmount;       // yang harus dibayar perusahaan
  const netVendor    = totalTagihan - pphAmount;   // yang diterima vendor setelah potong PPh

  return { subtotal, ppnAmount, pphAmount, totalTagihan, netVendor };
}

// ─── Format angka ke Rupiah tanpa simbol ────────────────────────────────────────────────────────
function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function NewFrPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [numberFr, setNumberFr] = useState("");
  const [kategoriFrId, setKategoriFrId] = useState<number | "">("");
  const [currency, setCurrency] = useState("IDR");
  const [keterangan, setKeterangan] = useState("");

  const [items, setItems] = useState<ItemLine[]>([
    { id: "1", deskripsi: "", sub_total: 0, selectedTaxIds: [] },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [issuedBy, setIssuedBy] = useState<any>(null);
  const [checkedBy, setCheckedBy] = useState<any>(null);
  const [approvedBy, setApprovedBy] = useState<any>(null);
  const [approvedByAtasan, setApprovedByAtasan] = useState<any>(null);

  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setNumberFr(`FR/${dateStr}/${randomNum}`);

    async function fetchMeta() {
      try {
        const res = await fetch("/api/fr/categories", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCategories(json.data.categories || []);
            setTaxes(json.data.taxes || []);
            if (json.data.categories?.length > 0) {
              setKategoriFrId(json.data.categories[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load FR metadata", err);
      } finally {
        setLoadingMeta(false);
      }
    }

    fetchMeta();
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), deskripsi: "", sub_total: 0, selectedTaxIds: [] },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemLine, value: string | number | number[]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleTax = (itemId: string, taxId: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.selectedTaxIds.includes(taxId);
        const newTaxIds = exists
          ? item.selectedTaxIds.filter((t) => t !== taxId)
          : [...item.selectedTaxIds, taxId];
        return { ...item, selectedTaxIds: newTaxIds };
      })
    );
  };

  // Grand Total = jumlah semua "Total Tagihan" per item (yang perusahaan bayar)
  const grandTotal = items.reduce(
    (acc, item) => acc + calcItemBreakdown(item, taxes).totalTagihan,
    0
  );

  const handleSubmit = async (submitStatus: "draft" | "submitted") => {
    setErrorMsg(null);
    if (!numberFr.trim()) {
      setErrorMsg("Nomor FR tidak boleh kosong");
      return;
    }
    if (!kategoriFrId) {
      setErrorMsg("Pilih Kategori FR terlebih dahulu");
      return;
    }
    if (items.some((i) => !i.deskripsi.trim())) {
      setErrorMsg("Semua item baris harus mengisi deskripsi");
      return;
    }
    if (!issuedBy && !checkedBy && !approvedBy && !approvedByAtasan) {
      setErrorMsg("Minimal 1 dari 4 slot approval roles harus diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const xsrfToken = await refreshCsrfCookie();

      const payloadItems = items.map((item) => {
        const itemTaxes = item.selectedTaxIds.map((tId) => {
          const t = taxes.find((tx) => tx.id === tId);
          return {
            tax_id: tId,
            value: t ? Number(t.value) : 0,
          };
        });
        return {
          deskripsi: item.deskripsi,
          sub_total: Number(item.sub_total) || 0,
          taxes: itemTaxes,
        };
      });

      const approverLines: any[] = [];
      if (issuedBy) {
        const p = approverPayloadFromSelection(issuedBy);
        if (p) approverLines.push({ ...p, role: "issued_by" });
      }
      if (checkedBy) {
        const p = approverPayloadFromSelection(checkedBy);
        if (p) approverLines.push({ ...p, role: "checked_by" });
      }
      if (approvedBy) {
        const p = approverPayloadFromSelection(approvedBy);
        if (p) approverLines.push({ ...p, role: "approved_by" });
      }
      if (approvedByAtasan) {
        const p = approverPayloadFromSelection(approvedByAtasan);
        if (p) approverLines.push({ ...p, role: "approved_by_atasan" });
      }

      const res = await fetch("/api/fr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          number_fr: numberFr,
          kategori_fr_id: kategoriFrId,
          currency,
          keterangan,
          status: submitStatus,
          items: payloadItems,
          approver_lines: approverLines,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat Fund Request");
      }

      router.push("/fr");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  // Pisahkan daftar pajak berdasarkan jenisnya untuk label yang lebih informatif di UI
  const ppnTaxes = taxes.filter((t) => getTaxType(t.name) === "ppn");
  const pphTaxes = taxes.filter((t) => getTaxType(t.name) === "pph");

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-md transition"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buat Fund Request (FR)</h1>
            <p className="text-xs text-gray-500">Pengajuan permohonan dana baru</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-sm p-3.5 rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-2">
          Informasi Utama
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nomor FR <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={numberFr}
              onChange={(e) => setNumberFr(e.target.value)}
              className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kategori FR <span className="text-red-500">*</span>
            </label>
            {loadingMeta ? (
              <div className="text-xs text-gray-400 py-2">Memuat kategori...</div>
            ) : (
              <select
                value={kategoriFrId}
                onChange={(e) => setKategoriFrId(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white"
              >
                {categories.length === 0 ? (
                  <option value="">(Tidak ada kategori tersedia)</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mata Uang</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white"
            >
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Pengajuan operasional kantor..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>
        </div>

        {/* Item Lines */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Rincian Barang / Layanan (Items)
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-[#1F3A5F] font-semibold hover:underline"
            >
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const { subtotal, ppnAmount, pphAmount, totalTagihan, netVendor } =
                calcItemBreakdown(item, taxes);
              const hasPph = pphAmount > 0;

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Header item */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Input Deskripsi & Subtotal */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Deskripsi Item</label>
                      <input
                        type="text"
                        value={item.deskripsi}
                        onChange={(e) => updateItem(item.id, "deskripsi", e.target.value)}
                        placeholder="Deskripsi barang atau biaya..."
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Subtotal / DPP ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        // Kosongkan field saat nilai 0 agar tidak ada "0" di depan
                        value={item.sub_total === 0 ? "" : item.sub_total}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          updateItem(item.id, "sub_total", isNaN(num) ? 0 : num);
                        }}
                        placeholder="0"
                        className="w-full text-sm font-mono border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F]"
                      />
                    </div>
                  </div>

                  {/* Pilihan Pajak — Checkbox independen */}
                  {taxes.length > 0 && (
                    <div className="space-y-2">
                      {/* PPN */}
                      {ppnTaxes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">PPN</p>
                          <div className="flex flex-wrap gap-2">
                            {ppnTaxes.map((t) => {
                              const isChecked = item.selectedTaxIds.includes(t.id);
                              return (
                                <label
                                  key={t.id}
                                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border cursor-pointer transition select-none ${
                                    isChecked
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isChecked}
                                    onChange={() => toggleTax(item.id, t.id)}
                                  />
                                  {t.name} ({Number(t.value)}%)
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* PPh */}
                      {pphTaxes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">PPh</p>
                          <div className="flex flex-wrap gap-2">
                            {pphTaxes.map((t) => {
                              const isChecked = item.selectedTaxIds.includes(t.id);
                              return (
                                <label
                                  key={t.id}
                                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border cursor-pointer transition select-none ${
                                    isChecked
                                      ? "bg-amber-600 text-white border-amber-600"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isChecked}
                                    onChange={() => toggleTax(item.id, t.id)}
                                  />
                                  {t.name} ({Number(t.value)}%)
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Breakdown Pajak per Item */}
                  <div className="mt-2 rounded-md border border-gray-200 bg-white overflow-hidden text-xs">
                    <table className="w-full">
                      <tbody>
                        {/* Subtotal (DPP) */}
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-1.5 text-gray-500">Subtotal (DPP)</td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                            {fmt(subtotal, currency)}
                          </td>
                        </tr>

                        {/* PPN — hanya tampil jika ada */}
                        {ppnAmount > 0 && (
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-1.5 text-blue-600">
                              PPN{" "}
                              <span className="text-gray-400">
                                (+{item.selectedTaxIds
                                  .map((id) => taxes.find((t) => t.id === id))
                                  .filter((t) => t && getTaxType(t.name) === "ppn")
                                  .map((t) => `${Number(t!.value)}%`)
                                  .join(", ")})
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-blue-600">
                              + {fmt(ppnAmount, currency)}
                            </td>
                          </tr>
                        )}

                        {/* Total Tagihan = Subtotal + PPN */}
                        <tr className={`font-semibold ${hasPph ? "border-b border-gray-100" : ""}`}>
                          <td className="px-3 py-2 text-gray-800">Total Tagihan</td>
                          <td className="px-3 py-2 text-right font-mono text-gray-900">
                            {fmt(totalTagihan, currency)}
                          </td>
                        </tr>

                        {/* PPh — hanya tampil jika ada */}
                        {hasPph && (
                          <>
                            <tr className="border-b border-gray-100 bg-amber-50">
                              <td className="px-3 py-1.5 text-amber-700">
                                PPh{" "}
                                <span className="text-gray-400">
                                  (−{item.selectedTaxIds
                                    .map((id) => taxes.find((t) => t.id === id))
                                    .filter((t) => t && getTaxType(t.name) === "pph")
                                    .map((t) => `${Number(t!.value)}%`)
                                    .join(", ")})
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-amber-700">
                                − {fmt(pphAmount, currency)}
                              </td>
                            </tr>
                            <tr className="font-semibold bg-amber-50">
                              <td className="px-3 py-2 text-gray-800">
                                Net Diterima Vendor
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-gray-900">
                                {fmt(netVendor, currency)}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="text-right">
              <span className="text-xs text-gray-500 block uppercase font-medium">
                Grand Total (Total Tagihan ke Perusahaan)
              </span>
              <span className="text-xl font-bold font-mono text-[#1F3A5F]">
                {fmt(grandTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Approval Roles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-2">
              Approval Roles (Persetujuan)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Pilih minimal 1 approver untuk memproses pengajuan ini. Hanya pegawai dari seksi/departemen Anda yang akan ditampilkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot 1: Issued By */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issued By
              </label>
              <SsoUserPicker
                value={issuedBy}
                onChange={setIssuedBy}
                placeholder="Pilih Pembuat Pengajuan..."
                filterOwnUnit={true}
              />
            </div>

            {/* Slot 2: Checked By */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Checked By
              </label>
              <SsoUserPicker
                value={checkedBy}
                onChange={setCheckedBy}
                placeholder="Pilih Pemeriksa Dokumen..."
                filterOwnUnit={true}
              />
            </div>

            {/* Slot 3: Approved By */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Approved By
              </label>
              <SsoUserPicker
                value={approvedBy}
                onChange={setApprovedBy}
                placeholder="Pilih Pemberi Persetujuan..."
                filterOwnUnit={true}
              />
            </div>

            {/* Slot 4: Approved By Atasan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Approved By Atasan
              </label>
              <SsoUserPicker
                value={approvedByAtasan}
                onChange={setApprovedByAtasan}
                placeholder="Pilih Atasan Tertinggi..."
                filterOwnUnit={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit("draft")}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-300 disabled:opacity-50 transition"
        >
          <Save size={16} /> Simpan Draft
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit("submitted")}
          className="flex items-center gap-2 bg-[#1F3A5F] hover:bg-[#162a45] text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition shadow-sm"
        >
          <Send size={16} /> Ajukan FR
        </button>
      </div>
    </div>
  );
}

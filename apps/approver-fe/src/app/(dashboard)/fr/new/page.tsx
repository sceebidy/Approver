"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { refreshCsrfCookie } from "@/lib/csrf";

interface Category {
  id: number;
  nama: string;
  min_app: number;
  max_amount: number;
}

interface Tax {
  id: number;
  name: string;
  value: number;
}

interface ItemLine {
  id: string;
  deskripsi: string;
  sub_total: number;
  selectedTaxIds: number[];
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

  useEffect(() => {
    // Generate automatic FR number default
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

  // Calculations
  const calculateItemTotal = (item: ItemLine) => {
    const sub = item.sub_total || 0;
    let taxAmount = 0;
    item.selectedTaxIds.forEach((tId) => {
      const t = taxes.find((tax) => tax.id === tId);
      if (t) taxAmount += t.value;
    });
    return sub + taxAmount;
  };

  const grandTotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);

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

    setSubmitting(true);
    try {
      const xsrfToken = await refreshCsrfCookie();
      
      const payloadItems = items.map((item) => {
        const itemTaxes = item.selectedTaxIds.map((tId) => {
          const t = taxes.find((tx) => tx.id === tId);
          return {
            tax_id: tId,
            value: t ? t.value : 0,
          };
        });
        return {
          deskripsi: item.deskripsi,
          sub_total: item.sub_total,
          taxes: itemTaxes,
        };
      });

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
                      {c.nama} (Min Approver: {c.min_app})
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
              const itemTotal = calculateItemTotal(item);
              return (
                <div
                  key={item.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
                >
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
                      <label className="block text-xs text-gray-600 mb-1">Subtotal ({currency})</label>
                      <input
                        type="number"
                        value={item.sub_total}
                        onChange={(e) => updateItem(item.id, "sub_total", parseFloat(e.target.value) || 0)}
                        className="w-full text-sm font-mono border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F]"
                      />
                    </div>
                  </div>

                  {taxes.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pajak yang Berlaku</label>
                      <div className="flex flex-wrap gap-2">
                        {taxes.map((t) => {
                          const isChecked = item.selectedTaxIds.includes(t.id);
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => toggleTax(item.id, t.id)}
                              className={`text-xs px-2.5 py-1 rounded-md border transition ${
                                isChecked
                                  ? "bg-[#1F3A5F] text-white border-[#1F3A5F]"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {t.name} ({t.value.toLocaleString()})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-right text-xs font-semibold text-gray-700 pt-1">
                    Total Item (Inc. Tax):{" "}
                    <span className="font-mono text-sm text-gray-900">
                      {currency} {itemTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="text-right">
              <span className="text-xs text-gray-500 block uppercase font-medium">Grand Total</span>
              <span className="text-xl font-bold font-mono text-[#1F3A5F]">
                {currency} {grandTotal.toLocaleString()}
              </span>
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

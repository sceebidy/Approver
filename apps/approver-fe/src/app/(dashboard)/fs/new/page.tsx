"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Send, UserCheck } from "lucide-react";
import { refreshCsrfCookie } from "@/lib/csrf";
import SsoUserPicker from "@/components/SsoUserPicker";
import { approverPayloadFromSelection } from "@/lib/employees";

interface ApprovedFr {
  id: number;
  number_fr: string;
  keterangan: string;
  request_date_time: string;
}

interface PortalEmployee {
  id: string;
  employeeId: string;
  namaLengkap: string;
  jabatan?: string;
}

interface ItemLine {
  id: string;
  deskripsi: string;
  total: number;
}

export default function NewFsPage() {
  const router = useRouter();

  const [approvedFrs, setApprovedFrs] = useState<ApprovedFr[]>([]);
  const [employees, setEmployees] = useState<PortalEmployee[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [frId, setFrId] = useState<number | "">("");
  const [numberFs, setNumberFs] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [balanceDueToEmployee, setBalanceDueToEmployee] = useState<number>(0);
  const [balanceDueToCompany, setBalanceDueToCompany] = useState<number>(0);

  const [items, setItems] = useState<ItemLine[]>([
    { id: "1", deskripsi: "", total: 0 },
  ]);

  interface ApproverLineState {
    id: string;
    role: string;
    person: any;
  }

  const [approverLines, setApproverLines] = useState<ApproverLineState[]>([
    { id: "1", role: "Requested By", person: null },
  ]);

  const addApproverLine = () => {
    setApproverLines((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "Requested By", person: null },
    ]);
  };

  const removeApproverLine = (id: string) => {
    if (approverLines.length <= 1) return;
    setApproverLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateApproverLine = (id: string, field: "role" | "person", value: any) => {
    setApproverLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Generate default FS number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setNumberFs(`FS/${dateStr}/${randomNum}`);

    async function fetchMetadata() {
      try {
        const [frRes, empRes] = await Promise.all([
          fetch("/api/fr/approved-list", {
            headers: { Accept: "application/json" },
            credentials: "include",
          }),
          fetch("/api/portal/employees", {
            headers: { Accept: "application/json" },
            credentials: "include",
          }),
        ]);

        if (frRes.ok) {
          const jsonFr = await frRes.json();
          if (jsonFr.success && jsonFr.data) {
            setApprovedFrs(jsonFr.data);
            if (jsonFr.data.length > 0) {
              setFrId(jsonFr.data[0].id);
            }
          }
        }

        if (empRes.ok) {
          const jsonEmp = await empRes.json();
          if (jsonEmp.success && jsonEmp.data) {
            setEmployees(jsonEmp.data);
          }
        }
      } catch (err) {
        console.error("Failed to load FS metadata", err);
      } finally {
        setLoadingMeta(false);
      }
    }

    fetchMetadata();
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), deskripsi: "", total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemLine, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const grandTotalItems = items.reduce((acc, i) => acc + (i.total || 0), 0);

  const handleSubmit = async (submitStatus: "draft" | "submitted") => {
    setErrorMsg(null);

    if (!frId) {
      setErrorMsg("Pilih Fund Request (FR) yang berstatus approved terlebih dahulu.");
      return;
    }
    if (!numberFs.trim()) {
      setErrorMsg("Nomor FS tidak boleh kosong.");
      return;
    }
    if (items.some((i) => !i.deskripsi.trim())) {
      setErrorMsg("Semua item baris harus memiliki deskripsi.");
      return;
    }

    const hasIncomplete = approverLines.some((l) => (l.role.trim() && !l.person) || (!l.role.trim() && l.person));
    if (hasIncomplete) {
      setErrorMsg("Semua baris approver yang ditambahkan harus diisi lengkap (role dan nama orang).");
      return;
    }
    const completeLines = approverLines.filter((l) => l.role.trim() && l.person);
    if (completeLines.length === 0) {
      setErrorMsg("Minimal 1 approver harus diisi lengkap (role & orang).");
      return;
    }

    setSubmitting(true);
    try {
      const xsrfToken = await refreshCsrfCookie();

      const payloadApprovers = completeLines.map((l) => {
        const p = approverPayloadFromSelection(l.person);
        return {
          employee_id: p?.employee_id || "",
          name: p?.name || "",
          email: p?.email || (l.person as any)?.email || "",
          role: l.role,
        };
      });

      const res = await fetch("/api/fs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          fr_id: frId,
          number_fs: numberFs,
          balance: balance,
          balance_due_to_employee: balanceDueToEmployee,
          balance_due_to_company: balanceDueToCompany,
          status: submitStatus,
          items: items.map((i) => ({ deskripsi: i.deskripsi, total: i.total })),
          approver_lines: payloadApprovers,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat Fund Settlement");
      }

      router.push("/fs");
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
            <h1 className="text-xl font-bold text-gray-900">Buat Fund Settlement (FS)</h1>
            <p className="text-xs text-gray-500">Pertanggungjawaban penggunaan dana dari FR</p>
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
          Referensi FR & Informasi FS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pilih FR (Approved) <span className="text-red-500">*</span>
            </label>
            {loadingMeta ? (
              <div className="text-xs text-gray-400 py-2">Memuat daftar FR...</div>
            ) : (
              <select
                value={frId}
                onChange={(e) => setFrId(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white"
              >
                {approvedFrs.length === 0 ? (
                  <option value="">(Tidak ada FR approved milik Anda)</option>
                ) : (
                  approvedFrs.map((fr) => (
                    <option key={fr.id} value={fr.id}>
                      {fr.number_fr} - {fr.keterangan || "Tanpa Keterangan"}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nomor FS <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={numberFs}
              onChange={(e) => setNumberFs(e.target.value)}
              className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Balance</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Balance Due to Employee (Hutang ke Karyawan)
            </label>
            <input
              type="number"
              value={balanceDueToEmployee}
              onChange={(e) => setBalanceDueToEmployee(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Balance Due to Company (Pengembalian ke Perusahaan)
            </label>
            <input
              type="number"
              value={balanceDueToCompany}
              onChange={(e) => setBalanceDueToCompany(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
            />
          </div>
        </div>

        {/* Item Lines */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Rincian Pengeluaran Real (FS Item Lines)
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
            {items.map((item, index) => (
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
                    <label className="block text-xs text-gray-600 mb-1">Deskripsi Realisasi Pengeluaran</label>
                    <input
                      type="text"
                      value={item.deskripsi}
                      onChange={(e) => updateItem(item.id, "deskripsi", e.target.value)}
                      placeholder="Pembayaran / kwitansi..."
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total (IDR)</label>
                    <input
                      type="number"
                      value={item.total}
                      onChange={(e) => updateItem(item.id, "total", parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-mono border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="text-right">
              <span className="text-xs text-gray-500 block uppercase font-medium">Grand Total Realisasi</span>
              <span className="text-xl font-bold font-mono text-[#1F3A5F]">
                IDR {grandTotalItems.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Approver Lines */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <UserCheck size={16} /> Penentuan Approver FS
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Pilih minimal 1 approver untuk memproses pengajuan pertanggungjawaban ini.
              </p>
            </div>
            <button
              type="button"
              onClick={addApproverLine}
              className="flex items-center gap-1 text-xs text-[#1F3A5F] font-semibold hover:underline"
            >
              <Plus size={14} /> Tambah Approver
            </button>
          </div>

          <div className="space-y-4">
            {approverLines.map((line, index) => (
              <div key={line.id} className="flex flex-col md:flex-row md:items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role Approver #{index + 1}
                  </label>
                  <RolePicker
                    value={line.role}
                    onChange={(val) => updateApproverLine(line.id, "role", val)}
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nama / Karyawan
                  </label>
                  <SsoUserPicker
                    value={line.person}
                    onChange={(val) => updateApproverLine(line.id, "person", val)}
                    placeholder="Pilih Karyawan..."
                    filterOwnUnit={true}
                  />
                </div>
                {approverLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeApproverLine(line.id)}
                    className="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50 self-end md:mb-1"
                    title="Hapus Approver"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
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
          <Send size={16} /> Ajukan FS
        </button>
      </div>
    </div>
  );
}

const RolePicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const defaultRoles = ["Requested By", "Checked By", "Approved By", "Approved By Atasan"];
  const isCustom = value !== "" && !defaultRoles.includes(value);
  const [customMode, setCustomMode] = useState(isCustom);
  const [customValue, setCustomValue] = useState(isCustom ? value : "");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setCustomMode(true);
      onChange("");
    } else {
      setCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange(val);
  };

  if (customMode) {
    return (
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={customValue}
          onChange={handleCustomChange}
          placeholder="Ketik role kustom..."
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false);
            onChange(defaultRoles[0]);
          }}
          className="text-xs text-[#1F3A5F] hover:underline shrink-0"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white"
    >
      {defaultRoles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
      <option value="custom">-- Ketik Bebas... --</option>
    </select>
  );
};

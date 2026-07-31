"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Percent, ArrowLeft } from "lucide-react";
import { refreshCsrfCookie, getXsrfToken } from "@/lib/csrf";

interface Tax {
  id: number;
  name: string;
  value: number | string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminTaxPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  // Modal State for Create / Edit Tax
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState({ name: "", value: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string; value?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Modal State for Delete Confirmation
  const [deleteConfirmTax, setDeleteConfirmTax] = useState<Tax | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast message
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Verify User Authentication & Role ('super_admin' or 'admin')
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          const user = json?.data?.user || json?.user || json?.data;
          if (user) {
            setCurrentUser(user);
            const userRole = (user.role || "").toLowerCase();
            if (userRole === "super_admin" || userRole === "admin") {
              setIsAuthorized(true);
            } else {
              setIsAuthorized(false);
            }
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Failed to check auth:", err);
        setIsAuthorized(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // 2. Fetch Taxes List
  const fetchTaxes = async () => {
    setLoadingTaxes(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/admin/tax`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTaxes(json.data);
        } else if (Array.isArray(json)) {
          setTaxes(json);
        }
      } else {
        showToast("error", "Gagal mengambil data jenis pajak.");
      }
    } catch (err) {
      console.error("Failed to fetch taxes:", err);
      showToast("error", "Terjadi kesalahan koneksi saat memuat pajak.");
    } finally {
      setLoadingTaxes(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchTaxes();
    }
  }, [isAuthorized]);

  const isSuperAdmin = currentUser?.role?.toLowerCase() === "super_admin";

  // Open Modal for Add
  const handleOpenAddModal = () => {
    if (!isSuperAdmin) {
      showToast("error", "Hanya Super Admin yang dapat mengubah jenis pajak.");
      return;
    }
    setEditingTax(null);
    setFormData({ name: "", value: "" });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (tax: Tax) => {
    if (!isSuperAdmin) {
      showToast("error", "Hanya Super Admin yang dapat mengubah jenis pajak.");
      return;
    }
    setEditingTax(tax);
    setFormData({ name: tax.name, value: String(tax.value) });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Form Submit (Store or Update)
  const handleSubmitTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!isSuperAdmin) {
      setFormErrors({ general: "Hanya Super Admin yang memiliki hak akses ini." });
      return;
    }

    const errors: { name?: string; value?: string } = {};
    if (!formData.name.trim()) errors.name = "Nama jenis pajak wajib diisi";
    if (!formData.value.trim()) {
      errors.value = "Nilai persentase wajib diisi";
    } else if (isNaN(Number(formData.value)) || Number(formData.value) < 0 || Number(formData.value) > 100) {
      errors.value = "Persentase harus berupa angka antara 0 - 100";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await refreshCsrfCookie();
      const xsrfToken = getXsrfToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

      const url = editingTax ? `${apiUrl}/admin/tax/${editingTax.id}` : `${apiUrl}/admin/tax`;
      const method = editingTax ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          value: Number(formData.value),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        showToast("success", editingTax ? "Jenis pajak berhasil diperbarui." : "Jenis pajak baru berhasil ditambahkan.");
        setIsModalOpen(false);
        fetchTaxes();
      } else {
        if (data?.errors) {
          setFormErrors({
            name: data.errors.name?.[0],
            value: data.errors.value?.[0],
            general: data.message || "Gagal menyimpan data pajak.",
          });
        } else {
          setFormErrors({ general: data?.message || "Gagal menyimpan data pajak." });
        }
      }
    } catch (err: any) {
      console.error("Submit tax error:", err);
      setFormErrors({ general: "Terjadi kesalahan server saat menyimpan data." });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteTax = async () => {
    if (!deleteConfirmTax) return;

    if (!isSuperAdmin) {
      setDeleteError("Hanya Super Admin yang dapat menghapus jenis pajak.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await refreshCsrfCookie();
      const xsrfToken = getXsrfToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${apiUrl}/admin/tax/${deleteConfirmTax.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        showToast("success", data.message || "Jenis pajak berhasil dihapus.");
        setDeleteConfirmTax(null);
        fetchTaxes();
      } else {
        setDeleteError(data?.message || "Gagal menghapus jenis pajak.");
      }
    } catch (err) {
      console.error("Delete tax error:", err);
      setDeleteError("Terjadi kesalahan server saat menghapus data.");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
        <p className="text-sm text-gray-500">Memeriksa hak akses...</p>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-red-800">Akses Ditolak</h2>
          <p className="text-sm text-red-600">
            Halaman ini khusus untuk pengguna dengan role <span className="font-semibold">admin</span> atau <span className="font-semibold">super_admin</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all duration-300 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Kembali ke Admin Control"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Percent size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan Pajak (Tax Management)</h1>
            <p className="text-xs text-gray-500">Kelola tarif dan jenis pajak yang dipakai pada form Fund Request (FR)</p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition shadow-sm shrink-0"
          >
            <Plus size={16} />
            Tambah Jenis Pajak
          </button>
        )}
      </div>

      {/* Taxes Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Daftar Jenis Pajak Terdaftar ({taxes.length})
          </span>
          {!isSuperAdmin && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
              Mode Lihat (Memerlukan Super Admin untuk mengubah)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loadingTaxes ? (
            <div className="py-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-[#1F3A5F] animate-spin" />
              Memuat daftar pajak...
            </div>
          ) : taxes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Belum ada jenis pajak yang terdaftar. Klik "+ Tambah Jenis Pajak" untuk membuat baru.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">ID</th>
                  <th className="py-3 px-4">Nama Jenis Pajak</th>
                  <th className="py-3 px-4">Persentase</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {taxes.map((tax) => (
                  <tr key={tax.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-gray-400">#{tax.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{tax.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {Number(tax.value)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(tax)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit Pajak"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmTax(tax);
                              setDeleteError(null);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Hapus Pajak"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL FORM: CREATE / EDIT TAX */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingTax ? "Edit Jenis Pajak" : "Tambah Jenis Pajak Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTax} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Jenis Pajak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: PPN 11%, PPh 23 (2%), PPh 4 ayat 2 (2.5%)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Persentase Tax (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Misal: 11, 5, 2.5"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 ${
                      formErrors.value ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                </div>
                {formErrors.value && <p className="text-[11px] text-red-600 mt-1">{formErrors.value}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1F3A5F] hover:bg-[#142640] rounded-lg transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTax ? "Simpan Perubahan" : "Tambah Pajak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION: DELETE TAX */}
      {deleteConfirmTax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle size={22} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Konfirmasi Hapus Pajak</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus jenis pajak{" "}
              <span className="font-semibold text-gray-900">{deleteConfirmTax.name}</span> ({Number(deleteConfirmTax.value)}%)?
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTax(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteTax}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

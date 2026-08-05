"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, AlertCircle, Loader2, FolderPlus, ArrowLeft, Search } from "lucide-react";
import { refreshCsrfCookie, getXsrfToken } from "@/lib/csrf";

interface KategoriFr {
  id: number;
  nama: string;
  min_app: number;
  max_amount: number | string;
  seksi_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export default function AdminKategoriFrPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [categories, setCategories] = useState<KategoriFr[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<KategoriFr | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    min_app: "1",
    max_amount: "50000000",
  });
  const [formErrors, setFormErrors] = useState<{ nama?: string; min_app?: string; max_amount?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Modal State for Delete Confirmation
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<KategoriFr | null>(null);
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

  // 2. Fetch Categories List
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/admin/kategori-fr`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        } else if (Array.isArray(json)) {
          setCategories(json);
        }
      } else {
        showToast("error", "Gagal memuat daftar Kategori Fund Control.");
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      showToast("error", "Terjadi kesalahan saat memuat data kategori.");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchCategories();
    }
  }, [isAuthorized]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingCat(null);
    setFormData({ nama: "", min_app: "1", max_amount: "50000000" });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (cat: KategoriFr) => {
    setEditingCat(cat);
    setFormData({
      nama: cat.nama,
      min_app: String(cat.min_app ?? 1),
      max_amount: String(cat.max_amount ?? 0),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Close form modal
  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingCat(null);
    setFormErrors({});
  };

  // Handle Submit (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: { nama?: string; min_app?: string; max_amount?: string } = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama kategori wajib diisi.";
    }
    const minAppNum = parseInt(formData.min_app, 10);
    if (isNaN(minAppNum) || minAppNum < 1) {
      errors.min_app = "Jumlah minimal approver minimal 1.";
    }
    const maxAmountNum = parseFloat(formData.max_amount);
    if (isNaN(maxAmountNum) || maxAmountNum < 0) {
      errors.max_amount = "Batas nominal tidak boleh negatif.";
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
      const url = editingCat ? `${apiUrl}/admin/kategori-fr/${editingCat.id}` : `${apiUrl}/admin/kategori-fr`;
      const method = editingCat ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          min_app: minAppNum,
          max_amount: maxAmountNum,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast("success", editingCat ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!");
        handleCloseModal();
        fetchCategories();
      } else {
        if (json.errors) {
          setFormErrors({
            nama: json.errors.nama?.[0],
            min_app: json.errors.min_app?.[0],
            max_amount: json.errors.max_amount?.[0],
            general: json.message || "Gagal menyimpan data.",
          });
        } else {
          setFormErrors({ general: json.message || "Gagal menyimpan data kategori." });
        }
      }
    } catch (err) {
      console.error("Failed to submit category form:", err);
      setFormErrors({ general: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteCategory = async () => {
    if (!deleteConfirmCat) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await refreshCsrfCookie();
      const xsrfToken = getXsrfToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/admin/kategori-fr/${deleteConfirmCat.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast("success", "Kategori berhasil dihapus!");
        setDeleteConfirmCat(null);
        fetchCategories();
      } else {
        setDeleteError(json.message || "Gagal menghapus kategori.");
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
      setDeleteError("Terjadi kesalahan jaringan saat menghapus.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) =>
    c.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  // Render Loading Auth State
  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
        <p className="text-sm text-gray-500">Memeriksa hak akses...</p>
      </div>
    );
  }

  // Render Access Denied State
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
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FolderPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategori Fund Control</h1>
            <p className="text-xs text-gray-500">Kelola jenis kategori yang digunakan pada modul pengajuan/upload Fund Request (FR)</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition shadow-sm shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Search & Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:border-[#1F3A5F] focus:ring-1 focus:ring-[#1F3A5F]"
            />
          </div>
          <span className="text-xs text-gray-500">
            Total: <strong className="text-gray-900 font-semibold">{filteredCategories.length}</strong> Kategori
          </span>
        </div>

        {/* Table Content */}
        {loadingCategories ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#1F3A5F]" />
            <p className="text-xs text-gray-500">Memuat daftar kategori...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 space-y-2">
            <FolderPlus size={32} className="mx-auto text-gray-300" />
            <p className="text-xs font-medium">
              {searchQuery ? "Kategori tidak ditemukan." : "Belum ada kategori fund control yang dibuat."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4 text-center">Min. Approver</th>
                  <th className="py-3 px-4 text-right">Batas Maksimal Nominal</th>
                  <th className="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-gray-400">{cat.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{cat.nama}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {cat.min_app} Approver
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                      {formatCurrency(cat.max_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCat(cat)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">
                {editingCat ? "Edit Kategori Fund Control" : "Tambah Kategori Fund Control Baru"}
              </h3>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 text-xs font-medium cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Nama Kategori */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perjalanan Dinas / ATK & Operasional"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-hidden focus:ring-1 ${
                    formErrors.nama
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#1F3A5F] focus:ring-[#1F3A5F]"
                  }`}
                />
                {formErrors.nama && <p className="text-[11px] text-red-600 mt-1">{formErrors.nama}</p>}
              </div>

              {/* Minimal Approver */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Jumlah Minimal Approver <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.min_app}
                  onChange={(e) => setFormData({ ...formData, min_app: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-hidden focus:ring-1 ${
                    formErrors.min_app
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#1F3A5F] focus:ring-[#1F3A5F]"
                  }`}
                />
                {formErrors.min_app && <p className="text-[11px] text-red-600 mt-1">{formErrors.min_app}</p>}
              </div>

              {/* Batas Maksimal Nominal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batas Maksimal Nominal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-hidden focus:ring-1 ${
                    formErrors.max_amount
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-[#1F3A5F] focus:ring-[#1F3A5F]"
                  }`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Pratinjau Format: {formatCurrency(formData.max_amount)}
                </p>
                {formErrors.max_amount && <p className="text-[11px] text-red-600 mt-1">{formErrors.max_amount}</p>}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingCat ? "Simpan Perubahan" : "Tambah Kategori"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Hapus Kategori Fund Control</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus kategori <strong className="text-gray-800">{deleteConfirmCat.nama}</strong>?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-left flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirmCat(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

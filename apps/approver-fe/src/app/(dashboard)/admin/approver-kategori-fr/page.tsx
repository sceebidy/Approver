"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { refreshCsrfCookie } from "@/lib/csrf";

interface MappingUser {
  user_id: number;
  name: string;
}

interface CategoryMapping {
  kategori_fr_id: number;
  nama: string;
  mappings: {
    issued_by: MappingUser | null;
    checked_by: MappingUser | null;
    approved_by: MappingUser | null;
    approved_by_atasan: MappingUser | null;
  };
}

interface UserOption {
  id: number;
  name: string;
  email: string;
}

export default function ApproverKategoriFrSettings() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<CategoryMapping[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  
  // Track selected user IDs locally for form editing: categoryId -> { role: userId }
  const [formState, setFormState] = useState<Record<number, Record<string, number>>>({});
  
  // Per-category saving and status message state
  const [savingStatus, setSavingStatus] = useState<Record<number, { saving: boolean; success: string | null; error: string | null }>>({});

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const initPage = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        
        // 1. Verify user profile and permissions
        const meRes = await fetch(`${baseUrl}/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!meRes.ok) {
          if (meRes.status === 401) {
            const portalUrl = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || "https://portal.inl.co.id";
            window.location.href = portalUrl;
            return;
          }
          if (mounted) setAuthorized(false);
          return;
        }

        const meData = await meRes.json();
        if (!meData.success || meData.data?.user?.role !== "super_admin") {
          if (mounted) setAuthorized(false);
          return;
        }

        if (mounted) setAuthorized(true);

        // 2. Fetch categories with mappings
        const catRes = await fetch(`${baseUrl}/admin/approver-kategori-fr`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        // 3. Fetch local users list
        const usersRes = await fetch(`${baseUrl}/admin/users`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (catRes.ok && usersRes.ok) {
          const catData = await catRes.json();
          const usersData = await usersRes.json();

          if (mounted) {
            setCategories(catData.data || []);
            setUsers(usersData.data || []);

            // Initialize form states
            const initialFormState: Record<number, Record<string, number>> = {};
            const initialSavingStatus: Record<number, { saving: boolean; success: string | null; error: string | null }> = {};
            
            (catData.data || []).forEach((cat: CategoryMapping) => {
              initialFormState[cat.kategori_fr_id] = {
                issued_by: cat.mappings.issued_by?.user_id || 0,
                checked_by: cat.mappings.checked_by?.user_id || 0,
                approved_by: cat.mappings.approved_by?.user_id || 0,
                approved_by_atasan: cat.mappings.approved_by_atasan?.user_id || 0,
              };
              initialSavingStatus[cat.kategori_fr_id] = { saving: false, success: null, error: null };
            });

            setFormState(initialFormState);
            setSavingStatus(initialSavingStatus);
          }
        }
      } catch (err) {
        console.error("Failed to initialize settings page", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initPage();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRoleChange = (categoryId: number, role: string, userId: number) => {
    setFormState((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [role]: userId,
      },
    }));
  };

  const handleSave = async (categoryId: number) => {
    setSavingStatus((prev) => ({
      ...prev,
      [categoryId]: { saving: true, success: null, error: null },
    }));

    try {
      const baseUrl = getApiBaseUrl();
      const xsrfToken = await refreshCsrfCookie();
      const payload = {
        mappings: formState[categoryId],
      };

      const res = await fetch(`${baseUrl}/admin/approver-kategori-fr/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSavingStatus((prev) => ({
          ...prev,
          [categoryId]: { saving: false, success: "Mapping approver berhasil disimpan!", error: null },
        }));
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSavingStatus((prev) => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], success: null },
          }));
        }, 3000);
      } else {
        throw new Error(data.message || `Gagal menyimpan data (${res.status})`);
      }
    } catch (err: any) {
      setSavingStatus((prev) => ({
        ...prev,
        [categoryId]: { saving: false, success: null, error: err.message || "Terjadi kesalahan." },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
          <span className="text-sm font-medium text-gray-500">Memuat pengaturan...</span>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex-1 p-8 bg-[#F9FAFB] min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">Akses Ditolak</h2>
          <p className="text-[13.5px] text-gray-500 leading-relaxed">
            Halaman ini hanya dapat diakses oleh Administrator Sistem (Super Admin).
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] text-white text-sm font-medium rounded-lg hover:opacity-95 transition-opacity"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 bg-[#F9FAFB] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#E3E6EA] relative">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#111827] tracking-tight">
            Pengaturan Approval Kategori FR
          </h1>
          <p className="text-[13.5px] text-[#6B7280] font-medium">
            Kelola pembagian 4-role approval bertingkat untuk setiap kategori Fund Request.
          </p>
          <div className="absolute bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] rounded-full"></div>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E3E6EA] rounded-full text-sm font-medium text-[#4B5563] hover:bg-[#F1F3F6] transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const categoryState = formState[cat.kategori_fr_id] || {};
          const status = savingStatus[cat.kategori_fr_id] || { saving: false, success: null, error: null };

          return (
            <div
              key={cat.kategori_fr_id}
              className="bg-white rounded-2xl border border-[#E3E6EA] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col justify-between animate-fadeIn"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-[#E3E6EA] bg-gradient-to-r from-[#F8F9FB] to-white flex items-center justify-between">
                <span className="text-[15px] font-bold text-gray-900 tracking-tight">{cat.nama}</span>
                <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#F1F3F6] text-gray-600 rounded-md">
                  ID Kategori: {cat.kategori_fr_id}
                </span>
              </div>

              {/* Card Body - Roles Form */}
              <div className="p-5 space-y-4 flex-1">
                {/* Role 1: Issued By */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2 pb-3.5 border-b border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Issued By</label>
                    <span className="text-[11.5px] text-gray-400">Pembuat/Pengaju awal</span>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={categoryState.issued_by || ""}
                      onChange={(e) => handleRoleChange(cat.kategori_fr_id, "issued_by", Number(e.target.value))}
                      className="w-full text-[13px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="">(Belum ditugaskan)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role 2: Checked By */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2 pb-3.5 border-b border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Checked By</label>
                    <span className="text-[11.5px] text-gray-400">Pemeriksa dokumen</span>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={categoryState.checked_by || ""}
                      onChange={(e) => handleRoleChange(cat.kategori_fr_id, "checked_by", Number(e.target.value))}
                      className="w-full text-[13px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="">(Belum ditugaskan)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role 3: Approved By */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2 pb-3.5 border-b border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Approved By</label>
                    <span className="text-[11.5px] text-gray-400">Pemberi persetujuan</span>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={categoryState.approved_by || ""}
                      onChange={(e) => handleRoleChange(cat.kategori_fr_id, "approved_by", Number(e.target.value))}
                      className="w-full text-[13px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="">(Belum ditugaskan)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role 4: Approved By Atasan */}
                <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Approved By Atasan</label>
                    <span className="text-[11.5px] text-gray-400">Persetujuan atasan tertinggi</span>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={categoryState.approved_by_atasan || ""}
                      onChange={(e) => handleRoleChange(cat.kategori_fr_id, "approved_by_atasan", Number(e.target.value))}
                      className="w-full text-[13px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1F3A5F] focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="">(Belum ditugaskan)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card Footer - Status & Action */}
              <div className="px-5 py-4 border-t border-[#E3E6EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex-1">
                  {status.success && (
                    <div className="text-[12.5px] text-emerald-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 size={16} />
                      {status.success}
                    </div>
                  )}
                  {status.error && (
                    <div className="text-[12.5px] text-red-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle size={16} />
                      {status.error}
                    </div>
                  )}
                </div>
                <button
                  disabled={status.saving}
                  onClick={() => handleSave(cat.kategori_fr_id)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] text-white text-[13px] font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shrink-0"
                >
                  {status.saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

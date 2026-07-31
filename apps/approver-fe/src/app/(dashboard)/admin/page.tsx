"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Loader2, Settings, Percent, ArrowRight } from "lucide-react";

export default function AdminControlPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

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

  // Render Loading Auth State
  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
        <p className="text-sm text-gray-500">Memeriksa hak akses Admin...</p>
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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1F3A5F]/10 text-[#1F3A5F] rounded-xl">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Control</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Pusat konfigurasi sistem dan manajemen fungsi administratif
            </p>
          </div>
        </div>
      </div>

      {/* 2 Main Function Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tombol 1: Semua Request */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Semua Request
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Pantau, cari, filter, dan telusuri seluruh pengajuan dokumen transaksi (PPAB, PO, MIS, FR, FS) dari semua pengguna.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Link
              href="/admin/requests"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1F3A5F] text-white text-xs font-semibold rounded-xl hover:bg-[#142640] transition shadow-xs group-hover:bg-blue-600"
            >
              <span>Buka Semua Request</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Tombol 2: Pengaturan Pajak */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Percent size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Pengaturan Pajak
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Kelola jenis dan persentase tarif pajak (PPN / PPh) yang digunakan untuk pemotongan/penambahan pada form Fund Request (FR).
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Link
              href="/admin/tax"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1F3A5F] text-white text-xs font-semibold rounded-xl hover:bg-[#142640] transition shadow-xs group-hover:bg-indigo-600"
            >
              <span>Kelola Pengaturan Pajak</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

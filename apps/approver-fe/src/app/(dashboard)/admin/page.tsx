"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";

export default function AdminControlPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Verify User Authentication & Role ('super_admin' or 'admin')
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
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
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
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Control</h1>
        <p className="text-xs text-gray-500 mt-1">
          Pusat konfigurasi sistem dan manajemen fungsi administratif
        </p>
      </div>

      {/* 3 Clean Single-Color Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Semua Request */}
        <div className="bg-white rounded-xl border border-gray-200 hover:border-[#1F3A5F] transition-all p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Semua Request</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Pantau, cari, dan telusuri seluruh pengajuan transaksi (PPAB, PO, MIS, FR, FS) dari semua pengguna.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/admin/requests"
              className="w-full inline-flex items-center justify-between px-3.5 py-2.5 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition cursor-pointer"
            >
              <span>Buka Semua Request</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 2: Kategori Fund Control */}
        <div className="bg-white rounded-xl border border-gray-200 hover:border-[#1F3A5F] transition-all p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Kategori Fund Control</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Kelola dan buat jenis-jenis kategori pengajuan dana yang digunakan pada modul upload/pengajuan FR.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/admin/kategori-fr"
              className="w-full inline-flex items-center justify-between px-3.5 py-2.5 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition cursor-pointer"
            >
              <span>Kelola Kategori FR</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 3: Pengaturan Pajak */}
        <div className="bg-white rounded-xl border border-gray-200 hover:border-[#1F3A5F] transition-all p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pengaturan Pajak</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Kelola jenis dan persentase tarif pajak (PPN / PPh) yang digunakan pada form Fund Request (FR).
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/admin/tax"
              className="w-full inline-flex items-center justify-between px-3.5 py-2.5 bg-[#1F3A5F] text-white text-xs font-semibold rounded-lg hover:bg-[#142640] transition cursor-pointer"
            >
              <span>Kelola Pengaturan Pajak</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

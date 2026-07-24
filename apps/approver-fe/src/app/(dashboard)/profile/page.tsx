"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, KeyRound, ShieldAlert, Mail, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!mounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.user) {
            setUser(data.data.user);
          }
        } else if (res.status === 401) {
          const portalUrl = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || "https://portal.inl.co.id";
          window.location.href = portalUrl;
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1F3A5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "User") + "&background=1F3A5F&color=fff";

  return (
    <div className="flex-1 p-8 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E3E6EA]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Profil Pengguna</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Detail informasi diri dan status akun yang sedang login di sistem.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E3E6EA] rounded-full text-sm font-medium text-[#4B5563] hover:bg-[#F1F3F6] transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-[#F3F4F6] flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F1F5F9] shrink-0">
          <img 
            src={user?.foto_profil || defaultAvatar} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#111827] uppercase tracking-wide">{user?.name || '-'}</h2>
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mt-1">{user?.role || '-'}</p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#059669] rounded-full text-[12px] font-semibold border border-[#A7F3D0]">
              <ShieldAlert size={14} />
              Akses: {user?.role || 'User'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] text-[#D97706] rounded-full text-[12px] font-semibold border border-[#FDE68A]">
              <UserCircle2 size={14} />
              Grade: {user?.grade_level ? `Level ${user.grade_level}` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Detail Perusahaan & Jabatan */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3F4F6]">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="text-[#10B981]" size={20} />
            <h3 className="text-sm font-bold text-[#4B5563] tracking-wider uppercase">Detail Perusahaan & Jabatan</h3>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Nama Lengkap</span>
              <span className="text-[14px] font-semibold text-[#111827]">{user?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Jabatan</span>
              <span className="text-[14px] font-semibold text-[#111827]">{user?.role || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Unit Kerja / Divisi</span>
              <span className="text-[14px] font-semibold text-[#111827]">{user?.unit_nama || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Grade Golongan</span>
              <span className="text-[14px] font-semibold text-[#111827]">{user?.grade_level ? `Level ${user.grade_level}` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Informasi Akun & Keamanan */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3F4F6]">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="text-[#10B981]" size={20} />
            <h3 className="text-sm font-bold text-[#4B5563] tracking-wider uppercase">Informasi Akun & Keamanan</h3>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Alamat Email</span>
              <span className="text-[14px] font-medium text-[#111827] flex items-center gap-2">
                <Mail size={14} className="text-[#9CA3AF]"/> {user?.email || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">SSO User ID</span>
              <span className="text-[14px] font-medium text-[#111827]">{user?.employeeId || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Status Login</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] text-[#059669] rounded-full text-[11px] font-semibold border border-[#A7F3D0]">
                <ShieldAlert size={12} />
                Terverifikasi SSO
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
              <span className="text-[13px] text-[#6B7280]">Sistem Keamanan</span>
              <span className="text-[12px] font-semibold text-[#0EA5E9] bg-[#E0F2FE] px-2.5 py-1 rounded-full border border-[#BAE6FD]">Active Token (JWT)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex gap-3">
        <ShieldAlert className="text-[#D97706] shrink-0 mt-0.5" size={20} />
        <p className="text-[13px] text-[#92400E] leading-relaxed">
          Akun ini terhubung langsung dengan sistem SSO (Single Sign-On) Portal Utama Perusahaan. Pengubahan data profil (nama, jabatan, golongan, divisi) hanya dapat dilakukan melalui Administrator Portal Utama.
        </p>
      </div>
    </div>
  );
}


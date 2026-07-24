"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ClipboardList, FileText, CheckCircle2, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

function NavItem({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] transition-colors ${
        active ? "bg-[#1F3A5F] text-white font-medium" : "text-[#4B5563] hover:bg-[#F1F3F6]"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.user) {
            setUser(data.data.user);
          }
        } else if (res.status === 401) {
          // If the session is invalid or expired, redirect to portal to re-login
          const portalUrl = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || "https://portal.inl.co.id";
          window.location.href = portalUrl;
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-56 shrink-0 border-r border-[#E3E6EA] bg-white flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-[#E3E6EA]">
        <div className="w-6 h-6 rounded bg-[#1F3A5F] flex items-center justify-center text-white text-[11px] font-semibold">A</div>
        <span className="ml-2 text-[14px] font-semibold text-[#111827]">Approver</span>
      </div>
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 text-sm">
        <NavItem icon={LayoutGrid} label="Dashboard" href="/" />
        <div className="pt-3 pb-1 px-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Procurement</div>
        <NavItem icon={ClipboardList} label="PPAB" href="/ppab" />
        <NavItem icon={FileText} label="Purchase Order" href="/po" />
        <NavItem icon={CheckCircle2} label="MIS" href="/mis" />
        <div className="pt-3 pb-1 px-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Financial</div>
        <NavItem icon={Wallet} label="Fund Request" href="/fr" />
        <NavItem icon={Wallet} label="Fund Settlement" href="/fs" />
      </nav>
      <div className="p-2.5 border-t border-[#E3E6EA]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md">
          {user ? (
            <>
              {user.foto_profil ? (
                <img src={user.foto_profil} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#E3E6EA] text-[#4B5563] flex items-center justify-center text-[11px] font-medium">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium truncate text-[#111827]">{user.name}</div>
                <div className="text-[11px] text-[#9CA3AF] truncate">{user.unit_nama || user.role || 'User'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-[#E3E6EA] flex items-center justify-center animate-pulse"></div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
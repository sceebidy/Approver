"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ClipboardList, FileText, CheckCircle2, Wallet, User, Bell, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

function NavItem({ icon: Icon, label, href, onClick }: { icon: LucideIcon; label: string; href: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] transition-all duration-200 ${
        active 
          ? "bg-gradient-to-r from-[#1F3A5F] to-[#2B5284] text-white font-medium shadow-sm" 
          : "text-[#4B5563] hover:bg-gradient-to-r hover:from-[#F1F3F6] hover:to-transparent"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-[#F8F9FB]">
      <div className="h-14 flex items-center justify-between px-5 border-b border-[#E3E6EA]">
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1F3A5F] to-[#2B5284] flex items-center justify-center text-white text-[12px] font-bold shadow-sm">A</div>
          <span className="ml-2.5 text-[15px] font-bold text-[#111827] tracking-tight">Approver</span>
        </div>
        
        {/* Mobile close button */}
        <button 
          className="md:hidden p-1.5 rounded-md text-[#4B5563] hover:bg-[#E3E6EA] transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <nav className="flex-1 px-3.5 py-5 space-y-1 text-sm overflow-y-auto">
        <NavItem icon={LayoutGrid} label="Dashboard" href="/" onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className="pt-5 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Procurement</div>
        <NavItem icon={ClipboardList} label="PPAB" href="/ppab" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem icon={FileText} label="Purchase Order" href="/po" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem icon={CheckCircle2} label="MIS" href="/mis" onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className="pt-5 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Financial</div>
        <NavItem icon={Wallet} label="Fund Request" href="/fr" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem icon={Wallet} label="Fund Settlement" href="/fs" onClick={() => setIsMobileMenuOpen(false)} />
      </nav>

      {/* Topbar Info Moved Here */}
      <div className="px-5 py-4 border-t border-[#E3E6EA] bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[12px] text-[#6B7280] font-medium">{currentDate}</span>
          <button className="relative w-8 h-8 rounded-full hover:bg-[#F1F3F6] flex items-center justify-center transition-colors">
            <Bell size={16} className="text-[#4B5563]" strokeWidth={2} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B54708] ring-2 ring-white" />
          </button>
        </div>
        
        <Link 
          href="/profile" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E3E6EA] transition-all cursor-pointer group"
        >
          {user?.foto_profil ? (
            <img src={user.foto_profil} alt={user.name || "User"} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-[#E3E6EA] transition-all" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F3A5F] to-[#2B5284] text-white flex items-center justify-center text-[13px] font-semibold shrink-0 shadow-sm">
              {getInitials(user?.name || "U")}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate text-[#111827] group-hover:text-[#1F3A5F] transition-colors">
              {user?.name || "Memuat..."}
            </div>
            <div className="text-[11.5px] text-[#6B7280] truncate font-medium">
              {user ? (user?.role || user?.unit_nama || "User") : "Tunggu sebentar"}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-[#E3E6EA] shrink-0 sticky top-0 z-20">
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1F3A5F] to-[#2B5284] flex items-center justify-center text-white text-[12px] font-bold shadow-sm">A</div>
          <span className="ml-2.5 text-[15px] font-bold text-[#111827] tracking-tight">Approver</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-full hover:bg-[#F1F3F6] flex items-center justify-center transition-colors">
            <Bell size={18} className="text-[#4B5563]" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B54708] ring-2 ring-white" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-md text-[#4B5563] hover:bg-[#F1F3F6] transition-colors"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-[#E3E6EA] bg-white flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
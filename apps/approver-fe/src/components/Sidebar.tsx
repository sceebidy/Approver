"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ClipboardList, FileText, CheckCircle2, Wallet, User, LogOut, Menu, X, ChevronLeft, ChevronRight, History, ShieldCheck, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

function NavItem({ icon: Icon, label, href, onClick, isCollapsed }: { icon: LucideIcon; label: string; href: string; onClick?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13.5px] transition-all duration-200 ${
        active 
          ? "bg-[#1F3A5F] text-white font-medium shadow-sm" 
          : "text-[#4B5563] hover:bg-[#F1F3F6]"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
    } catch (e) {
      console.error(e);
    }
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || "https://portal.inl.co.id";
    window.location.href = portalUrl;
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full w-full bg-[#F8F9FB] overflow-hidden">
      <div className={`h-16 flex items-center px-4 border-b border-[#E3E6EA] ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <img 
            src="/logo.png" 
            alt="INL Logo" 
            className={`object-contain transition-all duration-300 ${collapsed ? "w-10 h-10" : "w-12 h-12"}`} 
          />
          {!collapsed && <span className="text-[17px] font-extrabold text-[#111827] tracking-tight truncate">Approver</span>}
        </div>
        
        {/* Desktop Toggle Button */}
        {!collapsed && (
          <button 
            className="hidden md:flex p-1.5 rounded-md text-[#4B5563] hover:bg-[#E3E6EA] transition-colors shrink-0"
            onClick={() => setIsCollapsed(true)}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        )}
        
        {/* Mobile close button */}
        <button 
          className="md:hidden p-1.5 rounded-md text-[#4B5563] hover:bg-[#E3E6EA] transition-colors shrink-0"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? "px-2" : "px-3.5"} py-2.5 space-y-0.5 text-sm overflow-y-auto overflow-x-hidden`}>
        {collapsed && (
          <div className="flex justify-center mb-2">
             <button 
              className="hidden md:flex p-1.5 rounded-md text-[#4B5563] hover:bg-[#E3E6EA] transition-colors shrink-0"
              onClick={() => setIsCollapsed(false)}
              title="Expand Sidebar"
             >
               <ChevronRight size={18} strokeWidth={2} />
             </button>
          </div>
        )}
      
        <NavItem icon={LayoutGrid} label="Dashboard" href="/" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        <NavItem icon={History} label="Riwayat Dokumen" href="/history" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        
        <div className={`pt-2.5 pb-1 ${collapsed ? "px-0 text-center" : "px-3"} text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]`}>
          {collapsed ? "..." : "Procurement"}
        </div>
        <NavItem icon={ClipboardList} label="PPAB" href="/ppab" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        <NavItem icon={FileText} label="Purchase Order" href="/po" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        <NavItem icon={CheckCircle2} label="MIS" href="/mis" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        
        <div className={`pt-2.5 pb-1 ${collapsed ? "px-0 text-center" : "px-3"} text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]`}>
           {collapsed ? "..." : "Financial"}
        </div>
        <NavItem icon={Wallet} label="Fund Request" href="/fr" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
        <NavItem icon={Wallet} label="Fund Settlement" href="/fs" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />

        {user && ["super_admin", "admin"].includes(user.role?.toLowerCase()) && (
          <>
            <div className={`pt-2.5 pb-1 ${collapsed ? "px-0 text-center" : "px-3"} text-[11px] font-bold uppercase tracking-wider text-red-600`}>
              {collapsed ? "..." : "Admin"}
            </div>
            <NavItem icon={Settings} label="Admin Control" href="/admin" onClick={() => setIsMobileMenuOpen(false)} isCollapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Footer / Profile */}
      <div className={`px-4 py-4 border-t border-[#E3E6EA] bg-white/60 backdrop-blur-sm ${collapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        {!collapsed && (
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[12px] text-[#6B7280] font-medium truncate">{currentDate}</span>
            <button 
              onClick={handleLogout} 
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors group shrink-0" 
              title="Logout"
            >
              <LogOut size={16} strokeWidth={2.5} className="transition-colors" />
            </button>
          </div>
        )}
        {collapsed && (
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors group shrink-0" 
            title="Logout"
          >
             <LogOut size={18} strokeWidth={2.5} className="transition-colors" />
          </button>
        )}
        
        <Link 
          href="/profile" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center ${collapsed ? "justify-center p-1" : "gap-3 p-2.5"} rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E3E6EA] transition-all cursor-pointer group`}
          title={collapsed ? (user?.name || "User Profile") : undefined}
        >
          {user?.foto_profil ? (
            <img src={user.foto_profil} alt={user.name || "User"} className={`${collapsed ? "w-10 h-10" : "w-9 h-9"} rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-[#E3E6EA] transition-all`} />
          ) : (
            <div className={`${collapsed ? "w-10 h-10 text-[14px]" : "w-9 h-9 text-[13px]"} rounded-full bg-[#1F3A5F] text-white flex items-center justify-center font-semibold shrink-0 shadow-sm`}>
              {getInitials(user?.name || "U")}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate text-[#111827] group-hover:text-[#1F3A5F] transition-colors">
                {user?.name || "Memuat..."}
              </div>
              <div className="text-[11.5px] text-[#6B7280] truncate font-medium">
                {user ? (user?.role || user?.unit_nama || "User") : "Tunggu sebentar"}
              </div>
            </div>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-[#E3E6EA] shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -ml-1 rounded-md text-[#4B5563] hover:bg-[#F1F3F6] transition-colors"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <img 
            src="/logo.png" 
            alt="INL Logo" 
            className="w-10 h-10 object-contain ml-1" 
          />
          <span className="text-[16px] font-extrabold text-[#111827] tracking-tight">Approver</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
            title="Logout"
          >
            <LogOut size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex shrink-0 border-r border-[#E3E6EA] bg-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
        <SidebarContent collapsed={isCollapsed} />
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
        <SidebarContent collapsed={false} />
      </aside>
    </>
  );
}
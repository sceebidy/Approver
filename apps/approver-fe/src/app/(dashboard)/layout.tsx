import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FB] text-[#111827] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
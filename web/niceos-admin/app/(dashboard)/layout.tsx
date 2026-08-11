import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { RoleProvider } from "@/lib/role-context";
import { ToastViewport } from "@/components/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
        </div>
      </div>
      <ToastViewport />
    </RoleProvider>
  );
}

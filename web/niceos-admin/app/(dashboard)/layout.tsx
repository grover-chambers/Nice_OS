import Sidebar from "@/components/Sidebar";
import { RoleProvider } from "@/lib/role-context";
import { ToastViewport } from "@/components/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-slate-50 p-6">{children}</main>
      </div>
      <ToastViewport />
    </RoleProvider>
  );
}

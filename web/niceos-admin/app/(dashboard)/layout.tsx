import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { RoleProvider } from "@/lib/role-context";
import { ToastViewport } from "@/components/toast";
import { getAlertCounts } from "@/lib/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let alertCount = 0;
  try {
    const counts = await getAlertCounts();
    alertCount = counts?.unread ?? 0;
  } catch {
    alertCount = 0;
  }

  return (
    <RoleProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar alertCount={alertCount} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav alertCount={alertCount} />
          <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
        </div>
      </div>
      <ToastViewport />
    </RoleProvider>
  );
}

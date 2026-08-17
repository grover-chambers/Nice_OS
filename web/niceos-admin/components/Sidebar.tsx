"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Map, ShoppingBag, Route as RouteIcon, ClipboardCheck, BarChart3, FileText, Bell, Settings, Grid3x3, LogOut, ListChecks } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: string | number }>> = {
  Dashboard: LayoutDashboard,
  Territories: Map,
  "Territory Hierarchy": Grid3x3,
  Retailers: ShoppingBag,
  Routes: RouteIcon,
  Visits: ClipboardCheck,
  "Rep Management": Users,
  Analytics: BarChart3,
  Reports: FileText,
  Alerts: Bell,
  "Users & Roles": Users,
  Settings: Settings,
  "Census": ListChecks,
  Overview: BarChart3,
  "Market Analytics": BarChart3,
  "My Dashboard": LayoutDashboard,
  "My Territory": Map,
  "My Retailers": ShoppingBag,
  "My Routes": RouteIcon,
  "My Visits": ClipboardCheck,
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/territories") return pathname === "/territories" || pathname === "/territories/manage";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useRole();

  const handleLogout = () => {
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-emerald-950 text-slate-100">
      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-emerald-950">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">NiceOS</h1>
            <p className="text-[10px] text-emerald-300/70">NICE MILLERS LIMITED</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2">
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          {config.label}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {config.nav.map((item) => {
          const Icon = iconMap[item.label];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500 text-emerald-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              {Icon && <Icon size={16} className={active ? "text-emerald-950" : "text-slate-400"} />}
              <span className="flex-1">{item.label}</span>
              {item.href === "/alerts" && alertCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              pathname === "/settings"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-white/5 text-slate-200 hover:bg-white/10"
            )}
          >
            <Settings size={14} />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
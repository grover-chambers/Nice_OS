"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Map, ShoppingBag, Route as RouteIcon, ClipboardCheck, BarChart3, FileText, Bell, Settings, Grid3x3 } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { ROLE_CONFIG } from "@/lib/data";
import { getAlertCounts } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/data/types";

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

export default function Sidebar() {
  const pathname = usePathname();
  const { role, setRole, config } = useRole();
  const alertCount = getAlertCounts().unread;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-900">NiceOS</h1>
            <p className="text-[10px] text-slate-400">Market Link · Nice Millers</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
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
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {Icon && <Icon size={16} className={active ? "text-white" : "text-slate-400"} />}
              <span className="flex-1">{item.label}</span>
              {item.href === "/alerts" && alertCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Preview role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
        >
          {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_CONFIG[r].label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

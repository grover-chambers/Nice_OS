"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { getAlertCounts } from "@/lib/data";

export default function TopNav() {
  const pathname = usePathname();
  const { config } = useRole();
  const alertCount = getAlertCounts().unread;

  const pageTitle = config.nav.find((n) => {
    if (n.href === "/dashboard") return pathname === "/dashboard";
    if (n.href === "/territories") return pathname === "/territories" || pathname === "/territories/manage";
    return pathname === n.href || pathname.startsWith(n.href + "/");
  })?.label;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
          {config.label}
        </p>
        <h2 className="truncate text-lg font-bold text-slate-900">
          {pageTitle ?? "Dashboard"}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 sm:flex">
          <Search size={14} />
          <span>Search retailers, routes…</span>
        </div>

        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          aria-label="Alerts"
        >
          <Bell size={16} />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-emerald-950">
              {alertCount}
            </span>
          )}
        </Link>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          GM
        </div>
      </div>
    </header>
  );
}

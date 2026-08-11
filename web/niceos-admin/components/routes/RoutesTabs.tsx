"use client";

import Link from "next/link";
import { Route as RouteIcon, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoutesTab = "planning" | "approvals";

const TABS: { id: RoutesTab; label: string; icon: typeof RouteIcon }[] = [
  { id: "planning", label: "Planning", icon: RouteIcon },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck },
];

export default function RoutesTabs({ active, queueCount }: { active: RoutesTab; queueCount?: number }) {
  return (
    <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={t.id === "planning" ? "/routes" : `/routes?tab=${t.id}`}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            <Icon size={15} />
            {t.label}
            {t.id === "approvals" && queueCount != null && queueCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
                {queueCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

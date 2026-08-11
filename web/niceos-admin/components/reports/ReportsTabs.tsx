"use client";

import Link from "next/link";
import { MapPin, TrendingUp, Radar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportsTab = "coverage" | "sales" | "market" | "reps";

const TABS: { id: ReportsTab; label: string; icon: typeof MapPin }[] = [
  { id: "coverage", label: "Coverage", icon: MapPin },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "market", label: "Market", icon: Radar },
  { id: "reps", label: "Reps", icon: Users },
];

export default function ReportsTabs({ active }: { active: ReportsTab }) {
  return (
    <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={t.id === "coverage" ? "/reports" : `/reports?tab=${t.id}`}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            <Icon size={15} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { LayoutGrid, Map, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export type TerritoryTab = "overview" | "map" | "hierarchy";

const TABS: { id: TerritoryTab; label: string; icon: typeof Map }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "map", label: "Map", icon: Map },
  { id: "hierarchy", label: "Hierarchy", icon: GitBranch },
];

export default function TerritoryTabs({ active }: { active: TerritoryTab }) {
  return (
    <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={t.id === "overview" ? "/territories" : `/territories?tab=${t.id}`}
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

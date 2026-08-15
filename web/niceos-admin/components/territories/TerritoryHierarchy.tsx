"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Layers, MapPin, Plus, Search } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { zoneColor } from "@/lib/status";
import { toaster } from "@/components/toast";
import type { HierarchyNode } from "@/lib/data/mock";

export default function TerritoryHierarchy({ tree }: { tree: HierarchyNode[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const levelColor = (level: HierarchyNode["level"]) =>
    level === "zone" ? "bg-slate-900 text-white" : level === "subcounty" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";

  const renderNode = (node: HierarchyNode, depth: number) => {
    const matches = node.name.toLowerCase().includes(q.toLowerCase());
    if (q && !matches) return null;
    const isOpen = open[node.id];
    const hasChildren = !!node.children?.length;

    return (
      <div key={node.id}>
        <div
          className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 ${depth > 0 ? "ml-5 border-l border-slate-100" : ""}`}
          onClick={() => hasChildren && toggle(node.id)}
        >
          <span className="w-4 shrink-0 text-slate-400">
            {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />}
          </span>
          {node.level === "zone" && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: zoneColor(node.zone!) }} />
          )}
          <span className={`text-sm font-semibold ${node.level === "zone" ? "text-slate-900" : "text-slate-700"}`}>{node.name}</span>
          <Badge className={levelColor(node.level)}>{node.level}</Badge>
          <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-slate-500">
            <span className="hidden items-center gap-1 sm:flex">
              <MapPin size={12} /> {node.retailerCount}
            </span>
            <span className={`w-11 text-right font-bold ${node.coveragePct >= 60 ? "text-emerald-600" : node.coveragePct >= 30 ? "text-amber-600" : "text-rose-600"}`}>
              {node.coveragePct}%
            </span>
            {node.level === "ward" && (
              <Link
                href={`/retailers/new?ward=${encodeURIComponent(node.name)}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 opacity-0 transition-opacity hover:bg-slate-50 group-hover:opacity-100"
              >
                <Plus size={11} /> Register
              </Link>
            )}
          </span>
        </div>
        {hasChildren && isOpen && node.children!.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const totals = tree.reduce(
    (acc, z) => ({
      retailers: acc.retailers + z.retailerCount,
      wards: acc.wards + (z.children ?? []).reduce((a, c) => a + (c.children?.length ?? 0), 0),
      subcounties: acc.subcounties + (z.children?.length ?? 0),
    }),
    { retailers: 0, wards: 0, subcounties: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Sales zones", value: tree.length, icon: Layers },
          { label: "Sub-counties", value: totals.subcounties },
          { label: "Wards", value: totals.wards },
          { label: "Registered outlets", value: totals.retailers },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hierarchy explorer</h3>
            <p className="text-xs text-slate-500">
              Click a zone or sub-county to expand; coverage % shows share of registered outlets that are active.
            </p>
          </div>
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="w-44 rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div className="p-3">
          {tree.map((z) => renderNode(z, 0))}
          {q && !tree.some((z) => z.name.toLowerCase().includes(q.toLowerCase())) && (
            <div className="p-2">
              <EmptyState title="No matches" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-4 py-2.5">
          <button
            onClick={() => toaster.success("Hierarchy export ready (demo)")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Export hierarchy
          </button>
        </div>
      </div>
    </div>
  );
}

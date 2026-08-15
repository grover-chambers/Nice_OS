"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Plus, Search, Store } from "lucide-react";
import MapViewWrapper from "@/components/MapViewWrapper";
import { Card, Badge, PageHeader, DemoBanner, EmptyState, Progress } from "@/components/ui";
import { fmtDate, fmtKes, daysSince } from "@/lib/data/mock";
import { retailerStatusMeta, zoneColor } from "@/lib/status";
import type { Retailer, RetailerStatus, WardZone, Rep } from "@/lib/data/types";
import { WARD_META } from "@/lib/data/seed";

const STATUSES: RetailerStatus[] = ["active", "prospect", "at-risk", "churned", "blocked"];

export default function RetailersView({
  retailers: all,
  reps,
}: {
  retailers: Retailer[];
  reps: Rep[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RetailerStatus | "all">("all");
  const [zone, setZone] = useState<WardZone | "all">("all");
  const [type, setType] = useState<string>("all");
  const [ward, setWard] = useState<string>("all");
  const [selected, setSelected] = useState<Retailer | null>(null);
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<RetailerStatus>>(new Set());

  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "—";

  const visible = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter((r) => {
      if (hiddenStatuses.has(r.status)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (zone !== "all" && r.zone !== zone) return false;
      if (type !== "all" && r.type !== type) return false;
      if (ward !== "all" && r.ward !== ward) return false;
      if (qq && !`${r.name} ${r.owner} ${r.ward} ${r.phone}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [all, q, status, zone, type, ward, hiddenStatuses]);

  const toggleLegend = (s: RetailerStatus) => {
    setHiddenStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const markerColor = (r: Retailer) => retailerStatusMeta[r.status].color;
  const selectedRetailerId = selected?.id ?? null;

  const countsByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of all) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [all]);

  return (
    <div>
      <PageHeader
        title="Retailers"
        description="Outlet registry mapped across Nairobi. Filter by segment, click a marker or row to inspect an outlet."
        actions={
          <Link
            href="/retailers/new"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            <Plus size={14} /> Register retailer
          </Link>
        }
      />
      <DemoBanner />

      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, owner, ward, phone…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RetailerStatus | "all")}
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{retailerStatusMeta[s].label}</option>
              ))}
            </select>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as WardZone | "all")}
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All zones</option>
              {["Kiambu", "Central", "Northern", "Eastern", "South-Eastern", "Kajiado"].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All outlet types</option>
              {["duka", "kiosk", "supermarket", "wholesaler", "restaurant", "chemist"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="max-w-[180px] rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All wards</option>
              {WARD_META.map((w) => (
                <option key={w.ward} value={w.ward}>{w.ward}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MapViewWrapper
              wardMode="zone"
              retailers={visible}
              retailerColor={markerColor}
              onRetailerClick={(r) => setSelected(r)}
              selectedRetailerId={selectedRetailerId}
              className="h-[460px] rounded-none border-0"
              overlay={
                <div className="pointer-events-auto absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Legend — {visible.length} shown
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {STATUSES.map((s) => {
                      const m = retailerStatusMeta[s];
                      const hidden = hiddenStatuses.has(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleLegend(s)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
                          title={hidden ? "Show" : "Hide"}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/10"
                            style={{ background: hidden ? "#cbd5e1" : m.color }}
                          />
                          {m.label} ({countsByStatus[s] ?? 0})
                        </button>
                      );
                    })}
                  </div>
                </div>
              }
            />
          </div>

          <div className="flex max-h-[460px] flex-col border-t border-slate-200 lg:border-l lg:border-t-0">
            <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Outlets ({visible.length})
            </div>
            <div className="flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No outlets match" hint="Adjust the filters above." />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {visible.slice(0, 120).map((r) => {
                    const m = retailerStatusMeta[r.status];
                    const active = selected?.id === r.id;
                    return (
                      <li
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className={`cursor-pointer px-4 py-3 transition-colors ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Store size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate text-sm font-semibold text-slate-800">{r.name}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {r.owner} · {r.ward}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <Badge tone="slate" className="capitalize">{r.type}</Badge>
                              <Badge tone="slate">Tier {r.tier}</Badge>
                              <Badge className={m.bg}>{m.label}</Badge>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-600">
                            {fmtKes(r.avgOrderValue)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            <span style={{ color: zoneColor(r.zone) }}>{r.zone}</span>
                          </span>
                          <span>·</span>
                          <span>Last visit: {r.lastVisitAt ? fmtDate(r.lastVisitAt) : "never"}</span>
                          {r.lastVisitAt && daysSince(r.lastVisitAt) > 14 && (
                            <span className="text-amber-600">(overdue)</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>

      {selected && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                <Badge className={retailerStatusMeta[selected.status].bg}>
                  {retailerStatusMeta[selected.status].label}
                </Badge>
                <Badge tone="slate">Tier {selected.tier}</Badge>
                <Badge tone="slate" className="capitalize">{selected.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {selected.owner} · {selected.phone} · {selected.address}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {selected.ward}, {selected.constituency} · {selected.zone} Zone · Rep {repName(selected.repId)}
              </p>
            </div>
            <Link
              href={`/retailers/${selected.id}`}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Open intelligence profile <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Health score</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{selected.healthScore}</span>
                <Progress
                  value={selected.healthScore}
                  tone={selected.healthScore >= 70 ? "emerald" : selected.healthScore >= 45 ? "amber" : "rose"}
                  className="w-20"
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Churn risk</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-800">{selected.churnRisk}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Orders (30d)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selected.orders30d}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Visits (30d)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{selected.visits30d}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

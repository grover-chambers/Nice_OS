"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Store, User } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, Badge, PageHeader, Progress, EmptyState } from "@/components/ui";
import { fmtKes, fmtDateTime } from "@/lib/data/mock";
import { retailerStatusMeta, visitStatusMeta } from "@/lib/status";
import { toaster } from "@/components/toast";
import type { Retailer, Rep, Visit, CompetitorObservation } from "@/lib/data/types";

export default function RetailerProfileView({
  retailer,
  rep,
  visits,
  observations,
}: {
  retailer: Retailer | null;
  rep?: Rep;
  visits: Visit[];
  observations: CompetitorObservation[];
}) {
  const [tab, setTab] = useState<"timeline" | "stock">("timeline");

  if (!retailer) {
    return (
      <div>
        <Link href="/retailers" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={13} /> Back to retailers
        </Link>
        <EmptyState title="Retailer not found" hint="The outlet may have been removed." />
      </div>
    );
  }

  const m = retailerStatusMeta[retailer.status];

  const orderChart = visits
    .filter((v) => v.orderValue)
    .slice(0, 8)
    .reverse()
    .map((v) => ({
      date: new Date(v.at).toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      value: v.orderValue ?? 0,
    }));

  const shelfData = useMemo(() => {
    const acc: Record<string, { sku: string; full: number; low: number; out: number }> = {};
    for (const v of visits) {
      for (const it of v.items) {
        const row = (acc[it.sku] ??= { sku: it.sku, full: 0, low: 0, out: 0 });
        if (it.shelf === "full") row.full++;
        if (it.shelf === "low") row.low++;
        if (it.shelf === "out") row.out++;
      }
    }
    return Object.values(acc);
  }, [visits]);

  return (
    <div>
      <Link href="/retailers" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={13} /> Back to retailers
      </Link>
      <PageHeader
        title={retailer.name}
        description={retailer.address}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => toaster.success("Visit scheduled — assigned to " + (rep?.name ?? "rep"))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Schedule visit
            </button>
            <button
              onClick={() => toaster.success("Order request forwarded to Nice Millers sales office")}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Forward order
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge className={m.bg}>{m.label}</Badge>
        <Badge tone="slate">Tier {retailer.tier}</Badge>
        <Badge tone="slate" className="capitalize">{retailer.type}</Badge>
        <Badge tone={retailer.churnRisk === "high" ? "rose" : retailer.churnRisk === "medium" ? "amber" : "emerald"}>
          Churn: {retailer.churnRisk}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={13} /> {retailer.ward} · {retailer.constituency} · {retailer.zone} Zone
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card title="Health score" pad={false}>
            <div className="flex flex-col items-center px-5 py-6">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-emerald-100 bg-emerald-50">
                <span className="text-3xl font-black text-emerald-700">{retailer.healthScore}</span>
              </div>
              <p className="mt-3 text-sm font-semibold capitalize text-slate-700">
                {retailer.healthScore >= 80 ? "Excellent" : retailer.healthScore >= 60 ? "Good" : retailer.healthScore >= 45 ? "Fair" : "Poor"} health
              </p>
              <Progress
                value={retailer.healthScore}
                tone={retailer.healthScore >= 70 ? "emerald" : retailer.healthScore >= 45 ? "amber" : "rose"}
                className="mt-3 w-40"
              />
            </div>
          </Card>

          <Card title="Key metrics" pad={false}>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between px-5 py-3">
                <dt className="text-slate-500">Visits (30d)</dt>
                <dd className="font-semibold text-slate-900">{retailer.visits30d}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt className="text-slate-500">Orders (30d)</dt>
                <dd className="font-semibold text-slate-900">{retailer.orders30d}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt className="text-slate-500">Avg order value</dt>
                <dd className="font-semibold text-slate-900">{fmtKes(retailer.avgOrderValue)}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt className="text-slate-500">Order trend (30d)</dt>
                <dd className={`font-semibold ${retailer.orderTrendPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {retailer.orderTrendPct >= 0 ? "+" : ""}{retailer.orderTrendPct}%
                </dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt className="text-slate-500">Last visit</dt>
                <dd className="font-semibold text-slate-900">
                  {retailer.lastVisitAt ? fmtDateTime(retailer.lastVisitAt) : "Never"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Competitor presence">
            {retailer.competitorPresence.length === 0 ? (
              <p className="text-xs text-slate-400">No competitor activity detected nearby.</p>
            ) : (
              <ul className="space-y-2">
                {retailer.competitorPresence.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{c.brand}</span>
                    <Badge tone={c.proximity === "same-street" ? "rose" : "amber"}>
                      {c.proximity === "same-street" ? "Same street" : "Nearby"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {observations.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Field observations
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {observations.map((o) => (
                    <li key={o.id}>
                      <b className="capitalize">{o.brand}</b> — {o.activity.replace(/-/g, " ")} · {fmtDateTime(o.at)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card title="Outlet details" pad={false}>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex items-center gap-3 px-5 py-3">
                <Store size={14} className="text-slate-400" />
                <span className="text-slate-500">Owner</span>
                <span className="ml-auto font-semibold text-slate-900">{retailer.owner}</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <Phone size={14} className="text-slate-400" />
                <span className="text-slate-500">Phone</span>
                <span className="ml-auto font-semibold text-slate-900">{retailer.phone}</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <User size={14} className="text-slate-400" />
                <span className="text-slate-500">Assigned rep</span>
                <Link href="/rep-management" className="ml-auto font-semibold text-blue-600 hover:underline">
                  {rep?.name ?? "—"}
                </Link>
              </div>
              <div className="flex items-center gap-3 px-5 py-3">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-slate-500">Registered</span>
                <span className="ml-auto font-semibold text-slate-900">
                  {new Date(retailer.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card title="Visit history" subtitle="GPS-verified field interactions">
            <div className="mb-3 flex gap-1">
              {(["timeline", "stock"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {t === "timeline" ? "Visit timeline" : "Shelf & stock"}
                </button>
              ))}
            </div>

            {tab === "timeline" ? (
              visits.length === 0 ? (
                <EmptyState title="No visits recorded" hint="Field visits will appear here once captured." />
              ) : (
                <ol className="space-y-3">
                  {visits.slice(0, 10).map((v) => {
                    const vm = visitStatusMeta[v.status];
                    return (
                      <li key={v.id} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                        <div className="flex flex-col items-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                            {v.gpsVerified ? "✓" : "•"}
                          </span>
                          <span className="mt-1 h-full w-px bg-slate-200" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-800">{fmtDateTime(v.at)}</span>
                            <Badge className={vm.bg}>{vm.label}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {v.durationMin} min · {v.gpsVerified ? `GPS verified (${v.radiusM}m)` : "not GPS verified"} · {v.photoCount} photos
                            {v.orderValue ? ` · order ${fmtKes(v.orderValue)}` : ""}
                          </p>
                          {v.items.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {v.items.slice(0, 4).map((it) => (
                                <span key={it.sku} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                                  {it.name} ×{it.qty} <span className={`font-bold ${it.shelf === "full" ? "text-emerald-600" : it.shelf === "low" ? "text-amber-600" : "text-rose-600"}`}>{it.shelf}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {v.notes && <p className="mt-1 text-xs italic text-slate-400">{v.notes}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )
            ) : shelfData.length === 0 ? (
              <EmptyState title="No stock data" hint="Shelf capture from field visits will appear here." />
            ) : (
              <div>
                <div className="mb-3 flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Full</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Low</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Out</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {shelfData.map((s) => {
                    const total = s.full + s.low + s.out;
                    return (
                      <div key={s.sku} className="rounded-lg border border-slate-100 p-3">
                        <p className="text-sm font-semibold text-slate-800">{s.sku}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="flex h-full">
                            <div className="bg-emerald-500" style={{ width: `${(s.full / total) * 100}%` }} />
                            <div className="bg-amber-400" style={{ width: `${(s.low / total) * 100}%` }} />
                            <div className="bg-rose-500" style={{ width: `${(s.out / total) * 100}%` }} />
                          </div>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          {s.full} full · {s.low} low · {s.out} out of {total} checks
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card title="Order pattern" subtitle="Recent order values from captured visits">
            {orderChart.length === 0 ? (
              <EmptyState title="No order data" hint="Orders captured in the field will appear here." />
            ) : (
              <div className="h-56 px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => fmtKes(Number(v))} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmtKes(Number(v)), "Order value"]} />
                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

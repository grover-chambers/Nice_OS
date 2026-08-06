"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { Activity, AlertTriangle, Store, TrendingUp } from "lucide-react";
import MapViewWrapper from "@/components/MapViewWrapper";
import { Card, StatCard, Badge, PageHeader, DemoBanner, Td, Th, Progress } from "@/components/ui";
import {
  getRetailers,
  getCompetitorObservations,
  getOpportunities,
  getVisits,
  getZoneCoverage,
  fmtKes,
  fmtDateTime,
  fmtNum,
} from "@/lib/data";
import { retailerStatusMeta, zoneColors } from "@/lib/status";
import type { Retailer } from "@/lib/data/types";

const HEALTH_COLORS = ["#16a34a", "#84cc16", "#f59e0b", "#dc2626"];

export default function AnalyticsPage() {
  const retailers = useMemo(() => getRetailers(), []);
  const opportunities = useMemo(() => getOpportunities(), []);
  const obs = useMemo(() => getCompetitorObservations(), []);
  const visits = useMemo(() => getVisits(), []);
  const zoneCoverage = useMemo(() => getZoneCoverage(), []);

  const active = retailers.filter((r) => r.status === "active" || r.status === "at-risk");
  const avgHealth = Math.round(
    retailers.reduce((s, r) => s + r.healthScore, 0) / Math.max(1, retailers.length)
  );
  const churned = retailers.filter((r) => r.status === "churned").length;
  const churnRate = Math.round((churned / retailers.length) * 100);
  const pipeline = opportunities
    .filter((o) => o.priority === "high")
    .reduce((s, o) => s + o.potentialMonthlyKes, 0);

  const healthDist = [
    { name: "Excellent", value: retailers.filter((r) => r.healthScore >= 80).length },
    { name: "Good", value: retailers.filter((r) => r.healthScore >= 60 && r.healthScore < 80).length },
    { name: "Fair", value: retailers.filter((r) => r.healthScore >= 40 && r.healthScore < 60).length },
    { name: "Poor", value: retailers.filter((r) => r.healthScore < 40).length },
  ];

  const byZone = zoneCoverage.map((z) => ({
    zone: z.zone,
    active: retailers.filter((r) => r.zone === z.zone && r.status === "active").length,
    prospect: retailers.filter((r) => r.zone === z.zone && r.status === "prospect").length,
    atRisk: retailers.filter((r) => r.zone === z.zone && (r.status === "at-risk" || r.status === "churned")).length,
  }));

  const compCount = (r: Retailer) => r.competitorPresence.length;
  const markerColor = (r: Retailer) =>
    compCount(r) === 0 ? "#94a3b8" : compCount(r) === 1 ? "#f59e0b" : compCount(r) === 2 ? "#ea580c" : "#dc2626";

  const shelfHealth = useMemo(() => {
    const acc: Record<string, { name: string; full: number; low: number; out: number }> = {};
    for (const v of visits) {
      for (const it of v.items) {
        const row = (acc[it.sku] ??= { name: it.name, full: 0, low: 0, out: 0 });
        if (it.shelf === "full") row.full++;
        if (it.shelf === "low") row.low++;
        if (it.shelf === "out") row.out++;
      }
    }
    return Object.values(acc).map((r) => {
      const total = r.full + r.low + r.out;
      return { ...r, availability: total ? Math.round((r.full / total) * 100) : 0 };
    });
  }, [visits]);

  return (
    <div>
      <PageHeader
        title="Market analytics"
        description="Retailer intelligence across coverage, health, churn and competition."
      />
      <DemoBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Avg health score" value={avgHealth} icon={<Activity size={16} />} tone="blue" />
        <StatCard label="Churn rate" value={`${churnRate}%`} sub={`${churned} churned`} icon={<AlertTriangle size={16} />} tone={churnRate > 10 ? "rose" : "amber"} />
        <StatCard label="Coverage" value={`${Math.round((active.length / retailers.length) * 100)}%`} sub={`${active.length} active outlets`} icon={<Store size={16} />} tone="emerald" />
        <StatCard label="High-priority pipeline" value={fmtKes(pipeline)} sub="monthly potential" icon={<TrendingUp size={16} />} tone="violet" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Health score distribution" pad={false}>
          <div className="h-60 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {healthDist.map((_, i) => (
                    <Cell key={i} fill={HEALTH_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Retailers by zone" subtitle="Status mix across sales territories" pad={false}>
          <div className="h-60 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="zone" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="active" name="Active" stackId="a" fill="#16a34a" />
                <Bar dataKey="prospect" name="Prospect" stackId="a" fill="#2563eb" />
                <Bar dataKey="atRisk" name="At risk / churned" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Competitor heatmap" subtitle="Competitor brand presence at outlets" className="xl:col-span-2" pad={false}>
          <MapViewWrapper
            wardMode="zone"
            retailers={retailers}
            retailerColor={markerColor}
            className="h-[400px] rounded-none border-0"
            overlay={
              <div className="pointer-events-auto absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-sm">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Competitor brands</div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" /> 0</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 1</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-orange-600" /> 2</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-rose-600" /> 3+</span>
                </div>
              </div>
            }
          />
        </Card>

        <Card title="Recent competitive activity" pad={false}>
          <ul className="max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
            {obs.slice(0, 18).map((o) => (
              <li key={o.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">{o.brand}</span>
                  <Badge tone={o.activity === "price-drop" || o.activity === "promo" ? "rose" : o.activity === "stockout" ? "amber" : "slate"}>
                    {o.activity.replace(/-/g, " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{o.note}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  <Link href={`/retailers/${o.retailerId}`} className="text-blue-600 hover:underline">
                    view outlet
                  </Link>{" "}
                  · {fmtDateTime(o.at)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Opportunity engine" subtitle="Prioritised revenue opportunities from the field" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Outlet</Th>
                  <Th>Type</Th>
                  <Th>Monthly potential</Th>
                  <Th>Priority</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.slice(0, 12).map((o) => {
                  const r = retailers.find((x) => x.id === o.retailerId);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <Td>
                        <Link href={`/retailers/${o.retailerId}`} className="font-semibold text-slate-800 hover:text-blue-600">
                          {r?.name ?? "—"}
                        </Link>
                        <p className="text-[11px] text-slate-400">{o.reason}</p>
                      </Td>
                      <Td className="capitalize">{o.type.replace(/-/g, " ")}</Td>
                      <Td className="font-semibold">{fmtKes(o.potentialMonthlyKes)}</Td>
                      <Td>
                        <Badge tone={o.priority === "high" ? "rose" : o.priority === "medium" ? "amber" : "slate"}>
                          {o.priority}
                        </Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Shelf availability by SKU" subtitle="Share of on-shelf checks captured in the field" pad={false}>
          <div className="space-y-4 px-5 py-4">
            {shelfHealth.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  <span className={`text-xs font-bold ${s.availability >= 60 ? "text-emerald-600" : s.availability >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                    {s.availability}% on-shelf
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full">
                    <div className="bg-emerald-500" style={{ width: `${(s.full / Math.max(1, s.full + s.low + s.out)) * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${(s.low / Math.max(1, s.full + s.low + s.out)) * 100}%` }} />
                    <div className="bg-rose-500" style={{ width: `${(s.out / Math.max(1, s.full + s.low + s.out)) * 100}%` }} />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {s.full} full · {s.low} low · {s.out} out
                </p>
              </div>
            ))}
            {shelfHealth.length === 0 && (
              <p className="text-xs text-slate-400">No shelf captures yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

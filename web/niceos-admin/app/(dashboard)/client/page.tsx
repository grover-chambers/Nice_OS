"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BadgeCheck, Building2, Package, ShieldCheck, TrendingUp } from "lucide-react";
import MapViewWrapper from "@/components/MapViewWrapper";
import { Card, StatCard, Badge, PageHeader, DemoBanner, Progress, Td, Th } from "@/components/ui";
import { getDashboardSummary, getRetailers, getCompetitorObservations, fmtKes, fmtNum } from "@/lib/data";

export default function ClientPage() {
  const d = useMemo(() => getDashboardSummary(), []);
  const retailers = useMemo(() => getRetailers(), []);
  const obs = useMemo(() => getCompetitorObservations(), []);

  const wardCounts = new Map<string, number>();
  for (const r of retailers) {
    if (r.status === "active" || r.status === "at-risk") {
      wardCounts.set(r.ward, (wardCounts.get(r.ward) ?? 0) + 1);
    }
  }

  const competitorTally = new Map<string, number>();
  for (const o of obs) competitorTally.set(o.brand, (competitorTally.get(o.brand) ?? 0) + 1);
  const competitors = Array.from(competitorTally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const trend = d.weeklyTrend.map((t) => ({ day: t.day, value: t.value }));

  return (
    <div>
      <PageHeader
        title="Nice Millers — Executive Overview"
        description="Report view for the Nice Limited CEO. Overview of coverage, orders and competitive landscape."
        actions={
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} /> CEO report view
          </span>
        }
      />
      <DemoBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Coverage"
          value={`${d.coveragePct}%`}
          sub={`${d.zoneCoverage.reduce((s, z) => s + z.wardsCovered, 0)} wards active`}
          icon={<BadgeCheck size={16} />}
          tone="emerald"
        />
        <StatCard
          label="Active outlets"
          value={fmtNum(d.totals.active)}
          sub={`${fmtNum(d.totals.retailers)} registered`}
          icon={<Building2 size={16} />}
          tone="blue"
        />
        <StatCard
          label="Orders (7d)"
          value={fmtNum(d.weeklyTrend.reduce((s, t) => s + t.orders, 0))}
          sub="week on week"
          icon={<Package size={16} />}
          tone="violet"
        />
        <StatCard
          label="Order value (7d)"
          value={fmtKes(d.weeklyTrend.reduce((s, t) => s + t.value, 0))}
          icon={<TrendingUp size={16} />}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Distribution coverage" className="xl:col-span-2" pad={false}>
          <MapViewWrapper
            wardMode="coverage"
            wardCounts={wardCounts}
            className="h-[380px] rounded-none border-0"
            overlay={
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm">
                <div className="mb-1 font-bold uppercase tracking-wide text-slate-500">Active outlets / ward</div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: "#EEF4EC" }} /> 0</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: "#C3E3C3" }} /> 3</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: "#8FCF8F" }} /> 6</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: "#4FAF4F" }} /> 10</span>
                  <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: "#1F7A2E" }} /> 15+</span>
                </div>
              </div>
            }
          />
        </Card>

        <Card title="Order value trend" subtitle="Last 7 days" pad={false}>
          <div className="h-[380px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmtKes(Number(v)), "Order value"]} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Competitive landscape" subtitle="Competitor activity observed in the field" pad={false}>
          <div className="px-5 py-4">
            {competitors.map(([brand, count], i) => (
              <div key={brand} className="mb-3">
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{brand}</span>
                  <span className="text-xs text-slate-500">{count} observations</span>
                </div>
                <Progress value={Math.max(8, (count / competitors[0][1]) * 100)} tone={i === 0 ? "rose" : i === 1 ? "amber" : "slate"} />
              </div>
            ))}
            {competitors.length === 0 && <p className="text-xs text-slate-400">No observations recorded.</p>}
          </div>
        </Card>

        <Card title="Coverage by zone" pad={false}>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Zone</Th>
                <Th>Wards</Th>
                <Th className="w-1/3">Coverage</Th>
                <Th>Active outlets</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.zoneCoverage.map((z) => (
                <tr key={z.zone} className="hover:bg-slate-50">
                  <Td className="font-semibold text-slate-800">
                    <Badge tone="slate">{z.zone}</Badge>
                  </Td>
                  <Td>{z.wardsCovered}/{z.wardsTotal}</Td>
                  <Td>
                    <Progress value={z.coveragePct} tone={z.coveragePct >= 60 ? "emerald" : "amber"} />
                  </Td>
                  <Td className="font-semibold">{z.active}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

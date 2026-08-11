"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import MapViewWrapper from "@/components/MapViewWrapper";
import { Card, StatCard, Badge, Progress, PageHeader, DemoBanner } from "@/components/ui";
import { getDashboardSummary, getRetailers, fmtKes, fmtNum } from "@/lib/data";
import { useRole } from "@/lib/role-context";

export default function DashboardPage() {
  const d = getDashboardSummary();
  const { role } = useRole();

  const retailerWardCounts = new Map<string, number>();
  for (const r of getRetailers()) {
    if (r.status === "active" || r.status === "at-risk") {
      retailerWardCounts.set(r.ward, (retailerWardCounts.get(r.ward) ?? 0) + 1);
    }
  }

  return (
    <div>
      <PageHeader
        title={role === "ceo" ? "Market Overview" : "Director Dashboard"}
        description={
          new Date().toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
        }
        actions={
          <Link
            href="/alerts"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <AlertTriangle size={14} />
            {d.alerts.filter((a) => !a.read).length} alerts
          </Link>
        }
      />
      <DemoBanner />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Retailers"
          value={fmtNum(d.totals.retailers)}
          sub={`${fmtNum(d.totals.active)} active`}
          icon={<Store size={16} />}
          tone="blue"
          href="/retailers"
        />
        <StatCard
          label="Coverage"
          value={`${d.coveragePct}%`}
          sub={`${d.zoneCoverage.reduce((s, z) => s + z.wardsCovered, 0)} wards covered`}
          icon={<MapPin size={16} />}
          tone="emerald"
          trend={{ dir: d.coveragePct >= 70 ? "up" : "down", text: "vs launch", good: true }}
          href="/territories?tab=map"
        />
        <StatCard
          label="Visits today"
          value={fmtNum(d.visitsToday)}
          sub={`${d.verificationRate}% GPS verified`}
          icon={<Activity size={16} />}
          tone="violet"
          href="/visits"
        />
        <StatCard
          label="Orders today"
          value={fmtNum(d.ordersToday)}
          sub={fmtKes(d.orderValueToday)}
          icon={<ShoppingCart size={16} />}
          tone="emerald"
          href="/routes"
        />
        <StatCard
          label="At risk / churned"
          value={fmtNum(d.totals.atRisk)}
          sub={`${fmtNum(d.totals.prospects)} prospects`}
          icon={<AlertTriangle size={16} />}
          tone="amber"
          href="/alerts"
        />
        <StatCard
          label="Field team"
          value={fmtNum(d.activeReps)}
          sub={`${d.onRouteNow} on route now`}
          icon={<Users size={16} />}
          tone="slate"
          href="/rep-management"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title="Territory coverage"
          subtitle="Active retail presence by ward"
          className="xl:col-span-2"
          pad={false}
        >
          <MapViewWrapper
            wardMode="coverage"
            wardCounts={retailerWardCounts}
            className="h-[380px]"
            overlay={
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-sm">
                <div className="mb-1 font-bold uppercase tracking-wide text-slate-500">
                  Active retailers / ward
                </div>
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

        <Card title="Rep leaderboard" subtitle="Weekly activity by sales value" pad={false}>
          <ul className="divide-y divide-slate-100">
            {d.repLeaderboard.map((rep, i) => (
              <li key={rep.repId} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {i + 1}
                </span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: rep.color }}
                >
                  {rep.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">{rep.name}</span>
                    <span className="text-sm font-bold text-slate-900">{fmtKes(rep.value)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{rep.visits} visits</span>
                    <span>·</span>
                    <span>{rep.orders} orders</span>
                    <span>·</span>
                    <span>{rep.coveragePct}% coverage</span>
                  </div>
                  <Progress value={rep.coveragePct} tone={rep.coveragePct >= 60 ? "emerald" : "amber"} className="mt-1.5" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Weekly activity" subtitle="Visits and orders over the last 7 days" className="xl:col-span-2" pad={false}>
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.weeklyTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="visits" name="Visits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Executive alerts" subtitle="Latest flags from the field" pad={false}>
          <ul className="divide-y divide-slate-100">
            {d.alerts.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    a.severity === "critical" ? "bg-rose-500" : a.severity === "warning" ? "bg-amber-500" : "bg-blue-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{a.message}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 px-5 py-3">
            <Link href="/alerts" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
              View all alerts <ArrowRight size={12} />
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Coverage by zone" pad={false}>
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {d.zoneCoverage.map((z) => (
                <tr key={z.zone}>
                  <td className="px-5 py-2.5">
                    <Badge tone="slate">{z.zone}</Badge>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-slate-500">
                    {z.wardsCovered}/{z.wardsTotal} wards
                  </td>
                  <td className="w-1/3 px-2 py-2.5">
                    <Progress value={z.coveragePct} tone={z.coveragePct >= 60 ? "emerald" : "amber"} />
                  </td>
                  <td className="px-5 py-2.5 text-right text-sm font-semibold text-slate-700">
                    {z.coveragePct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Retailer health distribution" subtitle="Health score across the base" pad={false}>
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.healthDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" name="Retailers" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


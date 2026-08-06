"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Navigation, PhoneCall, Wifi, Clock } from "lucide-react";
import { Card, Badge, PageHeader, DemoBanner, Progress, Segmented } from "@/components/ui";
import { getRepManagement, fmtKes, fmtNum } from "@/lib/data";
import { toaster } from "@/components/toast";
import type { WardZone } from "@/lib/data/types";

export default function RepManagementPage() {
  const rows = useMemo(() => getRepManagement(), []);
  const [zone, setZone] = useState<WardZone | "all">("all");

  const visible = rows.filter((r) => zone === "all" || r.rep.zone === zone);

  const chart = visible.map((r) => ({
    name: r.rep.name.split(" ")[0],
    target: r.targetThisWeek,
    actual: r.visitsThisWeek,
  }));

  return (
    <div>
      <PageHeader
        title="Rep & territory management"
        description="Monthly targets versus actual field activity per sales rep."
      />
      <DemoBanner />

      <div className="mb-4 flex items-center gap-2">
        <Segmented
          options={[
            { value: "all", label: "All zones" },
            ...(["Western", "Central", "Northern", "Eastern", "South-Eastern", "Southern"] as WardZone[]).map((z) => ({
              value: z,
              label: z,
            })),
          ]}
          value={zone}
          onChange={(v) => setZone(v as WardZone | "all")}
        />
      </div>

      <Card title="Target vs actual visits (this week)" pad={false}>
        <div className="h-56 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visible.map((r) => {
          const rep = r.rep;
          const onTarget = r.onTargetPct >= 80;
          return (
            <Card key={rep.id} pad={false}>
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: rep.color }}
                >
                  {rep.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{rep.name}</h3>
                    <Badge tone="slate">{rep.zone} Zone</Badge>
                    <Badge tone={rep.onRoute ? "emerald" : "slate"}>
                      {rep.onRoute ? "On route" : "Stationary"}
                    </Badge>
                    <Badge tone={rep.status === "active" ? "emerald" : rep.status === "on-leave" ? "amber" : "rose"}>
                      {rep.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {rep.phone} · {rep.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${onTarget ? "text-emerald-600" : "text-amber-600"}`}>
                    {r.onTargetPct}%
                  </p>
                  <p className="text-[11px] text-slate-400">of target</p>
                </div>
              </div>

              <div className="space-y-3 px-5 py-4 text-sm">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">Monthly target vs actual</span>
                    <span className="font-semibold text-slate-700">
                      {fmtNum(r.actualVisitsMonth)} / {fmtNum(r.targetVisitsMonth)} visits
                    </span>
                  </div>
                  <Progress value={r.onTargetPct} tone={onTarget ? "emerald" : "amber"} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "This week", value: `${r.visitsThisWeek}/${r.targetThisWeek}` },
                    { label: "Orders", value: fmtNum(r.ordersPlaced) },
                    { label: "Order value", value: fmtKes(r.orderValue) },
                    { label: "Attendance", value: `${r.attendancePct}%` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Navigation size={12} className="text-blue-500" /> Ward coverage {r.coverageWards}/{r.assignedWards}</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> Last sync {r.lastSyncAgoMin} min ago</span>
                  <span className="flex items-center gap-1"><Wifi size={12} className="text-slate-400" /> {rep.device}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  onClick={() => toaster.success("Call initiated — " + rep.phone)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <PhoneCall size={13} /> Call
                </button>
                <button
                  onClick={() => toaster.success("Route view opened for " + rep.name)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  View routes
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

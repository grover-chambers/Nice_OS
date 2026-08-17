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
import { Award } from "lucide-react";
import { Card, Badge, PageHeader, Segmented, Td, Th, Progress, tableWrap } from "@/components/ui";
import { fmtKes, fmtNum } from "@/lib/data/shared";
import type { WardZone } from "@/lib/data/types";
import type { RepManagementRow } from "@/lib/data/shared";

export default function RepPerformance({ rows }: { rows: RepManagementRow[] }) {
  const [zone, setZone] = useState<WardZone | "all">("all");

  const visible = rows
    .filter((r) => zone === "all" || r.rep.zone === zone)
    .sort((a, b) => b.onTargetPct - a.onTargetPct);

  const chart = visible.map((r) => ({
    name: r.rep.name.split(" ")[0],
    target: r.targetThisWeek,
    actual: r.visitsThisWeek,
  }));

  const rank = (i: number) =>
    i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-slate-50 text-slate-400";

  return (
    <div>
      <PageHeader
        title="Rep performance"
        description="Leaderboard and target-vs-actual activity across the field team."
      />
      

      <div className="mb-4 flex items-center gap-2">
        <Segmented
          options={[
            { value: "all", label: "All zones" },
            ...(["Kiambu", "Central", "Northern", "Eastern", "South-Eastern", "Kajiado"] as WardZone[]).map((z) => ({
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

      <div className="mt-4">
        {tableWrap(
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>#</Th>
                <Th>Rep</Th>
                <Th>Zone</Th>
                <Th>Target (month)</Th>
                <Th>Actual (month)</Th>
                <Th>This week</Th>
                <Th>Orders</Th>
                <Th>Order value</Th>
                <Th>Coverage</Th>
                <Th>On target</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((r, i) => (
                <tr key={r.rep.id} className="hover:bg-slate-50/60">
                  <Td>
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${rank(i)}`}>
                      {i === 0 ? <Award size={13} /> : i + 1}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: r.rep.color }}
                      >
                        {r.rep.name.split(" ").map((p) => p[0]).join("")}
                      </span>
                      <span className="font-medium text-slate-900">{r.rep.name}</span>
                    </div>
                  </Td>
                  <Td><Badge tone="slate">{r.rep.zone}</Badge></Td>
                  <Td>{fmtNum(r.targetVisitsMonth)}</Td>
                  <Td className="font-semibold text-slate-800">{fmtNum(r.actualVisitsMonth)}</Td>
                  <Td>{r.visitsThisWeek}/{r.targetThisWeek}</Td>
                  <Td>{fmtNum(r.ordersPlaced)}</Td>
                  <Td>{fmtKes(r.orderValue)}</Td>
                  <Td>{r.coverageWards}/{r.assignedWards}</Td>
                  <Td>
                    <div className="w-28">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{r.onTargetPct}%</span>
                      </div>
                      <Progress value={r.onTargetPct} tone={r.onTargetPct >= 80 ? "emerald" : "amber"} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

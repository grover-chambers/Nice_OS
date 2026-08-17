"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Card, Badge, EmptyState, Td, Th } from "@/components/ui";
import { dateString, todayString, fmtNum } from "@/lib/data/shared";
import { routeStatusMeta } from "@/lib/status";
import { toaster } from "@/components/toast";
import type { Route, Rep, RouteStatus } from "@/lib/data/types";

type Scope = "all" | "today" | "tomorrow" | "past";

async function api(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}

export default function RoutePlanning({
  routes: allRoutes,
  reps,
  today,
}: {
  routes: Route[];
  reps: Rep[];
  today: string;
}) {
  const router = useRouter();

  const [scope, setScope] = useState<Scope>("today");
  const [status, setStatus] = useState<RouteStatus | "all">("all");
  const [repId, setRepId] = useState<string>("all");
  const [regen, setRegen] = useState(0);

  const rows = useMemo(() => {
    const tomorrow = dateString(1);
    let out = allRoutes;
    if (scope === "today") out = out.filter((r) => r.date === today);
    if (scope === "tomorrow") out = out.filter((r) => r.date === tomorrow);
    if (scope === "past") out = out.filter((r) => r.date < today);
    if (status !== "all") out = out.filter((r) => r.status === status);
    if (repId !== "all") out = out.filter((r) => r.repId === repId);
    return out.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, status, repId, regen, allRoutes, today]);

  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "—";

  const counts = useMemo(() => {
    const todayRoutes = allRoutes.filter((r) => r.date === today);
    return {
      today: todayRoutes.length,
      inProgress: todayRoutes.filter((r) => r.status === "in-progress").length,
      awaiting: allRoutes.filter((r) => r.status === "submitted").length,
      stops: todayRoutes.reduce((s, r) => s + r.stops.length, 0),
    };
  }, [allRoutes, today]);

  const generate = async () => {
    const without = reps.filter(
      (r) => !allRoutes.some((rt) => rt.repId === r.id && rt.date === today)
    );
    const target = without[0] ?? reps[0];
    if (!target) return;
    try {
      const data = await api("/api/routes/draft", { repId: target.id, date: today });
      toaster.success(`Draft route created for ${target.name}`);
      setRegen((n) => n + 1);
      router.push(`/routes/${data.id}`);
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Failed to create route");
    }
  };

  const approve = async (id: string) => {
    try {
      await api("/api/routes/status", { id, status: "approved" });
      setRegen((n) => n + 1);
      toaster.success("Route approved");
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Failed to approve route");
    }
  };

  const summary = [
    { label: "Routes today", value: counts.today },
    { label: "In progress now", value: counts.inProgress },
    { label: "Awaiting approval", value: counts.awaiting },
    { label: "Stops planned today", value: fmtNum(counts.stops) },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          System-generated, manager-reviewed, rep-executed.
        </p>
        <button
          onClick={generate}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <Sparkles size={14} /> Generate draft route
        </button>
      </div>
      

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            {(["today", "tomorrow", "past", "all"] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${scope === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RouteStatus | "all")}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
          >
            <option value="all">All statuses</option>
            {Object.entries(routeStatusMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-900"
          >
            <option value="all">All reps</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400">{rows.length} routes</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No routes for this selection" hint="Use 'Generate draft route' to plan one." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Rep</Th>
                  <Th>Zone</Th>
                  <Th>Stops</Th>
                  <Th>Distance</Th>
                  <Th>Window</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const rm = routeStatusMeta[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <Td className="whitespace-nowrap font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-slate-400" />
                          {new Date(r.date + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}
                          {r.date === today && <Badge tone="blue">Today</Badge>}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-slate-700">{repName(r.repId)}</span>
                      </Td>
                      <Td><Badge tone="slate">{r.zone}</Badge></Td>
                      <Td>{r.stops.length}</Td>
                      <Td>{r.totalKm} km</Td>
                      <Td className="whitespace-nowrap text-xs">{r.startTime} – {r.endTime}</Td>
                      <Td><Badge className={rm.bg}>{rm.label}</Badge></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "submitted" && (
                            <button
                              onClick={() => approve(r.id)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            href={`/routes/${r.id}`}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {r.status === "submitted" ? "Review" : "Open"} <ArrowRight size={12} />
                          </Link>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

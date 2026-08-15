"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Gauge,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  ExternalLink,
} from "lucide-react";
import MapViewWrapper from "@/components/MapViewWrapper";
import { Card, Badge, PageHeader, EmptyState, Progress } from "@/components/ui";
import { fmtNum } from "@/lib/data/mock";
import { routeStatusMeta } from "@/lib/status";
import { toaster } from "@/components/toast";
import type { Route, Retailer, Rep, RouteStop } from "@/lib/data/types";

async function api(path: string, body: unknown, method = "POST") {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}

export default function RoutePlannerView({
  route,
  retailers,
  rep,
}: {
  route: Route | null;
  retailers: Retailer[];
  rep?: Rep;
}) {
  const router = useRouter();

  const [stops, setStops] = useState<RouteStop[]>(() => route?.stops ?? []);
  const [dirty, setDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addId, setAddId] = useState("");

  const retById = useMemo(() => new Map(retailers.map((r) => [r.id, r])), [retailers]);

  if (!route) {
    return (
      <div>
        <Link href="/routes" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={13} /> Back to routes
        </Link>
        <EmptyState title="Route not found" />
      </div>
    );
  }

  const rm = routeStatusMeta[route.status];

  const stats = useMemo(() => {
    const km = stops.reduce((s, st) => s + st.kmFromPrev, 0);
    const travel = stops.reduce((s, st) => s + st.minutesFromPrev, 0);
    return { km: Math.round(km), travel, count: stops.length };
  }, [stops]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...stops];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    next.forEach((s, i) => (s.order = i + 1));
    setStops(next);
    setDirty(true);
  };

  const remove = (idx: number) => {
    const next = stops.filter((_, i) => i !== idx);
    next.forEach((s, i) => (s.order = i + 1));
    setStops(next);
    setDirty(true);
  };

  const setVisitType = (idx: number, type: RouteStop["visitType"]) => {
    const next = [...stops];
    next[idx].visitType = type;
    setStops(next);
    setDirty(true);
  };

  const addStop = () => {
    const ret = retById.get(addId);
    if (!ret) return;
    const last = stops[stops.length - 1];
    const lastRet = last ? retById.get(last.retailerId) : undefined;
    const km = lastRet ? Math.round(haversine(lastRet, ret) * 1.3 * 10) / 10 : 2;
    const min = Math.max(5, Math.round(km * 2.4));
    const startHm = shiftTime(last?.plannedEnd ?? route.startTime, min);
    const stop: RouteStop = {
      retailerId: ret.id,
      order: stops.length + 1,
      plannedStart: startHm,
      plannedEnd: shiftTime(startHm, 26),
      visitType: ret.status === "prospect" ? "prospecting" : "retail",
      kmFromPrev: km,
      minutesFromPrev: min,
    };
    setStops([...stops, stop]);
    setAddId("");
    setAddOpen(false);
    setDirty(true);
  };

  const save = async () => {
    try {
      await api("/api/routes/stops", { id: route.id, stops }, "PUT");
      setDirty(false);
      toaster.success("Route saved");
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Failed to save route");
    }
  };

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toaster.success(msg);
      router.refresh();
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const exportRoute = () => {
    if (stops.length === 0) return;
    const coords = stops.map((s) => retById.get(s.retailerId)).filter(Boolean);
    const first = coords[0];
    const last = coords[coords.length - 1];
    const way = coords.slice(1, -1).map((p) => `${p!.lat},${p!.lng}`).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${first!.lat},${first!.lng}&destination=${last!.lat},${last!.lng}${
      way ? `&waypoints=${way}` : ""
    }`;
    window.open(url, "_blank");
  };

  const del = async () => {
    try {
      await api("/api/routes/delete", { id: route.id });
      toaster.success("Route deleted");
      router.push("/routes");
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Failed to delete route");
    }
  };

  const routeLine: [number, number][] = stops
    .map((s) => retById.get(s.retailerId))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => [r.lng, r.lat]);

  const addCandidates = retailers.filter(
    (r) =>
      r.zone === route.zone &&
      r.status !== "churned" &&
      !stops.some((s) => s.retailerId === r.id)
  );

  const isReviewable = route.status === "submitted" || route.status === "needs-revision";

  return (
    <div>
      <Link href="/routes" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={13} /> Back to routes
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {new Date(route.date + "T00:00:00").toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}
            <Badge className={rm.bg}>{rm.label}</Badge>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
            <span className="flex items-center gap-1"><CalendarDays size={13} /> {route.date}</span>
            <span>Rep: <b className="text-slate-700">{rep?.name ?? "—"}</b></span>
            <span>{route.zone} Zone</span>
            <span>Created by {route.createdBy}</span>
            {route.revisedReason && <span className="text-amber-600">Revision: {route.revisedReason}</span>}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => act(() => api("/api/routes/optimize", { id: route.id }), "Route optimised — stops re-sequenced for the shortest path")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Sparkles size={14} /> Optimize
            </button>
            {route.status === "draft" && (
              <button
                onClick={() => act(() => api("/api/routes/status", { id: route.id, status: "submitted" }), "Submitted for approval")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Submit
              </button>
            )}
            {(route.status === "approved" || isReviewable) && (
              <button
                onClick={() => act(() => api("/api/routes/status", { id: route.id, status: "approved" }), "Route approved")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Approve
              </button>
            )}
            {isReviewable && (
              <button
                onClick={async () => {
                  const reason = window.prompt("Reason for revision:");
                  if (reason) await act(() => api("/api/routes/status", { id: route.id, status: "needs-revision", reason }), "Revision requested");
                }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
              >
                Request changes
              </button>
            )}
            <button
              onClick={exportRoute}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={13} /> Export route
            </button>
            {route.status === "draft" && (
              <button onClick={del} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Stops", value: stats.count },
          { label: "Total distance", value: `${stats.km} km` },
          { label: "Travel time", value: `${Math.round(stats.travel / 60)}h ${stats.travel % 60}m` },
          { label: "Window", value: `${route.startTime} – ${route.endTime}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card
          title="Route stops"
          subtitle="Reorder, add or remove stops — map updates live"
          className="xl:col-span-2"
          actions={
            dirty ? (
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <Save size={13} /> Save changes
              </button>
            ) : undefined
          }
          pad={false}
        >
          {stops.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No stops yet" hint="Add a stop from the panel below." />
            </div>
          ) : (
            <ol className="divide-y divide-slate-100">
              {stops.map((stop, i) => {
                const ret = retById.get(stop.retailerId);
                return (
                  <li key={stop.retailerId} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                        {stop.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/retailers/${stop.retailerId}`}
                            className="truncate text-sm font-semibold text-slate-800 hover:text-blue-600"
                          >
                            {ret?.name ?? "Outlet"}
                          </Link>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
                            <button onClick={() => move(i, 1)} disabled={i === stops.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
                            <button onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                          <MapPin size={11} /> {ret?.ward}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{stop.plannedStart} – {stop.plannedEnd}</span>
                          {stop.order > 1 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="flex items-center gap-0.5"><Gauge size={11} /> {stop.kmFromPrev} km · {stop.minutesFromPrev} min</span>
                            </>
                          )}
                          <select
                            value={stop.visitType}
                            onChange={(e) => setVisitType(i, e.target.value as RouteStop["visitType"])}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium capitalize text-slate-600 outline-none"
                          >
                            {["retail", "order-collection", "stock-check", "prospecting", "complaint-resolution"].map((t) => (
                              <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="border-t border-slate-100 p-3">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
            >
              <span className="flex items-center gap-1.5"><Plus size={14} /> Add stop</span>
              <ChevronDown size={14} className={addOpen ? "rotate-180" : ""} />
            </button>
            {addOpen && (
              <div className="mt-2 flex gap-2">
                <select
                  value={addId}
                  onChange={(e) => setAddId(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-slate-900"
                >
                  <option value="">Select outlet…</option>
                  {addCandidates.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} — {r.ward}</option>
                  ))}
                </select>
                <button
                  onClick={addStop}
                  disabled={!addId}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Route map" subtitle="Sequenced route across the territory" className="xl:col-span-3" pad={false}>
          <MapViewWrapper
            wardMode="zone"
            retailers={stops.map((s) => retById.get(s.retailerId)).filter((r): r is NonNullable<typeof r> => Boolean(r))}
            retailerColor={(r) => "#2563eb"}
            route={{ id: route.id, line: routeLine, stops: stops.map((s, i) => {
              const ret = retById.get(s.retailerId);
              return { lat: ret?.lat ?? -1.29, lng: ret?.lng ?? 36.82, label: String(i + 1) };
            }) }}
            className="h-[520px] rounded-none border-0"
          />
        </Card>
      </div>

      {route.status === "approved" || route.status === "in-progress" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Route progress</p>
              <p className="text-xs text-slate-500">Verified check-ins against planned stops</p>
            </div>
            <Progress value={Math.min(100, (Math.round(stops.length / (stops.length + 2)) * 100))} className="w-40" tone="blue" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function shiftTime(t: string, minutes: number) {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

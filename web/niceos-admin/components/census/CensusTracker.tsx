"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Target,
  Users,
  CalendarDays,
  Route as RouteIcon,
  MapPin,
  FilePlus2,
  XCircle,
  Navigation,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, PageHeader, Progress, StatCard, Th, Td, tableWrap, DemoBanner } from "@/components/ui";
import { zoneColor } from "@/lib/status";
import {
  CENSUS_DAYS,
  CENSUS_OFFICERS,
  CENSUS_PACE_MIN,
  CENSUS_PACE_MAX,
  CENSUS_ROUTES,
  CENSUS_TOTAL_SHOPS,
} from "@/lib/data/census";
import type { CensusRoute, CensusArea } from "@/lib/data/census";

// Demo progress state — deterministic per area so numbers stay stable.
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DEMO_DAY = 12; // day 12 of 25 for the demo snapshot

type AreaProgress = {
  visited: number;
  newRegistered: number;
  closed: number;
  gps: string;
  issues: string[];
};

function progressFor(area: CensusArea): AreaProgress {
  const r = hashStr(area.name + area.zone) / 4294967295;
  const progress = 0.22 + r * 0.62; // between 22% and 84% done
  const visited = Math.round(area.shops * progress);
  const newRegistered = Math.round(visited * (0.14 + r * 0.18));
  const closed = Math.round(visited * (0.04 + r * 0.08));
  const issues: string[] = [];
  if (r > 0.72) issues.push("Locked out — revisit requested");
  if (r > 0.88) issues.push("2 closed permanently");
  return {
    visited,
    newRegistered,
    closed,
    gps: r > 0.5 ? "GPS captured" : "GPS pending",
    issues,
  };
}

const routeProgress = (route: CensusRoute) =>
  route.areas.reduce(
    (acc, a) => {
      const p = progressFor(a);
      acc.visited += p.visited;
      acc.newRegistered += p.newRegistered;
      acc.closed += p.closed;
      acc.target += a.shops;
      return acc;
    },
    { visited: 0, newRegistered: 0, closed: 0, target: 0 }
  );

const DEMO_TOTAL = CENSUS_ROUTES.reduce(
  (acc, r) => {
    const p = routeProgress(r);
    acc.visited += p.visited;
    acc.newRegistered += p.newRegistered;
    acc.closed += p.closed;
    acc.target += p.target;
    return acc;
  },
  { visited: 0, newRegistered: 0, closed: 0, target: 0 }
);

const PACE_PER_OFFICER = Math.round(
  DEMO_TOTAL.visited / Math.max(1, DEMO_DAY) / CENSUS_OFFICERS
);

export default function CensusTracker() {
  const [routeFilter, setRouteFilter] = useState<number | "all">("all");
  const [day, setDay] = useState(DEMO_DAY);

  const dayFactor = day / DEMO_DAY;
  const totalVisited = Math.round(DEMO_TOTAL.visited * dayFactor);
  const totalRegistered = Math.round(DEMO_TOTAL.newRegistered * dayFactor);
  const totalClosed = Math.round(DEMO_TOTAL.closed * dayFactor);
  const dayTarget = CENSUS_OFFICERS * CENSUS_PACE_MIN;
  const dayMax = CENSUS_OFFICERS * CENSUS_PACE_MAX;
  const completionPct = (totalVisited / CENSUS_TOTAL_SHOPS) * 100;

  const visibleRoutes = routeFilter === "all" ? CENSUS_ROUTES : CENSUS_ROUTES.filter((r) => r.id === routeFilter);

  return (
    <div>
      <PageHeader
        title="Census Tracker"
        description="Nairobi Metropolitan Shops Census — 25-day field drive · 8 officers · 4 groups × 2. Output template: Route | Area | Shops Visited | New Registered | Closed | GPS/Notes | Issues."
        actions={
          <Badge tone="emerald">
            Day {day} of {CENSUS_DAYS}
          </Badge>
        }
      />
      <DemoBanner />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Shops visited"
          value={totalVisited.toLocaleString()}
          sub={`of ${CENSUS_TOTAL_SHOPS.toLocaleString()} target shops`}
          icon={<ClipboardList size={16} />}
          tone="emerald"
          href="/census?tab=map"
        />
        <StatCard
          label="Completion"
          value={`${completionPct.toFixed(0)}%`}
          sub={`by day ${day} of ${CENSUS_DAYS}`}
          icon={<Target size={16} />}
          tone="blue"
          href="/census?tab=map"
        />
        <StatCard
          label="New registered"
          value={`+${totalRegistered.toLocaleString()}`}
          sub={`${totalClosed.toLocaleString()} closed / churned`}
          icon={<FilePlus2 size={16} />}
          tone="violet"
          href="/retailers"
        />
        <StatCard
          label="Pace per officer"
          value={`${PACE_PER_OFFICER}/day`}
          sub={`target ${CENSUS_PACE_MIN}–${CENSUS_PACE_MAX} shops/person/day`}
          icon={<Users size={16} />}
          tone="amber"
          href="/rep-management"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Overall progress</span>
            <span className="text-slate-500">{completionPct.toFixed(0)}%</span>
          </div>
          <Progress value={completionPct} tone={completionPct >= 60 ? "emerald" : "amber"} />
          <p className="mt-2 text-xs text-slate-500">
            Target completion by day 25: {CENSUS_TOTAL_SHOPS.toLocaleString()} shops total.
          </p>
        </div>
        {CENSUS_ROUTES.map((r) => {
          const p = routeProgress(r);
          const pct = (p.visited / Math.max(1, p.target)) * 100;
          return (
            <button
              key={r.id}
              onClick={() => setRouteFilter(routeFilter === r.id ? "all" : r.id)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-sm transition-colors",
                routeFilter === r.id ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <RouteIcon size={13} /> {r.name}
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: zoneColor(r.zone) }} />
              </div>
              <div className="mb-1.5 text-lg font-bold text-slate-900">
                {p.visited.toLocaleString()}
                <span className="text-xs font-medium text-slate-400"> / {p.target}</span>
              </div>
              <Progress value={pct} tone={pct >= 60 ? "emerald" : "amber"} />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {r.areas.length} areas · {r.officers} officers
              </p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Simulate day
        </span>
        <input
          type="range"
          min={1}
          max={CENSUS_DAYS}
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="w-48 accent-emerald-700"
        />
        <span className="text-xs font-semibold text-slate-700">{day}</span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
          <AlertTriangle size={12} className="text-amber-600" />
          Day target {dayTarget}–{dayMax} shops across {CENSUS_OFFICERS} officers
        </div>
      </div>

      {visibleRoutes.map((r) => {
        const p = routeProgress(r);
        const pct = (p.visited / Math.max(1, p.target)) * 100;
        return (
          <div key={r.id} className="mb-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <RouteIcon size={15} style={{ color: zoneColor(r.zone) }} />
                {r.name}
              </h3>
              <Badge tone="slate">{r.areas.length} areas</Badge>
              <Badge tone="emerald">{pct.toFixed(0)}% visited</Badge>
              <span className="ml-auto text-xs text-slate-500">
                {p.visited.toLocaleString()} / {p.target.toLocaleString()} · +{p.newRegistered} new · {p.closed} closed
              </span>
            </div>
            {tableWrap(
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Area</Th>
                    <Th>Target</Th>
                    <Th>Visited</Th>
                    <Th>New registered</Th>
                    <Th>Closed</Th>
                    <Th>GPS / Notes</Th>
                    <Th>Issues</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.areas.map((a) => {
                    const pr = progressFor(a);
                    return (
                      <tr key={a.name} className="hover:bg-slate-50/60">
                        <Td>
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <MapPin size={13} style={{ color: zoneColor(a.zone) }} />
                            {a.name}
                          </div>
                        </Td>
                        <Td>{a.shops}</Td>
                        <Td>
                          <span className="font-semibold text-emerald-700">{pr.visited}</span>
                          <span className="ml-1 text-xs text-slate-400">
                            ({Math.round((pr.visited / a.shops) * 100)}%)
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-violet-700">
                            <FilePlus2 size={13} /> {pr.newRegistered}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <XCircle size={13} /> {pr.closed}
                          </span>
                        </Td>
                        <Td className="text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Navigation size={11} /> {pr.gps}
                          </span>
                        </Td>
                        <Td className="text-xs">
                          {pr.issues.length > 0 ? (
                            <div className="space-y-1">
                              {pr.issues.map((i, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700"
                                >
                                  <AlertTriangle size={11} /> {i}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <CalendarDays size={13} /> Timeline
          </div>
          <p className="mt-2 text-sm text-slate-700">
            25 working days · day {day} snapshot
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Users size={13} /> Field team
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {CENSUS_OFFICERS} officers · 4 groups × 2
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Target size={13} /> Daily pace
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {CENSUS_PACE_MIN}–{CENSUS_PACE_MAX} shops / person / day
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <RouteIcon size={13} /> Coverage
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {CENSUS_ROUTES.length} routes · Central, Northern, Eastern, Kajiado/Kiambu
          </p>
        </div>
      </div>
    </div>
  );
}

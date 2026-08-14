"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Target,
  Users,
  Route as RouteIcon,
  MapPin,
  FilePlus2,
  Navigation,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, PageHeader, Progress, StatCard, Th, Td, tableWrap } from "@/components/ui";
import { zoneColor } from "@/lib/status";
import type { CensusSummary, CensusWard } from "@/lib/data";

export default function CensusTracker({ data }: { data: CensusSummary }) {
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [wardQuery, setWardQuery] = useState("");

  const gpsPct = data.totalOutlets
    ? Math.round((data.gpsCaptured / data.totalOutlets) * 100)
    : 0;

  const visibleZones =
    zoneFilter === "all"
      ? data.byZone
      : data.byZone.filter((z) => z.zone === zoneFilter);

  const visibleWards = useMemo(() => {
    let wards = data.byWard;
    if (zoneFilter !== "all") {
      wards = wards.filter((w) => w.zone === zoneFilter);
    }
    const q = wardQuery.trim().toLowerCase();
    if (q) wards = wards.filter((w) => w.ward.toLowerCase().includes(q));
    return wards;
  }, [data.byWard, zoneFilter, wardQuery]);

  const lastSeen = data.lastCaptureAt
    ? new Date(data.lastCaptureAt).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No captures yet";

  return (
    <div>
      <PageHeader
        title="Census Tracker"
        description="Live census capture from the field app — outlets, GPS coverage and consumer intercepts synced from reps in real time."
        actions={
          <Badge tone="emerald">
            {data.totalOutlets.toLocaleString()} outlets captured
          </Badge>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Outlets captured"
          value={data.totalOutlets.toLocaleString()}
          sub={`${data.newRegistered.toLocaleString()} new registered`}
          icon={<ClipboardList size={16} />}
          tone="emerald"
          href="/retailers"
        />
        <StatCard
          label="GPS coverage"
          value={`${gpsPct}%`}
          sub={`${data.gpsCaptured.toLocaleString()} with coordinates`}
          icon={<Navigation size={16} />}
          tone="blue"
        />
        <StatCard
          label="Consumer intercepts"
          value={data.intercepts.toLocaleString()}
          sub="anonymised survey responses"
          icon={<MessagesSquare size={16} />}
          tone="violet"
        />
        <StatCard
          label="Field officers"
          value={data.officers.toLocaleString()}
          sub={`Last capture: ${lastSeen}`}
          icon={<Users size={16} />}
          tone="amber"
          href="/rep-management"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.byZone.map((z) => {
          const pct = (z.outlets / Math.max(1, z.outlets + z.intercepts)) * 100;
          return (
            <button
              key={z.zone}
              onClick={() =>
                setZoneFilter(zoneFilter === z.zone ? "all" : z.zone)
              }
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-sm transition-colors",
                zoneFilter === z.zone
                  ? "border-emerald-600 ring-2 ring-emerald-100"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <RouteIcon size={13} /> {z.zone}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: zoneColor(z.zone) }}
                />
              </div>
              <div className="mb-1.5 text-lg font-bold text-slate-900">
                {z.outlets.toLocaleString()}
                <span className="text-xs font-medium text-slate-400">
                  {" "}
                  outlets
                </span>
              </div>
              <Progress value={pct} tone="emerald" />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {z.intercepts} intercepts · {z.officers} officers ·{" "}
                {z.gpsCaptured} GPS
              </p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Filter by ward…"
          value={wardQuery}
          onChange={(e) => setWardQuery(e.target.value)}
          className="w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
        />
        <span className="ml-auto text-xs text-slate-500">
          {visibleWards.length} wards with capture data
        </span>
      </div>

      {visibleZones.map((z) => {
        const pct = (z.outlets / Math.max(1, z.outlets + z.intercepts)) * 100;
        return (
          <div key={z.zone} className="mb-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <RouteIcon size={15} style={{ color: zoneColor(z.zone) }} />
                {z.zone}
              </h3>
              <Badge tone="emerald">{z.outlets} outlets</Badge>
              <Badge tone="violet">{z.intercepts} intercepts</Badge>
              <span className="ml-auto text-xs text-slate-500">
                {Math.round(pct)}% capture share
              </span>
            </div>
            {tableWrap(
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Ward</Th>
                    <Th>Outlets</Th>
                    <Th>GPS captured</Th>
                    <Th>Intercepts</Th>
                    <Th>Zone</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleWards
                    .filter((w) => w.zone === z.zone)
                    .map((w) => (
                      <tr key={w.ward} className="hover:bg-slate-50/60">
                        <Td>
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <MapPin
                              size={13}
                              style={{ color: zoneColor(w.zone) }}
                            />
                            {w.ward}
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold text-emerald-700">
                            {w.outlets}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Navigation size={11} /> {w.gpsCaptured}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1 text-violet-700">
                            <MessagesSquare size={13} /> {w.intercepts}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className="inline-flex items-center gap-1 text-xs"
                            style={{ color: zoneColor(w.zone) }}
                          >
                            <FilePlus2 size={11} /> {w.zone}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  {visibleWards.filter((w) => w.zone === z.zone).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                        No capture data for this zone yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { CensusWard };
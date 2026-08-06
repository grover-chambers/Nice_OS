"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, RefreshCw, CalendarDays } from "lucide-react";
import { Card, Badge, PageHeader, DemoBanner, EmptyState, Td, Th } from "@/components/ui";
import { getRoutes, getReps, setRouteStatus, todayString } from "@/lib/data";
import { routeStatusMeta } from "@/lib/status";
import { toaster } from "@/components/toast";

export default function RouteApprovalsPage() {
  const [regen, setRegen] = useState(0);
  const today = todayString();

  const queue = getRoutes()
    .filter((r) => r.status === "submitted" || r.status === "needs-revision")
    .sort((a, b) => (a.date === today ? -1 : 1) - (b.date === today ? -1 : 1));

  const reps = getReps();
  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "—";

  const approve = (id: string) => {
    setRouteStatus(id, "approved");
    setRegen((n) => n + 1);
    toaster.success("Route approved");
  };

  const reject = (id: string) => {
    const reason = window.prompt("Reason for revision:");
    if (reason) {
      setRouteStatus(id, "needs-revision", reason);
      setRegen((n) => n + 1);
      toaster.success("Revision requested");
    }
  };

  return (
    <div>
      <PageHeader
        title="Route approvals"
        description="Review routes submitted by sales reps before they go live."
        actions={
          <Link
            href="/routes"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            All routes <ArrowRight size={13} />
          </Link>
        }
      />
      <DemoBanner />

      <Card pad={false}>
        {queue.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Nothing awaiting review" hint="Newly submitted routes will appear here for approval." />
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
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((r) => {
                  const rm = routeStatusMeta[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <Td className="whitespace-nowrap font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-slate-400" />
                          {new Date(r.date + "T00:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                          {r.date === today && <Badge tone="blue">Today</Badge>}
                        </span>
                      </Td>
                      <Td>{repName(r.repId)}</Td>
                      <Td><Badge tone="slate">{r.zone}</Badge></Td>
                      <Td>{r.stops.length}</Td>
                      <Td>{r.totalKm} km</Td>
                      <Td>
                        <Badge className={rm.bg}>{rm.label}</Badge>
                        {r.revisedReason && (
                          <p className="mt-0.5 max-w-[220px] text-[11px] text-amber-600">{r.revisedReason}</p>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => approve(r.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            onClick={() => reject(r.id)}
                            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <RefreshCw size={13} /> Revise
                          </button>
                          <Link
                            href={`/routes/${r.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Open
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

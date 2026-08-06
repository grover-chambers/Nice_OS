"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, MapPin, ShoppingCart } from "lucide-react";
import { Card, Badge, PageHeader, DemoBanner, EmptyState, Td, Th, Segmented } from "@/components/ui";
import { getVisits, getRetailers, getReps, fmtKes, fmtDateTime, daysSince } from "@/lib/data";
import { visitStatusMeta } from "@/lib/status";
import type { VisitStatus } from "@/lib/data/types";

export default function VisitsPage() {
  const all = useMemo(() => getVisits(), []);
  const retailers = useMemo(() => getRetailers(), []);
  const reps = useMemo(() => getReps(), []);
  const [status, setStatus] = useState<VisitStatus | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const rows = all.filter((v) => {
    if (status !== "all" && v.status !== status) return false;
    if (verifiedOnly && !v.gpsVerified) return false;
    return true;
  });

  const retName = (id: string) => retailers.find((r) => r.id === id)?.name ?? "—";
  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "—";

  const stats = {
    verified: all.filter((v) => v.gpsVerified && daysSince(v.at) <= 7).length,
    orders: all.filter((v) => v.orderPlaced && daysSince(v.at) <= 7).length,
    stockouts: all.filter((v) => v.status === "no-stock" && daysSince(v.at) <= 7).length,
    photos: all.filter((v) => daysSince(v.at) <= 7).reduce((s, v) => s + v.photoCount, 0),
  };

  return (
    <div>
      <PageHeader
        title="Field visits"
        description="GPS-verified field interactions captured by reps on route."
      />
      <DemoBanner />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "GPS-verified (7d)", value: stats.verified },
          { label: "Orders (7d)", value: stats.orders },
          { label: "Stockouts (7d)", value: stats.stockouts },
          { label: "Photos (7d)", value: stats.photos },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="w-56">
            <Segmented
              options={[
                { value: "all", label: "All" },
                { value: "completed", label: "Completed" },
                { value: "no-stock", label: "No stock" },
                { value: "closed", label: "Closed" },
              ]}
              value={status}
              onChange={(v) => setStatus(v as VisitStatus | "all")}
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-slate-900"
            />
            GPS-verified only
          </label>
          <span className="ml-auto text-xs text-slate-400">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No visits match" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Time</Th>
                  <Th>Retailer</Th>
                  <Th>Rep</Th>
                  <Th>Verification</Th>
                  <Th>Status</Th>
                  <Th>Order</Th>
                  <Th>Capture</Th>
                  <Th className="text-right">Route</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 120).map((v) => {
                  const vm = visitStatusMeta[v.status];
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <Td className="whitespace-nowrap">{fmtDateTime(v.at)}</Td>
                      <Td>
                        <Link href={`/retailers/${v.retailerId}`} className="font-semibold text-slate-800 hover:text-blue-600">
                          {retName(v.retailerId)}
                        </Link>
                      </Td>
                      <Td className="text-slate-600">{repName(v.repId)}</Td>
                      <Td>
                        {v.gpsVerified ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={13} /> {v.radiusM}m
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <MapPin size={13} /> Not verified
                          </span>
                        )}
                      </Td>
                      <Td><Badge className={vm.bg}>{vm.label}</Badge></Td>
                      <Td>
                        {v.orderPlaced && v.orderValue ? (
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <ShoppingCart size={13} className="text-emerald-600" /> {fmtKes(v.orderValue)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Camera size={12} /> {v.photoCount}
                          {v.stockCaptured && <span className="text-emerald-600">· stock</span>}
                        </span>
                      </Td>
                      <Td className="text-right text-xs">
                        {v.routeId ? (
                          <Link href={`/routes/${v.routeId}`} className="font-semibold text-blue-600 hover:underline">
                            {v.routeId}
                          </Link>
                        ) : (
                          <span className="text-slate-300">ad-hoc</span>
                        )}
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

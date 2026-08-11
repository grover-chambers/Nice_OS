"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, PageHeader, DemoBanner, Td, Th } from "@/components/ui";
import {
  getRetailers,
  getRetailersByZone,
  getCompetitorObservations,
  getVisits,
  getRepManagement,
  getZoneCoverage,
  getOrderIntents,
  fmtKes,
  todayString,
} from "@/lib/data";
import { downloadCsv } from "@/lib/csv";
import { toaster } from "@/components/toast";
import ReportsTabs, { type ReportsTab } from "@/components/reports/ReportsTabs";

export default function ReportsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: ReportsTab =
    searchParams.tab === "sales" ||
    searchParams.tab === "market" ||
    searchParams.tab === "reps"
      ? searchParams.tab
      : "coverage";

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Downloadable operational reports for Market Link management and Nice Millers stakeholders."
      />
      <DemoBanner />
      <ReportsTabs active={tab} />
      {tab === "coverage" && <CoverageTab />}
      {tab === "sales" && <SalesTab />}
      {tab === "market" && <MarketTab />}
      {tab === "reps" && <RepsTab />}
    </div>
  );
}

function useReportData() {
  const retailers = useMemo(() => getRetailers(), []);
  const byZone = useMemo(() => getRetailersByZone(), []);
  const visits = useMemo(() => getVisits(), []);
  const obs = useMemo(() => getCompetitorObservations(), []);
  const intents = useMemo(() => getOrderIntents(), []);
  const zoneCoverage = useMemo(() => getZoneCoverage(), []);
  const repMgmt = useMemo(() => getRepManagement(), []);
  const date = todayString();
  return { retailers, byZone, visits, obs, intents, zoneCoverage, repMgmt, date };
}

function ReportCard({ title, desc, stats, onExport }: {
  title: string;
  desc: string;
  stats: string[];
  onExport: () => void;
}) {
  return (
    <Card title={title} subtitle={desc}>
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <span key={s} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {s}
          </span>
        ))}
      </div>
      <button
        onClick={onExport}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        <Download size={13} /> Download CSV
      </button>
    </Card>
  );
}

function CoverageTab() {
  const { zoneCoverage, byZone, date } = useReportData();
  const exportCoverage = () =>
    downloadCsv(
      `coverage-report-${date}.csv`,
      ["Zone", "Ward", "Retailers", "Active", "Prospect", "At risk / churned", "Coverage %"],
      zoneCoverage.flatMap((z) =>
        z.wardsTotal
          ? [[z.zone, `${z.wardsCovered}/${z.wardsTotal} wards`, z.retailers, z.active, z.retailers - z.active, z.atRisk, z.coveragePct]]
          : []
      )
    );

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          title="Coverage report"
          desc="Retail presence and coverage by zone and ward."
          stats={[
            `${zoneCoverage.reduce((s, z) => s + z.wardsCovered, 0)}/85 wards`,
            `${zoneCoverage.reduce((s, z) => s + z.active, 0)} active outlets`,
            `${Math.round((zoneCoverage.reduce((s, z) => s + z.wardsCovered, 0) / 85) * 100)}% coverage`,
          ]}
          onExport={() => { exportCoverage(); toaster.success("Coverage report downloaded"); }}
        />
      </div>
      <div className="mt-4">
        <Card title="Retailers by zone (preview)" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Zone</Th>
                  <Th>Active</Th>
                  <Th>Prospect</Th>
                  <Th>At risk</Th>
                  <Th>Churned</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byZone.map((z) => (
                  <tr key={z.zone} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-800">{z.zone}</Td>
                    <Td>{z.active}</Td>
                    <Td>{z.prospect}</Td>
                    <Td>{z.atRisk}</Td>
                    <Td>{z.churned}</Td>
                    <Td className="font-semibold">{z.total}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SalesTab() {
  const { visits, intents, retailers, date } = useReportData();
  const ordersWeek = visits.filter((v) => v.orderPlaced && Date.now() - new Date(v.at).getTime() < 7 * 86400000);

  const exportDemand = () =>
    downloadCsv(
      `demand-report-${date}.csv`,
      ["Date", "Visits", "Orders", "Order value (KES)"],
      [0, -1, -2, -3, -4, -5, -6].map((off) => {
        const d = new Date();
        d.setDate(d.getDate() + off);
        const day = d.toISOString().slice(0, 10);
        const dayVisits = visits.filter((v) => v.at.slice(0, 10) === day);
        const dayOrders = dayVisits.filter((v) => v.orderPlaced);
        return [day, dayVisits.length, dayOrders.length, dayOrders.reduce((s, v) => s + (v.orderValue ?? 0), 0)];
      })
    );

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          title="Demand & orders"
          desc="Order volume and value trend, plus pending WhatsApp forwards."
          stats={[
            `${ordersWeek.length} orders (7d)`,
            fmtKes(ordersWeek.reduce((s, v) => s + (v.orderValue ?? 0), 0)),
            `${intents.filter((i) => i.forwardStatus === "pending").length} pending forwards`,
          ]}
          onExport={() => { exportDemand(); toaster.success("Demand report downloaded"); }}
        />
      </div>
      <div className="mt-4">
        <Card title="Pending order forwards" subtitle="Order intents awaiting WhatsApp confirmation" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Outlet</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intents.slice(0, 8).map((i) => {
                  const r = retailers.find((x) => x.id === i.retailerId);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-800">{r?.name ?? "—"}</Td>
                      <Td className="text-xs text-slate-500">{i.items.map((x) => `${x.name}×${x.qty}`).join(", ")}</Td>
                      <Td className="font-semibold">{fmtKes(i.total)}</Td>
                      <Td className="capitalize">{i.forwardStatus}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MarketTab() {
  const { visits, obs, retailers, date } = useReportData();

  const exportVisibility = () => {
    const acc: Record<string, { sku: string; full: number; low: number; out: number }> = {};
    for (const v of visits)
      for (const it of v.items) {
        const row = (acc[it.sku] ??= { sku: it.sku, full: 0, low: 0, out: 0 });
        row[it.shelf]++;
      }
    downloadCsv(
      `brand-visibility-${date}.csv`,
      ["SKU", "Full", "Low", "Out of stock", "On-shelf %"],
      Object.values(acc).map((r) => {
        const total = r.full + r.low + r.out;
        return [r.sku, r.full, r.low, r.out, total ? Math.round((r.full / total) * 100) : 0];
      })
    );
  };

  const exportIntel = () =>
    downloadCsv(
      `market-intelligence-${date}.csv`,
      ["Brand", "Activity", "Retailer", "Date", "Note"],
      obs.map((o) => {
        const r = retailers.find((x) => x.id === o.retailerId);
        return [o.brand, o.activity, r?.name ?? "—", o.at, o.note];
      })
    );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReportCard
        title="Brand visibility"
        desc="On-shelf availability of Nice SKUs from field captures."
        stats={[`${visits.filter((v) => v.stockCaptured).length} stock checks`, "3 SKUs tracked", "Shelf-out flagged in alerts"]}
        onExport={() => { exportVisibility(); toaster.success("Brand visibility downloaded"); }}
      />
      <ReportCard
        title="Market intelligence"
        desc="Competitor pricing, promotions and shelf activity."
        stats={[
          `${obs.length} observations`,
          new Set(obs.map((o) => o.brand)).size + " brands",
          `${obs.filter((o) => o.activity === "price-drop" || o.activity === "promo").length} price/promo flags`,
        ]}
        onExport={() => { exportIntel(); toaster.success("Market intelligence downloaded"); }}
      />
    </div>
  );
}

function RepsTab() {
  const { repMgmt, date } = useReportData();

  const exportReps = () =>
    downloadCsv(
      `rep-performance-${date}.csv`,
      ["Rep", "Zone", "Target (month)", "Actual (month)", "Visits (week)", "Orders (week)", "Order value (KES)", "Coverage %"],
      repMgmt.map((r) => [r.rep.name, r.rep.zone, r.targetVisitsMonth, r.actualVisitsMonth, r.visitsThisWeek, r.ordersPlaced, Math.round(r.orderValue), r.onTargetPct])
    );

  const repTotal = (rows: { actualVisitsMonth: number }[]) => rows.reduce((s, r) => s + r.actualVisitsMonth, 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReportCard
        title="Rep performance"
        desc="Target vs actual visits, orders and coverage per rep."
        stats={[
          `${repMgmt.length} reps`,
          `${repTotal(repMgmt)} visits (month)`,
          `${repMgmt.filter((r) => r.onTargetPct >= 80).length} on target`,
        ]}
        onExport={() => { exportReps(); toaster.success("Rep performance downloaded"); }}
      />
    </div>
  );
}

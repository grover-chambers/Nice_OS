import dynamic from "next/dynamic";
import { getZoneCoverage, getRetailerCount, getRetailers } from "@/lib/data";
import { PageHeader, DemoBanner, Progress } from "@/components/ui";
import TerritoryTabs, { type TerritoryTab } from "@/components/territories/TerritoryTabs";
import TerritoryHierarchy from "@/components/territories/TerritoryHierarchy";

const TerritoryMap = dynamic(() => import("@/components/TerritoryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] min-h-[560px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function TerritoriesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: TerritoryTab =
    searchParams.tab === "map" || searchParams.tab === "hierarchy"
      ? searchParams.tab
      : "overview";

  const coverage = getZoneCoverage();
  const totalRetailers = getRetailerCount();
  const retailers = getRetailers();

  return (
    <div>
      <PageHeader
        title="Territories"
        description="Nairobi County ward map — IEBC 2019 boundaries, zones, population density and road corridors used for route planning."
      />
      <DemoBanner />

      <TerritoryTabs active={tab} />

      {tab === "overview" && (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {coverage.map((z) => (
            <div key={z.zone} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{z.zone} Zone</span>
                <span className="text-xs text-slate-400">{z.retailers} outlets</span>
              </div>
              <Progress value={z.coveragePct} tone={z.coveragePct >= 60 ? "emerald" : "amber"} />
              <p className="mt-1.5 text-xs text-slate-500">
                {z.wardsCovered}/{z.wardsTotal} wards covered · {z.active} active
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Registry total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalRetailers}</p>
            <p className="mt-1 text-xs text-slate-400">retailers across 6 sales territories</p>
          </div>
        </div>
      )}

      {tab === "map" && <TerritoryMap retailers={retailers} />}

      {tab === "hierarchy" && <TerritoryHierarchy />}
    </div>
  );
}

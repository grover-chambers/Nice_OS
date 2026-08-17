import NextDynamic from "next/dynamic";
import Link from "next/link";
import { getZoneCoverage, getRetailerCount, getRetailers, getTerritoryHierarchy } from "@/lib/data";
import { PageHeader, Progress } from "@/components/ui";
import TerritoryTabs, { type TerritoryTab } from "@/components/territories/TerritoryTabs";
import TerritoryHierarchy from "@/components/territories/TerritoryHierarchy";

const TerritoryMap = NextDynamic(() => import("@/components/TerritoryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] min-h-[560px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export const dynamic = "force-dynamic";

export default async function TerritoriesPage({
  searchParams,
}: {
  searchParams: { tab?: string; zone?: string };
}) {
  const tab: TerritoryTab =
    searchParams.tab === "map" || searchParams.tab === "hierarchy"
      ? searchParams.tab
      : "overview";

  const [coverage, totalRetailers, retailers, tree] = await Promise.all([
    getZoneCoverage(),
    getRetailerCount(),
    getRetailers(),
    getTerritoryHierarchy(),
  ]);

  return (
    <div>
      <PageHeader
        title="Territories"
        description="Nairobi County ward map — IEBC 2019 boundaries, zones, population density and road corridors used for route planning."
      />
      

      <TerritoryTabs active={tab} />

      {tab === "overview" && (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {coverage.map((z) => (
            <Link
              key={z.zone}
              href={`/territories?tab=map&zone=${encodeURIComponent(z.zone)}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-800">{z.zone} Zone</span>
                <span className="text-xs text-slate-400">{z.retailers} outlets</span>
              </div>
              <Progress value={z.coveragePct} tone={z.coveragePct >= 60 ? "emerald" : "amber"} />
              <p className="mt-1.5 text-xs text-slate-500">
                {z.wardsCovered}/{z.wardsTotal} wards covered · {z.active} active
              </p>
            </Link>
          ))}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Registry total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalRetailers}</p>
            <p className="mt-1 text-xs text-slate-400">retailers across 6 sales territories</p>
          </div>
        </div>
      )}

      {tab === "map" && <TerritoryMap retailers={retailers} initialZone={searchParams.zone ?? null} />}

      {tab === "hierarchy" && <TerritoryHierarchy tree={tree} />}
    </div>
  );
}

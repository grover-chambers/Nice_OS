import dynamic from "next/dynamic";
import Link from "next/link";
import { ClipboardList, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import CensusTracker from "@/components/census/CensusTracker";
import { getCensusSummary } from "@/lib/data";

const TerritoryMap = dynamic(() => import("@/components/TerritoryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] min-h-[560px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

const TABS = [
  { id: "tracker", label: "Tracker", icon: ClipboardList },
  { id: "map", label: "Map", icon: Map },
] as const;

export default async function CensusPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === "map" ? "map" : "tracker";
  const census = await getCensusSummary();

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.id === "tracker" ? "/census" : `/census?tab=${t.id}`}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              )}
            >
              <Icon size={15} />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "tracker" ? (
        <CensusTracker data={census} />
      ) : (
        <div>
          <PageHeader
            title="Census Map"
            description="Census area pins across the 4 census routes — Central, Northern, Eastern and South/Kajiado/Kiambu. Toggle 'Census areas' in the sidebar to show or hide."
          />
          <TerritoryMap />
        </div>
      )}
    </div>
  );
}

import {
  getRetailers,
  getRetailersByZone,
  getCompetitorObservations,
  getVisits,
  getRepManagement,
  getZoneCoverage,
  getOrderIntents,
} from "@/lib/data";
import ReportsView from "@/components/reports/ReportsView";
import type { ReportsTab } from "@/components/reports/ReportsTabs";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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

  const [retailers, byZone, visits, obs, repMgmt, zoneCoverage, intents] = await Promise.all([
    getRetailers(),
    getRetailersByZone(),
    getVisits(),
    getCompetitorObservations(),
    getRepManagement(),
    getZoneCoverage(),
    getOrderIntents(),
  ]);

  return (
    <ReportsView
      tab={tab}
      retailers={retailers}
      byZone={byZone}
      visits={visits}
      obs={obs}
      intents={intents}
      zoneCoverage={zoneCoverage}
      repMgmt={repMgmt}
    />
  );
}

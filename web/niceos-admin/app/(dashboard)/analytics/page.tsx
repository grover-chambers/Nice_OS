import { getRetailers, getOpportunities, getCompetitorObservations, getVisits, getZoneCoverage } from "@/lib/data";
import AnalyticsView from "@/components/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [retailers, opportunities, observations, visits, zoneCoverage] = await Promise.all([
    getRetailers(),
    getOpportunities(),
    getCompetitorObservations(),
    getVisits(),
    getZoneCoverage(),
  ]);

  return (
    <AnalyticsView
      retailers={retailers}
      opportunities={opportunities}
      observations={observations}
      visits={visits}
      zoneCoverage={zoneCoverage}
    />
  );
}

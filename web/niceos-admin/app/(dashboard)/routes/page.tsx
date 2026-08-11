import { getRoutes, todayString } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import RoutesTabs, { type RoutesTab } from "@/components/routes/RoutesTabs";
import RoutePlanning from "@/components/routes/RoutePlanning";
import RouteApprovals from "@/components/routes/RouteApprovals";

export default function RoutesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: RoutesTab = searchParams.tab === "approvals" ? "approvals" : "planning";

  const awaitingCount = getRoutes().filter(
    (r) => r.status === "submitted" || r.status === "needs-revision"
  ).length;

  return (
    <div>
      <PageHeader
        title="Route planning"
        description="Daily field routes — system-generated, manager-reviewed, rep-executed."
      />
      <RoutesTabs active={tab} queueCount={awaitingCount} />
      {tab === "planning" ? <RoutePlanning /> : <RouteApprovals />}
    </div>
  );
}

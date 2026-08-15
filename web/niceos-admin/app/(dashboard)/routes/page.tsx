import { getRoutes, getReps, todayString } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import RoutesTabs, { type RoutesTab } from "@/components/routes/RoutesTabs";
import RoutePlanning from "@/components/routes/RoutePlanning";
import RouteApprovals from "@/components/routes/RouteApprovals";

export const dynamic = "force-dynamic";

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: RoutesTab = searchParams.tab === "approvals" ? "approvals" : "planning";

  const [routes, reps, today] = await Promise.all([
    getRoutes(),
    getReps(),
    Promise.resolve(todayString()),
  ]);

  const awaitingCount = routes.filter(
    (r) => r.status === "submitted" || r.status === "needs-revision"
  ).length;

  return (
    <div>
      <PageHeader
        title="Route planning"
        description="Daily field routes — system-generated, manager-reviewed, rep-executed."
      />
      <RoutesTabs active={tab} queueCount={awaitingCount} />
      {tab === "planning" ? (
        <RoutePlanning routes={routes} reps={reps} today={today} />
      ) : (
        <RouteApprovals routes={routes} reps={reps} today={today} />
      )}
    </div>
  );
}

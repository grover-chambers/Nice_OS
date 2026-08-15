import { getRepManagement } from "@/lib/data";
import RepManagementTabs, { type RepManagementTab } from "@/components/rep/RepManagementTabs";
import RepRoster from "@/components/rep/RepRoster";
import RepPerformance from "@/components/rep/RepPerformance";

export const dynamic = "force-dynamic";

export default async function RepManagementPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: RepManagementTab = searchParams.tab === "performance" ? "performance" : "roster";
  const rows = await getRepManagement();

  return (
    <div>
      <RepManagementTabs active={tab} />
      {tab === "roster" ? <RepRoster rows={rows} /> : <RepPerformance rows={rows} />}
    </div>
  );
}

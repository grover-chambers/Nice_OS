import RepManagementTabs, { type RepManagementTab } from "@/components/rep/RepManagementTabs";
import RepRoster from "@/components/rep/RepRoster";
import RepPerformance from "@/components/rep/RepPerformance";

export default function RepManagementPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab: RepManagementTab = searchParams.tab === "performance" ? "performance" : "roster";

  return (
    <div>
      <RepManagementTabs active={tab} />
      {tab === "roster" ? <RepRoster /> : <RepPerformance />}
    </div>
  );
}

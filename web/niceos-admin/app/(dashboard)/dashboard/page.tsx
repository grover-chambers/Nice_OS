import { getDashboardSummary, getRetailers } from "@/lib/data";
import DashboardView from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, retailers] = await Promise.all([
    getDashboardSummary(),
    getRetailers(),
  ]);

  return <DashboardView summary={summary} retailers={retailers} />;
}

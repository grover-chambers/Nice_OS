import { getDashboardSummary, getRetailers, getCompetitorObservations } from "@/lib/data";
import ClientView from "@/components/client/ClientView";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const [summary, retailers, observations] = await Promise.all([
    getDashboardSummary(),
    getRetailers(),
    getCompetitorObservations(),
  ]);

  return (
    <ClientView summary={summary} retailers={retailers} observations={observations} />
  );
}

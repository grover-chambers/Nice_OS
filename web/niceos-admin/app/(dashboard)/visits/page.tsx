import { getVisits, getRetailers, getReps } from "@/lib/data";
import VisitsView from "@/components/visits/VisitsView";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const [visits, retailers, reps] = await Promise.all([getVisits(), getRetailers(), getReps()]);

  return <VisitsView visits={visits} retailers={retailers} reps={reps} />;
}

import { getRetailers, getReps } from "@/lib/data";
import RetailersView from "@/components/retailers/RetailersView";

export const dynamic = "force-dynamic";

export default async function RetailersPage() {
  const [retailers, reps] = await Promise.all([getRetailers(), getReps()]);

  return <RetailersView retailers={retailers} reps={reps} />;
}

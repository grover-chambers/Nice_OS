import { getReps } from "@/lib/data";
import NewRetailerView from "@/components/retailers/NewRetailerView";

export const dynamic = "force-dynamic";

export default async function NewRetailerPage() {
  const reps = await getReps();

  return <NewRetailerView reps={reps} />;
}

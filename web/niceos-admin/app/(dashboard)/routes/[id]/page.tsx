import { notFound } from "next/navigation";
import { getRoute, getRetailers, getReps } from "@/lib/data";
import RoutePlannerView from "@/components/routes/RoutePlannerView";

export const dynamic = "force-dynamic";

export default async function RoutePlannerPage({
  params,
}: {
  params: { id: string };
}) {
  const [route, retailers, reps] = await Promise.all([
    getRoute(params.id),
    getRetailers(),
    getReps(),
  ]);

  if (!route) notFound();

  const rep = reps.find((r) => r.id === route.repId);

  return <RoutePlannerView route={route} retailers={retailers} rep={rep} />;
}

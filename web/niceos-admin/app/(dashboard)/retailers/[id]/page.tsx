import { notFound } from "next/navigation";
import { getRetailer, getReps, getVisits, getCompetitorObservations } from "@/lib/data";
import RetailerProfileView from "@/components/retailers/RetailerProfileView";

export const dynamic = "force-dynamic";

export default async function RetailerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [retailer, reps, visits, observations] = await Promise.all([
    getRetailer(params.id),
    getReps(),
    getVisits({ retailerId: params.id }),
    getCompetitorObservations(),
  ]);

  if (!retailer) notFound();

  const rep = reps.find((r) => r.id === retailer.repId);
  const retailerObs = observations.filter((o) => o.retailerId === params.id);

  return (
    <RetailerProfileView retailer={retailer} rep={rep} visits={visits} observations={retailerObs} />
  );
}

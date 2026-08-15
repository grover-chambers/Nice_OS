import { getAlerts } from "@/lib/data";
import AlertsView from "@/components/alerts/AlertsView";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return <AlertsView alerts={alerts} />;
}

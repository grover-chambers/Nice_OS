import { getReps } from "@/lib/data";
import UsersView from "@/components/users/UsersView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const reps = await getReps();

  return <UsersView reps={reps} />;
}

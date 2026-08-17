import { createServerSupabaseClient } from "@/lib/supabase/server";
import UsersView from "@/components/users/UsersView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const supabase = createServerSupabaseClient();

  const [profilesRes, rolesRes, terrRes, scopeRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, status, zone, territory_id, updated_at")
      .order("full_name"),
    supabase.from("role_definitions").select("*").order("role"),
    supabase.from("territories").select("id, name").order("name"),
    supabase.rpc("app_scope"),
  ]);

  const scope = scopeRes.data?.[0];

  return (
    <UsersView
      profiles={profilesRes.data ?? []}
      roleDefinitions={rolesRes.data ?? []}
      territories={terrRes.data ?? []}
      currentRole={scope?.role ?? "admin"}
      currentZone={scope?.zones?.[0] ?? null}
    />
  );
}
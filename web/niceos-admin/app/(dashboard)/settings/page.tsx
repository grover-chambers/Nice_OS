import { createServerSupabaseClient } from "@/lib/supabase/server";
import SettingsView from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();

  const [settingsRes, scopeRes] = await Promise.all([
    supabase.from("app_settings").select("key, value, description, updated_at").order("key"),
    supabase.rpc("app_scope"),
  ]);

  const scope = scopeRes.data?.[0];
  const canEdit = scope?.role === "super_admin" || scope?.role === "admin";

  return (
    <SettingsView
      settings={settingsRes.data ?? []}
      canEdit={canEdit}
    />
  );
}
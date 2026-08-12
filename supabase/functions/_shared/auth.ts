import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "./cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SyncContext {
  user: { id: string; email?: string };
  jwt: string;
  profile: { id: string; role: string; status: string };
  rep: { id: string; zone: string | null; status: string };
  db: ReturnType<typeof serviceClient>;
}

// Resolves the request's Bearer token to an active sales_rep. Returns either
// a context or a short-circuited error Response. Only sales_reps may sync.
export async function requireRep(
  req: Request
): Promise<{ ctx: SyncContext; error: Response | null }> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    ""
  );
  if (!jwt) return { ctx: null as unknown as SyncContext, error: json({ error: "Missing Authorization header" }, 401) };

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return { ctx: null as unknown as SyncContext, error: json({ error: "Invalid or expired token" }, 401) };
  }

  const db = serviceClient();
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, role, status")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") {
    return { ctx: null as unknown as SyncContext, error: json({ error: "Active profile not found" }, 403) };
  }

  const { data: rep, error: repError } = await db
    .from("reps")
    .select("id, zone, status")
    .eq("id", profile.id)
    .maybeSingle();
  if (repError || !rep || rep.status !== "active") {
    return { ctx: null as unknown as SyncContext, error: json({ error: "Sync is available to active sales reps only" }, 403) };
  }

  return {
    ctx: { user, jwt, profile, rep, db },
    error: null,
  };
}

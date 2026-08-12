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

export interface UserContext {
  user: { id: string; email?: string };
  jwt: string;
  profile: { id: string; role: string; status: string };
  db: ReturnType<typeof serviceClient>;
}

export interface RepContext extends UserContext {
  rep: { id: string; zone: string | null; status: string; phone?: string | null };
}

// Resolves the Bearer token to a user + their active profile. Used by
// functions that accept any authenticated operator (e.g. the OTP flow).
export async function requireUser(
  req: Request
): Promise<{ ctx: UserContext; error: Response | null }> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    ""
  );
  if (!jwt) {
    return {
      ctx: null as unknown as UserContext,
      error: json({ error: "Missing Authorization header" }, 401),
    };
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return {
      ctx: null as unknown as UserContext,
      error: json({ error: "Invalid or expired token" }, 401),
    };
  }

  const db = serviceClient();
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, role, status")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.status !== "active") {
    return {
      ctx: null as unknown as UserContext,
      error: json({ error: "Active profile not found" }, 403),
    };
  }

  return {
    ctx: { user, jwt, profile, db },
    error: null,
  };
}

// Sync functions require an active sales_rep.
export async function requireRep(
  req: Request
): Promise<{ ctx: RepContext; error: Response | null }> {
  const { ctx, error } = await requireUser(req);
  if (error) return { ctx: null as unknown as RepContext, error };

  const { data: rep, error: repError } = await ctx.db
    .from("reps")
    .select("id, zone, status, phone")
    .eq("id", ctx.profile.id)
    .maybeSingle();
  if (repError || !rep || rep.status !== "active") {
    return {
      ctx: null as unknown as RepContext,
      error: json(
        { error: "Sync is available to active sales reps only" },
        403
      ),
    };
  }

  return {
    ctx: { ...ctx, rep: { id: rep.id, zone: rep.zone, status: rep.status, phone: rep.phone ?? null } },
    error: null,
  };
}

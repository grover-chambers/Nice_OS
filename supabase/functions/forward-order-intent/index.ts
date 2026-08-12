import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface OrderLine {
  sku: string;
  name?: string;
  quantity: number;
  price?: number;
}

interface OrderIntentPayload {
  retailer_id: string;
  rep_id?: string;
  items: OrderLine[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the caller is authenticated. The gateway enforces verify_jwt = true,
  // but we double-check the Authorization header so the function is safe even if
  // it is ever exposed without JWT verification.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userJwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!userJwt) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  // Build a user-scoped client so we can verify the caller owns rep_id.
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } }
  );
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { retailer_id, rep_id, items } = body as OrderIntentPayload;
  if (!retailer_id || !Array.isArray(items) || items.length === 0) {
    return json(
      { error: "Invalid payload: retailer_id + items[] required" },
      400
    );
  }

  // Validate items and compute total server-side — never trust a client-sent total.
  let total = 0;
  for (const i of items) {
    if (
      typeof i.sku !== "string" || !i.sku.trim() ||
      typeof i.quantity !== "number" || !Number.isInteger(i.quantity) ||
      i.quantity <= 0
    ) {
      return json(
        { error: `Invalid item: ${JSON.stringify(i)}` },
        400
      );
    }
    const price = typeof i.price === "number" && i.price >= 0 ? i.price : 0;
    total += i.quantity * price;
  }

  // If rep_id is provided, verify the caller's profile matches that rep.
  // This stops one rep from creating order_intents attributed to another.
  if (rep_id) {
    const { data: rep, error: repError } = await supabase
      .from("reps")
      .select("id")
      .eq("id", rep_id)
      .maybeSingle();
    if (repError || !rep) {
      return json({ error: "Unknown rep_id" }, 400);
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (profileError || !profile) {
      return json({ error: "Caller has no profile" }, 403);
    }
    const isOwner = profile.id === rep_id;
    const isPrivileged = profile.role === "admin" ||
      profile.role === "territory_manager";
    if (!isOwner && !isPrivileged) {
      return json(
        { error: "Caller cannot create order intents for another rep" },
        403
      );
    }
  }

  const insertPayload: Record<string, unknown> = {
    retailer_id,
    rep_id: rep_id ?? null,
    total,
    forward_status: "pending",
  };
  if (rep_id) insertPayload.created_by = rep_id;

  const { data: order, error: headerError } = await supabase
    .from("order_intents")
    .insert(insertPayload)
    .select("id")
    .single();

  if (headerError) {
    return json({ error: headerError.message }, 500);
  }

  const lines = items.map((i) => ({
    order_intent_id: order!.id,
    sku: i.sku,
    name: i.name ?? null,
    quantity: i.quantity,
    price: typeof i.price === "number" && i.price >= 0 ? i.price : 0,
  }));

  const { error: itemsError } = await supabase
    .from("order_intent_items")
    .insert(lines);
  if (itemsError) {
    // Best-effort rollback of the header row so partial states don't linger.
    await supabase.from("order_intents").delete().eq("id", order!.id);
    return json({ error: itemsError.message }, 500);
  }

  return json({ success: true, order_intent_id: order!.id, total });
});

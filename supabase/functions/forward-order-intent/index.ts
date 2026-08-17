import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, json } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { forwardPendingOrder } from "../_shared/order-forward.ts";

interface OrderLine {
  sku: string;
  name?: string;
  quantity: number;
  price?: number;
}

interface OrderIntentPayload {
  retailer_id: string;
  rep_id?: string;
  rep_name?: string;
  rep_phone?: string;
  items: OrderLine[];
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // The gateway enforces verify_jwt = true, but we double-check the token so
  // the function is safe even if it is ever exposed without JWT verification.
  const { ctx, error } = await requireUser(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { retailer_id, rep_id, rep_name, rep_phone, items } =
    body as OrderIntentPayload;
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
    const { data: rep, error: repError } = await ctx.db
      .from("reps")
      .select("id")
      .eq("id", rep_id)
      .maybeSingle();
    if (repError || !rep) {
      return json({ error: "Unknown rep_id" }, 400);
    }
    const isOwner = ctx.profile.id === rep_id;
    const isPrivileged = ctx.profile.role === "admin" ||
      ctx.profile.role === "super_admin" ||
      ctx.profile.role === "territory_manager";
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

  const { data: order, error: headerError } = await ctx.db
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

  const { error: itemsError } = await ctx.db
    .from("order_intent_items")
    .insert(lines);
  if (itemsError) {
    // Best-effort rollback of the header row so partial states don't linger.
    await ctx.db.from("order_intents").delete().eq("id", order!.id);
    return json({ error: itemsError.message }, 500);
  }

  // After the order is persisted, forward it to the order handling desk.
  const forwardStatus = await forwardPendingOrder(ctx.db, order!.id);

  return json({
    success: true,
    order_intent_id: order!.id,
    total,
    forward_status: forwardStatus,
  });
});
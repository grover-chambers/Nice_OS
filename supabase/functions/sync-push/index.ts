import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, json } from "../_shared/cors.ts";
import { requireRep, type RepContext } from "../_shared/auth.ts";
import { forwardPendingOrder } from "../_shared/order-forward.ts";

const ENTITIES = [
  "retailers",
  "routes",
  "route_stops",
  "visits",
  "visit_items",
  "competitor_observations",
  "order_intents",
  "order_intent_items",
  "health_scores",
  "stock_observations",
  "shelf_photos",
  "outlets",
  "outlet_contacts",
  "outlet_client_links",
  "consent_records",
  "category_observations",
  "consumer_intercepts",
  "daily_submissions",
  "back_checks",
];

// Parent entities keyed by the column that links children to them.
const PARENT_ENTITY = {
  route_stops: "route_id",
  visit_items: "visit_id",
  order_intent_items: "order_intent_id",
  outlet_contacts: "outlet_id",
  outlet_client_links: "outlet_id",
  category_observations: "outlet_id",
} as const;

type ParentKey = keyof typeof PARENT_ENTITY;
type ParentEntity = typeof PARENT_ENTITY[ParentKey];
type OwnedParents = Record<ParentEntity, Set<string>>;

interface Row {
  [key: string]: unknown;
}

// A row is owned by the caller when it names the caller as rep_id,
// created_by or enumerator_id. Parent entities enforce this directly; child
// entities must reference a parent that is owned (in the DB already OR present
// in this same batch as a brand-new offline row).
function isOwnedRow(
  row: Row,
  ctx: RepContext,
  ownedParents: OwnedParents
): boolean {
  const repId = ctx.rep.id;
  const profileId = ctx.profile.id;

  if (
    row.rep_id === repId ||
    row.created_by === profileId ||
    row.enumerator_id === repId
  ) {
    return true;
  }

  for (const parentCol of Object.values(PARENT_ENTITY)) {
    if (typeof row[parentCol] === "string") {
      return ownedParents[parentCol].has(row[parentCol] as string);
    }
  }
  return false;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const { ctx, error } = await requireRep(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.batch)) {
    return json({ error: "Invalid payload: batch[] required" }, 400);
  }

  const deviceId = typeof body.device_id === "string" ? body.device_id : null;
  // V1: remember the rep's device id for future notification work. The push
  // token is accepted and ignored until a notifications system exists.
  if (deviceId) {
    await ctx.db
      .from("reps")
      .update({ device: deviceId.slice(0, 120) })
      .eq("id", ctx.rep.id);
  }

  // Gather owned parents: everything the rep owns on the server PLUS any
  // parent ids in this batch (offline-created rows not yet on the server).
  const ownedParents: OwnedParents = {
    route_id: new Set(),
    visit_id: new Set(),
    order_intent_id: new Set(),
    outlet_id: new Set(),
  };
  for (const group of body.batch) {
    const entity = group?.entity;
    if (entity === "routes" && Array.isArray(group.rows)) {
      for (const r of group.rows) if (typeof r.id === "string") ownedParents.route_id.add(r.id);
    }
    if (entity === "visits" && Array.isArray(group.rows)) {
      for (const r of group.rows) if (typeof r.id === "string") ownedParents.visit_id.add(r.id);
    }
    if (entity === "order_intents" && Array.isArray(group.rows)) {
      for (const r of group.rows) if (typeof r.id === "string") ownedParents.order_intent_id.add(r.id);
    }
    if (entity === "outlets" && Array.isArray(group.rows)) {
      for (const r of group.rows) if (typeof r.id === "string") ownedParents.outlet_id.add(r.id);
    }
  }
  {
    const [routes, visits, orders, outlets] = await Promise.all([
      ctx.db.from("routes").select("id").eq("rep_id", ctx.rep.id),
      ctx.db.from("visits").select("id").eq("rep_id", ctx.rep.id),
      ctx.db
        .from("order_intents")
        .select("id")
        .or(`rep_id.eq.${ctx.rep.id},created_by.eq.${ctx.profile.id}`),
      ctx.db
        .from("outlets")
        .select("id")
        .or(`created_by.eq.${ctx.profile.id}`),
    ]);
    for (const r of routes.data ?? []) ownedParents.route_id.add(r.id);
    for (const v of visits.data ?? []) ownedParents.visit_id.add(v.id);
    for (const o of orders.data ?? []) ownedParents.order_intent_id.add(o.id);
    for (const o of outlets.data ?? []) ownedParents.outlet_id.add(o.id);
  }

  const applied: Record<string, number> = {};
  const conflicts: unknown[] = [];
  const pendingOrderIds: string[] = [];

  for (const group of body.batch) {
    const entity = group?.entity as string;
    const rows = group?.rows as Row[] | undefined;
    if (!ENTITIES.includes(entity) || !Array.isArray(rows) || rows.length === 0) {
      continue;
    }

    const owned = rows.filter((r) => isOwnedRow(r, ctx, ownedParents));
    if (owned.length === 0) continue;

    const { data, error: rpcError } = await ctx.db.rpc("sync_apply", {
      p_entity: entity,
      p_rows: owned,
    });
    if (rpcError) {
      return json({ error: `${entity}: ${rpcError.message}` }, 500);
    }
    applied[entity] = data?.applied ?? 0;
    if (Array.isArray(data?.conflicts)) conflicts.push(...data.conflicts);

    // Collect applied order intents so pending ones can be forwarded to the
    // sales order desk after the batch lands.
    if (entity === "order_intents") {
      for (const r of owned) {
        if (typeof r.id === "string" && r.forward_status === "pending") {
          pendingOrderIds.push(r.id);
        }
      }
    }
  }

  // Best-effort WhatsApp forwarding for newly applied orders. A forwarding
  // failure is recorded on the order (forward_status = 'failed') and never
  // fails the sync itself.
  if (pendingOrderIds.length > 0) {
    await Promise.allSettled(
      pendingOrderIds.map((id) => forwardPendingOrder(ctx.db, id))
    );
  }

  return json({
    applied,
    conflicts,
    cursor: new Date().toISOString(),
  });
});

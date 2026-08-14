import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, json } from "../_shared/cors.ts";
import { requireRep, type SyncContext } from "../_shared/auth.ts";

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

const PAGE_LIMIT = 10000;

interface OwnedSets {
  retailerIds: string[];
  routeIds: string[];
  visitIds: string[];
  orderIds: string[];
  outletIds: string[];
}

// Preload the rep's owned parent ids so child entities can be scoped.
async function ownedSets(ctx: SyncContext): Promise<OwnedSets> {
  const repId = ctx.rep.id;
  const profileId = ctx.profile.id;
  const and = (key: string) => `rep_id.eq.${repId},created_by.eq.${profileId}`;

  const [retailers, routes, visits, orders, outlets] = await Promise.all([
    ctx.db.from("retailers").select("id").or(and("rep_id")),
    ctx.db.from("routes").select("id").eq("rep_id", repId),
    ctx.db.from("visits").select("id").eq("rep_id", repId),
    ctx.db.from("order_intents").select("id").or(and("rep_id")),
    ctx.db.from("outlets").select("id").eq("created_by", profileId),
  ]);

  return {
    retailerIds: (retailers.data ?? []).map((r: { id: string }) => r.id),
    routeIds: (routes.data ?? []).map((r: { id: string }) => r.id),
    visitIds: (visits.data ?? []).map((v: { id: string }) => v.id),
    orderIds: (orders.data ?? []).map((o: { id: string }) => o.id),
    outletIds: (outlets.data ?? []).map((o: { id: string }) => o.id),
  };
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const { ctx, error } = await requireRep(req);
  if (error) return error;

  const url = new URL(req.url);
  const since = url.searchParams.get("since") ?? null;
  const requested = (url.searchParams.get("entities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const entities = requested.length
    ? requested.filter((e) => ENTITIES.includes(e))
    : [...ENTITIES];

  const repId = ctx.rep.id;
  const profileId = ctx.profile.id;
  const sets = await ownedSets(ctx);

  const data: Record<string, unknown[]> = {};
  let maxTs = since ? new Date(since).toISOString() : new Date(0).toISOString();

  for (const entity of entities) {
    let q = ctx.db
      .from(entity)
      .select("*")
      .order("updated_at", { ascending: true })
      .limit(PAGE_LIMIT);
    if (since) q = q.gt("updated_at", since);

    switch (entity) {
      case "retailers":
        q = q.or(`rep_id.eq.${repId},created_by.eq.${profileId}`);
        break;
      case "routes":
      case "visits":
      case "competitor_observations":
      case "stock_observations":
      case "shelf_photos":
        q = q.eq("rep_id", repId);
        break;
      case "route_stops":
        if (sets.routeIds.length) q = q.in("route_id", sets.routeIds);
        else q = q.eq("route_id", "00000000-0000-0000-0000-000000000000");
        break;
      case "visit_items":
        if (sets.visitIds.length) q = q.in("visit_id", sets.visitIds);
        else q = q.eq("visit_id", "00000000-0000-0000-0000-000000000000");
        break;
      case "order_intents":
        q = q.or(`rep_id.eq.${repId},created_by.eq.${profileId}`);
        break;
      case "order_intent_items":
        if (sets.orderIds.length) q = q.in("order_intent_id", sets.orderIds);
        else q = q.eq("order_intent_id", "00000000-0000-0000-0000-000000000000");
        break;
      case "outlets":
        q = q.eq("created_by", profileId);
        break;
      case "outlet_contacts":
      case "outlet_client_links":
        if (sets.outletIds.length) q = q.in("outlet_id", sets.outletIds);
        else q = q.eq("outlet_id", "00000000-0000-0000-0000-000000000000");
        break;
      case "consent_records":
      case "consumer_intercepts":
      case "daily_submissions":
      case "back_checks":
        q = q.eq("enumerator_id", repId);
        break;
      case "category_observations":
        q = q.eq("rep_id", repId);
        break;
      case "health_scores":
        if (sets.retailerIds.length) {
          q = q.in("retailer_id", sets.retailerIds);
        } else {
          q = q.eq("retailer_id", "00000000-0000-0000-0000-000000000000");
        }
        break;
      default:
        break;
    }

    const { data: rows, error: err } = await q;
    if (err) {
      return json({ error: `${entity}: ${err.message}` }, 500);
    }
    data[entity] = rows ?? [];
    for (const r of data[entity]) {
      const t = (r as { updated_at?: string }).updated_at;
      if (t && t > maxTs) maxTs = t;
    }
  }

  return json({ cursor: maxTs, data });
});

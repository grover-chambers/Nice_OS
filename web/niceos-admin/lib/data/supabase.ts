// NiceOS Supabase data layer.
// Server-side query functions backed by the live database.
// Every export matches the signature of lib/data/index.ts so page code
// stays unchanged.

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import type {
  Alert,
  CompetitorObservation,
  Opportunity,
  OrderIntent,
  Rep,
  Retailer,
  Route,
  RouteStatus,
  RouteStop,
  Visit,
  WardZone,
} from "./types";
import {
  WARD_META,
  ZONES,
  fmtKes,
  fmtNum,
  haversineKm,
  type CensusSummary,
  type CensusWard,
  type DashboardSummary,
  type HierarchyNode,
  type RepManagementRow,
  type RetailerFilters,
  type RouteFilters,
  type WardCoveragePoint,
  type ZoneCoverage,
} from "./shared";

// --- helpers ----------------------------------------------------------------

function dbToRetailer(row: any): Retailer {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner_name ?? "",
    phone: row.phone ?? "",
    type: row.business_type,
    tier: row.tier,
    status: row.status,
    ward: row.ward ?? "",
    constituency: row.constituency ?? "",
    zone: row.zone ?? "",
    address: row.address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    healthScore: row.health_score ?? 55,
    churnRisk: row.churn_risk ?? "low",
    lastVisitAt: row.last_visit_at ?? null,
    visits30d: row.visits30d ?? 0,
    orders30d: row.orders30d ?? 0,
    avgOrderValue: Number(row.avg_order_value) ?? 0,
    orderTrendPct: row.order_trend_pct ?? 0,
    repId: row.rep_id ?? "",
    createdAt: row.created_at,
    competitorPresence: Array.isArray(row.competitor_presence)
      ? row.competitor_presence
      : typeof row.competitor_presence === "string"
        ? JSON.parse(row.competitor_presence)
        : [],
    shelfNote: row.shelf_note ?? undefined,
  };
}

function dbToRep(row: any): Rep {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    color: row.color ?? "#2563eb",
    zone: row.zone ?? "Central",
    wards: row.wards ?? [],
    targetVisitsMonth: row.target_visits_month ?? 96,
    actualVisitsMonth: row.actual_visits_month ?? 0,
    onRoute: row.on_route ?? false,
    lastSyncAt: row.last_sync_at ?? row.updated_at,
    device: row.device ?? "",
    status: row.status ?? "active",
  };
}

function dbToRoute(row: any, stops?: any[]): Route {
  return {
    id: row.id,
    date: row.date,
    repId: row.rep_id,
    zone: row.zone ?? "",
    status: row.status,
    stops: (stops ?? []).map(dbToRouteStop),
    totalKm: Number(row.total_km) ?? 0,
    totalTravelMin: row.total_travel_min ?? 0,
    startTime: row.start_time?.slice(0, 5) ?? "08:00",
    endTime: row.end_time?.slice(0, 5) ?? "17:00",
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    revisedBy: row.revised_by ?? undefined,
    revisedReason: row.revised_reason ?? undefined,
  };
}

function dbToRouteStop(row: any): RouteStop {
  return {
    retailerId: row.retailer_id,
    order: row.position,
    plannedStart: row.planned_start?.slice(0, 5) ?? "08:00",
    plannedEnd: row.planned_end?.slice(0, 5) ?? "08:30",
    visitType: row.visit_type,
    kmFromPrev: Number(row.km_from_prev) ?? 0,
    minutesFromPrev: row.minutes_from_prev ?? 0,
  };
}

function dbToVisit(row: any): Visit {
  return {
    id: row.id,
    retailerId: row.retailer_id,
    repId: row.rep_id ?? "",
    routeId: row.route_id ?? undefined,
    at: row.check_in_at,
    gpsVerified: row.gps_verified ?? false,
    radiusM: row.radius_m ?? 0,
    status: row.status,
    durationMin: row.duration_min ?? 0,
    stockCaptured: row.stock_captured ?? false,
    photoCount: row.photo_count ?? 0,
    orderPlaced: row.order_placed ?? false,
    orderValue: row.order_value ? Number(row.order_value) : undefined,
    notes: row.notes ?? undefined,
    items: [], // populated separately if needed
  };
}

// --- retailers --------------------------------------------------------------

export async function getRetailers(
  filters: RetailerFilters = {}
): Promise<Retailer[]> {
  const supabase = createServerSupabaseClient();
  let q = supabase.from("retailers").select("*").order("name");

  if (filters.q) {
    const term = `%${filters.q}%`;
    q = q.or(
      `name.ilike.${term},owner_name.ilike.${term},ward.ilike.${term},phone.ilike.${term}`
    );
  }
  if (filters.status && filters.status !== "all")
    q = q.eq("status", filters.status);
  if (filters.zone && filters.zone !== "all") q = q.eq("zone", filters.zone);
  if (filters.type && filters.type !== "all")
    q = q.eq("business_type", filters.type);
  if (filters.tier && filters.tier !== "all") q = q.eq("tier", filters.tier);
  if (filters.churnRisk && filters.churnRisk !== "all")
    q = q.eq("churn_risk", filters.churnRisk);
  if (filters.ward && filters.ward !== "all") q = q.eq("ward", filters.ward);

  const { data, error } = await q;
  if (error) {
    console.error("getRetailers:", error.message);
    return [];
  }
  return (data ?? []).map(dbToRetailer);
}

export async function getRetailer(id: string): Promise<Retailer | undefined> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("retailers")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return dbToRetailer(data);
}

export async function getRetailerCount(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from("retailers")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function createRetailer(
  input: Omit<
    Retailer,
    | "id"
    | "createdAt"
    | "healthScore"
    | "churnRisk"
    | "lastVisitAt"
    | "visits30d"
    | "orders30d"
    | "avgOrderValue"
    | "orderTrendPct"
    | "competitorPresence"
  >
): Promise<Retailer> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("retailers")
    .insert({
      name: input.name,
      owner_name: input.owner,
      phone: input.phone,
      business_type: input.type,
      tier: input.tier,
      status: input.status,
      ward: input.ward,
      constituency: input.constituency,
      zone: input.zone,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      rep_id: input.repId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return dbToRetailer(data);
}

// --- reps -------------------------------------------------------------------

export async function getReps(): Promise<Rep[]> {  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reps")
    .select("*")
    .order("name");
  if (error) {
    console.error("getReps:", error.message);
    return [];
  }
  return (data ?? []).map(dbToRep);
}

export async function getRep(id: string): Promise<Rep | undefined> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reps")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return dbToRep(data);
}

export async function getRepManagement(): Promise<RepManagementRow[]> {
  const reps = await getReps();
  const supabase = createServerSupabaseClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const { data: weekVisits } = await supabase
    .from("visits")
    .select("rep_id, order_placed, order_value")
    .gte("check_in_at", weekAgoIso);

  const visitByRep = new Map<string, any[]>();
  for (const v of weekVisits ?? []) {
    const repId = v.rep_id ?? "";
    const arr = visitByRep.get(repId) ?? [];
    arr.push(v);
    visitByRep.set(repId, arr);
  }

  return reps.map((rep) => {
    const vs = visitByRep.get(rep.id) ?? [];
    const orders = vs.filter((v: any) => v.order_placed);
    const orderValue = orders.reduce(
      (s: number, v: any) => s + (Number(v.order_value) || 0),
      0
    );
    const assignedWards = rep.wards.length || 1;

    return {
      rep,
      targetVisitsMonth: rep.targetVisitsMonth,
      actualVisitsMonth: rep.actualVisitsMonth,
      visitsThisWeek: vs.length,
      targetThisWeek: Math.round(rep.targetVisitsMonth / 4.3),
      onTargetPct: Math.min(
        100,
        Math.round(
          (rep.actualVisitsMonth / rep.targetVisitsMonth) * 100
        )
      ),
      ordersPlaced: orders.length,
      orderValue,
      coverageWards: assignedWards,
      assignedWards,
      attendancePct: rep.status === "active" ? 100 : 0,
      lastSyncAgoMin: 0,
    };
  });
}

// --- routes -----------------------------------------------------------------

export async function getRoutes(
  filters: RouteFilters = {}
): Promise<Route[]> {
  const supabase = createServerSupabaseClient();
  let q = supabase
    .from("routes")
    .select("*, route_stops(*)")
    .order("date", { ascending: false });

  if (filters.status && filters.status !== "all")
    q = q.eq("status", filters.status);
  if (filters.zone && filters.zone !== "all") q = q.eq("zone", filters.zone);
  if (filters.repId && filters.repId !== "all")
    q = q.eq("rep_id", filters.repId);
  if (filters.date && filters.date !== "all") q = q.eq("date", filters.date);

  const { data, error } = await q;
  if (error) {
    console.error("getRoutes:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) =>
    dbToRoute(r, r.route_stops?.sort((a: any, b: any) => a.position - b.position))
  );
}

export async function getRoute(id: string): Promise<Route | undefined> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*, route_stops(*)")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return dbToRoute(
    data,
    data.route_stops?.sort((a: any, b: any) => a.position - b.position)
  );
}

export async function createDraftRoute(
  repId: string,
  date: string
): Promise<string> {
  const supabase = createServerSupabaseClient();
  const rep = await getRep(repId);
  if (!rep) throw new Error("Rep not found");

  const { data: pool } = await supabase
    .from("retailers")
    .select("id, lat, lng, status")
    .eq("zone", rep.zone)
    .neq("status", "churned")
    .limit(20);

  const chosen = (pool ?? [])
    .sort((a: any, b: any) => a.id.localeCompare(b.id))
    .slice(0, 8);

  let cursor: { lat: number; lng: number } | null = null;
  let accKm = 0;
  let accMin = 0;
  const startMinutes = 8 * 60 + 45;

  const stops = chosen.map((ret: any, i: number) => {
    const km = cursor
      ? haversineKm(cursor.lat, cursor.lng, ret.lat, ret.lng) * 1.3
      : 1.5;
    const min = Math.max(5, Math.round(km * 2.4));
    cursor = { lat: ret.lat, lng: ret.lng };
    accKm += km;
    accMin += min;
    const vs = startMinutes + accMin;
    const dur = 26;
    accMin += dur;
    return {
      retailer_id: ret.id,
      position: i + 1,
      planned_start: hm(vs),
      planned_end: hm(vs + dur),
      visit_type: (ret.status === "prospect" ? "prospecting" : "retail") as
        | "prospecting"
        | "retail",
      km_from_prev: i === 0 ? 0 : Math.round(km * 10) / 10,
      minutes_from_prev: i === 0 ? 0 : min,
    } satisfies {
      retailer_id: string;
      position: number;
      planned_start: string;
      planned_end: string;
      visit_type: "prospecting" | "retail";
      km_from_prev: number;
      minutes_from_prev: number;
    };
  });

  const routeStart = hm(startMinutes);
  const routeEnd = hm(startMinutes + accMin);

  const { data: route, error } = await supabase
    .from("routes")
    .insert({
      date,
      rep_id: repId,
      zone: rep.zone,
      status: "draft",
      total_km: Math.round(accKm),
      total_travel_min: Math.round(accMin),
      start_time: routeStart,
      end_time: routeEnd,
    })
    .select("id")
    .single();

  if (error || !route) throw new Error(error?.message ?? "Route insert failed");

  if (stops.length > 0) {
    const { error: stopsError } = await supabase.from("route_stops").insert(
      stops.map((s) => ({ ...s, route_id: route.id }))
    );
    if (stopsError) throw new Error(stopsError.message);
  }

  return route.id;
}

export async function deleteRoute(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("routes").delete().eq("id", id);
}

export async function setRouteStatus(
  id: string,
  status: RouteStatus,
  reason?: string
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const update: any = { status };
  if (reason) {
    update.revised_reason = reason;
    update.revised_by = "current-user"; // TODO: resolve from session
  }
  await supabase.from("routes").update(update).eq("id", id);
}

export async function replaceRouteStops(
  id: string,
  stops: RouteStop[]
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("route_stops").delete().eq("route_id", id);
  if (stops.length > 0) {
    await supabase.from("route_stops").insert(
      stops.map((s) => ({
        route_id: id,
        retailer_id: s.retailerId,
        position: s.order,
        planned_start: s.plannedStart,
        planned_end: s.plannedEnd,
        visit_type: s.visitType,
        km_from_prev: s.kmFromPrev,
        minutes_from_prev: s.minutesFromPrev,
      }))
    );
  }
}

export async function optimizeRoute(id: string): Promise<void> {
  const route = await getRoute(id);
  if (!route) return;
  const supabase = createServerSupabaseClient();

  const { data: retailers } = await supabase
    .from("retailers")
    .select("id, lat, lng")
    .in(
      "id",
      route.stops.map((s) => s.retailerId)
    );

  const retMap = new Map(
    (retailers ?? []).map((r: any) => [r.id, r])
  );

  const pts = route.stops
    .map((s) => retMap.get(s.retailerId))
    .filter(Boolean) as { id: string; lat: number; lng: number }[];

  if (pts.length === 0) return;

  const centre = pts.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  centre.lat /= pts.length;
  centre.lng /= pts.length;

  const ordered: typeof pts = [];
  const remaining = [...pts];
  let cursor: { lat: number; lng: number } = centre;
  while (remaining.length) {
    let bestIdx = 0;
    let bestKm = Infinity;
    remaining.forEach((p, i) => {
      const km = haversineKm(cursor.lat, cursor.lng, p.lat, p.lng);
      if (km < bestKm) {
        bestKm = km;
        bestIdx = i;
      }
    });
    cursor = remaining[bestIdx];
    ordered.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  let accKm = 0;
  let accMin = 0;
  const [sh, sm] = route.startTime.split(":").map(Number);
  const startMin = sh * 60 + sm;

  const newStops: RouteStop[] = ordered.map((ret, i) => {
    const km =
      i === 0
        ? 1.5
        : haversineKm(ordered[i - 1].lat, ordered[i - 1].lng, ret.lat, ret.lng) *
          1.3;
    const min = Math.max(5, Math.round(km * 2.4));
    accKm += km;
    accMin += min;
    const visitStart = startMin + accMin;
    const dur = 26;
    const prev = route.stops.find((s) => s.retailerId === ret.id);
    const stop: RouteStop = {
      retailerId: ret.id,
      order: i + 1,
      plannedStart: hm(visitStart),
      plannedEnd: hm(visitStart + dur),
      visitType: prev?.visitType ?? "retail",
      kmFromPrev: i === 0 ? 0 : Math.round(km * 10) / 10,
      minutesFromPrev: i === 0 ? 0 : min,
    };
    accMin += dur;
    return stop;
  });

  await replaceRouteStops(id, newStops);

  const visitMins = newStops.reduce(
    (s, st) => s + (parseHm(st.plannedEnd) - parseHm(st.plannedStart)),
    0
  );
  await supabase
    .from("routes")
    .update({
      total_km: Math.round(accKm),
      total_travel_min: Math.round(accMin),
      end_time: hm(startMin + accMin + visitMins),
    })
    .eq("id", id);
}

function parseHm(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hm(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// --- visits -----------------------------------------------------------------

export async function getVisits(
  filters: { retailerId?: string; repId?: string; limit?: number } = {}
): Promise<Visit[]> {
  const supabase = createServerSupabaseClient();
  let q = supabase
    .from("visits")
    .select("*")
    .order("check_in_at", { ascending: false });

  if (filters.retailerId) q = q.eq("retailer_id", filters.retailerId);
  if (filters.repId) q = q.eq("rep_id", filters.repId);
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) {
    console.error("getVisits:", error.message);
    return [];
  }
  return (data ?? []).map(dbToVisit);
}

// --- orders & competitors ---------------------------------------------------

export async function getOrderIntents(): Promise<OrderIntent[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("order_intents")
    .select("*, order_intent_items(*)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getOrderIntents:", error.message);
    return [];
  }
  return (data ?? []).map((o: any) => ({
    id: o.id,
    retailerId: o.retailer_id,
    repId: o.rep_id ?? "",
    createdAt: o.created_at,
    items: (o.order_intent_items ?? []).map((i: any) => ({
      sku: i.sku,
      name: i.name ?? i.sku,
      qty: i.quantity,
    })),
    total: Number(o.total) ?? 0,
    forwardStatus: o.forward_status,
  }));
}

export async function getCompetitorObservations(): Promise<
  CompetitorObservation[]
> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("competitor_observations")
    .select("*")
    .order("at", { ascending: false });
  if (error) {
    console.error("getCompetitorObservations:", error.message);
    return [];
  }
  return (data ?? []).map((c: any) => ({
    id: c.id,
    retailerId: c.retailer_id,
    repId: c.rep_id ?? "",
    at: c.at,
    brand: c.brand,
    activity: c.activity,
    note: c.note ?? "",
  }));
}

// --- opportunities ----------------------------------------------------------

export async function getOpportunities(): Promise<Opportunity[]> {
  // Compute from retailer data (same logic as mock, but from DB)
  const retailers = await getRetailers();
  const out: Opportunity[] = [];
  for (const r of retailers) {
    if (r.status === "churned" || r.status === "at-risk") {
      out.push({
        id: `op-reactivation-${r.id}`,
        retailerId: r.id,
        type: "reactivation",
        potentialMonthlyKes: (r.avgOrderValue || 6000) * 4,
        priority: r.churnRisk === "high" ? "high" : "medium",
        reason: `${r.name} ${r.status === "churned" ? "stopped buying" : "at risk"} — competitor presence ${r.competitorPresence.length > 0 ? "detected" : "unknown"}.`,
      });
    }
    if (r.status === "prospect") {
      out.push({
        id: `op-expansion-${r.id}`,
        retailerId: r.id,
        type: "expansion",
        potentialMonthlyKes:
          9000 + Math.round(r.tier === "A" ? 18000 : r.tier === "B" ? 9000 : 3500),
        priority: r.tier === "A" ? "high" : "medium",
        reason: `Prospect outlet with ${r.tier}-tier potential not yet buying.`,
      });
    }
  }
  return out.sort((a, b) => {
    const w = { high: 3, medium: 2, low: 1 };
    return w[b.priority] - w[a.priority];
  });
}

// --- alerts -----------------------------------------------------------------

const readAlerts = new Set<string>();

export async function getAlerts(): Promise<Alert[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    console.error("getAlerts:", error.message);
    return [];
  }
  return (data ?? []).map((a: any) => ({
    id: a.id,
    severity: a.severity,
    category: a.category,
    title: a.title,
    message: a.message ?? "",
    createdAt: a.created_at,
    retailerId: a.retailer_id ?? undefined,
    read: readAlerts.has(a.id),
  }));
}

export function markAlertRead(id: string) {
  readAlerts.add(id);
}

export async function getAlertCounts() {
  const all = await getAlerts();
  return {
    total: all.length,
    critical: all.filter((a) => a.severity === "critical").length,
    warning: all.filter((a) => a.severity === "warning").length,
    unread: all.filter((a) => !a.read).length,
  };
}

// --- dashboard aggregates ---------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [retailers, visits, routes, reps, orderIntents, alertsList] =
    await Promise.all([
      supabase.from("retailers").select("*"),
      supabase
        .from("visits")
        .select("*")
        .gte("check_in_at", weekAgo.toISOString()),
      supabase
        .from("routes")
        .select("*, route_stops(*)")
        .eq("date", today),
      supabase.from("reps").select("*"),
      supabase.from("order_intents").select("*").eq("forward_status", "pending"),
      getAlerts(),
    ]);

  const allRetailers = (retailers.data ?? []).map(dbToRetailer);
  const allVisits = (visits.data ?? []).map(dbToVisit);
  const allReps = (reps.data ?? []).map(dbToRep);

  const active = allRetailers.filter((r) => r.status === "active");
  const atRisk = allRetailers.filter((r) => r.status === "at-risk");
  const prospects = allRetailers.filter((r) => r.status === "prospect");
  const churned = allRetailers.filter((r) => r.status === "churned");

  const wardsTotal = 84;
  const wardsCovered = new Set(
    allRetailers.filter((r) => r.status !== "churned").map((r) => r.ward)
  ).size;
  const coveragePct = Math.round((wardsCovered / wardsTotal) * 100);

  const todayVisits = allVisits.filter(
    (v) => v.at.slice(0, 10) === today
  );
  const weekVisits = allVisits;
  const verified = todayVisits.filter((v) => v.gpsVerified).length;
  const todayOrders = todayVisits.filter((v) => v.orderPlaced);
  const orderValueToday = todayOrders.reduce(
    (s, v) => s + (v.orderValue ?? 0),
    0
  );

  const healthDistribution = [
    {
      label: "Excellent (80+)",
      count: allRetailers.filter((r) => r.healthScore >= 80).length,
    },
    {
      label: "Good (60–79)",
      count: allRetailers.filter(
        (r) => r.healthScore >= 60 && r.healthScore < 80
      ).length,
    },
    {
      label: "Fair (40–59)",
      count: allRetailers.filter(
        (r) => r.healthScore >= 40 && r.healthScore < 60
      ).length,
    },
    {
      label: "Poor (<40)",
      count: allRetailers.filter((r) => r.healthScore < 40).length,
    },
  ];

  const weeklyTrend = [-6, -5, -4, -3, -2, -1, 0].map((off) => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    const dStr = d.toISOString().slice(0, 10);
    const dayVisits = allVisits.filter((v) => v.at.slice(0, 10) === dStr);
    const dayOrders = dayVisits.filter((v) => v.orderPlaced);
    return {
      day: d.toLocaleDateString("en-KE", { weekday: "short" }),
      visits: dayVisits.length,
      orders: dayOrders.length,
      value: dayOrders.reduce((s, v) => s + (v.orderValue ?? 0), 0),
    };
  });

  const visitsByRep = new Map<string, Visit[]>();
  for (const v of weekVisits)
    visitsByRep.set(v.repId, [...(visitsByRep.get(v.repId) ?? []), v]);

  const retByRep = new Map<string, Retailer[]>();
  for (const r of allRetailers)
    retByRep.set(r.repId, [...(retByRep.get(r.repId) ?? []), r]);

  const repLeaderboard = allReps.map((rep) => {
    const vs = visitsByRep.get(rep.id) ?? [];
    const orders = vs.filter((v) => v.orderPlaced);
    const rs = retByRep.get(rep.id) ?? [];
    const covered = new Set(
      rs.filter((r) => r.status !== "churned").map((r) => r.ward)
    ).size;
    return {
      repId: rep.id,
      name: rep.name,
      color: rep.color,
      visits: vs.length,
      orders: orders.length,
      value: orders.reduce((s, v) => s + (v.orderValue ?? 0), 0),
      coveragePct: Math.round(
        (covered / Math.max(1, rep.wards.length || 14)) * 100
      ),
    };
  });
  repLeaderboard.sort((a, b) => b.value - a.value);

  const wardCountByZone = new Map<string, number>();
  for (const f of TERRITORY_WARDS.features) {
    const z = f.properties.zone;
    wardCountByZone.set(z, (wardCountByZone.get(z) ?? 0) + 1);
  }

  const zoneCoverage: ZoneCoverage[] = ZONES.map((zone) => {
    const zoneRetailers = allRetailers.filter((r) => r.zone === zone);
    const wardsCovered = new Set(
      zoneRetailers
        .filter((r) => r.status !== "churned")
        .map((r) => r.ward)
    ).size;
    const total = wardCountByZone.get(zone) ?? 0;
    return {
      zone,
      wardsTotal: total,
      wardsCovered,
      retailers: zoneRetailers.length,
      active: zoneRetailers.filter((r) => r.status === "active").length,
      atRisk: zoneRetailers.filter(
        (r) => r.status === "at-risk" || r.status === "churned"
      ).length,
      coveragePct: total ? Math.round((wardsCovered / total) * 100) : 0,
    };
  });

  return {
    totals: {
      retailers: allRetailers.length,
      active: active.length,
      atRisk: atRisk.length,
      prospects: prospects.length,
      churned30d: churned.length,
    },
    coveragePct,
    visitsToday: todayVisits.length,
    visitsWeek: weekVisits.length,
    verificationRate: todayVisits.length
      ? Math.round((verified / todayVisits.length) * 100)
      : 0,
    ordersToday: todayOrders.length,
    orderValueToday,
    pendingOrderIntents: (orderIntents.data ?? []).length,
    activeReps: allReps.filter((r) => r.status === "active").length,
    onRouteNow: allReps.filter((r) => r.onRoute).length,
    routesToday: (routes.data ?? []).length,
    healthDistribution,
    weeklyTrend,
    repLeaderboard,
    alerts: alertsList.slice(0, 5),
    zoneCoverage,
  };
}

// --- zone coverage -----------------------------------------------------------

export async function getZoneCoverage(): Promise<ZoneCoverage[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("retailers").select("zone, ward, status");
  if (error) {
    console.error("getZoneCoverage:", error.message);
    return [];
  }

  const wardCountByZone = new Map<string, number>();
  for (const f of TERRITORY_WARDS.features) {
    const z = f.properties.zone;
    wardCountByZone.set(z, (wardCountByZone.get(z) ?? 0) + 1);
  }

  return ZONES.map((zone) => {
    const zoneRetailers = (data ?? []).filter((r) => r.zone === zone);
    const wardsCovered = new Set(
      zoneRetailers.filter((r) => r.status !== "churned").map((r) => r.ward)
    ).size;
    const total = wardCountByZone.get(zone) ?? 0;
    return {
      zone,
      wardsTotal: total,
      wardsCovered,
      retailers: zoneRetailers.length,
      active: zoneRetailers.filter((r) => r.status === "active").length,
      atRisk: zoneRetailers.filter(
        (r) => r.status === "at-risk" || r.status === "churned"
      ).length,
      coveragePct: total ? Math.round((wardsCovered / total) * 100) : 0,
    };
  });
}

// --- ward coverage (map overlay) --------------------------------------------

export async function getWardCoverage(): Promise<WardCoveragePoint[]> {
  const retailers = await getRetailers();
  const map = new Map<string, WardCoveragePoint>();
  for (const r of retailers) {
    const p = map.get(r.ward) ?? {
      ward: r.ward,
      zone: r.zone,
      total: 0,
      active: 0,
      atRisk: 0,
      lat: r.lat,
      lng: r.lng,
    };
    p.total++;
    if (r.status === "active") p.active++;
    if (r.status === "at-risk" || r.status === "churned") p.atRisk++;
    map.set(r.ward, p);
  }
  return Array.from(map.values());
}

// --- territory hierarchy ----------------------------------------------------

export async function getTerritoryHierarchy(): Promise<HierarchyNode[]> {
  const retailers = await getRetailers();
  return ZONES.map((zone) => {
    const zoneWards = WARD_META.filter((w) => w.zone === zone);
    const subcounties = Array.from(
      new Set(zoneWards.map((w) => w.constituency))
    ).sort();
    const children: HierarchyNode[] = subcounties.map((sub) => {
      const subWards = zoneWards.filter((w) => w.constituency === sub);
      const wardNodes: HierarchyNode[] = subWards.map((w) => {
        const rs = retailers.filter((r) => r.ward === w.ward);
        const active = rs.filter((r) => r.status === "active").length;
        return {
          id: `ward-${w.ward}`,
          name: w.ward,
          level: "ward" as const,
          zone,
          parentId: sub,
          retailerCount: rs.length,
          activeCount: active,
          coveragePct: rs.length
            ? Math.round((active / rs.length) * 100)
            : 0,
        };
      });
      const rs = subWards.flatMap((w) =>
        retailers.filter((r) => r.ward === w.ward)
      );
      const active = rs.filter((r) => r.status === "active").length;
      return {
        id: `sub-${sub}`,
        name: sub,
        level: "subcounty" as const,
        zone,
        retailerCount: rs.length,
        activeCount: active,
        coveragePct: rs.length
          ? Math.round((active / rs.length) * 100)
          : 0,
        children: wardNodes,
      };
    });
    const zoneRs = zoneWards.flatMap((w) =>
      retailers.filter((r) => r.ward === w.ward)
    );
    const active = zoneRs.filter((r) => r.status === "active").length;
    return {
      id: `zone-${zone}`,
      name: zone,
      level: "zone" as const,
      zone,
      retailerCount: zoneRs.length,
      activeCount: active,
      coveragePct: zoneRs.length
        ? Math.round((active / zoneRs.length) * 100)
        : 0,
      children,
    };
  });
}

// --- reports data -----------------------------------------------------------

export async function getRetailersByZone(): Promise<
  {
    zone: string;
    active: number;
    prospect: number;
    atRisk: number;
    churned: number;
    total: number;
  }[]
> {
  const retailers = await getRetailers();
  return ZONES.map((zone) => {
    const rs = retailers.filter((r) => r.zone === zone);
    return {
      zone,
      active: rs.filter((r) => r.status === "active").length,
      prospect: rs.filter((r) => r.status === "prospect").length,
      atRisk: rs.filter((r) => r.status === "at-risk").length,
      churned: rs.filter((r) => r.status === "churned").length,
      total: rs.length,
    };
  });
}

// --- census (live capture data) ---------------------------------------------

const ZONE_BY_WARD = new Map<string, WardZone>();
for (const f of TERRITORY_WARDS.features) {
  const w = f.properties.ward as string;
  const z = f.properties.zone as WardZone;
  if (!ZONE_BY_WARD.has(w)) ZONE_BY_WARD.set(w, z);
}

function zoneFor(ward: string | null | undefined): WardZone {
  if (!ward) return "Central";
  const z = ZONE_BY_WARD.get(ward);
  if (z && ZONES.includes(z)) return z;
  // Ward not in the geo map — infer nothing, fall back to Central.
  return "Central";
}

export async function getCensusSummary(): Promise<CensusSummary> {
  const supabase = createServerSupabaseClient();

  const [outlets, intercepts, reps, dailySubs] = await Promise.all([
    supabase
      .from("outlets")
      .select("ward, gps_lat, gps_lng, created_at")
      .is("deleted_at", null),
    supabase
      .from("consumer_intercepts")
      .select("ward, captured_at")
      .is("deleted_at", null),
    supabase.from("reps").select("zone, status").eq("status", "active"),
    supabase
      .from("daily_submissions")
      .select("submission_date, outlet_count, intercept_count")
      .order("submission_date", { ascending: true }),
  ]);

  const outletRows = (outlets.data ?? []) as {
    ward?: string | null;
    gps_lat?: number | null;
    gps_lng?: number | null;
    created_at?: string | null;
  }[];
  const interceptRows = (intercepts.data ?? []) as {
    ward?: string | null;
    captured_at?: string | null;
  }[];
  const repRows = (reps.data ?? []) as { zone?: string | null }[];
  const dailyRows = (dailySubs.data ?? []) as {
    submission_date?: string;
    outlet_count?: number | null;
    intercept_count?: number | null;
  }[];

  const byZoneInit: CensusSummary["byZone"] = ZONES.map((zone) => ({
    zone,
    outlets: 0,
    gpsCaptured: 0,
    intercepts: 0,
    officers: 0,
  }));

  const zoneMap = new Map(byZoneInit.map((z) => [z.zone, z]));
  for (const r of repRows) {
    const z = (r.zone ?? "Central") as WardZone;
    if (zoneMap.has(z)) zoneMap.get(z)!.officers += 1;
  }

  const wardMap = new Map<string, CensusWard>();
  let totalOutlets = 0;
  let gpsCaptured = 0;
  let lastCaptureAt: string | null = null;

  for (const o of outletRows) {
    const ward = o.ward ?? "";
    const zone = zoneFor(ward);
    const z = zoneMap.get(zone)!;
    z.outlets += 1;
    totalOutlets += 1;
    if (o.gps_lat != null && o.gps_lng != null) {
      z.gpsCaptured += 1;
      gpsCaptured += 1;
    }
    const w = wardMap.get(ward) ?? { ward, zone, outlets: 0, gpsCaptured: 0, intercepts: 0 };
    w.outlets += 1;
    if (o.gps_lat != null && o.gps_lng != null) w.gpsCaptured += 1;
    wardMap.set(ward, w);
    if (o.created_at && (!lastCaptureAt || o.created_at > lastCaptureAt)) {
      lastCaptureAt = o.created_at;
    }
  }

  for (const i of interceptRows) {
    const ward = i.ward ?? "";
    const zone = zoneFor(ward);
    zoneMap.get(zone)!.intercepts += 1;
    const w = wardMap.get(ward) ?? { ward, zone, outlets: 0, gpsCaptured: 0, intercepts: 0 };
    w.intercepts += 1;
    wardMap.set(ward, w);
    if (i.captured_at && (!lastCaptureAt || i.captured_at > lastCaptureAt)) {
      lastCaptureAt = i.captured_at;
    }
  }

  const byWard = Array.from(wardMap.values()).sort(
    (a, b) => b.outlets - a.outlets || a.ward.localeCompare(b.ward)
  );

  const daily = dailyRows.map((d) => ({
    date: d.submission_date ?? "",
    outlets: d.outlet_count ?? 0,
    intercepts: d.intercept_count ?? 0,
  }));

  return {
    totalOutlets,
    gpsCaptured,
    newRegistered: totalOutlets,
    intercepts: interceptRows.length,
    officers: repRows.length,
    lastCaptureAt,
    byZone: byZoneInit,
    byWard,
    daily,
  };
}

// --- role config ------------------------------------------------------------

// ROLE_CONFIG / getRoleConfig live in ./shared and are re-exported by index.ts.

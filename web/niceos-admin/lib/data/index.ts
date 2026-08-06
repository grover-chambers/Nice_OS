// NiceOS data service facade.
//
// Pages consume data ONLY through this module. Today it is backed by a
// deterministic in-memory demo dataset; when Supabase is configured the
// internals of these functions are swapped for queries — page code stays
// unchanged.

import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import { buildSeed, dateString, haversineKm, todayString, WARD_META } from "./seed";
import type {
  Alert,
  ChurnRisk,
  CompetitorObservation,
  Opportunity,
  OrderIntent,
  Rep,
  Retailer,
  RetailerStatus,
  Role,
  Route,
  RouteStatus,
  RouteStop,
  Visit,
  WardZone,
} from "./types";

// --- in-memory store --------------------------------------------------------

const seed = buildSeed();

const reps = [...seed.reps];
const retailers = [...seed.retailers];
const routes = [...seed.routes];
const visits = [...seed.visits];
const orderIntents = [...seed.orderIntents];
const competitorObservations = [...seed.competitorObservations];

export { dateString, todayString } from "./seed";

export const ZONES: WardZone[] = ["Western", "Central", "Northern", "Eastern", "South-Eastern", "Southern"];

// --- tiny utils -------------------------------------------------------------

const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));

export const fmtKes = (n: number) =>
  "KSh " +
  Math.round(n).toLocaleString("en-KE", { maximumFractionDigits: 0 });

export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-KE");

export const fmtPct = (n: number, digits = 0) =>
  `${n.toFixed(digits)}%`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const daysSince = (iso: string | null) => {
  if (!iso) return 999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

// --- retailers --------------------------------------------------------------

export type RetailerFilters = {
  q?: string;
  status?: RetailerStatus | "all";
  zone?: WardZone | "all";
  type?: Retailer["type"] | "all";
  tier?: Retailer["tier"] | "all";
  churnRisk?: ChurnRisk | "all";
  ward?: string | "all";
};

export function getRetailers(filters: RetailerFilters = {}): Retailer[] {
  let out = retailers;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        r.phone.includes(q)
    );
  }
  if (filters.status && filters.status !== "all") out = out.filter((r) => r.status === filters.status);
  if (filters.zone && filters.zone !== "all") out = out.filter((r) => r.zone === filters.zone);
  if (filters.type && filters.type !== "all") out = out.filter((r) => r.type === filters.type);
  if (filters.tier && filters.tier !== "all") out = out.filter((r) => r.tier === filters.tier);
  if (filters.churnRisk && filters.churnRisk !== "all") out = out.filter((r) => r.churnRisk === filters.churnRisk);
  if (filters.ward && filters.ward !== "all") out = out.filter((r) => r.ward === filters.ward);
  return out.map((r) => ({ ...r }));
}

export function getRetailer(id: string): Retailer | undefined {
  const r = byId(retailers).get(id);
  return r ? { ...r } : undefined;
}

export function getRetailerCount(): number {
  return retailers.length;
}

export function createRetailer(input: Omit<Retailer, "id" | "createdAt" | "healthScore" | "churnRisk" | "lastVisitAt" | "visits30d" | "orders30d" | "avgOrderValue" | "orderTrendPct" | "competitorPresence">): Retailer {
  const retailer: Retailer = {
    ...input,
    id: `ret-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
    healthScore: 55,
    churnRisk: "medium",
    lastVisitAt: null,
    visits30d: 0,
    orders30d: 0,
    avgOrderValue: 0,
    orderTrendPct: 0,
    competitorPresence: [],
  };
  retailers.push(retailer);
  return retailer;
}

// --- reps -------------------------------------------------------------------

export function getReps(): Rep[] {
  return reps.map((r) => ({ ...r }));
}

export function getRep(id: string): Rep | undefined {
  const r = byId(reps).get(id);
  return r ? { ...r } : undefined;
}

export type RepManagementRow = {
  rep: Rep;
  targetVisitsMonth: number;
  actualVisitsMonth: number;
  visitsThisWeek: number;
  targetThisWeek: number;
  onTargetPct: number;
  ordersPlaced: number;
  orderValue: number;
  coverageWards: number;
  assignedWards: number;
  attendancePct: number;
  lastSyncAgoMin: number;
};

export function getRepManagement(): RepManagementRow[] {
  const retByRep = new Map<string, Retailer[]>();
  for (const r of retailers) {
    const arr = retByRep.get(r.repId) ?? [];
    arr.push(r);
    retByRep.set(r.repId, arr);
  }
  const visitByRep = new Map<string, Visit[]>();
  for (const v of visits) {
    const arr = visitByRep.get(v.repId) ?? [];
    arr.push(v);
    visitByRep.set(v.repId, arr);
  }
  return reps.map((rep) => {
    const rs = retByRep.get(rep.id) ?? [];
    const vs = visitByRep.get(rep.id) ?? [];
    const weekVisits = vs.filter((v) => daysSince(v.at) <= 7).length;
    const orders = vs.filter((v) => v.orderPlaced);
    const orderValue = orders.reduce((s, v) => s + (v.orderValue ?? 0), 0);
    const assignedWards = rep.wards.length || 1;
    const coveredWards = new Set(rs.filter((r) => r.status !== "churned").map((r) => r.ward)).size;
    return {
      rep,
      targetVisitsMonth: rep.targetVisitsMonth,
      actualVisitsMonth: rep.actualVisitsMonth,
      visitsThisWeek: weekVisits,
      targetThisWeek: Math.round(rep.targetVisitsMonth / 4.3),
      onTargetPct: Math.min(100, Math.round((rep.actualVisitsMonth / rep.targetVisitsMonth) * 100)),
      ordersPlaced: orders.length,
      orderValue,
      coverageWards: coveredWards,
      assignedWards,
      attendancePct: rep.status === "active" ? hashInt(78, 100, `att-${rep.id}`) : hashInt(30, 60, `att-${rep.id}`),
      lastSyncAgoMin: rep.onRoute ? hashInt(2, 60, `sync-${rep.id}`) : hashInt(90, 600, `sync-${rep.id}`),
    };
  });
}

function hashInt(min: number, max: number, key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return min + ((h >>> 0) % (max - min + 1));
}

// --- routes -----------------------------------------------------------------

export type RouteFilters = {
  status?: RouteStatus | "all";
  zone?: WardZone | "all";
  repId?: string | "all";
  date?: string | "all";
};

export function getRoutes(filters: RouteFilters = {}): Route[] {
  let out = routes;
  if (filters.status && filters.status !== "all") out = out.filter((r) => r.status === filters.status);
  if (filters.zone && filters.zone !== "all") out = out.filter((r) => r.zone === filters.zone);
  if (filters.repId && filters.repId !== "all") out = out.filter((r) => r.repId === filters.repId);
  if (filters.date && filters.date !== "all") out = out.filter((r) => r.date === filters.date);
  return out.map((r) => ({ ...r, stops: r.stops.map((s) => ({ ...s })) }));
}

export function getRoute(id: string): Route | undefined {
  const r = byId(routes).get(id);
  return r ? { ...r, stops: r.stops.map((s) => ({ ...s })) } : undefined;
}

export function createDraftRoute(repId: string, date: string): string {
  const rep = byId(reps).get(repId);
  if (!rep) throw new Error("Rep not found");
  const pool = retailers.filter((r) => r.zone === rep.zone && r.status !== "churned");
  const chosen: Retailer[] = [];
  while (chosen.length < Math.min(8, pool.length)) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!chosen.includes(r)) chosen.push(r);
  }
  let cursor: { lat: number; lng: number } | null = null;
  let accKm = 0;
  let accMin = 0;
  const startMinutes = 8 * 60 + Math.floor(Math.random() * 90);
  const stops: RouteStop[] = chosen.map((ret, i) => {
    const km = cursor ? haversineKm(cursor.lat, cursor.lng, ret.lat, ret.lng) * 1.3 : 1 + Math.random() * 2;
    const min = Math.max(5, Math.round(km * 2.4));
    cursor = { lat: ret.lat, lng: ret.lng };
    accKm += km;
    accMin += min;
    const vs = startMinutes + accMin;
    const dur = 26;
    accMin += dur;
    return {
      retailerId: ret.id,
      order: i + 1,
      plannedStart: hm(vs),
      plannedEnd: hm(vs + dur),
      visitType: ret.status === "prospect" ? "prospecting" : "retail",
      kmFromPrev: i === 0 ? 0 : Math.round(km * 10) / 10,
      minutesFromPrev: i === 0 ? 0 : min,
    };
  });
  const route: Route = {
    id: `rt-manual-${Date.now()}`,
    date,
    repId,
    zone: rep.zone,
    status: "draft",
    stops,
    totalKm: Math.round(accKm),
    totalTravelMin: Math.round(accMin),
    startTime: hm(startMinutes),
    endTime: hm(startMinutes + accMin),
    createdAt: nowIso(),
    createdBy: "You",
  };
  routes.push(route);
  return route.id;
}

export function deleteRoute(id: string) {
  const idx = routes.findIndex((r) => r.id === id);
  if (idx >= 0) routes.splice(idx, 1);
}

export function nowIso() {
  return new Date().toISOString();
}

export function setRouteStatus(id: string, status: RouteStatus, reason?: string) {
  const route = routes.find((r) => r.id === id);
  if (!route) return;
  route.status = status;
  if (reason) route.revisedReason = reason;
  if (status === "submitted" || status === "approved" || status === "needs-revision") {
    route.revisedBy = "You";
  }
}

export function replaceRouteStops(id: string, stops: RouteStop[]) {
  const route = routes.find((r) => r.id === id);
  if (!route) return;
  route.stops = stops.map((s) => ({ ...s }));
  recomputeRouteMetrics(route);
}

/** Nearest-neighbour ordering from the zone centroid — simulates route optimisation. */
export function optimizeRoute(id: string) {
  const route = routes.find((r) => r.id === id);
  if (!route) return;
  const retById = byId(retailers);
  const pts = route.stops
    .map((s) => retById.get(s.retailerId))
    .filter((r): r is Retailer => Boolean(r));

  const centre = pts.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  centre.lat /= pts.length;
  centre.lng /= pts.length;

  const ordered: Retailer[] = [];
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

  const minutesPerKm = 2.4; // urban 25 km/h + dwell allowance
  let accKm = 0;
  let accMin = 0;
  const [sh, sm] = route.startTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  route.stops = ordered.map((ret, i) => {
    const km = i === 0 ? 1 + Math.random() * 2 : haversineKm(ordered[i - 1].lat, ordered[i - 1].lng, ret.lat, ret.lng) * 1.3;
    const min = Math.max(5, Math.round(km * minutesPerKm));
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
  recomputeRouteMetrics(route);
}

function recomputeRouteMetrics(route: Route) {
  route.totalKm = Math.round(route.stops.reduce((s, st) => s + st.kmFromPrev, 0));
  route.totalTravelMin = route.stops.reduce((s, st) => s + st.minutesFromPrev, 0);
  const [sh, sm] = route.startTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const visitMins = route.stops.reduce(
    (s, st) => s + (parseHm(st.plannedEnd) - parseHm(st.plannedStart)),
    0
  );
  route.endTime = hm(startMin + route.totalTravelMin + visitMins);
}

function parseHm(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hm(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// --- visits -----------------------------------------------------------------

export function getVisits(filters: { retailerId?: string; repId?: string; limit?: number } = {}): Visit[] {
  let out = visits;
  if (filters.retailerId) out = out.filter((v) => v.retailerId === filters.retailerId);
  if (filters.repId) out = out.filter((v) => v.repId === filters.repId);
  const sorted = [...out].sort((a, b) => b.at.localeCompare(a.at));
  return filters.limit ? sorted.slice(0, filters.limit) : sorted;
}

// --- orders & competitors ---------------------------------------------------

export function getOrderIntents(): OrderIntent[] {
  return [...orderIntents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCompetitorObservations(): CompetitorObservation[] {
  return [...competitorObservations].sort((a, b) => b.at.localeCompare(a.at));
}

// --- opportunities (opportunity engine) -------------------------------------

export function getOpportunities(): Opportunity[] {
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
        potentialMonthlyKes: 9000 + Math.round(r.tier === "A" ? 18000 : r.tier === "B" ? 9000 : 3500),
        priority: r.tier === "A" ? "high" : "medium",
        reason: `Prospect outlet with ${r.tier}-tier potential not yet buying.`,
      });
    }
    if (r.status === "active" && r.visits30d > 0 && r.orders30d / Math.max(1, r.visits30d) < 0.6) {
      out.push({
        id: `op-category-${r.id}`,
        retailerId: r.id,
        type: "category-growth",
        potentialMonthlyKes: Math.round(r.avgOrderValue * 1.2),
        priority: "medium",
        reason: "Low order-to-visit conversion — upselling opportunity.",
      });
    }
    if (r.status === "active" && r.visits30d >= 4 && r.orders30d >= 3) {
      out.push({
        id: `op-promo-${r.id}`,
        retailerId: r.id,
        type: "promo-placement",
        potentialMonthlyKes: Math.round(r.avgOrderValue * 0.5),
        priority: "low",
        reason: "Consistent buyer — good candidate for promo display.",
      });
    }
    if (r.shelfNote) {
      out.push({
        id: `op-stock-${r.id}`,
        retailerId: r.id,
        type: "stock-correct",
        potentialMonthlyKes: Math.round((r.avgOrderValue || 5000) * 0.6),
        priority: r.churnRisk === "high" ? "high" : "medium",
        reason: r.shelfNote,
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

export function getAlerts(): Alert[] {
  const out: Alert[] = [];
  const retById = byId(retailers);

  for (const r of retailers) {
    if (r.churnRisk === "high" && (r.status === "at-risk" || r.status === "churned")) {
      out.push({
        id: `al-churn-${r.id}`,
        severity: "critical",
        category: "churn",
        title: `Churn risk: ${r.name}`,
        message: `${r.owner} last ordered ${r.lastVisitAt ? `${daysSince(r.lastVisitAt)} days ago` : "long ago"}. Health score ${r.healthScore}/100.`,
        createdAt: r.lastVisitAt ?? r.createdAt,
        retailerId: r.id,
        read: false,
      });
    }
    if (r.status === "active" && r.visits30d === 0) {
      out.push({
        id: `al-visit-${r.id}`,
        severity: "warning",
        category: "visit",
        title: `Coverage gap: ${r.name}`,
        message: "Active retailer not visited in the last 30 days — exceeds 2-week call cycle.",
        createdAt: r.createdAt,
        retailerId: r.id,
        read: false,
      });
    }
  }

  for (const o of competitorObservations.slice(0, 12)) {
    const r = retById.get(o.retailerId);
    out.push({
      id: `al-comp-${o.id}`,
      severity: o.activity === "price-drop" || o.activity === "promo" ? "warning" : "info",
      category: "competitive",
      title: `${o.brand} activity at ${r?.name ?? "outlet"}`,
      message: `${o.activity.replace(/-/g, " ")}: ${o.note}`,
      createdAt: o.at,
      retailerId: o.retailerId,
      read: false,
    });
  }

  for (const v of visits.filter((x) => x.status === "no-stock")) {
    const r = retById.get(v.retailerId);
    out.push({
      id: `al-stock-${v.id}`,
      severity: "warning",
      category: "stock",
      title: `Stockout at ${r?.name ?? "outlet"}`,
      message: `No Nice product on shelf — rep ${getRep(v.repId)?.name ?? ""} flagged replenishment.`,
      createdAt: v.at,
      retailerId: v.retailerId,
      read: false,
    });
  }

  for (const rt of routes.filter((r) => r.status === "submitted")) {
    out.push({
      id: `al-route-${rt.id}`,
      severity: "info",
      category: "route",
      title: `Route awaiting approval`,
      message: `${rt.date} route for ${getRep(rt.repId)?.name ?? ""} (${rt.stops.length} stops) submitted for review.`,
      createdAt: rt.createdAt,
      read: false,
    });
  }
  for (const rt of routes.filter((r) => r.status === "needs-revision")) {
    out.push({
      id: `al-rev-${rt.id}`,
      severity: "warning",
      category: "route",
      title: `Route needs revision`,
      message: `${rt.date} route requires changes before approval.`,
      createdAt: rt.createdAt,
      read: false,
    });
  }

  return out
    .sort((a, b) => {
      const w = { critical: 3, warning: 2, info: 1 };
      return w[b.severity] - w[a.severity] || b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 40)
    .map((a) => ({ ...a, read: readAlerts.has(a.id) }));
}

export function markAlertRead(id: string) {
  readAlerts.add(id);
}

export function getAlertCounts() {
  const all = getAlerts();
  return {
    total: all.length,
    critical: all.filter((a) => a.severity === "critical").length,
    warning: all.filter((a) => a.severity === "warning").length,
    unread: all.filter((a) => !a.read).length,
  };
}

// --- dashboard aggregates ---------------------------------------------------

export type ZoneCoverage = {
  zone: WardZone;
  wardsTotal: number;
  wardsCovered: number;
  retailers: number;
  active: number;
  atRisk: number;
  coveragePct: number;
};

export function getZoneCoverage(): ZoneCoverage[] {
  const wardCountByZone = new Map<WardZone, number>();
  for (const f of TERRITORY_WARDS.features) {
    wardCountByZone.set(f.properties.zone, (wardCountByZone.get(f.properties.zone) ?? 0) + 1);
  }
  return ZONES.map((zone) => {
    const zoneRetailers = retailers.filter((r) => r.zone === zone);
    const wardsCovered = new Set(zoneRetailers.filter((r) => r.status !== "churned").map((r) => r.ward)).size;
    const total = wardCountByZone.get(zone) ?? 0;
    return {
      zone,
      wardsTotal: total,
      wardsCovered,
      retailers: zoneRetailers.length,
      active: zoneRetailers.filter((r) => r.status === "active").length,
      atRisk: zoneRetailers.filter((r) => r.status === "at-risk" || r.status === "churned").length,
      coveragePct: total ? Math.round((wardsCovered / total) * 100) : 0,
    };
  });
}

export type DashboardSummary = {
  totals: {
    retailers: number;
    active: number;
    atRisk: number;
    prospects: number;
    churned30d: number;
  };
  coveragePct: number;
  visitsToday: number;
  visitsWeek: number;
  verificationRate: number;
  ordersToday: number;
  orderValueToday: number;
  pendingOrderIntents: number;
  activeReps: number;
  onRouteNow: number;
  routesToday: number;
  healthDistribution: { label: string; count: number }[];
  weeklyTrend: { day: string; visits: number; orders: number; value: number }[];
  repLeaderboard: { repId: string; name: string; color: string; visits: number; orders: number; value: number; coveragePct: number }[];
  alerts: Alert[];
  zoneCoverage: ZoneCoverage[];
};

export function getDashboardSummary(): DashboardSummary {
  const active = retailers.filter((r) => r.status === "active");
  const atRisk = retailers.filter((r) => r.status === "at-risk");
  const churned = retailers.filter((r) => r.status === "churned");
  const prospects = retailers.filter((r) => r.status === "prospect");

  const wardsTotal = 85;
  const wardsCovered = new Set(retailers.filter((r) => r.status !== "churned").map((r) => r.ward)).size;
  const coveragePct = Math.round((wardsCovered / wardsTotal) * 100);

  const today = todayString();
  const todayVisits = visits.filter((v) => v.at.slice(0, 10) === today);
  const weekVisits = visits.filter((v) => daysSince(v.at) <= 7);
  const verified = todayVisits.filter((v) => v.gpsVerified).length;
  const todayOrders = todayVisits.filter((v) => v.orderPlaced);
  const orderValueToday = todayOrders.reduce((s, v) => s + (v.orderValue ?? 0), 0);

  const healthDistribution = [
    { label: "Excellent (80+)", count: retailers.filter((r) => r.healthScore >= 80).length },
    { label: "Good (60–79)", count: retailers.filter((r) => r.healthScore >= 60 && r.healthScore < 80).length },
    { label: "Fair (40–59)", count: retailers.filter((r) => r.healthScore >= 40 && r.healthScore < 60).length },
    { label: "Poor (<40)", count: retailers.filter((r) => r.healthScore < 40).length },
  ];

  const weeklyTrend = [-6, -5, -4, -3, -2, -1, 0].map((off) => {
    const d = dateString(off);
    const dayVisits = visits.filter((v) => v.at.slice(0, 10) === d);
    const dayOrders = dayVisits.filter((v) => v.orderPlaced);
    return {
      day: new Date(d + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short" }),
      visits: dayVisits.length,
      orders: dayOrders.length,
      value: dayOrders.reduce((s, v) => s + (v.orderValue ?? 0), 0),
    };
  });

  const visitsByRep = new Map<string, Visit[]>();
  for (const v of weekVisits) visitsByRep.set(v.repId, [...(visitsByRep.get(v.repId) ?? []), v]);

  const retByRep = new Map<string, Retailer[]>();
  for (const r of retailers) retByRep.set(r.repId, [...(retByRep.get(r.repId) ?? []), r]);

  const repLeaderboard = reps.map((rep) => {
    const vs = visitsByRep.get(rep.id) ?? [];
    const orders = vs.filter((v) => v.orderPlaced);
    const rs = retByRep.get(rep.id) ?? [];
    const covered = new Set(rs.filter((r) => r.status !== "churned").map((r) => r.ward)).size;
    return {
      repId: rep.id,
      name: rep.name,
      color: rep.color,
      visits: vs.length,
      orders: orders.length,
      value: orders.reduce((s, v) => s + (v.orderValue ?? 0), 0),
      coveragePct: Math.round((covered / Math.max(1, rep.wards.length || 14)) * 100),
    };
  });
  repLeaderboard.sort((a, b) => b.value - a.value);

  return {
    totals: {
      retailers: retailers.length,
      active: active.length,
      atRisk: atRisk.length,
      prospects: prospects.length,
      churned30d: churned.length,
    },
    coveragePct,
    visitsToday: todayVisits.length,
    visitsWeek: weekVisits.length,
    verificationRate: todayVisits.length ? Math.round((verified / todayVisits.length) * 100) : 0,
    ordersToday: todayOrders.length,
    orderValueToday,
    pendingOrderIntents: orderIntents.filter((o) => o.forwardStatus === "pending" || o.forwardStatus === "failed").length,
    activeReps: reps.filter((r) => r.status === "active").length,
    onRouteNow: reps.filter((r) => r.onRoute).length,
    routesToday: routes.filter((r) => r.date === today).length,
    healthDistribution,
    weeklyTrend,
    repLeaderboard,
    alerts: getAlerts().slice(0, 5),
    zoneCoverage: getZoneCoverage(),
  };
}

// --- ward coverage (map overlay) --------------------------------------------

export type WardCoveragePoint = {
  ward: string;
  zone: WardZone;
  total: number;
  active: number;
  atRisk: number;
  lat: number;
  lng: number;
};

export function getWardCoverage(): WardCoveragePoint[] {
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

// --- territory hierarchy (M1) -----------------------------------------------

export type HierarchyNode = {
  id: string;
  name: string;
  level: "zone" | "subcounty" | "ward";
  zone?: WardZone;
  parentId?: string;
  retailerCount: number;
  activeCount: number;
  coveragePct: number;
  children?: HierarchyNode[];
};

export function getTerritoryHierarchy(): HierarchyNode[] {
  return ZONES.map((zone) => {
    const zoneWards = WARD_META.filter((w) => w.zone === zone);
    const subcounties = Array.from(new Set(zoneWards.map((w) => w.constituency))).sort();
    const children: HierarchyNode[] = subcounties.map((sub) => {
      const subWards = zoneWards.filter((w) => w.constituency === sub);
      const wardNodes: HierarchyNode[] = subWards.map((w) => {
        const rs = retailers.filter((r) => r.ward === w.ward);
        const active = rs.filter((r) => r.status === "active").length;
        return {
          id: `ward-${w.ward}`,
          name: w.ward,
          level: "ward",
          zone,
          parentId: sub,
          retailerCount: rs.length,
          activeCount: active,
          coveragePct: rs.length ? Math.round((active / rs.length) * 100) : 0,
        };
      });
      const rs = subWards.flatMap((w) => retailers.filter((r) => r.ward === w.ward));
      const active = rs.filter((r) => r.status === "active").length;
      return {
        id: `sub-${sub}`,
        name: sub,
        level: "subcounty",
        zone,
        retailerCount: rs.length,
        activeCount: active,
        coveragePct: rs.length ? Math.round((active / rs.length) * 100) : 0,
        children: wardNodes,
      };
    });
    const zoneRs = zoneWards.flatMap((w) => retailers.filter((r) => r.ward === w.ward));
    const active = zoneRs.filter((r) => r.status === "active").length;
    return {
      id: `zone-${zone}`,
      name: zone,
      level: "zone",
      zone,
      retailerCount: zoneRs.length,
      activeCount: active,
      coveragePct: zoneRs.length ? Math.round((active / zoneRs.length) * 100) : 0,
      children,
    };
  });
}

// --- reports data -----------------------------------------------------------

export function getRetailersByZone(): { zone: string; active: number; prospect: number; atRisk: number; churned: number; total: number }[] {
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

export type RoleConfig = {
  role: Role;
  label: string;
  description: string;
  nav: { href: string; label: string }[];
};

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  admin: {
    role: "admin",
    label: "Platform Admin",
    description: "Full access across all modules and configuration.",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/territories", label: "Territories" },
      { href: "/territories/manage", label: "Territory Hierarchy" },
      { href: "/retailers", label: "Retailers" },
      { href: "/routes", label: "Routes" },
      { href: "/visits", label: "Visits" },
      { href: "/rep-management", label: "Rep Management" },
      { href: "/analytics", label: "Analytics" },
      { href: "/reports", label: "Reports" },
      { href: "/alerts", label: "Alerts" },
      { href: "/users", label: "Users & Roles" },
      { href: "/settings", label: "Settings" },
    ],
  },
  territory_manager: {
    role: "territory_manager",
    label: "Territory Manager",
    description: "Operational management — routes, reps and retail coverage.",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/territories", label: "Territories" },
      { href: "/retailers", label: "Retailers" },
      { href: "/routes", label: "Routes" },
      { href: "/visits", label: "Visits" },
      { href: "/rep-management", label: "Rep Management" },
      { href: "/analytics", label: "Analytics" },
      { href: "/reports", label: "Reports" },
      { href: "/alerts", label: "Alerts" },
    ],
  },
  sales_rep: {
    role: "sales_rep",
    label: "Sales Rep",
    description: "Your territory, routes and retailer interactions.",
    nav: [
      { href: "/dashboard", label: "My Dashboard" },
      { href: "/territories", label: "My Territory" },
      { href: "/retailers", label: "My Retailers" },
      { href: "/routes", label: "My Routes" },
      { href: "/visits", label: "My Visits" },
      { href: "/alerts", label: "Alerts" },
    ],
  },
  ceo: {
    role: "ceo",
    label: "CEO",
    description: "Executive report view for the Nice Limited CEO.",
    nav: [
      { href: "/client", label: "Overview" },
      { href: "/analytics", label: "Market Analytics" },
      { href: "/reports", label: "Reports" },
    ],
  },
};

export function getRoleConfig(role: Role): RoleConfig {
  return ROLE_CONFIG[role];
}

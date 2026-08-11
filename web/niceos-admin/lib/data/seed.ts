// Deterministic demo dataset generator. Values are seeded so server render and
// client hydration always agree. Dates are anchored to the real "today" so the
// dashboard always shows meaningful current-day data.

import { WARD_ZONES } from "@/lib/geo/nairobi-wards";
import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import type {
  ChurnRisk,
  CompetitorObservation,
  OrderIntent,
  OutletType,
  Rep,
  Retailer,
  Route,
  RouteStatus,
  RouteStop,
  Tier,
  Visit,
  VisitType,
  WardZone,
} from "./types";

export type WardMeta = {
  ward: string;
  constituency: string;
  zone: WardZone;
};

export const WARD_META: WardMeta[] = TERRITORY_WARDS.features.map((f) => ({
  ward: f.properties.ward,
  constituency: f.properties.constituency,
  zone: f.properties.zone as WardZone,
}));

export const CONSTITUENCIES = Array.from(
  new Set(WARD_META.map((w) => w.constituency))
).sort();

export const RETAILER_TYPE_LABELS: Record<OutletType, string> = {
  duka: "Duka (grocer)",
  kiosk: "Kiosk",
  supermarket: "Supermarket",
  wholesaler: "Wholesaler",
  restaurant: "Restaurant",
  chemist: "Chemist",
};

export const TIER_LABELS: Record<Tier, string> = { A: "A", B: "B", C: "C" };

// --- deterministic PRNG -----------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const rand = mulberry32(0x4e494345); // "NICE"

function int(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function float(min: number, max: number) {
  return rand() * (max - min) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function weightedPick<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

// --- time helpers (anchored to real today) ----------------------------------

function dayStart(offsetDays: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}
export function dateString(offsetDays: number) {
  const d = dayStart(offsetDays);
  return d.toISOString().slice(0, 10);
}
function isoAt(offsetDays: number, hour: number, minute: number) {
  const d = dayStart(offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function isoDaysAgo(days: number, hour: number, minute: number) {
  return isoAt(-days, hour, minute);
}

export function todayString() {
  return dateString(0);
}
export function nowIso() {
  return new Date().toISOString();
}

// --- geometry ---------------------------------------------------------------

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Rough zone anchors so generated retailers scatter plausibly across the
// Nairobi-region territory (includes satellite town wards).
const ZONE_BBOX: Record<WardZone, [number, number, number, number]> = {
  Northern: [-1.05, 36.8, -1.27, 36.985], // minLat, minLng, maxLat, maxLng
  Kiambu: [-1.245, 36.64, -1.325, 36.815],
  Central: [-1.27, 36.79, -1.315, 36.875],
  Eastern: [-1.26, 36.87, -1.325, 36.985],
  Kajiado: [-1.3, 36.6, -1.46, 36.84],
  "South-Eastern": [-1.28, 36.7, -1.61, 37.02],
};

function zoneAnchor(zone: WardZone, wardKey: string): [number, number] {
  const [minLat, minLng, maxLat, maxLng] = ZONE_BBOX[zone];
  const h = hashStr(zone + wardKey) / 4294967295;
  const h2 = hashStr(wardKey + zone) / 4294967295;
  return [minLat + h * (maxLat - minLat), minLng + h2 * (maxLng - minLng)];
}

// --- people / branding ------------------------------------------------------

const REP_FIRST = ["Kevin", "Lucy", "Brian", "Amina", "Daniel", "Grace", "Peter", "Sarah", "John", "Faith", "Collins", "Mary", "Victor", "Naomi", "Erick"];
const REP_LAST = ["Otieno", "Mwangi", "Kamau", "Wanjiku", "Achieng", "Njoroge", "Mutua", "Kiprop", "Odhiambo", "Chebet", "Wekesa", "Nyambura", "Muthoni", "Omondi", "Kariuki"];

const SHOP_NAMES = ["Star", "Alpha", "Sunrise", "City", "Green", "GoodLife", "Unity", "Metro", "Family", "Sunshine", "Jumbo", "Bright", "Market", "Top", "Blessed", "Royal", "Quick", "Evergreen", "Central", "Kilimani", "Eastlands", "Imara", "Kamukunji", "Ngara", "Githurai", "Kayole", "Kangemi", "Kibera", "Roysambu", "Embakasi", "Mwiki", "Donholm", "Umoja", "Dandora", "Kawangware", "Westlands", "Lang'ata", "Karen", "South B", "South C", "Buruburu", "Rongai"];
const SHOP_SUFFIX = ["Stores", "Shop", "Mart", "Mini-Mart", "Wholesale", "Duka", "Dealers", "Depot", "Traders", "General", "Centre", "Kiosk"];

const OUTLET_POOL: OutletType[] = ["duka", "duka", "duka", "kiosk", "supermarket", "wholesaler", "restaurant", "chemist", "duka", "duka"];

const COMPETITORS = ["Unga Ltd", "Pembe Flour", "Mombasa Maize Millers", "Kitui Flour", "Bidco Millers"];

const SKUS: { sku: string; name: string; price: number }[] = [
  { sku: "NG-2", name: "Nice Ugali 2kg", price: 205 },
  { sku: "NG-5", name: "Nice Ugali 5kg", price: 490 },
  { sku: "NG-10", name: "Nice Ugali 10kg", price: 950 },
  { sku: "WM-2", name: "Nice Wimbi 2kg", price: 235 },
  { sku: "JR-2", name: "Nice Jogoo 2kg", price: 220 },
  { sku: "MC-5", name: "Nice Mchele 5kg", price: 620 },
];

// --- generation -------------------------------------------------------------

export type SeedData = {
  reps: Rep[];
  retailers: Retailer[];
  routes: Route[];
  visits: Visit[];
  orderIntents: OrderIntent[];
  competitorObservations: CompetitorObservation[];
};

const ZONE_WARD_INDEX: Record<WardZone, WardMeta[]> = WARD_ZONES.reduce(
  (acc, z) => {
    acc[z] = WARD_META.filter((w) => w.zone === z);
    return acc;
  },
  {} as Record<WardZone, WardMeta[]>
);

function genReps(): Rep[] {
  const zoneRepCount: [WardZone, number][] = [
    ["Central", 2],
    ["Northern", 2],
    ["Kiambu", 2],
    ["Eastern", 1],
    ["Kajiado", 1],
    ["South-Eastern", 2],
  ];
  const reps: Rep[] = [];
  let n = 0;
  for (const [zone, count] of zoneRepCount) {
    const zoneWards = ZONE_WARD_INDEX[zone].map((w) => w.ward);
    for (let i = 0; i < count; i++) {
      const name = `${pick(REP_FIRST)} ${pick(REP_LAST)}`;
      reps.push({
        id: `rep-${++n}`,
        name,
        phone: `07${int(10, 99)} ${int(100, 999)} ${int(100, 999)}`,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@niceos.co.ke`,
        color: pick(["#2563eb", "#0d9488", "#7c3aed", "#c2410c", "#be185d", "#4d7c0f", "#1d4ed8", "#9333ea", "#0f766e", "#b45309"]),
        zone,
        wards: zoneWards.filter(() => rand() < 0.45),
        targetVisitsMonth: 96,
        actualVisitsMonth: int(52, 101),
        onRoute: rand() < 0.5,
        lastSyncAt: isoDaysAgo(0, int(7, 9), int(0, 59)),
        device: pick(["Samsung A15", "Tecno Spark 10", "Infinix Note 30", "Redmi Note 13"]),
        status: rand() < 0.9 ? "active" : rand() < 0.5 ? "on-leave" : "inactive",
      });
    }
  }
  return reps;
}

function genRetailers(reps: Rep[]): Retailer[] {
  const retailers: Retailer[] = [];
  const repByZone = new Map<WardZone, Rep[]>();
  for (const r of reps) {
    const arr = repByZone.get(r.zone) ?? [];
    arr.push(r);
    repByZone.set(r.zone, arr);
  }

  const owners = ["James", "Fatuma", "Samuel", "Eunice", "David", "Halima", "George", "Mercy", "Stephen", "Catherine", "Ali", "Rose", "Patrick", "Jane", "Mohammed", "Agnes", "Joseph", "Teresa", "Michael", "Elizabeth"];

  for (const wardMeta of WARD_META) {
    const zoneReps = repByZone.get(wardMeta.zone) ?? [];
    if (zoneReps.length === 0) continue;
    const count = weightedPick<number>([
      [0, 14],
      [1, 30],
      [2, 28],
      [3, 18],
      [4, 8],
      [5, 2],
    ]);
    const [baseLat, baseLng] = zoneAnchor(wardMeta.zone, wardMeta.ward);
    for (let i = 0; i < count; i++) {
      const status = weightedPick([
        ["active", 0.58],
        ["prospect", 0.18],
        ["at-risk", 0.13],
        ["churned", 0.07],
        ["blocked", 0.04],
      ] as [Retailer["status"], number][]);
      const type = pick(OUTLET_POOL);
      const tier: Tier = type === "wholesaler" || type === "supermarket" ? weightedPick([["A", 0.4], ["B", 0.4], ["C", 0.2]]) : weightedPick([["A", 0.18], ["B", 0.4], ["C", 0.42]]);

      const healthScore =
        status === "churned" ? int(18, 40)
        : status === "at-risk" ? int(38, 58)
        : status === "blocked" ? int(30, 55)
        : int(58, 96);

      const churnRisk: Retailer["churnRisk"] =
        status === "churned" ? "high"
        : status === "at-risk" ? "high"
        : status === "prospect" ? weightedPick<ChurnRisk>([["low", 0.5], ["medium", 0.35], ["high", 0.15]])
        : healthScore < 60 ? "medium"
        : "low";

      const active = status === "active" || status === "at-risk";
      const visits30d = status === "churned" ? 0 : status === "prospect" ? int(0, 2) : int(2, 6);
      const orders30d = active ? Math.max(0, Math.round(visits30d * float(0.55, 0.9))) : status === "prospect" ? int(0, 1) : 0;
      const avgOrderValue = active ? int(3200, 9000) * (tier === "A" ? 2 : tier === "B" ? 1.5 : 1) : int(0, 2000);

      const lastVisit: Date | null =
        status === "churned"
          ? new Date(isoDaysAgo(int(35, 70), int(8, 16), int(0, 59)))
          : visits30d > 0
            ? new Date(isoDaysAgo(Math.min(int(0, 9), 9), int(8, 17), int(0, 59)))
            : null;

      const compPresence: Retailer["competitorPresence"] = [];
      if (rand() < 0.62) compPresence.push({ brand: "Unga Ltd", proximity: rand() < 0.5 ? "same-street" : "nearby" });
      if (rand() < 0.38) compPresence.push({ brand: "Pembe Flour", proximity: rand() < 0.5 ? "same-street" : "nearby" });
      if (rand() < 0.22) compPresence.push({ brand: "Mombasa Maize Millers", proximity: rand() < 0.6 ? "nearby" : "same-street" });

      const rep = pick(zoneReps);
      retailers.push({
        id: `ret-${retailers.length + 1}`,
        name: `${pick(SHOP_NAMES)} ${pick(SHOP_SUFFIX)}`,
        owner: `${pick(owners)} ${pick(REP_LAST)}`,
        phone: `07${int(10, 99)} ${int(100, 999)} ${int(100, 999)}`,
        type,
        tier,
        status,
        ward: wardMeta.ward,
        constituency: wardMeta.constituency,
        zone: wardMeta.zone,
        address: `${pick(["Kimathi St", "Moi Ave", "Jogoo Rd", "Tom Mboya St", "Kenyatta Ave", "Oginga Odinga St", "Koinange St", "Kipande Rd", "Ngong Rd", "Enterprise Rd"])} ${int(1, 120)}, ${wardMeta.ward}`,
        lat: baseLat + float(-0.0045, 0.0045),
        lng: baseLng + float(-0.0045, 0.0045),
        healthScore,
        churnRisk,
        lastVisitAt: lastVisit ? lastVisit.toISOString() : null,
        visits30d,
        orders30d,
        avgOrderValue: Math.round(avgOrderValue / 10) * 10,
        orderTrendPct: active ? int(-35, 45) : 0,
        repId: rep.id,
        createdAt: isoDaysAgo(int(30, 400), 9, 30),
        competitorPresence: compPresence,
        shelfNote:
          status === "churned" || status === "at-risk"
            ? "Low Nice stock — competitor shelf presence high"
            : undefined,
      });
    }
  }
  return retailers;
}

const VISIT_TYPES: VisitType[] = ["retail", "retail", "order-collection", "stock-check", "prospecting", "complaint-resolution"];

function genRoutes(reps: Rep[], retailers: Retailer[]): Route[] {
  const routes: Route[] = [];
  const retByZone = new Map<WardZone, Retailer[]>();
  for (const r of retailers) {
    const arr = retByZone.get(r.zone) ?? [];
    arr.push(r);
    retByZone.set(r.zone, arr);
  }

  let routeSeq = 0;
  for (let day = -6; day <= 1; day++) {
    for (const rep of reps) {
      if (rep.status !== "active" && rep.status !== "on-leave") continue;
      if (rand() < 0.18) continue; // not every rep runs every day
      const pool = retByZone.get(rep.zone) ?? [];
      if (pool.length === 0) continue;

      const status: RouteStatus =
        day < 0
          ? weightedPick([["completed", 0.9], ["needs-revision", 0.1]])
          : day === 0
            ? rand() < 0.6 ? "in-progress" : "approved"
            : weightedPick([["draft", 0.5], ["submitted", 0.3], ["approved", 0.2]]);

      const stopCount = int(5, 10);
      const chosen = new Set<Retailer>();
      const stops: RouteStop[] = [];
      let cursor: [number, number] | null = null;
      let accKm = 0;
      let accMin = 0;
      const startMinutes = int(8 * 60, 9 * 60 + 30);

      for (let i = 0; i < stopCount; i++) {
        const ret = pick(pool);
        if (chosen.has(ret)) continue;
        chosen.add(ret);
        const [toLat, toLng] = [ret.lat, ret.lng];
        const km = cursor ? haversineKm(cursor[0], cursor[1], toLat, toLng) * float(1.15, 1.5) : int(1, 3);
        const min = Math.round((km / 27) * 60) + int(0, 6);
        cursor = [toLat, toLng];
        accKm += km;
        accMin += min;
        const visitStart = startMinutes + accMin;
        const visitDur = int(18, 40);
        stops.push({
          retailerId: ret.id,
          order: i + 1,
          plannedStart: minsToHm(visitStart),
          plannedEnd: minsToHm(visitStart + visitDur),
          visitType: ret.status === "prospect" ? "prospecting" : pick(VISIT_TYPES),
          kmFromPrev: i === 0 ? 0 : Math.round(km * 10) / 10,
          minutesFromPrev: i === 0 ? 0 : min,
        });
        accMin += visitDur;
      }

      const startTime = minsToHm(startMinutes);
      routes.push({
        id: `rt-${++routeSeq}`,
        date: dateString(day),
        repId: rep.id,
        zone: rep.zone,
        status,
        stops,
        totalKm: Math.round(accKm),
        totalTravelMin: Math.round(accMin),
        startTime,
        endTime: minsToHm(startMinutes + accMin),
        createdAt: isoDaysAgo(Math.abs(day) + 1, 17, int(0, 59)),
        createdBy: "System",
      });
    }
  }
  return routes;
}

function minsToHm(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function genVisits(reps: Rep[], retailers: Retailer[], routes: Route[]): Visit[] {
  const visits: Visit[] = [];
  const retById = new Map(retailers.map((r) => [r.id, r]));
  const repById = new Map(reps.map((r) => [r.id, r]));
  let seq = 0;

  const pushVisit = (
    retailer: Retailer,
    rep: Rep,
    routeId: string | undefined,
    at: Date,
    status: Visit["status"],
    orderPlaced: boolean,
    visitDur: number
  ) => {
    const verified = status === "completed" || status === "no-stock" || status === "closed" ? rand() < 0.92 : false;
    const stockCaptured = verified && (status === "completed" || status === "no-stock");
    const items = stockCaptured
      ? SKUS.map((sku) => {
          const shelf: Visit["items"][number]["shelf"] = weightedPick([["full", 0.45], ["low", 0.4], ["out", 0.15]]);
          return { sku: sku.sku, name: sku.name, qty: shelf === "full" ? int(8, 40) : shelf === "low" ? int(1, 7) : 0, shelf };
        }).filter(() => rand() < 0.7)
      : [];
    const orderValue = orderPlaced ? items.reduce((s, it) => s + it.qty * (SKUS.find((k) => k.sku === it.sku)?.price ?? 0), 0) : undefined;
    visits.push({
      id: `vs-${++seq}`,
      retailerId: retailer.id,
      repId: rep.id,
      routeId,
      at: at.toISOString(),
      gpsVerified: verified,
      radiusM: verified ? int(40, 180) : int(180, 400),
      status,
      durationMin: visitDur,
      stockCaptured,
      photoCount: stockCaptured ? int(2, 6) : 0,
      orderPlaced,
      orderValue: orderValue ? Math.round(orderValue / 100) * 100 : undefined,
      notes:
        status === "no-stock"
          ? "No Nice stock available — noted for replenishment."
          : status === "closed"
            ? "Outlet closed during visit window."
            : rand() < 0.4
              ? "Customer requested promo pricing on 5kg Ugali."
              : undefined,
      items,
    });
  };

  // Visits derived from completed / in-progress route stops.
  for (const route of routes) {
    if (route.status !== "completed" && route.status !== "in-progress" && route.status !== "needs-revision") continue;
    const rep = repById.get(route.repId)!;
    const dayOffset = daysFromToday(route.date);
    for (const stop of route.stops) {
      const retailer = retById.get(stop.retailerId);
      if (!retailer) continue;
      const [h, m] = stop.plannedStart.split(":").map(Number);
      const at = dayStart(dayOffset);
      at.setHours(h, m, 0, 0);
      if (rand() < 0.16) continue; // some stops missed / unrecorded
      const status: Visit["status"] = weightedPick([["completed", 0.7], ["no-stock", 0.1], ["closed", 0.08], ["cancelled", 0.12]]);
      pushVisit(retailer, rep, route.id, at, status, status === "completed" && rand() < 0.62, int(16, 42));
    }
  }

  // A few extra ad-hoc visits.
  for (let i = 0; i < 24; i++) {
    const retailer = pick(retailers.filter((r) => r.status !== "churned"));
    const rep = repById.get(retailer.repId)!;
    const at = new Date(isoDaysAgo(int(0, 9), int(8, 17), int(0, 59)));
    pushVisit(retailer, rep, undefined, at, "completed", rand() < 0.6, int(15, 40));
  }

  return visits;
}

function daysFromToday(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff;
}

function genOrderIntents(reps: Rep[], retailers: Retailer[], routes: Route[]): OrderIntent[] {
  const intents: OrderIntent[] = [];
  const retById = new Map(retailers.map((r) => [r.id, r]));
  let seq = 0;
  const candidates = routes
    .filter((r) => r.status === "in-progress" || r.status === "approved" || r.status === "completed")
    .slice(-8);
  for (const route of candidates) {
    for (const stop of route.stops.slice(0, int(1, 3))) {
      const retailer = retById.get(stop.retailerId);
      if (!retailer || retailer.status === "churned") continue;
      const items = SKUS.filter(() => rand() < 0.55).map((sku) => ({ sku: sku.sku, name: sku.name, qty: int(2, 30) }));
      if (items.length === 0) continue;
      const total = items.reduce((s, it) => s + it.qty * (SKUS.find((k) => k.sku === it.sku)?.price ?? 0), 0);
      intents.push({
        id: `oi-${++seq}`,
        retailerId: retailer.id,
        repId: route.repId,
        createdAt: nowIso(),
        items,
        total,
        forwardStatus: weightedPick([["pending", 0.4], ["sent", 0.35], ["acknowledged", 0.15], ["failed", 0.1]]),
      });
    }
  }
  return intents;
}

function genCompetitorObservations(reps: Rep[], retailers: Retailer[]): CompetitorObservation[] {
  const obs: CompetitorObservation[] = [];
  let seq = 0;
  const pool = retailers.filter((r) => r.competitorPresence.length > 0 && r.status !== "churned");
  for (let i = 0; i < 22; i++) {
    const retailer = pick(pool);
    const brand = pick(retailer.competitorPresence).brand;
    obs.push({
      id: `co-${++seq}`,
      retailerId: retailer.id,
      repId: retailer.repId,
      at: new Date(isoDaysAgo(int(0, 7), int(8, 17), int(0, 59))).toISOString(),
      brand,
      activity: weightedPick([["price-drop", 0.25], ["promo", 0.3], ["new-listing", 0.2], ["stockout", 0.1], ["shelf-share", 0.15]]),
      note:
        weightedPick([
          ["Unga running 2kg @ KES 185 promotion.", 0.3],
          ["Competitor restocked shelf; Nice pushed to bottom.", 0.3],
          ["New competitor display at counter.", 0.2],
          ["Retailer reported lower demand — price sensitivity.", 0.2],
        ]),
    });
  }
  return obs;
}

export function buildSeed(): SeedData {
  const reps = genReps();
  const retailers = genRetailers(reps);
  const routes = genRoutes(reps, retailers);
  const visits = genVisits(reps, retailers, routes);
  const orderIntents = genOrderIntents(reps, retailers, routes);
  const competitorObservations = genCompetitorObservations(reps, retailers);
  return { reps, retailers, routes, visits, orderIntents, competitorObservations };
}

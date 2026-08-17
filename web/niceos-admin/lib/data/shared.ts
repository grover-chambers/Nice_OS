// NiceOS shared data layer — pure utilities, static reference data and
// domain types. Imports nothing from the demo dataset or the Supabase layer,
// so it is safe for any module (server, client, config) to import.

import { TERRITORY_WARDS } from "@/lib/geo/satellite-wards";
import type {
  Alert,
  ChurnRisk,
  OutletType,
  Rep,
  Retailer,
  RetailerStatus,
  Role,
  RouteStatus,
  Tier,
  Visit,
  WardZone,
} from "./types";

// --- zones ------------------------------------------------------------------

export const ZONES: WardZone[] = [
  "Kiambu",
  "Central",
  "Northern",
  "Eastern",
  "South-Eastern",
  "Kajiado",
];

// --- Market Link clusters ---------------------------------------------------
// The five census territories of the Market Link (Playmax x Nice Millers)
// programme. Reps and cluster leads are assigned to these; ward-level geo
// data above remains keyed by ZONES.
export const CLUSTERS = [
  "Central & CBD",
  "Northern Belt",
  "Eastern Corridor",
  "South & West",
  "Thika",
] as const;

export type Cluster = (typeof CLUSTERS)[number];

// --- tiny utils -------------------------------------------------------------

export const fmtKes = (n: number) =>
  "KSh " +
  Math.round(n).toLocaleString("en-KE", { maximumFractionDigits: 0 });

export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-KE");

export const fmtPct = (n: number, digits = 0) => `${n.toFixed(digits)}%`;

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

export function todayString() {
  return dateString(0);
}

export function nowIso() {
  return new Date().toISOString();
}

// --- geometry ---------------------------------------------------------------

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
) {
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

// --- static reference data --------------------------------------------------

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

// --- shared types -----------------------------------------------------------

export type RetailerFilters = {
  q?: string;
  status?: RetailerStatus | "all";
  zone?: WardZone | "all";
  type?: Retailer["type"] | "all";
  tier?: Retailer["tier"] | "all";
  churnRisk?: ChurnRisk | "all";
  ward?: string | "all";
};

export type RouteFilters = {
  status?: RouteStatus | "all";
  zone?: WardZone | "all";
  repId?: string | "all";
  date?: string | "all";
};

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

export type ZoneCoverage = {
  zone: WardZone;
  wardsTotal: number;
  wardsCovered: number;
  retailers: number;
  active: number;
  atRisk: number;
  coveragePct: number;
};

export type WardCoveragePoint = {
  ward: string;
  zone: WardZone;
  total: number;
  active: number;
  atRisk: number;
  lat: number;
  lng: number;
};

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
  repLeaderboard: {
    repId: string;
    name: string;
    color: string;
    visits: number;
    orders: number;
    value: number;
    coveragePct: number;
  }[];
  alerts: Alert[];
  zoneCoverage: ZoneCoverage[];
};

export type CensusWard = {
  ward: string;
  zone: WardZone;
  outlets: number;
  gpsCaptured: number;
  intercepts: number;
};

export type CensusSummary = {
  totalOutlets: number;
  gpsCaptured: number;
  newRegistered: number;
  intercepts: number;
  officers: number;
  lastCaptureAt: string | null;
  byZone: {
    zone: WardZone;
    outlets: number;
    gpsCaptured: number;
    intercepts: number;
    officers: number;
  }[];
  byWard: CensusWard[];
  daily: { date: string; outlets: number; intercepts: number }[];
};

// --- role config ------------------------------------------------------------

export type RoleConfig = {
  role: Role;
  label: string;
  description: string;
  nav: { href: string; label: string }[];
};

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin (Chairman)",
    description:
      "Full control of the platform — users, roles, configuration and every market module.",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/territories", label: "Territories" },
      { href: "/census", label: "Census" },
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
  admin: {
    role: "admin",
    label: "Platform Admin",
    description: "Full access across all modules and configuration.",
    nav: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/territories", label: "Territories" },
      { href: "/census", label: "Census" },
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
      { href: "/census", label: "Census" },
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
    description: "Executive report view for the NICE MILLERS LIMITED CEO.",
    nav: [
      { href: "/client", label: "Overview" },
      { href: "/census", label: "Census" },
      { href: "/analytics", label: "Market Analytics" },
      { href: "/reports", label: "Reports" },
    ],
  },
};

export function getRoleConfig(role: Role): RoleConfig {
  return ROLE_CONFIG[role];
}

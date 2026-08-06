// NiceOS domain types — shared across pages and (later) the Supabase data layer.

export type Role = "admin" | "territory_manager" | "sales_rep" | "ceo";

export type WardZone =
  | "Western"
  | "Central"
  | "Northern"
  | "Eastern"
  | "South-Eastern"
  | "Southern";

export type RetailerStatus =
  | "active"
  | "prospect"
  | "at-risk"
  | "churned"
  | "blocked";

export type OutletType =
  | "duka"
  | "kiosk"
  | "supermarket"
  | "wholesaler"
  | "restaurant"
  | "chemist";

export type Tier = "A" | "B" | "C";

export type ChurnRisk = "low" | "medium" | "high";

export type CompetitorPresence = {
  brand: string;
  proximity: "same-street" | "nearby";
};

export type Retailer = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  type: OutletType;
  tier: Tier;
  status: RetailerStatus;
  ward: string;
  constituency: string;
  zone: WardZone;
  address: string;
  lat: number;
  lng: number;
  healthScore: number; // 0–100
  churnRisk: ChurnRisk;
  lastVisitAt: string | null; // ISO
  visits30d: number;
  orders30d: number;
  avgOrderValue: number; // KES
  orderTrendPct: number; // % vs previous 30d
  repId: string;
  createdAt: string; // ISO
  competitorPresence: CompetitorPresence[];
  shelfNote?: string;
};

export type RepStatus = "active" | "on-leave" | "inactive";

export type Rep = {
  id: string;
  name: string;
  phone: string;
  email: string;
  color: string;
  zone: WardZone;
  wards: string[];
  targetVisitsMonth: number;
  actualVisitsMonth: number;
  onRoute: boolean; // currently out on a route
  lastSyncAt: string; // ISO
  device: string;
  status: RepStatus;
};

export type RouteStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "in-progress"
  | "completed"
  | "needs-revision";

export type VisitType =
  | "retail"
  | "order-collection"
  | "stock-check"
  | "prospecting"
  | "complaint-resolution";

export type RouteStop = {
  retailerId: string;
  order: number; // 1-based
  plannedStart: string; // "08:35"
  plannedEnd: string;
  visitType: VisitType;
  kmFromPrev: number;
  minutesFromPrev: number;
};

export type Route = {
  id: string;
  date: string; // YYYY-MM-DD
  repId: string;
  zone: WardZone;
  status: RouteStatus;
  stops: RouteStop[];
  totalKm: number;
  totalTravelMin: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdBy: string;
  revisedBy?: string;
  revisedReason?: string;
};

export type ShelfLevel = "full" | "low" | "out";

export type VisitItem = { sku: string; name: string; qty: number; shelf: ShelfLevel };

export type VisitStatus =
  | "completed"
  | "no-stock"
  | "closed"
  | "cancelled"
  | "missed";

export type Visit = {
  id: string;
  retailerId: string;
  repId: string;
  routeId?: string;
  at: string; // ISO
  gpsVerified: boolean;
  radiusM: number;
  status: VisitStatus;
  durationMin: number;
  stockCaptured: boolean;
  photoCount: number;
  orderPlaced: boolean;
  orderValue?: number;
  notes?: string;
  items: VisitItem[];
};

export type OrderIntent = {
  id: string;
  retailerId: string;
  repId: string;
  createdAt: string; // ISO
  items: { sku: string; name: string; qty: number }[];
  total: number; // KES
  forwardStatus: "pending" | "sent" | "failed" | "acknowledged";
};

export type CompetitorActivity =
  | "price-drop"
  | "promo"
  | "new-listing"
  | "stockout"
  | "shelf-share";

export type CompetitorObservation = {
  id: string;
  retailerId: string;
  repId: string;
  at: string; // ISO
  brand: string;
  activity: CompetitorActivity;
  note: string;
};

export type OpportunityType =
  | "reactivation"
  | "expansion"
  | "category-growth"
  | "promo-placement"
  | "stock-correct";

export type Opportunity = {
  id: string;
  retailerId: string;
  type: OpportunityType;
  potentialMonthlyKes: number;
  priority: "high" | "medium" | "low";
  reason: string;
};

export type AlertCategory =
  | "churn"
  | "competitive"
  | "stock"
  | "expiry"
  | "visit"
  | "route"
  | "system";

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  category: AlertCategory;
  title: string;
  message: string;
  createdAt: string; // ISO
  retailerId?: string;
  read: boolean;
};

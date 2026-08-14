// NiceOS data service facade.
//
// Pages consume data ONLY through this module. When Supabase is configured
// the functions query the database server-side; otherwise the deterministic
// in-memory demo dataset is used. Page code stays unchanged either way.

import { supabaseConfigured } from "@/lib/supabase/config";
import type {
  Alert,
  CompetitorObservation,
  Opportunity,
  OrderIntent,
  Rep,
  Retailer,
  RetailerStatus,
  Route,
  RouteStatus,
  RouteStop,
  Visit,
  WardZone,
  ChurnRisk,
  Role,
} from "./types";

// --- lazy imports -----------------------------------------------------------

import * as mock from "./mock";
import * as live from "./supabase";

// --- re-exports (zone list, utils, role config) ----------------------------

export const ZONES: WardZone[] = mock.ZONES;

export const fmtKes = mock.fmtKes;
export const fmtNum = mock.fmtNum;
export const fmtPct = mock.fmtPct;
export const fmtDate = mock.fmtDate;
export const fmtDateTime = mock.fmtDateTime;
export const daysSince = mock.daysSince;
export const dateString = mock.dateString;
export const todayString = mock.todayString;
export const nowIso = mock.nowIso;
export const ROLE_CONFIG = mock.ROLE_CONFIG;
export const getRoleConfig = mock.getRoleConfig;

// --- types re-exported for convenience --------------------------------------

export type {
  RetailerFilters,
  RouteFilters,
  DashboardSummary,
  ZoneCoverage,
  WardCoveragePoint,
  HierarchyNode,
  RepManagementRow,
  RoleConfig,
} from "./mock";

// --- facade: delegates to Supabase or mock based on config ------------------

// Retailers
export function getRetailers(
  filters?: mock.RetailerFilters
): Promise<Retailer[]> | Retailer[] {
  return supabaseConfigured
    ? live.getRetailers(filters)
    : Promise.resolve(mock.getRetailers(filters));
}

export function getRetailer(
  id: string
): Promise<Retailer | undefined> | Retailer | undefined {
  return supabaseConfigured
    ? live.getRetailer(id)
    : Promise.resolve(mock.getRetailer(id));
}

export function getRetailerCount(): Promise<number> | number {
  return supabaseConfigured
    ? live.getRetailerCount()
    : Promise.resolve(mock.getRetailerCount());
}

export function createRetailer(
  input: Parameters<typeof mock.createRetailer>[0]
): Promise<Retailer> | Retailer {
  return supabaseConfigured
    ? live.createRetailer(input)
    : Promise.resolve(mock.createRetailer(input));
}

// Reps
export function getReps(): Promise<Rep[]> | Rep[] {
  return supabaseConfigured
    ? live.getReps()
    : Promise.resolve(mock.getReps());
}

export function getRep(
  id: string
): Promise<Rep | undefined> | Rep | undefined {
  return supabaseConfigured
    ? live.getRep(id)
    : Promise.resolve(mock.getRep(id));
}

export function getRepManagement(): Promise<mock.RepManagementRow[]> | mock.RepManagementRow[] {
  return supabaseConfigured
    ? live.getRepManagement()
    : Promise.resolve(mock.getRepManagement());
}

// Routes
export function getRoutes(
  filters?: mock.RouteFilters
): Promise<Route[]> | Route[] {
  return supabaseConfigured
    ? live.getRoutes(filters)
    : Promise.resolve(mock.getRoutes(filters));
}

export function getRoute(
  id: string
): Promise<Route | undefined> | Route | undefined {
  return supabaseConfigured
    ? live.getRoute(id)
    : Promise.resolve(mock.getRoute(id));
}

export function createDraftRoute(
  repId: string,
  date: string
): Promise<string> | string {
  return supabaseConfigured
    ? live.createDraftRoute(repId, date)
    : Promise.resolve(mock.createDraftRoute(repId, date));
}

export function deleteRoute(id: string): Promise<void> | void {
  return supabaseConfigured
    ? live.deleteRoute(id)
    : Promise.resolve(mock.deleteRoute(id));
}

export function setRouteStatus(
  id: string,
  status: RouteStatus,
  reason?: string
): Promise<void> | void {
  return supabaseConfigured
    ? live.setRouteStatus(id, status, reason)
    : Promise.resolve(mock.setRouteStatus(id, status, reason));
}

export function replaceRouteStops(
  id: string,
  stops: RouteStop[]
): Promise<void> | void {
  return supabaseConfigured
    ? live.replaceRouteStops(id, stops)
    : Promise.resolve(mock.replaceRouteStops(id, stops));
}

export function optimizeRoute(id: string): Promise<void> | void {
  return supabaseConfigured
    ? live.optimizeRoute(id)
    : Promise.resolve(mock.optimizeRoute(id));
}

// Visits
export function getVisits(
  filters?: { retailerId?: string; repId?: string; limit?: number }
): Promise<Visit[]> | Visit[] {
  return supabaseConfigured
    ? live.getVisits(filters)
    : Promise.resolve(mock.getVisits(filters));
}

// Orders & competitors
export function getOrderIntents(): Promise<OrderIntent[]> | OrderIntent[] {
  return supabaseConfigured
    ? live.getOrderIntents()
    : Promise.resolve(mock.getOrderIntents());
}

export function getCompetitorObservations(): Promise<CompetitorObservation[]> | CompetitorObservation[] {
  return supabaseConfigured
    ? live.getCompetitorObservations()
    : Promise.resolve(mock.getCompetitorObservations());
}

// Opportunities
export function getOpportunities(): Promise<Opportunity[]> | Opportunity[] {
  return supabaseConfigured
    ? live.getOpportunities()
    : Promise.resolve(mock.getOpportunities());
}

// Alerts
export function getAlerts(): Promise<Alert[]> | Alert[] {
  return supabaseConfigured
    ? live.getAlerts()
    : Promise.resolve(mock.getAlerts());
}

export function markAlertRead(id: string): void {
  mock.markAlertRead(id);
  if (supabaseConfigured) live.markAlertRead(id);
}

export function getAlertCounts(): Promise<{
  total: number;
  critical: number;
  warning: number;
  unread: number;
}> | {
  total: number;
  critical: number;
  warning: number;
  unread: number;
} {
  return supabaseConfigured
    ? live.getAlertCounts()
    : Promise.resolve(mock.getAlertCounts());
}

// Dashboard
export function getDashboardSummary(): Promise<mock.DashboardSummary> | mock.DashboardSummary {
  return supabaseConfigured
    ? live.getDashboardSummary()
    : Promise.resolve(mock.getDashboardSummary());
}

// Ward coverage
export function getWardCoverage(): Promise<mock.WardCoveragePoint[]> | mock.WardCoveragePoint[] {
  return supabaseConfigured
    ? live.getWardCoverage()
    : Promise.resolve(mock.getWardCoverage());
}

// Territory hierarchy
export function getTerritoryHierarchy(): Promise<mock.HierarchyNode[]> | mock.HierarchyNode[] {
  return supabaseConfigured
    ? live.getTerritoryHierarchy()
    : Promise.resolve(mock.getTerritoryHierarchy());
}

// Reports
export function getRetailersByZone(): Promise<
  { zone: string; active: number; prospect: number; atRisk: number; churned: number; total: number }[]
> | { zone: string; active: number; prospect: number; atRisk: number; churned: number; total: number }[] {
  return supabaseConfigured
    ? live.getRetailersByZone()
    : Promise.resolve(mock.getRetailersByZone());
}

// Census (live capture data)
export type CensusSummary = mock.CensusSummary;
export type CensusWard = mock.CensusWard;

export function getCensusSummary(): Promise<CensusSummary> | CensusSummary {
  return supabaseConfigured
    ? live.getCensusSummary()
    : Promise.resolve(mock.getCensusSummary());
}

import type { RetailerStatus, RouteStatus, VisitStatus, WardZone } from "./data/types";

export const retailerStatusMeta: Record<
  RetailerStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: { label: "Active", color: "#16a34a", bg: "bg-emerald-50 text-emerald-700", dot: "#16a34a" },
  prospect: { label: "Prospect", color: "#2563eb", bg: "bg-blue-50 text-blue-700", dot: "#2563eb" },
  "at-risk": { label: "At risk", color: "#d97706", bg: "bg-amber-50 text-amber-800", dot: "#d97706" },
  churned: { label: "Churned", color: "#dc2626", bg: "bg-rose-50 text-rose-700", dot: "#dc2626" },
  blocked: { label: "Blocked", color: "#64748b", bg: "bg-slate-100 text-slate-600", dot: "#64748b" },
};

export const routeStatusMeta: Record<
  RouteStatus,
  { label: string; bg: string }
> = {
  draft: { label: "Draft", bg: "bg-slate-100 text-slate-600" },
  submitted: { label: "Awaiting approval", bg: "bg-blue-50 text-blue-700" },
  approved: { label: "Approved", bg: "bg-cyan-50 text-cyan-700" },
  "in-progress": { label: "In progress", bg: "bg-violet-50 text-violet-700" },
  completed: { label: "Completed", bg: "bg-emerald-50 text-emerald-700" },
  "needs-revision": { label: "Needs revision", bg: "bg-amber-50 text-amber-800" },
};

export const visitStatusMeta: Record<VisitStatus, { label: string; bg: string }> = {
  completed: { label: "Completed", bg: "bg-emerald-50 text-emerald-700" },
  "no-stock": { label: "No stock", bg: "bg-amber-50 text-amber-800" },
  closed: { label: "Closed", bg: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", bg: "bg-rose-50 text-rose-700" },
  missed: { label: "Missed", bg: "bg-rose-50 text-rose-700" },
};

export const zoneColors: Record<WardZone, string> = {
  Western: "#4C8C40",
  Central: "#D98A2B",
  Northern: "#2E6E9E",
  Eastern: "#D4B32A",
  "South-Eastern": "#8B4C9E",
  Southern: "#C1447A",
};

export const zoneColor = (zone: WardZone) => zoneColors[zone];

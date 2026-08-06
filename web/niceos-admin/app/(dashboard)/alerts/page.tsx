"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge, PageHeader, DemoBanner, EmptyState, Segmented } from "@/components/ui";
import { getAlerts, markAlertRead, fmtDateTime } from "@/lib/data";

type AlertSeverity = "critical" | "warning" | "info";

export default function AlertsPage() {
  const [regen, setRegen] = useState(0);
  const [severity, setSeverity] = useState<"all" | AlertSeverity>("all");
  const [category, setCategory] = useState<string>("all");

  const all = useMemo(() => getAlerts(), [regen]);
  const rows = all.filter(
    (a) => (severity === "all" || a.severity === severity) && (category === "all" || a.category === category)
  );

  const categories = Array.from(new Set(all.map((a) => a.category)));

  const markRead = (id: string) => {
    markAlertRead(id);
    setRegen((n) => n + 1);
  };

  const severityDot = (s: AlertSeverity) =>
    s === "critical" ? "bg-rose-500" : s === "warning" ? "bg-amber-500" : "bg-blue-400";

  return (
    <div>
      <PageHeader
        title="Executive alerts"
        description="Churn risk, competitive activity, stockouts and route flags from across the territory."
      />
      <DemoBanner />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-64">
          <Segmented
            options={[
              { value: "all", label: "All" },
              { value: "critical", label: "Critical" },
              { value: "warning", label: "Warning" },
              { value: "info", label: "Info" },
            ]}
            value={severity}
            onChange={(v) => setSeverity(v as "all" | AlertSeverity)}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium capitalize text-slate-700 outline-none focus:border-slate-900"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-slate-400">
          {all.filter((a) => !a.read).length} unread
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No alerts" hint="Nothing matching this filter." />
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li
              key={a.id}
              className={`flex items-start gap-3 rounded-xl border p-4 ${a.read ? "border-slate-200 bg-white opacity-70" : "border-slate-200 bg-white shadow-sm"}`}
            >
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${severityDot(a.severity)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                  <Badge tone="slate" className="capitalize">{a.category}</Badge>
                  {!a.read && <Badge tone="blue">New</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>{fmtDateTime(a.createdAt)}</span>
                  {a.retailerId && (
                    <Link href={`/retailers/${a.retailerId}`} className="flex items-center gap-0.5 font-semibold text-blue-600 hover:underline">
                      Open outlet <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>
              <button
                onClick={() => markRead(a.id)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                  a.read
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Check size={13} /> {a.read ? "Read" : "Mark read"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

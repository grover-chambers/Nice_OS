"use client";

import { useState } from "react";
import { Card, PageHeader, DemoBanner, Badge } from "@/components/ui";
import { toaster } from "@/components/toast";

type SettingToggle = {
  id: string;
  title: string;
  description: string;
  on: boolean;
};

export default function SettingsPage() {
  const [toggles, setToggles] = useState<SettingToggle[]>([
    { id: "alerts", title: "Alerts", description: "Notify on churn risk, new order intents and competitor activity.", on: true },
    { id: "gps", title: "GPS verification", description: "Flag visits without verified GPS position for manual review.", on: true },
    { id: "auto-route", title: "Auto-generate routes", description: "Generate daily routes for all reps at 05:00 AM.", on: true },
    { id: "weekly-report", title: "Weekly CEO report", description: "Email the CEO a market summary every Monday.", on: false },
  ]);

  const toggle = (id: string) => {
    setToggles((t) => t.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
    toaster.success("Setting updated (demo)");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration. Changes apply instantly in demo mode and are stored locally."
        actions={
          <button
            onClick={() => toaster.success("Settings saved (demo)")}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Save changes
          </button>
        }
      />
      <DemoBanner />

      <Card title="Notifications" subtitle="How the platform surfaces intelligence.">
        <div className="divide-y divide-slate-100">
          {toggles.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.id)}
                aria-pressed={s.on}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s.on ? "bg-emerald-500" : "bg-slate-200"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.on ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Integration status" subtitle="Connections used by the platform." pad={false}>
          <div className="divide-y divide-slate-100">
            {[
              { name: "Mapping tiles (MapLibre)", status: "Connected", tone: "emerald" as const, detail: "Carto Voyager · Kenya" },
              { name: "Database (Supabase)", status: "Not configured", tone: "amber" as const, detail: "Running in demo data mode" },
              { name: "WhatsApp forwarding (order intents)", status: "Demo", tone: "amber" as const, detail: "Preview payloads only" },
              { name: "Email reports", status: "Demo", tone: "amber" as const, detail: "CSV exports available" },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                  <p className="text-xs text-slate-500">{i.detail}</p>
                </div>
                <Badge tone={i.tone}>{i.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

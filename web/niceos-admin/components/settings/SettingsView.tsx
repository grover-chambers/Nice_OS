"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { createBrowserSupabaseClient, supabaseConfigured } from "@/lib/supabase/client";
import { toaster } from "@/components/toast";
import type { Database } from "@/lib/database.types";

type SettingRow = Database["public"]["Tables"]["app_settings"]["Row"];

type FieldDef = {
  key: string;
  label: string;
  hint?: string;
  kind: "text" | "secret" | "number" | "boolean";
};

const GROUPS: { title: string; subtitle: string; fields: FieldDef[] }[] = [
  {
    title: "WhatsApp order desk",
    subtitle: "Cloud API credentials and order forwarding.",
    fields: [
      { key: "whatsapp.access_token", label: "Access token", kind: "secret", hint: "WhatsApp Cloud API access token (order desk + OTP delivery)" },
      { key: "whatsapp.phone_number_id", label: "Phone number ID", kind: "text" },
      { key: "whatsapp.order_desk_number", label: "Order desk number", kind: "text", hint: "Sales department order handling desk (E.164)" },
      { key: "order_forwarding.enabled", label: "Forward order intents to the desk", kind: "boolean" },
    ],
  },
  {
    title: "Orders",
    subtitle: "Cutoff and delivery commitments.",
    fields: [
      { key: "orders.cutoff_time", label: "Same-day cutoff", kind: "text", hint: "Orders after this time deliver next day (HH:MM)" },
      { key: "orders.delivery_sla_hours", label: "Delivery SLA (hours)", kind: "number" },
    ],
  },
  {
    title: "Email",
    subtitle: "Resend delivery for system emails.",
    fields: [
      { key: "resend.api_key", label: "Resend API key", kind: "secret" },
      { key: "resend.from", label: "From address", kind: "text", hint: "e.g. NiceOS <otp@niceos.app>" },
    ],
  },
  {
    title: "Sync",
    subtitle: "Mobile client sync cadence.",
    fields: [
      { key: "sync.pull_interval_min", label: "Pull interval (minutes)", kind: "number" },
      { key: "sync.push_interval_min", label: "Push interval (minutes)", kind: "number" },
    ],
  },
  {
    title: "Updates",
    subtitle: "Release control for field clients.",
    fields: [
      { key: "updates.force_update", label: "Force update on all clients", kind: "boolean" },
    ],
  },
  {
    title: "OTP",
    subtitle: "Consumer intercept verification.",
    fields: [
      { key: "otp.expiry_min", label: "Challenge lifetime (minutes)", kind: "number" },
      { key: "otp.max_attempts", label: "Max attempts before burn", kind: "number" },
    ],
  },
];

type Value = string | number | boolean;

export default function SettingsView({
  settings,
  canEdit,
}: {
  settings: Pick<SettingRow, "key" | "value" | "description" | "updated_at">[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Value>>(() => {
    const d: Record<string, Value> = {};
    for (const s of settings) {
      const v = s.value;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        d[s.key] = v;
      }
    }
    return d;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const value = (key: string): Value =>
    key in draft ? draft[key] : defaultValue(key);

  const set = (key: string, v: Value) => {
    setDraft((d) => ({ ...d, [key]: v }));
    setDirty((prev) => new Set(prev).add(key));
  };

  const save = async () => {
    if (!canEdit || dirty.size === 0) return;
    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    const rows = Array.from(dirty).map((key) => ({
      key,
      value: draft[key] as unknown as Database["public"]["Tables"]["app_settings"]["Insert"]["value"],
    }));

    const { error } = await supabase.from("app_settings").upsert(rows);
    setSaving(false);

    if (error) {
      toaster.error(error.message);
      return;
    }
    toaster.success(`Saved ${rows.length} setting${rows.length === 1 ? "" : "s"}`);
    setDirty(new Set());
    router.refresh();
  };

  const isConnected = (key: string) => {
    const v = value(key);
    return typeof v === "string" && v.trim().length > 0;
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Live platform configuration — persisted to the database and read by the mobile clients."
        actions={
          canEdit ? (
            <button
              onClick={save}
              disabled={saving || dirty.size === 0}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
            >
              <Save size={14} />
              {saving ? "Saving…" : `Save changes${dirty.size > 0 ? ` (${dirty.size})` : ""}`}
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
          Read-only — only Super Admins and Admins can change configuration.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title} title={g.title} subtitle={g.subtitle}>
            <div className="divide-y divide-slate-100">
              {g.fields.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{f.label}</p>
                    {f.hint && <p className="text-xs text-slate-500">{f.hint}</p>}
                  </div>
                  <div className="shrink-0">
                    {f.kind === "boolean" ? (
                      <button
                        type="button"
                        aria-pressed={Boolean(value(f.key))}
                        disabled={!canEdit}
                        onClick={() => set(f.key, !value(f.key))}
                        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${value(f.key) ? "bg-emerald-500" : "bg-slate-200"}`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value(f.key) ? "left-[22px]" : "left-0.5"}`}
                        />
                      </button>
                    ) : (
                      <input
                        type={f.kind === "secret" ? "password" : f.kind === "number" ? "number" : "text"}
                        value={String(value(f.key))}
                        disabled={!canEdit}
                        onChange={(e) =>
                          set(
                            f.key,
                            f.kind === "number" ? Number(e.target.value) : e.target.value
                          )
                        }
                        className={`w-40 rounded border border-slate-300 px-2.5 py-1.5 text-right text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 ${f.kind === "number" ? "text-slate-700" : "text-slate-700"}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card title="Integration status" subtitle="Live connection state." pad={false}>
          <div className="divide-y divide-slate-100">
            {[
              { name: "Database (Supabase)", status: supabaseConfigured ? "Connected" : "Not configured", tone: supabaseConfigured ? ("emerald" as const) : ("amber" as const), detail: supabaseConfigured ? "Live queries and RLS enforced" : "Set NEXT_PUBLIC_SUPABASE_URL / KEY" },
              { name: "Mapping tiles (MapLibre)", status: "Connected", tone: "emerald" as const, detail: "OpenFreeMap · Kenya" },
              { name: "WhatsApp forwarding (order intents)", status: isConnected("whatsapp.access_token") ? "Configured" : "Not configured", tone: isConnected("whatsapp.access_token") ? ("emerald" as const) : ("amber" as const), detail: isConnected("whatsapp.access_token") ? "Credentials present" : "Add an access token above" },
              { name: "Email reports", status: isConnected("resend.api_key") ? "Configured" : "Not configured", tone: isConnected("resend.api_key") ? ("emerald" as const) : ("amber" as const), detail: isConnected("resend.api_key") ? "Resend API key present" : "Add an API key above" },
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

function defaultValue(key: string): Value {
  switch (key) {
    case "order_forwarding.enabled":
    case "updates.force_update":
      return false;
    case "orders.delivery_sla_hours":
    case "sync.pull_interval_min":
    case "sync.push_interval_min":
    case "otp.expiry_min":
    case "otp.max_attempts":
      return 0;
    default:
      return "";
  }
}
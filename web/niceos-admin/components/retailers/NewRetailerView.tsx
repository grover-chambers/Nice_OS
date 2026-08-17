"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { WARD_META } from "@/lib/data/shared";
import { toaster } from "@/components/toast";
import type { OutletType, RetailerStatus, Tier, Rep } from "@/lib/data/types";

const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";
const LABEL = "mb-1 block text-xs font-semibold text-slate-600";

export default function NewRetailerView({ reps }: { reps: Rep[] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    owner: "",
    phone: "",
    type: "duka" as OutletType,
    tier: "C" as Tier,
    status: "prospect" as RetailerStatus,
    ward: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wardMeta = WARD_META.find((w) => w.ward === form.ward);
  const zoneRep = wardMeta ? reps.find((r) => r.zone === wardMeta.zone) : undefined;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter the shop name";
    if (form.owner.trim().length < 2) errs.owner = "Enter owner name";
    if (!/^07\d{2}\s?\d{3}\s?\d{3}$/.test(form.phone)) errs.phone = "Use format 07XX XXX XXX";
    if (!form.ward) errs.ward = "Select a ward";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toaster.error("Please fix the highlighted fields");
      return;
    }
    if (!wardMeta || !zoneRep) {
      toaster.error("No rep assigned for this ward");
      return;
    }
    try {
      const res = await fetch("/api/retailers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          owner: form.owner.trim(),
          phone: form.phone,
          type: form.type,
          tier: form.tier,
          status: form.status,
          ward: form.ward,
          constituency: wardMeta.constituency,
          zone: wardMeta.zone,
          address: form.address || `${form.ward}, Nairobi`,
          lat: -1.29,
          lng: 36.82,
          repId: zoneRep.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to register retailer");
      toaster.success("Retailer registered");
      router.push(`/retailers/${data.id}`);
    } catch (e) {
      toaster.error(e instanceof Error ? e.message : "Failed to register retailer");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/retailers" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={13} /> Back to retailers
      </Link>
      <PageHeader
        title="Register retailer"
        description="Add a new outlet to the registry. Ward selection auto-assigns the sales zone and rep."
      />

      <Card title="Outlet details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Shop name *</label>
            <input className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Unity Stores" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>
          <div>
            <label className={LABEL}>Owner name *</label>
            <input className={FIELD} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="e.g. Jane Wanjiru" />
            {errors.owner && <p className="mt-1 text-xs text-rose-600">{errors.owner}</p>}
          </div>
          <div>
            <label className={LABEL}>Phone *</label>
            <input className={FIELD} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XX XXX XXX" />
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
          </div>
          <div>
            <label className={LABEL}>Address</label>
            <input className={FIELD} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, building" />
          </div>
          <div>
            <label className={LABEL}>Outlet type</label>
            <select className={FIELD} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="duka">Duka (grocer)</option>
              <option value="kiosk">Kiosk</option>
              <option value="supermarket">Supermarket</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="restaurant">Restaurant</option>
              <option value="chemist">Chemist</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Tier</label>
            <select className={FIELD} value={form.tier} onChange={(e) => set("tier", e.target.value)}>
              <option value="A">A — High volume</option>
              <option value="B">B — Medium</option>
              <option value="C">C — Small</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="at-risk">At risk</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Ward *</label>
            <select className={FIELD} value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              <option value="">Select ward…</option>
              {WARD_META.map((w) => (
                <option key={w.ward} value={w.ward}>{w.ward} — {w.zone}</option>
              ))}
            </select>
            {errors.ward && <p className="mt-1 text-xs text-rose-600">{errors.ward}</p>}
          </div>
        </div>

        {wardMeta && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{form.ward} · {wardMeta.constituency}</span>
            <Badge tone="slate">{wardMeta.zone} Zone</Badge>
            <span className="text-slate-400">→</span>
            <span>Assigned rep: <b>{zoneRep?.name ?? "unassigned"}</b></span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Link href="/retailers" className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </Link>
          <button onClick={submit} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
            Register retailer
          </button>
        </div>
      </Card>
    </div>
  );
}

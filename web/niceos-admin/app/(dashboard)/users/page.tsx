"use client";

import { useMemo, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { Card, Badge, PageHeader, DemoBanner, Td, Th } from "@/components/ui";
import { getReps } from "@/lib/data";
import { ROLE_CONFIG } from "@/lib/data";
import { toaster } from "@/components/toast";
import type { Role } from "@/lib/data/types";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "disabled";
  lastActive: string;
};

export default function UsersPage() {
  const reps = useMemo(() => getReps(), []);
  const [regen, setRegen] = useState(0);
  const [filter, setFilter] = useState<Role | "all">("all");

  const users: DemoUser[] = [
    { id: "u-admin-1", name: "J. Mwangi", email: "j.mwangi@niceos.co.ke", role: "admin", status: "active", lastActive: "now" },
    { id: "u-admin-2", name: "A. Chebet", email: "a.chebet@niceos.co.ke", role: "admin", status: "active", lastActive: "2h ago" },
    ...reps.map<DemoUser>((r, i) => ({
      id: `u-rep-${r.id}`,
      name: r.name,
      email: r.email,
      role: i % 3 === 0 ? ("territory_manager" as Role) : ("sales_rep" as Role),
      status: r.status === "active" ? ("active" as const) : r.status === "on-leave" ? ("invited" as const) : ("disabled" as const),
      lastActive: r.onRoute ? "now" : `${Math.floor(Math.random() * 120)}m ago`,
    })),
    { id: "u-client-1", name: "CEO, Nice Limited", email: "ceo@niceos.co.ke", role: "ceo", status: "active", lastActive: "2h ago" },
  ];

  const rows = users.filter((u) => filter === "all" || u.role === filter);

  const toggle = (id: string) => {
    toaster.success("Access updated (demo)");
  };

  return (
    <div>
      <PageHeader
        title="Users & roles"
        description="Role-based access across the platform — Platform Admin, Territory Manager, Sales Rep, CEO."
        actions={
          <button
            onClick={() => toaster.success("Invitation sent (demo)")}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            <Plus size={14} /> Invite user
          </button>
        }
      />
      <DemoBanner />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(filter === r ? "all" : r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {ROLE_CONFIG[r].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">{rows.length} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last active</Th>
                <Th className="text-right">Access</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-slate-400" />
                      <span className="capitalize">{ROLE_CONFIG[u.role].label}</span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={u.status === "active" ? "emerald" : u.status === "invited" ? "amber" : "rose"}>
                      {u.status}
                    </Badge>
                  </Td>
                  <Td className="text-slate-500">{u.lastActive}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggle(u.id)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          u.status === "disabled"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        }`}
                      >
                        {u.status === "disabled" ? "Re-enable" : "Revoke"}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

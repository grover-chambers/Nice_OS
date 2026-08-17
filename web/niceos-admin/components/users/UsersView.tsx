"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, ShieldCheck, UserPlus } from "lucide-react";
import { Card, Badge, PageHeader, Td, Th } from "@/components/ui";
import { CLUSTERS } from "@/lib/data/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { toaster } from "@/components/toast";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RoleDefinition = Database["public"]["Tables"]["role_definitions"]["Row"];
type ProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "email" | "phone" | "role" | "status" | "zone" | "territory_id" | "updated_at"
>;

type Props = {
  profiles: ProfileSummary[];
  roleDefinitions: RoleDefinition[];
  territories: { id: string; name: string }[];
  currentRole: Profile["role"];
  currentZone: string | null;
};

export default function UsersView({
  profiles,
  roleDefinitions,
  territories,
  currentRole,
  currentZone,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Profile["role"] | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState<ProfileSummary | null>(null);

  const defByRole = new Map(roleDefinitions.map((d) => [d.role, d]));
  const roleLabel = (r: Profile["role"]) =>
    defByRole.get(r)?.label ?? r.replace(/_/g, " ");

  // Roles the current user is allowed to create (from role_definitions).
  const creatableRoles =
    roleDefinitions.find((d) => d.role === currentRole)?.can_create_roles ?? [];

  const rows = profiles.filter(
    (p) => filter === "all" || p.role === filter
  );

  const statusTone = (s: string) =>
    s === "active" ? ("emerald" as const) : s === "disabled" ? ("rose" as const) : ("amber" as const);

  return (
    <div>
      <PageHeader
        title="Users & roles"
        description="Live user accounts with role-based access. Super Admins and Admins manage any user; Zone Supervisors create field reps for their own zone."
        actions={
          creatableRoles.length > 0 ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <Plus size={14} /> Add user
            </button>
          ) : undefined
        }
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </button>
          {roleDefinitions.map((d) => (
            <button
              key={d.role}
              onClick={() => setFilter(filter === d.role ? "all" : d.role)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${filter === d.role ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {d.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {rows.length} user{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Zone</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <Td className="py-10 text-center text-slate-400">
                    No users found for this filter.
                  </Td>
                </tr>
              )}
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {(u.full_name || u.email || "?")
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.email ?? "—"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-slate-400" />
                      <span>{roleLabel(u.role)}</span>
                    </span>
                  </Td>
                  <Td className="text-slate-500">{u.zone ?? "—"}</Td>
                  <Td>
                    <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      {(currentRole === "super_admin" || currentRole === "admin") && (
                        <button
                          onClick={() => setResetFor(u)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <KeyRound size={12} /> Reset password
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && (
        <AddUserModal
          creatableRoles={creatableRoles}
          roleDefinitions={roleDefinitions}
          territories={territories}
          currentZone={currentZone}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}

      {resetFor && (
        <ResetPasswordModal
          user={resetFor}
          onClose={() => setResetFor(null)}
          onReset={() => {
            setResetFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// --- Add user modal ---------------------------------------------------------

function AddUserModal({
  creatableRoles,
  roleDefinitions,
  territories,
  currentZone,
  onClose,
  onCreated,
}: {
  creatableRoles: Profile["role"][];
  roleDefinitions: RoleDefinition[];
  territories: { id: string; name: string }[];
  currentZone: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Profile["role"]>(creatableRoles[0] ?? "sales_rep");
  const [zone, setZone] = useState(currentZone ?? CLUSTERS[0]);
  const [territoryId, setTerritoryId] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const def = roleDefinitions.find((d) => d.role === role);
  const zoneLocked = role === "territory_manager" && currentZone;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("admin_create_user", {
      p_email: email.trim(),
      p_full_name: fullName.trim(),
      p_phone: phone.trim() || undefined,
      p_role: role,
      p_zone: zoneLocked ? currentZone ?? undefined : zone,
      p_territory_id: territoryId || undefined,
      p_password: password || undefined,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    toaster.success(`Created ${fullName.trim()} (${roleLabel(role)})`);
    onCreated();
  };

  const roleLabel = (r: Profile["role"]) =>
    roleDefinitions.find((d) => d.role === r)?.label ?? r.replace(/_/g, " ");

  return (
    <Modal title="Add user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Full name *</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Profile["role"])}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            {def && <p className="mt-1 text-[11px] text-slate-400">{def.description}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Zone</label>
            <select
              value={zoneLocked ? currentZone ?? "" : zone}
              disabled={Boolean(zoneLocked)}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {CLUSTERS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            {zoneLocked && (
              <p className="mt-1 text-[11px] text-slate-400">Locked to your zone.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547…"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Territory</label>
            <select
              value={territoryId}
              onChange={(e) => setTerritoryId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">—</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Temporary password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for the secure default"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <UserPlus size={14} /> {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- Reset password modal ---------------------------------------------------

function ResetPasswordModal({
  user,
  onClose,
  onReset,
}: {
  user: ProfileSummary;
  onClose: () => void;
  onReset: () => void;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!user.email) {
      setError("This user has no email on file — reset their password from the auth console.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("admin_reset_password", {
      p_email: user.email,
      p_password: password,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    toaster.success(`Password reset for ${user.full_name}`);
    onReset();
  };

  return (
    <Modal title={`Reset password — ${user.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <p className="text-xs text-slate-500">
          Sets a new password for <b>{user.email ?? user.full_name}</b>. Existing
          sessions for this user are signed out.
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">New password *</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <KeyRound size={14} /> {saving ? "Resetting…" : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- Modal shell ------------------------------------------------------------

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
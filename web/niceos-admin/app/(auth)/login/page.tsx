import { Suspense } from "react";
import { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "NICE Rice Millers — NiceOS Market Intelligence",
  description:
    "NiceOS — Market Activation & Intelligence Platform for Nice Rice Millers, Mwea, Kirinyaga County.",
};

const stats = [
  { value: "70%", label: "of Mwea production" },
  { value: "5,000+", label: "farmers helped" },
  { value: "40,000 t", label: "annual rice" },
  { value: "70 t/day", label: "milling capacity" },
];

export default function LoginPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-900">
      {/* ============ LEFT: LANDING / COMPANY PANEL ============ */}
      <section className="relative hidden w-[52%] overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-slate-100 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_18%_15%,rgba(16,185,129,0.28),transparent_50%),radial-gradient(circle_at_85%_85%,rgba(245,158,11,0.12),transparent_50%)]" />

        <div className="relative z-10 flex h-full flex-col px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-extrabold text-emerald-950 shadow-lg shadow-emerald-500/30">
              N
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                NICE Rice Millers
              </p>
              <p className="text-xs text-slate-400">Mwea · Kirinyaga County</p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
              Market Activation &amp; Intelligence
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight">
              Pure, quality &amp; affordable{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">
                Pishori rice
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              NiceOS gives the NICE team a real-time view of retailers, routes,
              rep activity and market intelligence across the Mwea rice network.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className="text-2xl font-extrabold text-emerald-300">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Field coverage · Nairobi metro
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              WhatsApp order forwarding
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Offline-first sync
            </span>
          </div>
        </div>
      </section>

      {/* ============ RIGHT: LOGIN PANEL (also full-screen on mobile) ============ */}
      <aside className="flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-6">
        <div className="flex w-full max-w-md flex-col">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-base font-extrabold text-white">
              N
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">NICE Rice Millers</p>
              <p className="text-[11px] text-slate-500">NiceOS Market Intelligence</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              NiceOS Portal
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to your NiceOS workspace.
            </p>

            <div className="mt-6">
              <Suspense fallback={<p className="text-sm text-slate-400">Loading sign-in form…</p>}>
                <LoginForm />
              </Suspense>
            </div>

            <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
              Authorized field &amp; management staff only. Issues? Contact the
              NiceOS admin desk.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

import { Suspense } from "react";
import { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "NICE Rice Millers — NiceOS Market Intelligence",
  description:
    "NiceOS — Market Activation & Intelligence Platform for Nice Rice Millers, Mwea, Kirinyaga County.",
};

const stats = [
  { value: "70%", label: "of Mwea rice production handled" },
  { value: "5,000+", label: "farmers & beneficiaries" },
  { value: "40,000 t", label: "annual rice in Mwea scheme" },
  { value: "70 t/day", label: "milling capacity" },
];

const services = [
  { title: "Rice Milling", text: "Grade 1 Pishori milling at 70 metric tonnes a day." },
  { title: "Rice Storage", text: "30,000 t monthly warehouse capacity." },
  { title: "Marketing & Sales", text: "Retail & wholesale of processed pishori rice." },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex lg:overflow-hidden">
      {/* ============ LEFT: LANDING / COMPANY PANEL ============ */}
      <section className="relative flex flex-col overflow-y-auto bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 px-6 py-10 sm:px-10 lg:max-h-screen lg:w-[55%] lg:px-14 lg:py-12">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.25),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-lg font-extrabold text-slate-950 shadow-lg shadow-emerald-500/30">
              N
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                NICE Rice Millers
              </p>
              <p className="text-xs text-slate-400">Mwea · Kirinyaga County</p>
            </div>
          </div>

          <div className="mt-12 lg:mt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Market Activation &amp; Intelligence
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Pure, quality &amp; affordable{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Pishori rice
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
              NiceOS gives the NICE team a real-time view of retailers, routes,
              rep activity and market intelligence across the Mwea rice
              distribution network.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className="text-2xl font-extrabold text-emerald-300">{s.value}</p>
                <p className="mt-1 text-xs leading-snug text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {services.map((svc) => (
              <div key={svc.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{svc.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{svc.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Field coverage · Nairobi metro
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-teal-300" />
              WhatsApp order forwarding
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-300" />
              Offline-first sync
            </span>
          </div>

          <p className="mt-10 pb-2 text-[11px] text-slate-500">
            © {new Date().getFullYear()} NiceOS · Nice Rice Millers Ltd — internal platform
          </p>
        </div>
      </section>

      {/* ============ RIGHT: LOGIN PANEL ============ */}
      <aside className="flex flex-1 items-center justify-center overflow-y-auto bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:max-h-screen lg:py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              NiceOS Portal
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to your NiceOS workspace.
            </p>

            <div className="mt-8">
              <Suspense fallback={<p className="text-sm text-slate-400">Loading sign-in form…</p>}>
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs leading-relaxed text-slate-400">
                Authorized field &amp; management staff only. Issues? Contact the
                NiceOS admin desk.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Map,
  Route as RouteIcon,
  ClipboardCheck,
  Camera,
  BarChart3,
  ShoppingCart,
  Users,
  Bell,
  Smartphone,
  Check,
  MapPin,
  Shield,
  TrendingUp,
} from "lucide-react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "NICE MILLERS LIMITED — NiceOS Market Intelligence",
  description:
    "NiceOS — Market Activation & Intelligence Platform for NICE MILLERS LIMITED, Mwea, Kirinyaga County.",
};

const features = [
  {
    icon: Map,
    title: "Live territory coverage",
    text: "Real-time retail presence across every ward, zone and rep territory.",
  },
  {
    icon: RouteIcon,
    title: "Smart route planning",
    text: "Plan and optimize daily routes — sequencing stops for less travel, more visits.",
  },
  {
    icon: ClipboardCheck,
    title: "GPS-verified visits",
    text: "Reps check in/out at each retailer with verified location and timestamps.",
  },
  {
    icon: Camera,
    title: "Stock & shelf photos",
    text: "Capture stock levels and shelf presence at every visit, with photo evidence.",
  },
  {
    icon: ShoppingCart,
    title: "Order intents → WhatsApp",
    text: "Orders captured in the field are forwarded straight to the sales desk.",
  },
  {
    icon: BarChart3,
    title: "Health & churn alerts",
    text: "Retailers heading at-risk are flagged early, before they stop buying.",
  },
];

const rolePointers = [
  {
    role: "Sales Rep",
    icon: MapPin,
    color: "text-emerald-300",
    points: [
      "Your route, your retailers, your visits",
      "Check in with GPS + capture stock, photos & orders",
      "Works offline — syncs when you're back online",
    ],
  },
  {
    role: "Territory Manager",
    icon: RouteIcon,
    color: "text-amber-300",
    points: [
      "Build & approve routes for your reps",
      "Monitor coverage and rep activity live",
      "Act on alerts within your zones",
    ],
  },
  {
    role: "Platform Admin",
    icon: Shield,
    color: "text-sky-300",
    points: [
      "Configure territories, retailers and users",
      "Manage roles, access and settings",
      "Full visibility across every module",
    ],
  },
  {
    role: "CEO / Executive",
    icon: TrendingUp,
    color: "text-slate-200",
    points: [
      "Executive market overview at a glance",
      "Market analytics, coverage and reports",
      "No field detail — just the big picture",
    ],
  },
];

export default function LoginPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-900">
      {/* ============ LEFT: SCROLLABLE INFO PANEL (2/3) ============ */}
      <section className="relative hidden w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-slate-100 lg:flex lg:w-2/3">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(245,158,11,0.10),transparent_40%)]" />
        <div className="relative z-10 h-full w-full overflow-y-auto px-12 py-10">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-extrabold text-emerald-950 shadow-lg shadow-emerald-500/30">
                  N
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                    NICE MILLERS LIMITED
                  </p>
                  <p className="text-xs text-slate-400">Mwea · Kirinyaga County</p>
                </div>
              </div>

              <div className="mt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Welcome to NiceOS
                </p>
                <h1 className="mt-3 text-4xl font-extrabold leading-tight">
                  Your market activation &amp;{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">
                    intelligence platform
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                  NiceOS connects the field to the office — giving every role a
                  clear, real-time view of retailers, routes and rep activity
                  across the Mwea rice distribution network.
                </p>
              </div>

              <div className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                  What the platform does
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {features.map((f) => (
                    <div
                      key={f.title}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <f.icon size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">{f.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                  What to expect for your role
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {rolePointers.map((rp) => (
                    <div
                      key={rp.role}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className={`flex items-center gap-2 text-sm font-semibold ${rp.color}`}>
                        <rp.icon size={15} className="shrink-0" />
                        {rp.role}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {rp.points.map((p) => (
                          <li key={p} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                            <Check size={13} className="mt-0.5 shrink-0 text-slate-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-emerald-400" />
                  Roles: Super Admin · Sales Rep · Territory Manager · Admin · CEO
                </span>
                <span className="flex items-center gap-2">
                  <Smartphone size={14} className="text-amber-400" />
                  Field app with offline-first sync
                </span>
                <span className="flex items-center gap-2">
                  <Bell size={14} className="text-sky-300" />
                  Alerts &amp; churn flags in real time
                </span>
              </div>

              <p className="mt-10 pb-2 text-[11px] text-slate-500">
                © {new Date().getFullYear()} NiceOS · NICE MILLERS LIMITED — internal platform
              </p>
            </div>
          </div>
      </section>

      {/* ============ RIGHT: LOGIN PANEL (1/3) ============ */}
      <aside className="flex w-full items-center justify-center overflow-hidden bg-slate-50 px-6 lg:w-1/3 lg:border-l lg:border-slate-200">
        <div className="flex w-full max-w-sm flex-col">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-base font-extrabold text-white">
              N
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">NICE MILLERS LIMITED</p>
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
              Authorized staff only — sign in with the account issued to your
              role. Issues? Contact the NiceOS admin desk.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

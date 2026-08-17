import { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Configuration Error — NiceOS",
  description:
    "NiceOS requires Supabase environment configuration. Contact the NICE MILLERS LIMITED platform administrator.",
};

export default function ConfigErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <ShieldAlert className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="text-lg font-bold text-white">Platform not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          NiceOS is fail-closed: it cannot start until the Supabase environment
          is configured. There is no demo data and no placeholder mode.
        </p>
        <p className="mt-4 rounded-lg bg-slate-800/80 p-3 text-left text-xs leading-relaxed text-slate-300">
          Set the following in <code className="text-emerald-400">.env.local</code> (or the
          hosting environment) and restart the deployment:
          <br />
          <code className="mt-1 block text-emerald-400">
            NEXT_PUBLIC_SUPABASE_URL
            <br />
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>
        </p>
        <p className="mt-5 text-xs text-slate-500">
          Contact the NICE MILLERS LIMITED platform administrator.
        </p>
      </div>
    </main>
  );
}
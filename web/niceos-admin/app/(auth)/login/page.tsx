import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Sign In — NiceOS",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">NiceOS</h1>
        <p className="mb-6 text-sm text-slate-500">
          Market Activation & Intelligence Platform
        </p>
        <Suspense fallback={<p>Loading sign-in form...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
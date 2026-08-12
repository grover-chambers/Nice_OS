import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabaseAnonKey, supabaseConfigured } from "@/lib/supabase/config";

// Routes that require a Supabase auth session. Without this middleware anyone
// hitting /dashboard/* directly bypasses auth and lands on the demo facade.
// The facade itself only contains fixture data, so this is defense-in-depth;
// the day the facade swaps to live Supabase reads, RLS will scope rows to the
// real authenticated user.
const PROTECTED_PREFIXES = ["/dashboard", "/alerts", "/analytics", "/census", "/rep-management",
  "/reports", "/retailers", "/routes", "/settings", "/territories", "/users", "/visits", "/client"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  // If Supabase isn't configured (demo build), allow through — LoginForm
  // already shows the explicit "Explore demo dashboard" path.
  if (!supabaseConfigured) return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient<never>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = options as Record<string, unknown> | undefined;
          if (cookieOptions && typeof cookieOptions.maxAge === "number") {
            res.cookies.set(name, value, { ...cookieOptions });
          } else {
            res.cookies.set(name, value, cookieOptions);
          }
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|map|api|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};

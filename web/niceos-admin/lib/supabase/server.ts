import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import { supabaseUrl, supabaseAnonKey, supabaseConfigured } from "@/lib/supabase/config";

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Called from a Server Component — ignore when middleware handles session refresh.
      }
    },
  };
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });
}

export { supabaseConfigured } from "@/lib/supabase/config";

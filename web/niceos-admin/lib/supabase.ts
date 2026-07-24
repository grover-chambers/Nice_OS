import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

export function createClient(cookieStore: Promise<Record<string, string>>) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieStore,
    }
  );
}

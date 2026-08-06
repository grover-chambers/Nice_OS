import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabaseConfigured } from "@/lib/supabase/config";

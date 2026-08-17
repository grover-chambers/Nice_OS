// NiceOS data service facade.
//
// Pages consume data ONLY through this module. All functions query the live
// Supabase database server-side; there is no demo dataset. Page code stays
// unchanged.

export * from "./supabase";
export * from "./shared";
export { supabaseConfigured } from "@/lib/supabase/config";
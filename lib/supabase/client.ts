import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let supabase: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();

  if (!supabase) {
    supabase = createBrowserClient<Database>(url, anonKey);
  }

  return supabase;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lovable Cloud injects these two variables once the database is enabled.
// Until then the shop works normally and tracking is simply skipped.
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

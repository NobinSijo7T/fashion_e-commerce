import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./env";

/**
 * New client per call — safe for API routes and getServerSideProps (no shared mutable state).
 */
export function createSupabaseServerClient(): SupabaseClient {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key);
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Browser singleton. Use in client components / hooks after env is loaded.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient() must run in the browser.");
  }
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createClient(url, key);
  }
  return browserClient;
}

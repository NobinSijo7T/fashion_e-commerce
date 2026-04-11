/**
 * Admin + client Supabase singleton.
 * Next.js: uses process.env.NEXT_PUBLIC_* (set in .env.local).
 * Vite equivalent: import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
    : "";

const key =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        "")
    : "";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

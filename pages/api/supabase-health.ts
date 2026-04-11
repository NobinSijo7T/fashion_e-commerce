import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type HealthResponse = {
  ok: boolean;
  url?: string;
  authHealth?: { status: number; ok: boolean };
  /** PostgREST responded (even “table missing” means the API gateway accepted the key). */
  postgrest?: { ok: boolean; code?: string; message?: string };
  error?: string;
};

/**
 * Verifies env vars and reachability of Supabase Auth and REST gateways.
 * Safe to remove or protect in production if you prefer not to expose this.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(500).json({
      ok: false,
      error:
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    });
  }

  try {
    const authRes = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    });

    const supabase = createClient(url, key);
    // Intentionally query a non-existent table: a structured PostgREST error proves the client reached your project.
    const { error: pgError } = await supabase
      .from("__supabase_health_probe__")
      .select("id")
      .limit(1);

    const authOk = authRes.ok;
    const postgrestOk =
      !!pgError &&
      (pgError.code === "PGRST205" ||
        pgError.code === "PGRST116" ||
        pgError.code === "42P01" ||
        pgError.message?.toLowerCase().includes("relation") ||
        pgError.message?.toLowerCase().includes("does not exist") ||
        pgError.message?.toLowerCase().includes("schema cache"));

    return res.status(200).json({
      ok: authOk && postgrestOk,
      url,
      authHealth: { status: authRes.status, ok: authOk },
      postgrest: postgrestOk
        ? {
            ok: true,
            code: pgError?.code,
            message: pgError?.message,
          }
        : {
            ok: false,
            code: pgError?.code,
            message: pgError?.message,
          },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ ok: false, error: message });
  }
}

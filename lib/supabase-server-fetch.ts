import {
  checkSupabaseRateLimit,
  getSupabaseRateLimitConfig,
} from "./supabase-rate-limit"

export function createServerRateLimitedFetch(): typeof fetch {
  const limitedFetch: typeof fetch = async (input, init) => {
    const cfg = getSupabaseRateLimitConfig()
    let key = "supabase:server:internal"
    let rule = cfg.server

    try {
      const { headers } = await import("next/headers")
      const h = await headers()
      const cronSecret = process.env.CRON_SECRET
      const auth = h.get("authorization")
      if (cronSecret && auth === `Bearer ${cronSecret}`) {
        key = "supabase:server:cron"
        rule = cfg.cron
      } else {
        const ip =
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          "unknown"
        key = `supabase:server:${ip}`
      }
    } catch {
      // Outside a request (or headers unavailable) — share one internal bucket
      key = "supabase:server:internal"
      rule = cfg.server
    }

    if (!checkSupabaseRateLimit(key, rule)) {
      return new Response(
        JSON.stringify({
          message: "Too many Supabase requests",
          hint: "Slow down and retry shortly.",
        }),
        { status: 429, headers: { "content-type": "application/json" } }
      )
    }

    return fetch(input, init)
  }
  return limitedFetch
}

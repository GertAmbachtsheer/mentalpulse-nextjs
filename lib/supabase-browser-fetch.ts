import {
  checkSupabaseRateLimit,
  getSupabaseRateLimitConfig,
} from "./supabase-rate-limit"

function browserTabKey(): string {
  if (typeof window === "undefined") return "ssr"
  try {
    const k = "mp_supabase_rl_tab"
    let id = sessionStorage.getItem(k)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(k, id)
    }
    return id
  } catch {
    return "no-storage"
  }
}

export function createBrowserRateLimitedFetch(): typeof fetch {
  const limitedFetch: typeof fetch = async (input, init) => {
    const cfg = getSupabaseRateLimitConfig()
    const key = `supabase:browser:${browserTabKey()}`
    if (!checkSupabaseRateLimit(key, cfg.browser)) {
      return new Response(
        JSON.stringify({
          message: "Too many Supabase requests from this session",
          hint: "Wait a moment and try again.",
        }),
        { status: 429, headers: { "content-type": "application/json" } }
      )
    }
    return fetch(input, init)
  }
  return limitedFetch
}

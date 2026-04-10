export type RateLimitRule = { max: number; windowMs: number }

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? "", 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getSupabaseRateLimitConfig(): {
  server: RateLimitRule
  browser: RateLimitRule
  cron: RateLimitRule
} {
  return {
    server: {
      max: parsePositiveInt(process.env.SUPABASE_RATE_LIMIT_SERVER_MAX, 120),
      windowMs: parsePositiveInt(
        process.env.SUPABASE_RATE_LIMIT_SERVER_WINDOW_MS,
        60_000
      ),
    },
    browser: {
      max: parsePositiveInt(process.env.SUPABASE_RATE_LIMIT_BROWSER_MAX, 90),
      windowMs: parsePositiveInt(
        process.env.SUPABASE_RATE_LIMIT_BROWSER_WINDOW_MS,
        60_000
      ),
    },
    cron: {
      max: parsePositiveInt(process.env.SUPABASE_RATE_LIMIT_CRON_MAX, 5000),
      windowMs: parsePositiveInt(
        process.env.SUPABASE_RATE_LIMIT_CRON_WINDOW_MS,
        60_000
      ),
    },
  }
}

const buckets = new Map<string, number[]>()

const PRUNE_EVERY = 200
let opCount = 0

function pruneStaleEntries(maxWindowMs: number) {
  const now = Date.now()
  const oldestKeep = now - maxWindowMs
  for (const [k, ts] of buckets) {
    const next = ts.filter((t) => t > oldestKeep)
    if (next.length === 0) buckets.delete(k)
    else buckets.set(k, next)
  }
}

/**
 * Fixed-window-style cap using a sliding list of timestamps per key.
 * In serverless / multi-instance deploys each instance has its own map; use Redis/Upstash for shared limits if needed.
 */
export function checkSupabaseRateLimit(
  key: string,
  rule: RateLimitRule
): boolean {
  opCount++
  if (opCount % PRUNE_EVERY === 0) pruneStaleEntries(rule.windowMs)

  const now = Date.now()
  const windowStart = now - rule.windowMs
  let timestamps = buckets.get(key) ?? []
  timestamps = timestamps.filter((t) => t > windowStart)

  if (timestamps.length >= rule.max) {
    buckets.set(key, timestamps)
    return false
  }
  timestamps.push(now)
  buckets.set(key, timestamps)
  return true
}

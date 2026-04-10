import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createServerRateLimitedFetch } from "./supabase-server-fetch"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const rateLimitedFetch = createServerRateLimitedFetch()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: rateLimitedFetch },
})

/** Service-role client with the same outbound rate limiting as the anon server client. */
export function createServiceRoleSupabase(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  return createClient(supabaseUrl, serviceKey, {
    global: { fetch: rateLimitedFetch },
  })
}

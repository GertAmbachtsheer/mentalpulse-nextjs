import { createClient } from "@supabase/supabase-js"
import { createBrowserRateLimitedFetch } from "./supabase-browser-fetch"
import { getSupabaseClerkAccessToken } from "./supabase-clerk-token"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Sends the Clerk session JWT on each request so PostgREST applies the
 * `authenticated` role and RLS. Use the same `user_id` predicate on `mood_journals`
 * as on `moods` (e.g. auth.jwt()->>'sub' with Clerk, or auth.uid()::text with native Auth).
 * Register the token source via registerSupabaseClerkAccessToken from ClerkSupabaseBridge.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: createBrowserRateLimitedFetch() },
  accessToken: async () => getSupabaseClerkAccessToken(),
})

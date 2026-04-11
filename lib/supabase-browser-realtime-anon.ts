import { createClient } from "@supabase/supabase-js";
import { createBrowserRateLimitedFetch } from "@/lib/supabase-browser-fetch";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anon-only browser client for Realtime **public** broadcast channels (no Clerk JWT).
 *
 * The main `supabase` client attaches Clerk via `accessToken`; Realtime still forwards
 * that JWT on the socket. If Supabase is not configured to verify Clerk as a third-party
 * issuer for Realtime, channel join returns `CHANNEL_ERROR` even with `private: false`.
 */
export const supabaseRealtimeAnon = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: createBrowserRateLimitedFetch() },
  // Default Realtime join timeout is 10s; postgres_changes often needs longer (cold pool / network).
  realtime: { timeout: 60_000 },
});

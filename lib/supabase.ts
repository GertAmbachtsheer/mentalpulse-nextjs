/**
 * Default export is the browser client. Server bundles replace this module with
 * `lib/supabase-server.ts` via webpack alias in `next.config.ts` so API routes
 * rate-limit by IP; the client bundle rate-limits per browser tab.
 */
export { supabase } from "./supabase-browser"

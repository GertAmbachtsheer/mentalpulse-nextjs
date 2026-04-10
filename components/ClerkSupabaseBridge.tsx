"use client"

import { useSession } from "@clerk/nextjs"
import { useEffect } from "react"
import { registerSupabaseClerkAccessToken } from "@/lib/supabase-clerk-token"

/**
 * Wires Clerk tokens into the browser Supabase client (see lib/supabase-browser.ts).
 *
 * Recommended (native Clerk ↔ Supabase): use the default session token from
 * `getToken()` and enable Clerk third-party auth on your Supabase stack so PostgREST
 * verifies JWTs against Clerk’s keys (hosted: Dashboard; self-hosted: e.g.
 * `[auth.third_party.clerk]` in config.toml — see Supabase “Clerk” third-party docs).
 *
 * If you see PGRST301 `JWSError JWSInvalidSignature` on self-hosted, PostgREST is still
 * verifying with your Supabase JWT secret only. Either fix server config as above, or
 * temporarily use Clerk’s legacy Supabase JWT template (signed with your project JWT
 * secret) and set NEXT_PUBLIC_CLERK_SUPABASE_JWT_TEMPLATE to that template’s name.
 */
const clerkJwtTemplateForSupabase =
  process.env.NEXT_PUBLIC_CLERK_SUPABASE_JWT_TEMPLATE?.trim() || undefined

export default function ClerkSupabaseBridge() {
  const { session } = useSession()

  useEffect(() => {
    registerSupabaseClerkAccessToken(async () => {
      if (!session) return null
      if (clerkJwtTemplateForSupabase) {
        return (
          (await session.getToken({ template: clerkJwtTemplateForSupabase })) ?? null
        )
      }
      return (await session.getToken()) ?? null
    })
  }, [session])

  return null
}

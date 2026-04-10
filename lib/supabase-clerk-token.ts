type AccessTokenGetter = () => Promise<string | null>

let getAccessToken: AccessTokenGetter | null = null

/** Called from a client component under ClerkProvider (e.g. ClerkSupabaseBridge). */
export function registerSupabaseClerkAccessToken(fn: AccessTokenGetter) {
  getAccessToken = fn
}

export async function getSupabaseClerkAccessToken(): Promise<string | null> {
  try {
    return (await getAccessToken?.()) ?? null
  } catch {
    return null
  }
}

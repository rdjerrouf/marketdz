/**
 * Docker-aware fetch for server-side Supabase clients.
 *
 * Problem: Inside Docker, `localhost:54321` resolves to the container's own loopback
 * (not the host's Supabase). We need to reach `host.docker.internal:54321` instead.
 *
 * BUT: The Supabase SSR library derives the auth cookie name from the URL passed to
 * createServerClient. If we pass `host.docker.internal` here, the cookie key becomes
 * `sb-host-auth-token`, which differs from the browser client's `sb-localhost-auth-token`.
 * This breaks session continuity between client and server.
 *
 * Solution: Pass `NEXT_PUBLIC_SUPABASE_URL` (localhost) to createServerClient for
 * consistent cookie naming, but intercept actual fetch() calls and rewrite the URL
 * to `SUPABASE_URL` (host.docker.internal) so the network request actually reaches Supabase.
 *
 * In production, SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL are the same internet URL,
 * so the rewrite is a no-op.
 */
export function getDockerAwareFetch(): typeof fetch | undefined {
  const internalUrl = process.env.SUPABASE_URL
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // No-op in production or when URLs are the same
  if (!internalUrl || !publicUrl || internalUrl === publicUrl) return undefined

  return (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url

    const rewritten = urlStr.startsWith(publicUrl)
      ? urlStr.replace(publicUrl, internalUrl)
      : urlStr

    const rewrittenInput = typeof input === 'string'
      ? rewritten
      : input instanceof URL
        ? new URL(rewritten)
        : new Request(rewritten, input as Request)

    return fetch(rewrittenInput, init)
  }
}

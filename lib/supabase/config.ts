/**
 * Supabase connection details.
 *
 * These two values previously appeared as `process.env.X ?? "<hardcoded>"`
 * fallbacks in four files. The literals were publishable browser credentials,
 * so the exposure was never the problem — the *silence* was. A preview
 * deployment with a missing or misspelled variable did not fail; it quietly
 * connected to the production project and wrote real customer data into it.
 *
 * There is no fallback now. The check is deliberately lazy — thrown when a
 * Supabase call is actually attempted, not at module load — so that a build or
 * a page render without these variables still succeeds and the site stays up.
 * What breaks is only the feature that needs Supabase, loudly, in the logs.
 */
type SupabaseConfig = { url: string; publishableKey: string };

export function supabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for this environment.",
    );
  }

  return { url, publishableKey };
}

/** True when both variables are present, for callers that degrade gracefully. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Supabase has two generations of API key, and they are sent DIFFERENTLY.
 *
 *   legacy:  a JWT (eyJ...), carrying the role as a claim. Works in both the
 *            `apikey` header and `Authorization: Bearer`.
 *   current: sb_publishable_... / sb_secret_..., which are NOT JWTs. Sent as
 *            a Bearer token, the platform tries to parse one as a JWT and
 *            rejects the request with "Invalid JWT". They belong in `apikey`
 *            only.
 *
 * Sending both headers was fine for as long as every key was a JWT. The
 * moment somebody pastes a current-generation key into Vercel, every call
 * built that way starts failing — and the failure reads like a bad key
 * rather than a bad header, which is a miserable afternoon.
 *
 * So: build request headers HERE, never by hand at the call site.
 *
 * Supabase deprecates the legacy keys at the end of 2026; both generations
 * work until then, and this handles either.
 */
export function isJwtKey(key: string): boolean {
  // A JWT is three base64url segments. Checking the shape rather than the
  // "eyJ" prefix means a differently-encoded header still reads correctly.
  const parts = key.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Headers for a Supabase REST/Auth call made AS THE KEY ITSELF — anon for a
 * publishable key, service_role for a secret one.
 *
 * To act as a signed-in USER instead, pass their access token as
 * `bearerToken`: the user's JWT goes in Authorization while the key stays in
 * apikey, which is what keeps RLS in the path.
 */
export function supabaseHeaders(
  key: string,
  bearerToken?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };

  if (bearerToken) {
    // A user's access token is always a JWT, so this is always correct.
    headers.Authorization = `Bearer ${bearerToken}`;
  } else if (isJwtKey(key)) {
    // Legacy key: harmless, and preserves the previous behaviour exactly.
    headers.Authorization = `Bearer ${key}`;
  }
  // Current-generation key with no user token: apikey alone, deliberately.

  return headers;
}

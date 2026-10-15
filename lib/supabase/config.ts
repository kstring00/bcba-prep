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

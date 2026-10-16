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
 *
 * Removing the fallbacks is also what makes a missing variable in Vercel
 * fatal rather than invisible, which is why the error below names the exact
 * variables and why callers must distinguish it from a network failure: both
 * happen before any request reaches Supabase, so neither leaves a trace in
 * the Supabase logs. Without that distinction the only evidence of a
 * misconfigured deployment is an opaque 500.
 */
type SupabaseConfig = { url: string; publishableKey: string };

/** The variables every Supabase call needs, by name. Never their values. */
export const REQUIRED_SUPABASE_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

/**
 * Thrown when the deployment itself is misconfigured, as opposed to anything
 * the person at the keyboard did. Callers catch this specifically: "please try
 * again" is a lie here, because retrying cannot fix an unset variable.
 */
export class SupabaseConfigError extends Error {
  readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    super(
      `Supabase is not configured. Missing in this environment: ${missing.join(", ")}. ` +
        "Set it in Vercel for the Production environment, then redeploy — " +
        "changing a variable does not alter deployments that already exist.",
    );
    this.name = "SupabaseConfigError";
    this.missing = missing;
  }
}

/** Which required variables are absent. Names only — never values. */
export function missingSupabaseVars(): string[] {
  return REQUIRED_SUPABASE_VARS.filter((name) => !process.env[name]);
}

export function supabaseConfig(): SupabaseConfig {
  const missing = missingSupabaseVars();
  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

/** True when both variables are present, for callers that degrade gracefully. */
export function isSupabaseConfigured(): boolean {
  return missingSupabaseVars().length === 0;
}

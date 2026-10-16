import { supabaseConfig, supabaseHeaders } from "./config";

/**
 * SERVICE-ROLE ACCESS. SERVER ONLY. READ THIS BEFORE USING IT.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security entirely. A request
 * made with it can read and write every row belonging to every customer.
 *
 * It is deliberately NOT prefixed `NEXT_PUBLIC_`, so Next.js will not inline
 * it into the client bundle. Never rename it, never pass it to a client
 * component, never return it from a route.
 *
 * There are exactly two legitimate uses in this codebase:
 *
 *   1. app/api/webhook/route.ts — writing purchases and entitlements after
 *      Stripe has verified a payment. The buyer has no session at that moment
 *      (Stripe is calling, not the browser), so there is no user token to act
 *      as, and RLS has no INSERT policy by design.
 *   2. app/api/content/[id]/route.ts — minting a signed URL for a file, AFTER
 *      that route has independently verified the session and the entitlement.
 *
 * Reading entitlements for the UI does NOT belong here. That goes through
 * lib/entitlements/server.ts with the user's own token, so RLS stays in the
 * path and a wrong `user_id` cannot leak someone else's library.
 */
export function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Fulfillment and protected " +
        "content delivery cannot work without it.",
    );
  }
  return key;
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Headers for a service-role REST call. Bypasses RLS — see the note above.
 *
 * Built by supabaseHeaders so that a current-generation `sb_secret_` key is
 * sent in `apikey` only. Sent as a Bearer token it would be parsed as a JWT
 * and rejected, and the resulting "Invalid JWT" looks like a bad key rather
 * than a bad header.
 */
export function adminHeaders(): Record<string, string> {
  return supabaseHeaders(serviceRoleKey());
}

export function restUrl(path: string): string {
  const { url } = supabaseConfig();
  return `${url}${path}`;
}

/**
 * Signs a private-storage object for short-lived download.
 *
 * 60 seconds is intentional. The URL is handed straight to the browser as a
 * redirect, so it only has to survive one immediate fetch. A long expiry is a
 * shareable link to paid material; a short one is useless the moment it
 * leaves the owner's browser.
 */
export const SIGNED_URL_TTL_SECONDS = 60;

export async function createSignedUrl(
  storagePath: string,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  const { url } = supabaseConfig();

  const response = await fetch(
    /*
     * Each path segment is encoded separately: encoding the whole string
     * would destroy the slashes that make it a path, and leaving it raw would
     * let a "../" in a storage_path walk out of the materials bucket. The
     * value comes from the database rather than a request, so this is depth
     * rather than a live hole.
     */
    `${url}/storage/v1/object/sign/materials/` +
      storagePath.split("/").map(encodeURIComponent).join("/"),
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ expiresIn }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error(
      "[storage] signing failed",
      response.status,
      await response.text().catch(() => ""),
    );
    return null;
  }

  const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signed = payload.signedURL ?? payload.signedUrl;
  if (!signed) return null;

  // Supabase returns a root-relative path; make it absolute.
  return signed.startsWith("http") ? signed : `${url}/storage/v1${signed}`;
}

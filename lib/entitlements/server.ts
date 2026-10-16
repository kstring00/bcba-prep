import { domains } from "@/lib/domains";
import { domainSku, type Sku } from "@/lib/catalog";
import { getAccessToken } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";

/**
 * OWNERSHIP, READ SERVER-SIDE.
 *
 * The read is made AS THE USER, with their own access token as the bearer.
 * Two things follow, and both matter:
 *
 *   1. PostgREST validates the JWT signature, so a forged cookie returns
 *      nothing rather than someone else's rows. This is the real verification
 *      step behind the cheap local decode in lib/auth/session.ts.
 *   2. RLS scopes the result to that user. Even a bug here cannot leak
 *      another person's entitlements, because the database will not return
 *      them.
 *
 * Deliberately NOT using the service-role key. Reading entitlements with a
 * key that bypasses RLS would mean one wrong `user_id` in a query string
 * hands a customer somebody else's library.
 */

export type Ownership = {
  userId: string | null;
  ownedSkus: Sku[];
};

export const EMPTY_OWNERSHIP: Ownership = { userId: null, ownedSkus: [] };

type EntitlementRow = { sku: string };

/**
 * Every SKU the signed-in user actively owns. Returns an empty list when
 * nobody is signed in, when Supabase is unconfigured, or on any failure —
 * failing closed, so a transient error shows "Unlock" rather than opening
 * paid content.
 */
export async function getOwnedSkus(): Promise<Sku[]> {
  const token = await getAccessToken();
  if (!token) return [];

  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = supabaseConfig());
  } catch {
    return [];
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/entitlements?select=sku&active=eq.true`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[entitlements] read failed", response.status);
      return [];
    }

    const rows = (await response.json()) as EntitlementRow[];
    return rows.map((row) => row.sku);
  } catch (error) {
    console.error("[entitlements] read threw", error);
    return [];
  }
}

export function ownsSku(ownedSkus: Sku[], sku: Sku): boolean {
  return ownedSkus.includes(sku);
}

export function ownsDomain(ownedSkus: Sku[], slug: string): boolean {
  return ownedSkus.includes(domainSku(slug));
}

/** Domain slugs the user owns, in catalog order. */
export function ownedDomainSlugs(ownedSkus: Sku[]): string[] {
  return domains
    .map((domain) => domain.slug)
    .filter((slug) => ownsDomain(ownedSkus, slug));
}

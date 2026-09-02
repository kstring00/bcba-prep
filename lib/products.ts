import { domains } from "./domains";

/**
 * Sellable license catalogue.
 *
 * THIS FILE IS THE SERVER-SIDE SOURCE OF TRUTH FOR PRICING.
 * The browser may send product ids only. Checkout always derives the amount,
 * license scope, and entitlement slugs from this catalogue on the server.
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  /** Display amount in cents (USD). Checkout also derives from server pricing. */
  price: number;
  /** Set on single-domain licenses; absent on the complete-library license. */
  domainSlug?: string;
  /** Domains this product grants. Never accept this list from the browser. */
  entitlementSlugs: string[];
  kind: "module" | "bundle";
};

export const BUNDLE_ID = "bundle-complete";
export const DOMAIN_LICENSE_PRICE = 2900;
export const THREE_DOMAIN_PRICE = 7500;
export const FIVE_DOMAIN_PRICE = 11500;
export const COMPLETE_LIBRARY_PRICE = 17900;

/**
 * One personal-use license per domain. The price is intentionally consistent
 * across domains: customers are buying access to the body of work for the
 * domain they need, not purchasing exam-weight percentage points.
 */
const modules: Product[] = domains.map((domain) => ({
  id: `module-${domain.slug}`,
  name: `Domain ${domain.letter} — ${domain.title}`,
  description: `Personal, non-transferable license to the BCBA Prep materials published within Domain ${domain.letter}.`,
  price: DOMAIN_LICENSE_PRICE,
  domainSlug: domain.slug,
  entitlementSlugs: [domain.slug],
  kind: "module",
}));

const bundle: Product = {
  id: BUNDLE_ID,
  name: "Complete A–I Domain Library",
  description:
    "Personal, non-transferable license to the complete BCBA Prep domain library, Domains A through I.",
  price: COMPLETE_LIBRARY_PRICE,
  entitlementSlugs: domains.map((domain) => domain.slug),
  kind: "bundle",
};

export const products: Product[] = [bundle, ...modules];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductForDomain(slug: string): Product | undefined {
  return products.find((p) => p.domainSlug === slug);
}

export function getBundle(): Product {
  return bundle;
}

export function getEntitlementSlugs(productId: string): string[] {
  return getProduct(productId)?.entitlementSlugs ?? [];
}

export type LicensePricing = {
  total: number;
  regularTotal: number;
  savings: number;
  label: string | null;
  checkoutName: string;
  checkoutDescription: string;
  entitlementSlugs: string[];
};

/**
 * Applies the best advertised license tier to a unique set of domain products.
 *
 * 1 domain   $29
 * any 3      $75
 * any 5      $115
 * all 9      $179
 *
 * Counts between tiers use the best combination of the lower tier plus
 * individual licenses. At eight selected domains, the complete library is
 * cheaper, so checkout automatically upgrades the buyer to all nine for $179.
 */
export function getLicensePricing(productIds: string[]): LicensePricing {
  const uniqueProducts = Array.from(new Set(productIds))
    .map(getProduct)
    .filter((product): product is Product => Boolean(product));

  if (uniqueProducts.some((product) => product.id === BUNDLE_ID)) {
    return {
      total: COMPLETE_LIBRARY_PRICE,
      regularTotal: domains.length * DOMAIN_LICENSE_PRICE,
      savings: domains.length * DOMAIN_LICENSE_PRICE - COMPLETE_LIBRARY_PRICE,
      label: "Complete library pricing",
      checkoutName: "Complete A–I Domain Library License",
      checkoutDescription: "Personal license to Domains A through I.",
      entitlementSlugs: domains.map((domain) => domain.slug),
    };
  }

  const selectedSlugs = uniqueProducts
    .filter((product) => product.kind === "module" && product.domainSlug)
    .map((product) => product.domainSlug as string);
  const count = selectedSlugs.length;
  const regularTotal = count * DOMAIN_LICENSE_PRICE;

  if (count === 0) {
    return {
      total: 0,
      regularTotal: 0,
      savings: 0,
      label: null,
      checkoutName: "BCBA Prep License",
      checkoutDescription: "Personal license to selected BCBA Prep materials.",
      entitlementSlugs: [],
    };
  }

  // The complete library beats a five-pack plus three-pack at 8 domains.
  if (count >= 8) {
    return {
      total: COMPLETE_LIBRARY_PRICE,
      regularTotal,
      savings: regularTotal - COMPLETE_LIBRARY_PRICE,
      label: "Automatic complete-library upgrade",
      checkoutName: "Complete A–I Domain Library License",
      checkoutDescription:
        "Eight or more selected domains automatically receive the complete A–I library license.",
      entitlementSlugs: domains.map((domain) => domain.slug),
    };
  }

  let total = regularTotal;
  let label: string | null = null;

  if (count >= 5) {
    total = FIVE_DOMAIN_PRICE + (count - 5) * DOMAIN_LICENSE_PRICE;
    label = count === 5 ? "Any 5 domains" : "5-domain bundle + additional domains";
  } else if (count >= 3) {
    total = THREE_DOMAIN_PRICE + (count - 3) * DOMAIN_LICENSE_PRICE;
    label = count === 3 ? "Any 3 domains" : "3-domain bundle + additional domain";
  }

  const names = selectedSlugs
    .map((slug) => domains.find((domain) => domain.slug === slug)?.letter)
    .filter(Boolean)
    .join(", ");

  return {
    total,
    regularTotal,
    savings: regularTotal - total,
    label,
    checkoutName: `${count}-Domain BCBA Prep License`,
    checkoutDescription: `Personal license to selected Domains ${names}.`,
    entitlementSlugs: selectedSlugs,
  };
}

export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

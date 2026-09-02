import { domains } from "./domains";

/**
 * Sellable items.
 *
 * THIS FILE IS THE SERVER-SIDE SOURCE OF TRUTH FOR PRICING.
 *
 * `app/api/checkout/route.ts` resolves every cart line back to an entry here
 * and sends only the `priceId` to Stripe. Nothing a client posts about money
 * is ever trusted — the client sends product ids and quantities only.
 * `price` below exists to render a number in the UI; it is never used to
 * charge anyone.
 *
 * ENTITLEMENTS ARE INTENTIONAL MVP METADATA.
 *
 * A product grants access to one or more domain slugs. At launch this can be
 * used purely as the canonical record for manual fulfillment. Later, if paid
 * demand justifies a member library, the exact same mapping can drive stored
 * entitlements without changing the storefront product model.
 *
 * Keep this abstraction now. Do NOT treat its existence as a requirement to
 * build authentication, a member portal, or automated entitlement storage
 * before the first validated sales.
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  /** Stripe Price ID (price_...). The only pricing input Stripe receives. */
  priceId: string;
  /** Display amount in cents (USD). Never sent to Stripe. */
  price: number | null;
  /** Set on single-domain modules; absent on bundles. */
  domainSlug?: string;
  /** Domains this product is intended to grant. Always derive server-side. */
  entitlementSlugs: string[];
  kind: "module" | "bundle";
};

export const BUNDLE_ID = "bundle-complete";

/**
 * One module per domain. Ids and entitlement slugs are structural keys.
 * Customer-facing names, descriptions and prices remain placeholders until
 * Bryana supplies final launch content and pricing.
 */
const modules: Product[] = domains.map((domain) => ({
  id: `module-${domain.slug}`,
  name: `[[TODO_PRODUCT_${domain.letter}_NAME]]`,
  description: `[[TODO_PRODUCT_${domain.letter}_DESCRIPTION]]`,
  priceId: `[[TODO_PRODUCT_${domain.letter}_PRICE_ID]]`,
  price: null, // [[TODO_PRODUCT_MODULE_PRICE]] — amount in cents (USD)
  domainSlug: domain.slug,
  entitlementSlugs: [domain.slug],
  kind: "module",
}));

const bundle: Product = {
  id: BUNDLE_ID,
  name: "[[TODO_PRODUCT_BUNDLE_NAME]]",
  description: "[[TODO_PRODUCT_BUNDLE_DESCRIPTION]]",
  priceId: "[[TODO_PRODUCT_BUNDLE_PRICE_ID]]",
  price: null, // [[TODO_PRODUCT_BUNDLE_PRICE]] — amount in cents (USD)
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

/**
 * Server-side helper for future automated fulfillment. Never accept
 * entitlement slugs from the browser or Stripe metadata; derive them from
 * the product catalogue here.
 */
export function getEntitlementSlugs(productId: string): string[] {
  return getProduct(productId)?.entitlementSlugs ?? [];
}

/** Display helper. Returns null while the price is still a placeholder. */
export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

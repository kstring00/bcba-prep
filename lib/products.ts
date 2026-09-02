import { domains } from "./domains";

/**
 * Sellable items.
 *
 * THIS FILE IS THE SERVER-SIDE SOURCE OF TRUTH FOR PRICING.
 *
 * `app/api/checkout/route.ts` resolves every cart line back to an entry here
 * and sends only the `priceId` to Stripe. Nothing a client posts about money
 * is ever trusted — the client sends product ids and quantities, nothing more.
 * `price` below exists to render a number in the UI; it is never used to
 * charge anyone.
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  /** Stripe Price ID (price_...). The only pricing input Stripe receives. */
  priceId: string;
  /** Display amount in cents (USD). Never sent to Stripe. */
  price: number | null;
  /** Set on single-domain modules; absent on the bundle. */
  domainSlug?: string;
  /**
   * The bundle is a first-class product, not an upsell: it is the
   * most-requested item and gets its own card in the stack and its own
   * treatment in the cart.
   */
  kind: "module" | "bundle";
};

export const BUNDLE_ID = "bundle-complete";

/**
 * One module per domain. Ids are structural keys, not copy — they stay.
 * Everything a customer reads or pays is a placeholder.
 */
const modules: Product[] = domains.map((domain) => ({
  id: `module-${domain.slug}`,
  name: `[[TODO_PRODUCT_${domain.letter}_NAME]]`,
  description: `[[TODO_PRODUCT_${domain.letter}_DESCRIPTION]]`,
  priceId: `[[TODO_PRODUCT_${domain.letter}_PRICE_ID]]`,
  price: null, // [[TODO_PRODUCT_MODULE_PRICE]] — amount in cents (USD)
  domainSlug: domain.slug,
  kind: "module",
}));

const bundle: Product = {
  id: BUNDLE_ID,
  name: "[[TODO_PRODUCT_BUNDLE_NAME]]",
  description: "[[TODO_PRODUCT_BUNDLE_DESCRIPTION]]",
  priceId: "[[TODO_PRODUCT_BUNDLE_PRICE_ID]]",
  price: null, // [[TODO_PRODUCT_BUNDLE_PRICE]] — amount in cents (USD)
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

/** Display helper. Returns null while the price is still a placeholder. */
export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

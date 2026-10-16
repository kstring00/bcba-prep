import { domains } from "./domains";
import { domainSku, isPurchasable, mockExams, type Sku } from "./catalog";

/**
 * Sellable license catalog.
 *
 * THIS FILE IS THE SERVER-SIDE SOURCE OF TRUTH FOR PRICING.
 * The browser may send product ids only. Checkout always derives the amount,
 * license scope, and entitlement slugs from this catalog on the server.
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  /** Display amount in cents (USD). Checkout also derives from server pricing. */
  price: number;
  /** Set on single-domain licenses; absent on the complete-library license. */
  domainSlug?: string;
  /**
   * SKUs this product grants. Never accept this list from the browser —
   * app/api/checkout/route.ts derives it here and writes it into Stripe
   * metadata, and the webhook grants exactly what Stripe hands back.
   */
  entitlementSkus: Sku[];
  kind: "module" | "bundle" | "exam" | "everything";
};

export const BUNDLE_ID = "bundle-complete";
export const DOMAIN_LICENSE_PRICE = 2900;
export const THREE_DOMAIN_PRICE = 7500;
export const FIVE_DOMAIN_PRICE = 11500;
export const COMPLETE_LIBRARY_PRICE = 17900;

/**
 * ⚠️ KYLE: the everything tier (all nine domains PLUS every mock exam) needs
 * a real price. `null` keeps it off the storefront rather than advertising a
 * number nobody agreed to. See lib/catalog.ts for the other two figures.
 */
export const EVERYTHING_BUNDLE_PRICE: number | null = null;

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
  entitlementSkus: [domainSku(domain.slug)],
  kind: "module",
}));

const bundle: Product = {
  id: BUNDLE_ID,
  name: "Complete A–I Domain Library",
  description:
    "Personal, non-transferable license to the complete BCBA Prep domain library, Domains A through I.",
  price: COMPLETE_LIBRARY_PRICE,
  entitlementSkus: domains.map((domain) => domainSku(domain.slug)),
  kind: "bundle",
};

/**
 * Mock exams as sellable products. Each is excluded from the catalog until
 * its price is set, so an unpriced exam cannot be added to a cart or reach
 * checkout — see isPurchasable().
 */
const examProducts: Product[] = mockExams
  .filter((exam) => isPurchasable(exam.priceCents))
  .map((exam) => ({
    id: `exam-${exam.id}`,
    name: exam.name,
    description: `Personal, non-transferable license to ${exam.name}.`,
    price: exam.priceCents as number,
    entitlementSkus: [exam.sku],
    kind: "exam" as const,
  }));

/** The everything tier. Also absent until priced. */
const everythingBundle: Product[] = isPurchasable(EVERYTHING_BUNDLE_PRICE)
  ? [
      {
        id: "bundle-everything",
        name: "Everything — Domains A–I plus every mock exam",
        description:
          "Personal, non-transferable license to the complete domain library and every mock exam.",
        price: EVERYTHING_BUNDLE_PRICE,
        entitlementSkus: [
          ...domains.map((domain) => domainSku(domain.slug)),
          ...mockExams.map((exam) => exam.sku),
        ],
        kind: "everything" as const,
      },
    ]
  : [];

export const products: Product[] = [
  ...everythingBundle,
  bundle,
  ...modules,
  ...examProducts,
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductForDomain(slug: string): Product | undefined {
  return products.find((p) => p.domainSlug === slug);
}

export function getBundle(): Product {
  return bundle;
}

export function getEntitlementSkus(productId: string): Sku[] {
  return getProduct(productId)?.entitlementSkus ?? [];
}

export type LicensePricing = {
  total: number;
  regularTotal: number;
  savings: number;
  label: string | null;
  checkoutName: string;
  checkoutDescription: string;
  entitlementSkus: Sku[];
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

  /*
   * The everything tier supersedes everything else in the cart, and the
   * complete-library bundle supersedes individual domains. Checked in that
   * order so a cart holding both is priced at the broader tier rather than
   * double-charged.
   */
  const everything = uniqueProducts.find((p) => p.kind === "everything");
  if (everything) {
    const regular =
      domains.length * DOMAIN_LICENSE_PRICE +
      examProducts.reduce((sum, exam) => sum + exam.price, 0);
    return {
      total: everything.price,
      regularTotal: regular,
      savings: Math.max(0, regular - everything.price),
      label: "Everything pricing",
      checkoutName: everything.name,
      checkoutDescription: everything.description,
      entitlementSkus: everything.entitlementSkus,
    };
  }

  // Exams are priced per item and stack with any domain tier below.
  const selectedExams = uniqueProducts.filter((p) => p.kind === "exam");
  const examTotal = selectedExams.reduce((sum, exam) => sum + exam.price, 0);
  const examSkusSelected = selectedExams.flatMap((e) => e.entitlementSkus);

  if (uniqueProducts.some((product) => product.id === BUNDLE_ID)) {
    const regular = domains.length * DOMAIN_LICENSE_PRICE + examTotal;
    return {
      total: COMPLETE_LIBRARY_PRICE + examTotal,
      regularTotal: regular,
      savings: regular - (COMPLETE_LIBRARY_PRICE + examTotal),
      label: "Complete library pricing",
      checkoutName:
        selectedExams.length > 0
          ? "Complete A–I Domain Library License + mock exams"
          : "Complete A–I Domain Library License",
      checkoutDescription: "Personal license to Domains A through I.",
      entitlementSkus: [
        ...domains.map((domain) => domainSku(domain.slug)),
        ...examSkusSelected,
      ],
    };
  }

  const selectedSlugs = uniqueProducts
    .filter((product) => product.kind === "module" && product.domainSlug)
    .map((product) => product.domainSlug as string);
  const count = selectedSlugs.length;
  const regularTotal = count * DOMAIN_LICENSE_PRICE + examTotal;

  if (count === 0) {
    // Exams only.
    if (selectedExams.length > 0) {
      return {
        total: examTotal,
        regularTotal: examTotal,
        savings: 0,
        label: selectedExams.length > 1 ? "Mock exams" : null,
        checkoutName:
          selectedExams.length === 1
            ? selectedExams[0].name
            : `${selectedExams.length} Mock Exams`,
        checkoutDescription: "Personal license to the selected mock exam(s).",
        entitlementSkus: examSkusSelected,
      };
    }
    return {
      total: 0,
      regularTotal: 0,
      savings: 0,
      label: null,
      checkoutName: "BCBA Prep License",
      checkoutDescription: "Personal license to selected BCBA Prep materials.",
      entitlementSkus: [],
    };
  }

  // The complete library beats a five-pack plus three-pack at 8 domains.
  if (count >= 8) {
    return {
      total: COMPLETE_LIBRARY_PRICE + examTotal,
      regularTotal,
      savings: regularTotal - (COMPLETE_LIBRARY_PRICE + examTotal),
      label: "Automatic complete-library upgrade",
      checkoutName: "Complete A–I Domain Library License",
      checkoutDescription:
        "Eight or more selected domains automatically receive the complete A–I library license.",
      entitlementSkus: [
        ...domains.map((domain) => domainSku(domain.slug)),
        ...examSkusSelected,
      ],
    };
  }

  let total = count * DOMAIN_LICENSE_PRICE;
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
    total: total + examTotal,
    regularTotal,
    savings: regularTotal - (total + examTotal),
    label,
    checkoutName: `${count}-Domain BCBA Prep License`,
    checkoutDescription: `Personal license to selected Domains ${names}.`,
    entitlementSkus: [
      ...selectedSlugs.map((slug) => domainSku(slug)),
      ...examSkusSelected,
    ],
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

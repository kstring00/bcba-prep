import { domains } from "./domains";

/**
 * THE CATALOGUE — one place that answers "what can be owned, and what is it?"
 *
 * Everything sellable resolves to one or more **SKUs**. A SKU is the unit of
 * ownership: an entitlement row grants exactly one SKU, and a piece of content
 * belongs to exactly one SKU.
 *
 * SKUs are namespaced strings — `domain:ethics`, `exam:mock-1` — so domain
 * study materials and mock exams share one entitlements table and one
 * ownership check, instead of each growing its own parallel plumbing.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * FIGURES KYLE STILL NEEDS TO FILL IN
 * ──────────────────────────────────────────────────────────────────────────
 * The mock-exam price, its question count, and the everything-bundle price
 * are business facts nobody has supplied yet. They are `null` on purpose.
 *
 * `null` is not a placeholder to tidy up later — it is load-bearing. The UI
 * reads it and says "pricing coming soon" instead of printing a number
 * somebody invented, and `isPurchasable()` returns false so the item cannot
 * be sold at a made-up price. Fill these in and the product goes live; leave
 * them and the site stays honest.
 */

export type Sku = string;

export const DOMAIN_SKU_PREFIX = "domain:";
export const EXAM_SKU_PREFIX = "exam:";

export function domainSku(slug: string): Sku {
  return `${DOMAIN_SKU_PREFIX}${slug}`;
}

export function examSku(id: string): Sku {
  return `${EXAM_SKU_PREFIX}${id}`;
}

export function isDomainSku(sku: Sku): boolean {
  return sku.startsWith(DOMAIN_SKU_PREFIX);
}

export function isExamSku(sku: Sku): boolean {
  return sku.startsWith(EXAM_SKU_PREFIX);
}

/** `domain:ethics` → `ethics`. Returns null for any other namespace. */
export function domainSlugFromSku(sku: Sku): string | null {
  return isDomainSku(sku) ? sku.slice(DOMAIN_SKU_PREFIX.length) : null;
}

// ===========================================================================
// MOCK EXAMS
// ===========================================================================

/**
 * A mock exam is delivered one of two ways, and the model carries both from
 * the start so adding the interactive version later is a data change rather
 * than a schema migration:
 *
 *   "file"        — a downloadable document. This is what ships now.
 *   "interactive" — an in-browser exam. NOT BUILT. Setting this on an exam
 *                   today will render an "available soon" state, not a quiz.
 *
 * Deliberately no quiz engine yet. Building one before a single exam has sold
 * is the wrong order.
 */
export type ExamDelivery = "file" | "interactive";

export type MockExam = {
  id: string;
  sku: Sku;
  name: string;
  /** One sentence for cards and list rows. */
  blurb: string;
  /** Who it is for. Shown on the public page. */
  audience: string;
  delivery: ExamDelivery;
  /** Scored items. `null` until Bryana confirms the real count. */
  questionCount: number | null;
  /** Price in cents. `null` until confirmed — blocks sale, see note above. */
  priceCents: number | null;
};

/**
 * ⚠️ KYLE: fill in `questionCount` and `priceCents` below, then redeploy.
 * Until both are set this exam shows as "coming soon" and cannot be bought.
 */
export const mockExams: MockExam[] = [
  {
    id: "mock-1",
    sku: examSku("mock-1"),
    name: "BCBA Mock Exam",
    blurb:
      "A full-length practice exam written to mirror the structure and weighting of the real thing.",
    audience:
      "Candidates who have worked through the domains and want to find their weak areas before exam day.",
    delivery: "file",
    questionCount: null, // ⚠️ needs the real number
    priceCents: null, //    ⚠️ needs the real price
  },
];

export function getMockExam(id: string): MockExam | undefined {
  return mockExams.find((exam) => exam.id === id);
}

/**
 * An item is purchasable only once its price is a real number. This is what
 * stops a `null` price being rendered as "$0" or "$NaN" and sold.
 */
export function isPurchasable(priceCents: number | null): priceCents is number {
  return typeof priceCents === "number" && priceCents > 0;
}

export const examSkus: Sku[] = mockExams.map((exam) => exam.sku);
export const domainSkus: Sku[] = domains.map((domain) => domainSku(domain.slug));
export const allSkus: Sku[] = [...domainSkus, ...examSkus];

// ===========================================================================
// DISPLAY
// ===========================================================================

export type SkuDisplay = {
  sku: Sku;
  title: string;
  subtitle: string;
  /** Where a logged-in owner goes to use it. */
  libraryHref: string;
  /** Where a non-owner goes to buy it. */
  salesHref: string;
};

export function describeSku(sku: Sku): SkuDisplay | null {
  const domainSlug = domainSlugFromSku(sku);
  if (domainSlug) {
    const domain = domains.find((d) => d.slug === domainSlug);
    if (!domain) return null;
    return {
      sku,
      title: `Domain ${domain.letter} — ${domain.title}`,
      subtitle: `${domain.percent}% of scored items`,
      libraryHref: `/member/domain/${domain.slug}`,
      salesHref: `/domain/${domain.slug}`,
    };
  }

  const exam = mockExams.find((e) => e.sku === sku);
  if (exam) {
    return {
      sku,
      title: exam.name,
      subtitle: exam.questionCount
        ? `${exam.questionCount} questions`
        : "Full-length practice exam",
      libraryHref: `/member/exam/${exam.id}`,
      salesHref: "/mock-exams",
    };
  }

  return null;
}

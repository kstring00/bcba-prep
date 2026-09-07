/**
 * PRE-LAUNCH SALES GATE.
 *
 * BCBA Prep is not selling yet. The study materials are not finished, and
 * there is no fulfilment path — a completed payment today would leave a real
 * customer with a receipt and nothing to download.
 *
 * This module is the single switch that keeps that from happening. It is
 * deliberately OFF by default: sales are enabled only when
 * NEXT_PUBLIC_SALES_ENABLED is exactly "true". A missing, misspelled, or
 * empty variable keeps the store closed. Failing closed is the whole point.
 *
 * Two layers read this flag, and BOTH must stay in place:
 *
 *   1. app/api/checkout/route.ts refuses to create a Stripe Checkout Session.
 *      This is the layer that actually protects the customer's money, and it
 *      is authoritative — the browser cannot bypass it.
 *   2. The storefront hides its buy controls, so nobody reaches a dead button.
 *      This is courtesy, not security. Never rely on it alone.
 *
 * Turning sales on is a launch-day step with prerequisites. See
 * LAUNCH_CHECKLIST.md before flipping it.
 */
export const SALES_ENABLED = process.env.NEXT_PUBLIC_SALES_ENABLED === "true";

/** Shown wherever a price or buy button would otherwise appear. */
export const PRE_LAUNCH_HEADLINE = "Not yet available for purchase";

export const PRE_LAUNCH_BLURB =
  "Bee is finishing her own BCBA certification before releasing these study materials. Domain licenses are not on sale yet — nothing here can be purchased today.";

/** Returned by the checkout API while the gate is closed. */
export const PRE_LAUNCH_API_MESSAGE =
  "BCBA Prep is not selling yet. Domain licenses are not available for purchase at this time.";

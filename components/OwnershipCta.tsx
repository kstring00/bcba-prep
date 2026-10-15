"use client";

import Link from "next/link";
import { AddToCart } from "./AddToCart";
import { useOwnership } from "@/lib/entitlements/context";
import { PRE_LAUNCH_BLURB, PRE_LAUNCH_HEADLINE, SALES_ENABLED } from "@/lib/launch";
import { formatPrice, type Product } from "@/lib/products";
import { describeSku, type Sku } from "@/lib/catalog";

/**
 * THE ONE PLACE that decides what a visitor sees where a buy button goes.
 *
 * Four states, and every card on the site resolves to exactly one of them:
 *
 *   Owned          → "Open", straight to the item in the member library.
 *   Not owned      → "Unlock", to its purchase page or add-to-cart.
 *   Unpriced       → "Coming soon". Blocks the case where a product exists
 *                    but nobody has set its price; see lib/catalog.ts.
 *   Store closed   → the pre-launch notice.
 *
 * Centralised deliberately. The audit found owned-content buy buttons were a
 * real risk, and the fix is one component rather than the same conditional
 * copy-pasted into the domain page, the bundle card, the exam page and the
 * shelf — where it would drift.
 *
 * Rendering only. Checkout re-checks ownership server-side.
 */
type Props = {
  /** The sku this card is about, used for the ownership check. */
  sku: Sku;
  /** The sellable product, when one exists. Absent → unpriced/coming soon. */
  product?: Product;
  /** Cloth colour for the add-to-cart flight animation. */
  tone: string;
  unlockLabel?: string;
  /** Show the price next to the control. */
  showPrice?: boolean;
};

export function OwnershipCta({
  sku,
  product,
  tone,
  unlockLabel = "Unlock",
  showPrice = true,
}: Props) {
  const { owns, signedIn } = useOwnership();
  const display = describeSku(sku);

  // ---- Owned: go and use it. Never a buy button. ----
  if (signedIn && owns(sku)) {
    return (
      <div className="buy-row">
        <span className="owned-badge">
          <span aria-hidden="true">✓</span> Owned
        </span>
        <Link
          href={display?.libraryHref ?? "/member"}
          className="btn btn--solid"
          aria-label={display ? `Open ${display.title}` : "Open in My Library"}
        >
          Open
        </Link>
      </div>
    );
  }

  // ---- Store closed ----
  if (!SALES_ENABLED) {
    return (
      <div className="prelaunch-note">
        <strong>{PRE_LAUNCH_HEADLINE}</strong>
        <p>{PRE_LAUNCH_BLURB}</p>
      </div>
    );
  }

  // ---- Exists but has no price yet ----
  if (!product) {
    return (
      <div className="prelaunch-note">
        <strong>Coming soon</strong>
        <p>
          This is being finished now. It will be available here shortly.
        </p>
      </div>
    );
  }

  // ---- Not owned: buy it ----
  return (
    <div className="buy-row">
      {showPrice ? (
        <span className="price">{formatPrice(product.price)}</span>
      ) : null}
      <AddToCart product={product} tone={tone} label={unlockLabel} />
    </div>
  );
}

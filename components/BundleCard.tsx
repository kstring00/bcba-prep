"use client";

import { useRef } from "react";
import { OwnershipCta } from "./OwnershipCta";
import {
  PRE_LAUNCH_BLURB,
  PRE_LAUNCH_HEADLINE,
  SALES_ENABLED,
} from "@/lib/launch";
import {
  COMPLETE_LIBRARY_PRICE,
  FIVE_DOMAIN_PRICE,
  formatPrice,
  getBundle,
  THREE_DOMAIN_PRICE,
} from "@/lib/products";

/**
 * The complete set closes the bookshelf as a first-class license. Build-your-
 * own discounts are automatic when customers add individual domains.
 */
export function BundleCard() {
  const bundle = getBundle();
  const cardRef = useRef<HTMLElement>(null);

  return (
    <section className="bundle" ref={cardRef}>
      <div>
        <p className="eyebrow eyebrow--foil">Build your study library</p>
        <h2 className="bundle-title">{bundle.name}</h2>
        <p className="bundle-note">{bundle.description}</p>
        {SALES_ENABLED ? (
          <>
            <p className="bundle-note" style={{ marginTop: 10 }}>
              Any 3 domains <strong>{formatPrice(THREE_DOMAIN_PRICE)}</strong>
              {" · "}Any 5 <strong>{formatPrice(FIVE_DOMAIN_PRICE)}</strong>
              {" · "}All 9 <strong>{formatPrice(COMPLETE_LIBRARY_PRICE)}</strong>
            </p>
            <p className="bundle-note" style={{ marginTop: 6, color: "var(--mauve)" }}>
              Mix-and-match savings are applied automatically in your cart.
            </p>
          </>
        ) : null}
      </div>
      <OwnershipCta
        sku={bundle.entitlementSkus[0]}
        product={bundle}
        tone="#c9a961"
        unlockLabel="License all 9 domains"
      />
    </section>
  );
}

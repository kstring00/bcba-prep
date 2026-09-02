"use client";

import { useRef } from "react";
import { AddToCart } from "./AddToCart";
import { formatPrice, getBundle } from "@/lib/products";

/**
 * The bundle is the most-requested product, so it closes the stack as a
 * first-class item rather than an upsell bolted onto a domain page.
 */
export function BundleCard() {
  const bundle = getBundle();
  const price = formatPrice(bundle.price);
  const cardRef = useRef<HTMLElement>(null);

  return (
    <section className="bundle" ref={cardRef}>
      <div>
        <p className="eyebrow eyebrow--foil">All nine domains</p>
        <h2 className="bundle-title">{bundle.name}</h2>
        <p className="bundle-note">{bundle.description}</p>
      </div>
      <div className="buy-row">
        {price ? (
          <span className="price">{price}</span>
        ) : (
          <span className="price price--todo">
            [[TODO_PRODUCT_BUNDLE_PRICE]]
          </span>
        )}
        <AddToCart product={bundle} tone="#c9a961" sourceRef={cardRef} />
      </div>
    </section>
  );
}

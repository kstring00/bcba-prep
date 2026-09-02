"use client";

import { AddToCart } from "./AddToCart";
import { formatPrice, getBundle } from "@/lib/products";

/**
 * The bundle is the most-requested product, so it is a first-class item in
 * the stack rather than an upsell bolted onto a domain page.
 */
export function BundleCard() {
  const bundle = getBundle();
  const price = formatPrice(bundle.price);

  return (
    <section className="bundle">
      <div>
        <p className="eyebrow">All nine domains</p>
        <h2 className="bundle-title">{bundle.name}</h2>
        <p className="bundle-note">{bundle.description}</p>
      </div>
      <div className="buy-row">
        {price ? (
          <span className="price">{price}</span>
        ) : (
          <span className="price price--todo">[[TODO_PRODUCT_BUNDLE_PRICE]]</span>
        )}
        <AddToCart product={bundle} tone="#c9a961" />
      </div>
    </section>
  );
}

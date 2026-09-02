"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getProduct } from "@/lib/products";

export function CartPanel() {
  const {
    lines,
    open,
    setOpen,
    remove,
    subtotal,
    regularSubtotal,
    savings,
    pricingLabel,
  } = useCart();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Product ids only. Prices, discounts and entitlements are all derived
        // again on the server from lib/products.ts.
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.productId, quantity: 1 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setPending(false);
    }
  }

  const fade = reduceMotion ? { duration: 0 } : { duration: 0.2 };
  const slide = reduceMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.22, 0.61, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="cart-panel"
            initial={{ x: reduceMotion ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduceMotion ? 0 : "100%" }}
            transition={slide}
            aria-label="Cart"
          >
            <div className="cart-head">
              <p className="eyebrow eyebrow--foil">Your licenses</p>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="cart-empty">
                Nothing here yet. Pick a domain from the stack, or take the
                complete A–I library.
              </p>
            ) : (
              <ul className="cart-lines">
                {lines.map((line) => {
                  const product = getProduct(line.productId);
                  if (!product) return null;
                  return (
                    <li className="cart-line" key={line.productId}>
                      <div>
                        <span className="cart-line-kind">
                          {product.kind === "bundle"
                            ? "Complete library license"
                            : "Personal domain license"}
                        </span>
                        <p className="cart-line-name">{product.name}</p>
                        <span className="cart-line-price">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn--quiet"
                        onClick={() => remove(line.productId)}
                        aria-label={`Remove ${product.name}`}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="cart-foot">
              <hr className="hairline" />
              {pricingLabel ? (
                <div className="cart-pricing-note">
                  <span>{pricingLabel}</span>
                  {savings > 0 ? <strong>Save {formatPrice(savings)}</strong> : null}
                </div>
              ) : null}
              {savings > 0 ? (
                <div className="cart-total cart-total--regular">
                  <span className="eyebrow">Regular</span>
                  <span>{formatPrice(regularSubtotal)}</span>
                </div>
              ) : null}
              <div className="cart-total">
                <span className="eyebrow">License total</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              {error ? <p className="cart-error">{error}</p> : null}
              <p className="cart-license-note">
                Purchase grants one personal, non-transferable license to the
                selected domain materials. Automatic bundle pricing is applied at checkout.
              </p>
              <button
                type="button"
                className="btn btn--solid"
                style={{ width: "100%" }}
                disabled={lines.length === 0 || pending}
                onClick={checkout}
              >
                {pending ? "Opening secure checkout…" : "Purchase licenses"}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

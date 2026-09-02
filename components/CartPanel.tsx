"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getProduct } from "@/lib/products";

export function CartPanel() {
  const { lines, open, setOpen, setQuantity, subtotal } = useCart();
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
        // Ids and quantities only. No prices leave the client — the server
        // resolves every line against lib/products.ts.
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
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
              <p className="eyebrow eyebrow--foil">Cart</p>
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
                complete set.
              </p>
            ) : (
              <ul className="cart-lines">
                {lines.map((line) => {
                  const product = getProduct(line.productId);
                  if (!product) return null;
                  const price = formatPrice(product.price);
                  return (
                    <li className="cart-line" key={line.productId}>
                      <div>
                        {product.kind === "bundle" ? (
                          <span className="cart-line-kind">Complete set</span>
                        ) : null}
                        <p className="cart-line-name">{product.name}</p>
                        <span className="cart-line-price">
                          {price ?? "Price to be set"}
                        </span>
                      </div>
                      <div className="qty">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity - 1)
                          }
                          aria-label={`Remove one ${product.name}`}
                        >
                          &minus;
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity + 1)
                          }
                          aria-label={`Add one ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="cart-foot">
              <hr className="hairline" />
              <div className="cart-total">
                <span className="eyebrow">Subtotal</span>
                <span className="price">{formatPrice(subtotal) ?? "—"}</span>
              </div>
              {error ? <p className="cart-error">{error}</p> : null}
              <button
                type="button"
                className="btn btn--solid"
                style={{ width: "100%" }}
                disabled={lines.length === 0 || pending}
                onClick={checkout}
              >
                {pending ? "Opening checkout…" : "Checkout"}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

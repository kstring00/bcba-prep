"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BUNDLE_ID, getLicensePricing, getProduct } from "./products";
import { useOwnership } from "./entitlements/context";

export type CartLine = { productId: string; quantity: 1 };

type CartValue = {
  lines: CartLine[];
  count: number;
  /** Set when an add was refused because the item is already owned. */
  blockedMessage: string | null;
  clearBlocked: () => void;
  subtotal: number;
  regularSubtotal: number;
  savings: number;
  pricingLabel: string | null;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  registerImpact: (fn: (velocity: number) => void) => () => void;
  impact: (velocity: number) => void;
};

const CartContext = createContext<CartValue | null>(null);

/**
 * The cart holds unique personal-use licenses, not quantities of files.
 * A domain can appear once. Adding the complete-library license replaces
 * individual domains; adding an individual domain removes the complete set.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const { ownedSkus } = useOwnership();
  const impactListeners = useRef(new Set<(velocity: number) => void>());

  const clearBlocked = useCallback(() => setBlockedMessage(null), []);

  const add = useCallback(
    (productId: string) => {
      const product = getProduct(productId);
      if (!product) return;

      /*
       * An owned item never enters the cart.
       *
       * This is the first of three layers. The storefront already shows
       * "Open" rather than a buy button for owned items, and
       * app/api/checkout/route.ts refuses the purchase outright. This layer
       * catches the paths in between — a stale page, a bundle that overlaps
       * something already owned, a double click.
       *
       * Refuses only when EVERY sku the product grants is already owned. A
       * bundle that adds even one new domain is still worth buying, and the
       * checkout route gives the precise error for the partial case.
       */
      const grants = product.entitlementSkus;
      if (grants.length > 0 && grants.every((sku) => ownedSkus.includes(sku))) {
        setBlockedMessage(
          `You already own ${product.name}. Open it from My Library.`,
        );
        return;
      }

      setBlockedMessage(null);
      setLines((prev) => {

      if (productId === BUNDLE_ID) {
        return [{ productId: BUNDLE_ID, quantity: 1 }];
      }

      const withoutBundle = prev.filter((line) => line.productId !== BUNDLE_ID);
      if (withoutBundle.some((line) => line.productId === productId)) {
        return withoutBundle;
      }

        return [...withoutBundle, { productId, quantity: 1 }];
      });
    },
    [ownedSkus],
  );

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const registerImpact = useCallback((fn: (velocity: number) => void) => {
    const listeners = impactListeners.current;
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const impact = useCallback((velocity: number) => {
    for (const listener of impactListeners.current) listener(velocity);
  }, []);

  const pricing = useMemo(
    () => getLicensePricing(lines.map((line) => line.productId)),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      count: pricing.entitlementSkus.length,
      blockedMessage,
      clearBlocked,
      subtotal: pricing.total,
      regularSubtotal: pricing.regularTotal,
      savings: pricing.savings,
      pricingLabel: pricing.label,
      add,
      remove,
      clear,
      open,
      setOpen,
      registerImpact,
      impact,
    }),
    [
      lines,
      pricing,
      blockedMessage,
      clearBlocked,
      add,
      remove,
      clear,
      open,
      registerImpact,
      impact,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

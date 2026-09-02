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

export type CartLine = { productId: string; quantity: 1 };

type CartValue = {
  lines: CartLine[];
  count: number;
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
  const impactListeners = useRef(new Set<(velocity: number) => void>());

  const add = useCallback((productId: string) => {
    setLines((prev) => {
      const product = getProduct(productId);
      if (!product) return prev;

      if (productId === BUNDLE_ID) {
        return [{ productId: BUNDLE_ID, quantity: 1 }];
      }

      const withoutBundle = prev.filter((line) => line.productId !== BUNDLE_ID);
      if (withoutBundle.some((line) => line.productId === productId)) {
        return withoutBundle;
      }

      return [...withoutBundle, { productId, quantity: 1 }];
    });
  }, []);

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
      count: pricing.entitlementSlugs.length,
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

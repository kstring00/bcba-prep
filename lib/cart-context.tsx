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
import { getProduct, type Product } from "./products";

export type CartLine = { productId: string; quantity: number };

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number | null;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * Subscribe a cart control to flight impacts. Returns an unsubscribe.
   *
   * This is a SET, not a single slot. Two cart controls are mounted at once
   * — one in the fixed rail, one in the mobile top bar — and only one of
   * them is displayed at any width. A single-slot registry silently hands
   * the knock to whichever mounted last, which is the hidden one.
   */
  registerImpact: (fn: (velocity: number) => void) => () => void;
  impact: (velocity: number) => void;
};

const CartContext = createContext<CartValue | null>(null);

/**
 * In-memory only, for the length of the session. No localStorage or
 * sessionStorage anywhere — a reload starts an empty cart, by design.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const impactListeners = useRef(new Set<(velocity: number) => void>());

  const add = useCallback((productId: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
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

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  // Null until every line has a real price. Prices are placeholders today, so
  // the UI must render "—" rather than a wrong number.
  const subtotal = useMemo(() => {
    let total = 0;
    for (const line of lines) {
      const product: Product | undefined = getProduct(line.productId);
      if (!product || product.price === null) return null;
      total += product.price * line.quantity;
    }
    return total;
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      add,
      setQuantity,
      remove,
      clear,
      open,
      setOpen,
      registerImpact,
      impact,
    }),
    [
      lines,
      count,
      subtotal,
      add,
      setQuantity,
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

"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

/**
 * The cart control, and the landing target for the add-to-cart flight.
 *
 * Lives in the sticky header. The header carries no 3D transform, so it
 * stays a valid containing block and the flight's getBoundingClientRect
 * target stays accurate as the page scrolls.
 */
export function CartButton() {
  const { count, setOpen, registerImpact } = useCart();
  const reduceMotion = useReducedMotion();
  // Displacement when something lands in it. Springs from 0 back to 0,
  // seeded with the flier's arrival velocity, so the size of the knock is
  // set by how fast the thing was travelling.
  const knock = useMotionValue(0);
  const [ripple, setRipple] = useState(0);
  const rippleCount = useRef(0);

  useEffect(() => {
    return registerImpact((velocity: number) => {
      if (reduceMotion) return;
      // The flight arrives at roughly 10,000 px/s. This spring's undamped
      // frequency is near 20 rad/s, so peak displacement is about
      // velocity/20 — the divisor lands a typical arrival at a ~12px knock,
      // and a slower arrival at proportionally less. Calibrated against a
      // measured flight, not guessed.
      const seeded = Math.max(-300, Math.min(300, velocity / 42));
      animate(knock, 0, {
        type: "spring",
        velocity: seeded,
        stiffness: 420,
        damping: 14,
        restDelta: 0.05,
      });
      rippleCount.current += 1;
      setRipple(rippleCount.current);
    });
  }, [knock, reduceMotion, registerImpact]);

  return (
    <motion.button
      type="button"
      className="pill"
      data-cart-target=""
      onClick={() => setOpen(true)}
      style={{ y: knock, position: "relative" }}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      Cart
      {count > 0 ? <span className="cart-count">{count}</span> : null}
      {/* Ring rippling out from the control as it takes the hit. */}
      {ripple > 0 && !reduceMotion ? (
        <motion.span
          key={ripple}
          className="cart-ring"
          initial={{ opacity: 0.8, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        />
      ) : null}
    </motion.button>
  );
}

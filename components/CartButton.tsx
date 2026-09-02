"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

export function CartButton() {
  const { count, setOpen, registerImpact } = useCart();
  const reduceMotion = useReducedMotion();
  // Displacement of the button when something lands in it. Springs from 0
  // back to 0, seeded with the flier's arrival velocity, so the size of the
  // knock is set by how fast the thing was travelling.
  const knock = useMotionValue(0);
  const [ripple, setRipple] = useState(0);
  const rippleCount = useRef(0);

  useEffect(() => {
    registerImpact((velocity: number) => {
      if (reduceMotion) return;
      // The flight arrives at roughly 10,000 px/s. This spring has an
      // undamped frequency near 20 rad/s, so peak displacement is about
      // velocity/20 — the divisor is set to land a typical arrival at a
      // ~12px knock, and a slower arrival (a nearer source element) at
      // proportionally less. Calibrated against a measured flight, not
      // guessed.
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
      className="cart-button"
      data-cart-target=""
      onClick={() => setOpen(true)}
      style={{ y: knock }}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <span>Cart</span>
      <span className="cart-badge">{count}</span>

      {/* Ring rippling out from the icon as it takes the hit. */}
      {ripple > 0 && !reduceMotion ? (
        <motion.span
          key={ripple}
          className="cart-ring"
          initial={{ opacity: 0.75, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        />
      ) : null}
    </motion.button>
  );
}

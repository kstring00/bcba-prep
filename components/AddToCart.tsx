"use client";

// `arc` ships in the installed Motion 13.1.1 (re-exported from motion-dom via
// framer-motion/dom) and works on the free tier — verified against
// node_modules, and the resulting curve was then measured in a browser rather
// than assumed. It takes exactly the options the reference animation uses.
import { animate, arc } from "motion";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/products";
import { FLIGHT_DURATION, FLIGHT_EASE } from "./motion-config";

/**
 * Created once at module scope on purpose. `arc()` carries a continuity
 * closure so successive flights curve consistently; a fresh instance per
 * render has no memory and the direction flickers between clicks.
 */
const FLIGHT_PATH = arc({
  strength: 0.5,
  peak: 0.15,
  rotate: 0.9,
  direction: "cw",
});

type Flier = {
  key: number;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  scale: number;
};

type Props = {
  product: Product;
  /** Cloth color of the thing being bought, so the flier looks like it. */
  tone: string;
  /** The element that visually departs. Falls back to the button itself. */
  sourceRef?: RefObject<HTMLElement | null>;
  /** Called when the flier launches, so the source can hide. */
  onDepart?: () => void;
  /** Called when the flier lands, so the source can scale back in. */
  onArrive?: () => void;
  label?: string;
};

export function AddToCart({
  product,
  tone,
  sourceRef,
  onDepart,
  onArrive,
  label = "Add to cart",
}: Props) {
  const reduceMotion = useReducedMotion();
  const { add, impact } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flier, setFlier] = useState<Flier | null>(null);
  const flightId = useRef(0);

  // The ease arrives fast, so the tail of the flight carries real speed.
  // Sampled from successive frames and handed to the cart's knock spring.
  const arrivalSpeed = useRef(0);

  const handleClick = useCallback(() => {
    // Reduced motion: no flight at all, add instantly.
    if (reduceMotion) {
      add(product.id);
      return;
    }

    const source = sourceRef?.current ?? buttonRef.current;
    // There are two cart controls in the DOM — one in the fixed rail, one in
    // the mobile top bar — and exactly one of them is displayed. Take the
    // first with a real box: a `display: none` element measures 0x0, and
    // aiming the flight at it would fling the product to the top-left
    // corner on every phone.
    const target = [
      ...document.querySelectorAll<HTMLElement>("[data-cart-target]"),
    ].find((el) => el.getBoundingClientRect().width > 0);
    if (!source || !target) {
      add(product.id);
      return;
    }

    const s = source.getBoundingClientRect();
    const t = target.getBoundingClientRect();

    // Centre to centre, measured live. Doing it this way means the landing
    // stays accurate no matter what scale the element picks up in flight.
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);
    const targetScale =
      Math.min(t.width, t.height) / Math.max(s.width, s.height);

    arrivalSpeed.current = 0;

    flightId.current += 1;
    setFlier({
      key: flightId.current,
      left: s.left,
      top: s.top,
      width: s.width,
      height: s.height,
      dx,
      dy,
      scale: targetScale,
    });
    onDepart?.();
  }, [add, onDepart, product.id, reduceMotion, sourceRef]);

  const flierRef = useRef<HTMLDivElement>(null);

  /*
    The flight runs through the IMPERATIVE `animate(element, ...)` API, not
    through a <motion.div animate={...} transition={{ path }}> prop.

    That is not a style preference. In the installed Motion 13.1.1,
    `transition.path` is only honoured by the imperative call sites —
    `animate()` from "motion" and `useAnimate()`. Passing the same `path` on
    a motion component's `transition` prop is accepted without any error, and
    the element snaps straight to its target: no arc, no tween, and
    `onAnimationComplete` never fires. Measured both ways in a browser:
    imperative arcs 168px off the chord and resolves; declarative deviates
    0.0px and never completes.

    x and y also have to travel in ONE call. `path` hooks in where it can see
    both axes and rewrite the pair as a curve; animating them as two separate
    values silently degrades to a straight line.
  */
  useLayoutEffect(() => {
    const el = flierRef.current;
    if (!flier || !el) return;

    let raf = 0;
    let prev: { t: number; x: number; y: number } | null = null;
    const sample = () => {
      const r = el.getBoundingClientRect();
      const now = performance.now();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (prev) {
        const dt = (now - prev.t) / 1000;
        if (dt > 0) {
          arrivalSpeed.current = Math.hypot(x - prev.x, y - prev.y) / dt;
        }
      }
      prev = { t: now, x, y };
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);

    const travel = animate(
      el,
      { x: flier.dx, y: flier.dy, scale: flier.scale },
      { duration: FLIGHT_DURATION, ease: FLIGHT_EASE, path: FLIGHT_PATH },
    );
    // Fades over the final 5% of travel, not across the whole arc.
    animate(
      el,
      { opacity: [1, 1, 0] },
      {
        duration: FLIGHT_DURATION,
        times: [0, 0.95, 1],
        ease: "linear",
      },
    );

    let cancelled = false;
    travel.then(() => {
      if (cancelled) return;
      cancelAnimationFrame(raf);
      add(product.id);
      impact(arrivalSpeed.current);
      setFlier(null);
      onArrive?.();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [add, flier, impact, onArrive, product.id]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn--solid"
        onClick={handleClick}
      >
        {label}
      </button>

      {flier ? (
        <div
          ref={flierRef}
          key={flier.key}
          className="flier"
          aria-hidden="true"
          style={{
            left: flier.left,
            top: flier.top,
            width: flier.width,
            height: flier.height,
            background: tone,
            transformOrigin: "center center",
          }}
        />
      ) : null}
    </>
  );
}

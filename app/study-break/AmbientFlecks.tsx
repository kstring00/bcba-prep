"use client";

import { useReducedMotion } from "motion/react";
import styles from "./study-break.module.css";

/**
 * The page's ONE idle ambient motion: slow drifting light flecks, very low
 * opacity. Spec allows at most one, so there is exactly one.
 *
 * Pure CSS transform animation on a handful of spans, with
 * `will-change: transform` and nothing else moving, so it costs almost
 * nothing. Hidden outright under prefers-reduced-motion — an ambient drift is
 * decoration, and decoration is the first thing to go.
 */
const FLECKS = [
  { left: "12%", top: "18%", delay: "0s", scale: 1 },
  { left: "78%", top: "12%", delay: "-7s", scale: 0.7 },
  { left: "64%", top: "62%", delay: "-13s", scale: 1.2 },
  { left: "24%", top: "74%", delay: "-4s", scale: 0.85 },
  { left: "46%", top: "34%", delay: "-18s", scale: 0.6 },
  { left: "88%", top: "48%", delay: "-10s", scale: 0.9 },
];

export function AmbientFlecks() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div className={styles.flecks} aria-hidden="true">
      {FLECKS.map((fleck, i) => (
        <span
          key={i}
          style={{
            left: fleck.left,
            top: fleck.top,
            animationDelay: fleck.delay,
            "--fleck-scale": fleck.scale,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

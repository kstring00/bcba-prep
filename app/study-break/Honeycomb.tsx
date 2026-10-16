"use client";

import { useReducedMotion } from "motion/react";
import styles from "./study-break.module.css";

/**
 * The round counter: one honeycomb cell per focus round, filled with liquid
 * gold as each one completes.
 *
 * THE HONEY POUR (the page's one dramatic beat)
 *
 * A bead forms above the cell, falls, and spreads from the point of contact
 * with a single slow ripple reaching the cell wall at 1200ms. The fill itself
 * is an SVG clip rectangle rising through the cell, so nothing is layered on
 * top of the geometry and nothing reflows.
 *
 * Everything animates transform and opacity only. The fill height is a CSS
 * custom property driving a transform on the clip rect, not a height change,
 * so there is no layout work per frame.
 *
 * Reduced motion: cells cross-fade to their filled state. No bead, no ripple,
 * no pour — the information is identical, the theatre is not.
 */
type Props = {
  total: number;
  filled: number;
  /** The cell that just completed, so only it performs the pour. */
  pouringIndex: number | null;
  glowing: boolean;
};

const CELL = 46;
// A regular hexagon, flat-top, drawn once and reused per cell.
const HEX_POINTS = "23,2 42,13 42,34 23,45 4,34 4,13";

export function Honeycomb({ total, filled, pouringIndex, glowing }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`${styles.comb}${glowing ? ` ${styles.combGlow}` : ""}`}
      role="img"
      aria-label={`${filled} of ${total} focus rounds complete`}
    >
      {Array.from({ length: total }, (_, index) => {
        const isFilled = index < filled;
        const isPouring = index === pouringIndex && !reduceMotion;
        const clipId = `comb-clip-${index}`;

        return (
          <svg
            key={index}
            className={`${styles.cell}${isPouring ? ` ${styles.cellPouring}` : ""}`}
            width={CELL}
            height={CELL}
            viewBox="0 0 46 46"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <polygon points={HEX_POINTS} />
              </clipPath>
              <linearGradient id={`honey-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8C878" />
                <stop offset="55%" stopColor="#C9A961" />
                <stop offset="100%" stopColor="#A8862F" />
              </linearGradient>
            </defs>

            {/* Empty cell: a blind-stamped outline, matching the hairlines
                used elsewhere on the site. */}
            <polygon
              points={HEX_POINTS}
              className={styles.cellOutline}
            />

            {/* The gold. Translated up from below rather than grown, so the
                browser only composites. */}
            <g clipPath={`url(#${clipId})`}>
              <rect
                x="0"
                y="0"
                width="46"
                height="46"
                fill={`url(#honey-${index})`}
                className={
                  isFilled ? styles.honeyFilled : styles.honeyEmpty
                }
              />
              {/* Meniscus: a soft lighter band riding the surface. */}
              {isFilled ? (
                <rect
                  x="0"
                  y="0"
                  width="46"
                  height="3"
                  className={styles.honeyMeniscus}
                />
              ) : null}
            </g>

            {/* The ripple, only on the cell that just filled. Expands from
                the contact point to the wall. */}
            {isPouring ? (
              <circle
                cx="23"
                cy="23"
                r="4"
                className={styles.ripple}
                clipPath={`url(#${clipId})`}
              />
            ) : null}

            {/* Specular highlight on a filled cell — the wet look. */}
            {isFilled ? (
              <ellipse
                cx="17"
                cy="15"
                rx="6"
                ry="3.5"
                className={styles.gleam}
                clipPath={`url(#${clipId})`}
              />
            ) : null}

            <polygon points={HEX_POINTS} className={styles.cellRim} />
          </svg>
        );
      })}

      {/* The falling bead. Lives outside the cells so it can travel into one. */}
      {pouringIndex !== null && !reduceMotion ? (
        <span
          className={styles.bead}
          style={{ "--cell-index": pouringIndex } as React.CSSProperties}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

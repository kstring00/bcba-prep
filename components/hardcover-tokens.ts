/**
 * Design and motion tokens for the hardcover volumes in the home stack.
 *
 * Everything the Hardcover component needs that is a *number* lives here:
 * how thick a volume is, where it sits in the pile, how far it pulls out on
 * hover, and how the settle-in is timed. The colour side of the same system
 * (page cream, foil gradients, shadow tints) is the custom-property block at
 * the top of Hardcover.module.css.
 */

/**
 * Page-block thickness encodes exam weight: a 5% domain is the thinnest
 * volume, a 14% domain the thickest. The range is deliberately tight so the
 * thinnest still reads as a block of pages and the thickest does not crowd
 * the row beneath it.
 */
export const PAGE_DEPTH = {
  minPx: 6,
  maxPx: 18,
  minPercent: 5,
  maxPercent: 14,
} as const;

export function pageDepth(percent: number): number {
  const { minPx, maxPx, minPercent, maxPercent } = PAGE_DEPTH;
  const t = (percent - minPercent) / (maxPercent - minPercent);
  const clamped = Math.min(1, Math.max(0, t));
  // Half-pixel steps keep neighbouring weights (11/12/13%) distinguishable
  // without producing sub-pixel page lines.
  return Math.round((minPx + clamped * (maxPx - minPx)) * 2) / 2;
}

/**
 * Hand-placed jog. Each volume gets a tiny rotation and a few px of
 * horizontal offset, derived from its index through a fixed hash rather than
 * Math.random, so the pile is identical on every render and between server
 * and client.
 */
export const PLACEMENT = {
  maxRotateDeg: 0.5,
  maxOffsetPx: 4,
} as const;

/** Deterministic 0..1 noise. Two decorrelated taps per index. */
function seeded(index: number, salt: number): number {
  let h = (index + 1) * 374761393 + salt * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

export function placement(index: number): { rotate: number; x: number } {
  const rotate = (seeded(index, 1) * 2 - 1) * PLACEMENT.maxRotateDeg;
  const x = (seeded(index, 2) * 2 - 1) * PLACEMENT.maxOffsetPx;
  return {
    rotate: Math.round(rotate * 100) / 100,
    x: Math.round(x * 10) / 10,
  };
}

/** How far a volume slides out of the pile toward the reader. */
export const PULL = {
  hover: { x: 14, y: -6, rotateY: -5 },
  /** Reduced on narrow viewports: less room, and less GPU to spare. */
  hoverCompact: { x: 8, y: -4, rotateY: -2.5 },
  /** The beat before the route change on click. */
  open: { x: 26, y: -10, rotateY: -8 },
  openCompact: { x: 14, y: -6, rotateY: -4 },
  /** The volumes directly above and below make room, in px. */
  neighbourShift: 3,
} as const;

/** Milliseconds the pull-out plays before the router navigates. */
export const PULL_BEFORE_ROUTE_MS = 170;

export const ENTRY = {
  /** Bottom-up stagger between volumes, in seconds. */
  stagger: 0.06,
  /** Initial drop, in px, that the spring settles from. */
  dropPx: 22,
  spring: { type: "spring", stiffness: 520, damping: 24, mass: 0.8 },
  fade: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] },
} as const;

/**
 * Asymmetric hover easing: a quick, decelerating pull-out and a slower,
 * softer settle back into the pile.
 */
export const HOVER_OUT = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1],
} as const;

export const HOVER_BACK = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1],
} as const;

export const OPEN_PULL = {
  duration: PULL_BEFORE_ROUTE_MS / 1000,
  ease: [0.2, 0.7, 0.2, 1],
} as const;

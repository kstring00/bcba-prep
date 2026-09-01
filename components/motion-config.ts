/**
 * One transition for the whole shared-element handoff.
 *
 * 520ms sits in the requested 450-600ms band. The curve is a pure
 * decelerating ease (fast out of the gate, settling at the end) rather than
 * a spring: a spring overshoots, and a hardcover book landing on a table
 * does not bounce back up.
 */
export const BOOK_TRANSITION = {
  duration: 0.52,
  ease: [0.22, 0.61, 0.36, 1],
} as const;

/** Matches --spine-depth / --book-tilt in globals.css. */
export const SPINE_DEPTH = 46;
export const BOOK_TILT = -83;
export const BOOK_TILT_HOVER = -76;
/**
 * Narrow viewports get a shallower tilt delta and, on the transition, less
 * rotation work per frame. See useCompactViewport().
 */
export const BOOK_TILT_MOBILE = -82;

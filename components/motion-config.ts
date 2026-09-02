/**
 * One transition for the shared-element fold-open.
 *
 * 500ms. Measured settle under a 6x CPU throttle on a 380px viewport is
 * 569-617ms across runs, which keeps it inside the requested 500-650ms band
 * on a mid-range phone rather than only on a desktop.
 *
 * The curve is a pure decelerating ease, not a spring: a spring overshoots,
 * and a hardcover book landing on a table does not bounce back up.
 */
export const BOOK_TRANSITION = {
  duration: 0.5,
  ease: [0.22, 0.61, 0.36, 1],
} as const;

/**
 * Past -90deg on purpose: that is what puts the viewer above the pile and
 * makes each book's top face visible. See the derivation in globals.css.
 */
export const BOOK_TILT = -100;
/** How far a book eases open as it passes the vertical centre of the screen. */
export const SCROLL_TILT_DELTA = -7;
/** ...and how far it lifts toward the viewer while it does. */
export const SCROLL_Z_LIFT = 16;

/**
 * Per-index taper: each book down the pile sits further back on Z. The
 * matching width taper lives in CSS as --taper-w, so it can shrink on narrow
 * viewports without a second breakpoint in JS.
 */
export const TAPER_Z = -9;

/** Three-quarter angle of the hardcover on the detail page. */
export const COVER_TILT_X = -6;
export const COVER_TILT_Y = -20;

/**
 * Add-to-cart flight. Values from the reference animation described in the
 * brief; the file it named was not present in the repo. See AddToCart.tsx.
 */
export const FLIGHT_DURATION = 0.45;
export const FLIGHT_EASE = [0.74, 0.18, 0.93, 0.69] as const;

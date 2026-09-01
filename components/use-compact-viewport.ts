"use client";

import { useEffect, useState } from "react";

/**
 * Starts false so server and client agree on first render; the effect
 * corrects it before any paint-relevant animation begins.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/**
 * True on narrow viewports. Used to trim rotation work on phones — mobile is
 * the primary target here (most arrivals are TikTok's in-app browser), and a
 * mid-range phone compositing nine perspective layers has no headroom to
 * spare.
 */
export const useCompactViewport = () => useMediaQuery("(max-width: 640px)");

/**
 * True only for real pointers. Hover is decoration here, never a way to reach
 * anything — touch users lose nothing by never matching this.
 */
export const useCanHover = () =>
  useMediaQuery("(hover: hover) and (pointer: fine)");

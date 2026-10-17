"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll reveal, done once for the whole site.
 *
 * Anything with `data-reveal` starts a little low and transparent (see the
 * rule in globals.css) and gets `is-in` the first time it enters the
 * viewport. Once — it never un-reveals on scroll-back, because content that
 * fades out behind you is a trick, not a transition.
 *
 * `data-reveal-group` on a parent staggers its children by 60ms each, which
 * is enough to read as a sequence and not enough to feel like waiting.
 *
 * Progressive: the hidden state only applies once `html.js` is set here, so
 * without JavaScript nothing is ever invisible. Reduced motion is handled in
 * CSS — the class still toggles, the transition is just instant.
 */
export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (items.length === 0) return;

    // Stagger within a group by setting a per-element delay.
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]")).forEach((el, i) => {
        el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 60}ms`);
      });
    });

    // Anything already on screen at load reveals immediately rather than
    // waiting for a scroll that may never come.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Re-run per route: Next keeps this mounted across navigations.
  }, [pathname]);

  return null;
}

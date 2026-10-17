"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./FoundingCta.module.css";

/**
 * The sticky founding-list call to action.
 *
 * Not a nav tab. One slim pill, bottom-right on desktop; one bottom bar on
 * phones. The rules, each of which exists because the opposite was tried
 * somewhere and was worse:
 *
 *   - Appears after a short scroll, not on load. Someone who has not read a
 *     word yet is not ready to be asked for an email.
 *   - Dismisses for the session. Asking again on the next page is nagging.
 *   - Hides whenever a form field has focus, so it can never sit on top of
 *     the thing someone is typing into — including the founding-list form
 *     itself, the testimonial form, and sign-in.
 *   - Does not exist on /start. That is the page it links to.
 *   - On phones it reserves its own height below the page (body class), so
 *     the footer's last line is never hidden behind it.
 */
const DISMISS_KEY = "founding-cta-dismissed";
const SHOW_AFTER_PX = 320;

export function FoundingCta() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until read
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && t.matches("input, textarea, select, [contenteditable='true']");
    function onFocusIn(e: FocusEvent) {
      if (isField(e.target)) setTyping(true);
    }
    function onFocusOut(e: FocusEvent) {
      if (isField(e.target)) setTyping(false);
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const onStart = pathname === "/start";
  const show = !onStart && !dismissed && scrolled && !typing;

  // Reserve space for the mobile bar so it never covers the footer.
  useEffect(() => {
    document.body.classList.toggle("has-founding-bar", show);
    return () => document.body.classList.remove("has-founding-bar");
  }, [show]);

  if (onStart) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: the state still holds for this page */
    }
  }

  return (
    <div
      className={`${styles.wrap}${show ? ` ${styles.show}` : ""}`}
      aria-hidden={!show}
      // Inert while hidden so it is neither tabbable nor announced.
      {...(!show ? { inert: true } : {})}
    >
      <div className={styles.pill}>
        <Link href="/start" className={styles.link}>
          <span className={styles.label}>Join the founding list</span>
          <span className={styles.sub}>Founding-member pricing, locked in</span>
        </Link>
        <button
          type="button"
          className={styles.dismiss}
          onClick={dismiss}
          aria-label="Dismiss for now"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}

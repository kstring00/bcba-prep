"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BeeMark } from "./BeeMark";
import { CartButton } from "./CartButton";
import { useOwnership } from "@/lib/entitlements/context";
import { SALES_ENABLED } from "@/lib/launch";
import brandStyles from "./Brand.module.css";

/**
 * Nav changes shape with sign-in state.
 *
 * Signed out: the sales nav, with one "Member Login" link.
 * Signed in:  "My Library" plus an account menu holding sign-out.
 *
 * The header previously rendered "Member Login" TWICE — once in the nav for
 * narrow viewports, once as a pill in the header bar — which read as a
 * duplicate at the widths where both were visible. There is now exactly one
 * account control at every width.
 */
const NAV = [
  { href: "/", label: "Home" },
  { href: "/mock-exams", label: "Mock Exams" },
  { href: "/study-break", label: "Study Break" },
  { href: "/about", label: "About" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { signedIn, email } = useOwnership();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /*
   * THE MOBILE MENU.
   *
   * Four ways out — a link, Escape, a tap outside, the button again — because
   * a panel that can only be closed by the control that opened it is a trap
   * on a phone, where that control is the one thing a thumb cannot reach
   * while reading.
   *
   * Scroll is locked on <body> while it is open. Without that, scrolling the
   * panel scrolls the page underneath it, and closing the menu drops you
   * somewhere you never chose to be.
   */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Desktop browsers reserve a scrollbar; removing it would shift the whole
    // page sideways as the menu opens. Phones report 0 here, so this is a
    // no-op where it does not apply.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        // Send focus back to the control that opened it, or it lands on
        // <body> and the next Tab starts from the top of the document.
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      /*
       * Focus trap.
       *
       * The panel sits BEFORE the toggle in the DOM, so a plain Tab from the
       * button walks forward into the page behind the panel rather than into
       * the menu — which is why checking only the first and last items was
       * not enough. Anything outside the panel is pulled back in.
       */
      const focusable = navRef.current?.querySelectorAll<HTMLElement>("a, button");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && navRef.current?.contains(active);

      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (navRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setOpen(false);
    }

    /*
     * Put focus in the menu. Without this a screen-reader or keyboard user
     * opens a panel and is still standing outside it, and the first Tab
     * takes them into the page the panel is covering.
     *
     * requestAnimationFrame so focus lands after the panel is visible —
     * focusing something still visibility:hidden is a no-op in some browsers.
     */
    const frame = requestAnimationFrame(() => {
      navRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    });

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  // A route change must close the menu. Next keeps the component mounted
  // across navigations, so without this the panel stays open over the new
  // page — which looks like the tap did nothing.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close the account menu on an outside click or Escape, the way a menu is
  // expected to behave.
  useEffect(() => {
    if (!accountOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      setAccountOpen(false);
      setSigningOut(false);
      // Refresh so the server re-renders the layout without a session, which
      // resets every ownership-aware button on the page at once.
      router.push("/");
      router.refresh();
    }
  }

  /*
   * /start is a link-in-bio page: its value is being one uncluttered screen
   * for someone arriving from an Instagram or TikTok bio. A six-item nav
   * competing with the link stack is exactly what it exists to avoid, so the
   * site chrome is suppressed there. The Footer does the same.
   */
  if (pathname === "/start") return null;

  return (
    <header className="site-header">
      <Link
        href="/"
        className="brand"
        aria-label="BCBA Prep by Bee the Behavior Bae"
      >
        <span className={`brand-mark ${brandStyles.mark}`} aria-hidden="true">
          <BeeMark size={38} />
        </span>
        <span className="brand-name">
          BCBA Prep
          <small className={brandStyles.tagline}>by Bee the Behavior Bae</small>
        </span>
      </Link>

      <nav
        ref={navRef}
        id="primary-nav"
        className={`site-nav${open ? " site-nav--open" : ""}`}
        aria-label="Primary"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}

        {/* The in-nav account link, shown only at widths where the header
            pill is hidden. One control, never two. */}
        <Link
          href={signedIn ? "/member" : "/sign-in"}
          className="nav-login"
          onClick={() => setOpen(false)}
        >
          {signedIn ? "My Library" : "Member Login"}
        </Link>
        {signedIn ? (
          <button
            type="button"
            className="nav-login nav-signout"
            onClick={() => {
              setOpen(false);
              handleSignOut();
            }}
          >
            Sign out
          </button>
        ) : null}

        {/*
          The primary item in the menu, and the only one styled as a button.
          Nothing is on sale, so the founding list is the single action this
          site is asking anyone for — the menu should say so rather than
          presenting six equal-weight rows.

          Menu-only: /start suppresses the header entirely, so this cannot
          appear on the page it links to.
        */}
        <Link href="/start" className="nav-cta" onClick={() => setOpen(false)}>
          Join the founding list
        </Link>
      </nav>

      <div className="header-end">
        {/* A cart with nothing purchasable in it is a dead end, so the control
            is removed entirely while the pre-launch gate is closed. */}
        {SALES_ENABLED ? <CartButton /> : null}

        {signedIn ? (
          <div className="account-menu" ref={accountRef}>
            <Link href="/member" className="pill pill--login">
              My Library
            </Link>
            <button
              type="button"
              className="account-toggle"
              onClick={() => setAccountOpen((o) => !o)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <span aria-hidden="true">▾</span>
            </button>
            {accountOpen ? (
              <div className="account-dropdown" role="menu">
                {email ? (
                  <p className="account-email" title={email}>
                    {email}
                  </p>
                ) : null}
                <Link
                  href="/member"
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                >
                  My Library
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link href="/sign-in" className="pill pill--login">
            Member Login <span aria-hidden="true">+</span>
          </Link>
        )}

        <button
          ref={toggleRef}
          type="button"
          className={`nav-toggle${open ? " nav-toggle--open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {/*
            Three spans rather than an SVG, so the bars can morph into an X
            with a transform instead of swapping one icon for another. A swap
            reads as a flicker at this size; a morph reads as the same object
            changing state.
          */}
          <span className="nav-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BeeMark } from "./BeeMark";
import { CartButton } from "./CartButton";
import { Menu } from "./Icons";
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
          type="button"
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <Menu />
        </button>
      </div>
    </header>
  );
}

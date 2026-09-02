"use client";

import Link from "next/link";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { CartButton } from "./CartButton";
import { useTheme } from "@/lib/theme-context";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/sign-in", label: "Sign in" },
];

const DOTS = 5;

function Monogram() {
  return (
    <span className="monogram" aria-hidden="true">
      B
      <span style={{ marginLeft: "-0.16em" }}>P</span>
    </span>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <path
            key={i}
            d={`M${12 + Math.cos(a) * 7.2} ${12 + Math.sin(a) * 7.2}L${12 + Math.cos(a) * 9.6} ${12 + Math.sin(a) * 9.6}`}
          />
        );
      })}
    </svg>
  );
}

export function NavRail() {
  const { theme, toggle } = useTheme();
  const { scrollYProgress } = useScroll();
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(DOTS - 1, Math.max(0, Math.round(p * (DOTS - 1)))));
  });

  const themeLabel =
    theme === "cloth" ? "Switch to paper theme" : "Switch to cloth theme";

  return (
    <>
      <aside className="navrail">
        <Link href="/" aria-label="BCBA Prep, home">
          <Monogram />
        </Link>

        <div className="rail-spacer" />

        <hr className="rule-short" />
        {/* Reading position through the stack. */}
        <ul className="rail-dots" aria-hidden="true">
          {Array.from({ length: DOTS }, (_, i) => (
            <li key={i} className="rail-dot" data-on={i === active} />
          ))}
        </ul>
        <hr className="rule-short" />

        <div className="rail-spacer" />

        <ul className="rail-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
          <li>
            <CartButton />
          </li>
        </ul>

        <hr className="rule-short" style={{ marginTop: 20 }} />
        <button
          type="button"
          className="rail-toggle"
          onClick={toggle}
          aria-label={themeLabel}
        >
          <SunIcon />
        </button>
      </aside>

      {/* Under 900px the rail becomes a top bar rather than disappearing. */}
      <div className="railbar">
        <Link href="/" aria-label="BCBA Prep, home">
          <Monogram />
        </Link>
        <nav className="rail-links" style={{ flexDirection: "row" }}>
          <CartButton />
          <button
            type="button"
            className="rail-toggle"
            style={{ marginTop: 0 }}
            onClick={toggle}
            aria-label={themeLabel}
          >
            <SunIcon />
          </button>
        </nav>
      </div>
    </>
  );
}

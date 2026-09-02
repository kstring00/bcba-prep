"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BeeMark } from "./BeeMark";
import { CartButton } from "./CartButton";
import { Menu } from "./Icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link
        href="/"
        className="brand"
        aria-label="BCBA Prep by Bee the Behavior Bae"
      >
        <span className="brand-mark" aria-hidden="true">
          <BeeMark size={38} />
        </span>
        <span className="brand-name">
          BCBA Prep
          <small>by Bee the Behavior Bae</small>
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
        {/* Only rendered at widths where the header pill is hidden. */}
        <Link
          href="/sign-in"
          className="nav-login"
          onClick={() => setOpen(false)}
        >
          Member Login
        </Link>
      </nav>

      <div className="header-end">
        <CartButton />
        <Link href="/sign-in" className="pill pill--login">
          Member Login <span aria-hidden="true">+</span>
        </Link>
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

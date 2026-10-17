"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BeeMark } from "@/components/BeeMark";
import { FounderPortrait } from "@/app/about/FounderPortrait";
import { SALES_ENABLED } from "@/lib/launch";
import { captureAttribution } from "@/lib/funnel/utm";
import { WaitlistSignup } from "./WaitlistSignup";
import styles from "./start.module.css";

/**
 * Link-in-bio layout.
 *
 * One column, thumb-reachable, no site nav. Order is deliberate: who she is,
 * then the waitlist, then everything else. Someone who taps a bio link does
 * not yet know who Bryana is, so the photo and one line come first; asking a
 * stranger for their email before that is asking for a favour.
 */
type Destination = {
  href: string;
  label: string;
  note: string;
  /**
   * Shown only once the store is open.
   *
   * The domain and mock-exam pages exist but say their contents are being
   * finalised. Sending cold traffic from a bio link onto a page that admits
   * it is unfinished spends the one impression this page gets, and it
   * undercuts the founding-list offer sitting directly above it: "join to
   * hear when it opens" reads oddly next to a link that implies it already
   * has. They come back on their own when NEXT_PUBLIC_SALES_ENABLED flips,
   * rather than needing anyone to remember to re-add them.
   */
  gated?: boolean;
};

const DESTINATIONS: Destination[] = [
  {
    href: "/",
    label: "Study materials by domain",
    note: "All nine BACB domains, A–I",
    gated: true,
  },
  {
    href: "/mock-exams",
    label: "Mock exams",
    note: "Full-length practice",
    gated: true,
  },
  {
    href: "/study-break",
    label: "Study break timer",
    note: "Free — focus, breathe, stretch",
  },
  {
    href: "/about",
    label: "About Bryana",
    note: "Why she built this",
  },
];

export function StartFunnel({ signedIn }: { signedIn: boolean }) {
  // Read UTMs on arrival, before any tap can navigate them away, and forward
  // them to Clarity as session tags.
  useEffect(() => {
    captureAttribution();
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.head}>
          <div className={styles.portrait}>
            <FounderPortrait rounded />
          </div>
          <p className={styles.handle}>BCBA Prep by Bee the Behavior Bae</p>
          <h1>
            Hi, I&rsquo;m Bryana <span aria-hidden="true">🐝</span>
          </h1>
          <p className={styles.lede}>
            Six years in ABA. I&rsquo;m building BCBA exam prep that feels
            less overwhelming — and the founding list gets in first.
          </p>
        </header>

        {/* The conversion. First thing after the introduction. */}
        <WaitlistSignup />

        <nav className={styles.links} aria-label="BCBA Prep">
          {DESTINATIONS.filter((item) => !item.gated || SALES_ENABLED).map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              <span className={styles.linkText}>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
              </span>
              <span className={styles.linkArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}

          <Link
            href={signedIn ? "/member" : "/sign-in"}
            className={`${styles.link} ${styles.linkQuiet}`}
          >
            <span className={styles.linkText}>
              {/*
                * Not "My Library": nothing is on sale, so nobody has one,
                * and offering a library implies a store that is not open.
                */}
              <strong>{signedIn ? "Member area" : "Member sign in"}</strong>
              <small>
                {/*
                 * Not "already bought something?" — nothing is on sale, so
                 * that question implies a store this page is a waitlist for.
                 */}
                {signedIn ? "Your account" : "Already have an account?"}
              </small>
            </span>
            <span className={styles.linkArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </nav>

        <footer className={styles.foot}>
          <span className={styles.footMark} aria-hidden="true">
            <BeeMark size={22} />
          </span>
          <p>
            <Link href="/privacy">Privacy</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/contact">Contact</Link>
          </p>
        </footer>
      </div>
    </section>
  );
}

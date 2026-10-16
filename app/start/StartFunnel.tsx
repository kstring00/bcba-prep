"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BeeMark } from "@/components/BeeMark";
import { FounderPortrait } from "@/app/about/FounderPortrait";
import { captureAttribution } from "@/lib/funnel/utm";
import { CheatSheetCapture } from "./CheatSheetCapture";
import styles from "./start.module.css";

/**
 * Link-in-bio layout.
 *
 * One column, thumb-reachable, no site nav. Order is deliberate: who she is,
 * the free thing, then the paid things. Someone who taps a bio link does not
 * yet know who Bryana is, so the photo and one line come first; asking for an
 * email before that is asking a stranger for a favour.
 */
type Destination = {
  href: string;
  label: string;
  note: string;
};

const DESTINATIONS: Destination[] = [
  {
    href: "/",
    label: "Study materials by domain",
    note: "All nine BACB domains, A–I",
  },
  {
    href: "/mock-exams",
    label: "Mock exams",
    note: "Full-length practice",
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
            Six years in ABA. I make BCBA exam prep feel less overwhelming —
            start with the free cheat sheet.
          </p>
        </header>

        {/* The conversion. First thing after the introduction. */}
        <CheatSheetCapture />

        <nav className={styles.links} aria-label="BCBA Prep">
          {DESTINATIONS.map((item) => (
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
              <strong>{signedIn ? "My Library" : "Member sign in"}</strong>
              <small>
                {signedIn
                  ? "Open what you already own"
                  : "Already bought something?"}
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

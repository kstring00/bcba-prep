"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Book } from "@/components/Book";
import { BryanaTeaser } from "@/components/BryanaTeaser";
import { BundleCard } from "@/components/BundleCard";
import { Florals, Ornament } from "@/components/Florals";
import { BOOK_TRANSITION } from "@/components/motion-config";
import { domains } from "@/lib/domains";
import { domainSku } from "@/lib/catalog";
import { useOwnership } from "@/lib/entitlements/context";

/**
 * Hand-stacked jog, in px, one per book. A fixed table rather than random,
 * so the pile is identical on every render and between server and client.
 * Scaled by --jog in CSS, which is reined in on narrow viewports.
 */
const JOG_X = [0, 34, 16, 40, 36, 2, 24, 8, 18];
const JOG_W = [10, 0, 8, 2, 4, 12, 4, 0, 2];

export default function LibraryPage() {
  const reduceMotion = useReducedMotion();
  const { signedIn, owns } = useOwnership();
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);

  return (
    <>
      <section className="bleed">
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className="bleed-inner">
          <div className="home-head">
            <p className="script">The library</p>
            <h1 className="display">
              Nine domains. <span className="accent">One standard.</span>
            </h1>
            <Ornament wide />
            <p>
              Every domain of the BACB<sup>&reg;</sup> Task List, bound and
              weighted the way the exam is. Open one to see what is inside.
            </p>
          </div>

          <ul className="stack" id="stack">
            {domains.map((domain, index) => {
              const isOpening = domain.slug === openingSlug;
              const openingIndex = domains.findIndex(
                (d) => d.slug === openingSlug,
              );
              const distance =
                openingIndex === -1 ? 0 : Math.abs(index - openingIndex);
              const owned = signedIn && owns(domainSku(domain.slug));

              return (
                <motion.li
                  key={domain.slug}
                  className="stack-item"
                  // Each book above must paint over the receding top board of
                  // the book below it, the way a real pile occludes itself.
                  style={{ zIndex: domains.length - index }}
                  // Motion has already taken over the opened book — the copy
                  // traveling to the detail page belongs to the incoming
                  // route — so this original fades fast, taking its contact
                  // shadow with it. The other eight fall away, nearest first.
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : isOpening
                        ? { opacity: 0, transition: { duration: 0.12 } }
                        : {
                            opacity: 0,
                            y: 34,
                            transition: {
                              duration: 0.3,
                              delay: Math.min(distance, 4) * 0.03,
                              ease: [0.4, 0, 1, 1],
                            },
                          }
                  }
                  transition={BOOK_TRANSITION}
                >
                  <div
                    className="stack-row"
                    style={
                      {
                        "--i": index,
                        "--dx": `${JOG_X[index]}px`,
                        "--dw": `${JOG_W[index]}px`,
                      } as React.CSSProperties
                    }
                  >
                    <Link
                      href={
                        owned
                          ? `/member/domain/${domain.slug}`
                          : `/domain/${domain.slug}`
                      }
                      className="book-box"
                      onClick={() => setOpeningSlug(domain.slug)}
                      aria-label={
                        owned
                          ? `Open Domain ${domain.letter}, ${domain.title}, in your library`
                          : `Domain ${domain.letter}. ${domain.title} — ${domain.questions} questions, ${domain.percent}% of the exam. Not yet unlocked.`
                      }
                    >
                      <Book domain={domain} variant="stack" index={index} />
                      {owned ? (
                        <span className="shelf-owned" aria-hidden="true">
                          ✓ Owned
                        </span>
                      ) : null}
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </ul>

          <BundleCard />
          <BryanaTeaser />
        </div>
      </section>
    </>
  );
}

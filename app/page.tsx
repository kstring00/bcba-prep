"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Book } from "@/components/Book";
import { BryanaTeaser } from "@/components/BryanaTeaser";
import { BundleCard } from "@/components/BundleCard";
import { Ornament } from "@/components/Florals";
import { HexCluster, HexField } from "@/components/HexMotif";
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
        {/* The signature motif behind the hero. Florals are retired here;
            see DESIGN_DIRECTION.md. Desktop only — on a phone the pile fills
            the width and a field behind it is just noise. */}
        <div className="home-hex" aria-hidden="true">
          <HexField size={34} opacity={0.14} />
        </div>

        <div className="bleed-inner">
          {/*
            Desktop: the introduction sits in a sticky left column while the
            pile scrolls on the right, so the page uses the screen instead of
            centring a 940px pile in 1440px of cream. Phones keep the stacked
            order, introduction then pile.
          */}
          <div className="home-grid">
          <div className="home-head" data-reveal>
            <p className="script">The library</p>
            <h1 className="display">
              Nine domains. <span className="accent">One standard.</span>
            </h1>
            <Ornament wide />
            <p>
              Every domain of the BACB<sup>&reg;</sup> Task List, bound and
              weighted the way the exam is. Open one to see what is inside.
            </p>
            {/* The conversion, where the eye lands first on desktop. */}
            <div className="home-cta">
              <Link href="/start" className="btn--gold">
                Join the founding list <span aria-hidden="true">→</span>
              </Link>
              <Link href="/about" className="link-gold home-cta-quiet">
                Meet Bryana <span aria-hidden="true">→</span>
              </Link>
            </div>
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
          </div>

          <div className="home-foot" data-reveal-group>
            <div data-reveal><BundleCard /></div>
            <div data-reveal><BryanaTeaser /></div>
          </div>
        </div>
      </section>

      {/*
        The closing beat. Cream-on-cream from the nav to the footer had no
        rhythm, and the last thing read before the legal text was "Not yet
        available for purchase". The founding-list ask returns here, in night,
        with the copy the sticky pill already uses. See DESIGN_DIRECTION.md,
        template 4.
      */}
      <section className="sec sec--band home-band" data-reveal>
        <HexField className="hex-field" size={40} opacity={0.06} />
        <HexCluster className="hex-cluster" size={26} honey={1} />
        <div className="container">
          <div className="home-band-copy">
            <p className="eyebrow">The founding list</p>
            <h2 className="display-lg">Founding-member pricing, locked in.</h2>
            <p className="lede">
              Be first in when BCBA Prep opens. We&rsquo;ll email you before
              anyone else.
            </p>
          </div>
          <div className="home-band-action">
            <Link href="/start" className="btn--gold">
              Join the founding list <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

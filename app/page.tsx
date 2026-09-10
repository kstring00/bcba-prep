"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { BundleCard } from "@/components/BundleCard";
import { Florals, Ornament } from "@/components/Florals";
import { Hardcover } from "@/components/Hardcover";
import { PULL } from "@/components/hardcover-tokens";
import { BOOK_TRANSITION } from "@/components/motion-config";
import { domains } from "@/lib/domains";

/**
 * The settle-in plays once per page load. Coming back from a detail page the
 * pile is already "known", and the returning book needs a visible target to
 * fly into, so later mounts start at rest.
 */
let entryPlayed = false;

export default function LibraryPage() {
  const reduceMotion = useReducedMotion();
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [skipEntry] = useState(() => entryPlayed);

  const stackRef = useRef<HTMLUListElement>(null);
  const inView = useInView(stackRef, { once: true, amount: 0.15 });
  if (inView) entryPlayed = true;

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

          <ul className="stack" id="stack" ref={stackRef}>
            {domains.map((domain, index) => {
              const isOpening = domain.slug === openingSlug;
              const openingIndex = domains.findIndex(
                (d) => d.slug === openingSlug,
              );
              const distance =
                openingIndex === -1 ? 0 : Math.abs(index - openingIndex);

              // The volumes directly above and below a lifted one make room.
              const neighbourShift =
                hoveredIndex === null
                  ? 0
                  : index === hoveredIndex - 1
                    ? -PULL.neighbourShift
                    : index === hoveredIndex + 1
                      ? PULL.neighbourShift
                      : 0;

              const lifted = isOpening || index === hoveredIndex;

              return (
                <motion.li
                  key={domain.slug}
                  className="stack-item"
                  // Each book paints over the one below it, the way a pile
                  // occludes itself; a lifted book comes to the very front.
                  style={{ zIndex: lifted ? domains.length + 1 : domains.length - index }}
                  // Motion has already taken over the opened book — the copy
                  // travelling to the detail page belongs to the incoming
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
                  <Hardcover
                    domain={domain}
                    index={index}
                    count={domains.length}
                    revealed={inView}
                    skipEntry={skipEntry}
                    neighbourShift={neighbourShift}
                    opening={isOpening}
                    onHoverChange={(hovered) =>
                      setHoveredIndex((current) =>
                        hovered ? index : current === index ? null : current,
                      )
                    }
                    onOpen={() => setOpeningSlug(domain.slug)}
                  />
                </motion.li>
              );
            })}
          </ul>

          <BundleCard />
        </div>
      </section>
    </>
  );
}

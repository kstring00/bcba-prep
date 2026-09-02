"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Book } from "@/components/Book";
import { BundleCard } from "@/components/BundleCard";
import { BOOK_TRANSITION } from "@/components/motion-config";
import { domains } from "@/lib/domains";

export default function StackPage() {
  const reduceMotion = useReducedMotion();
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);

  return (
    <div className="rails">
      <div className="rail rail--left">
        <p className="eyebrow">The shelf</p>
        <p>[[TODO_SITE_TAGLINE]]</p>
      </div>

      <div>
        <ul className="stack">
          {domains.map((domain, index) => {
            const isOpening = domain.slug === openingSlug;
            const openingIndex = domains.findIndex(
              (d) => d.slug === openingSlug,
            );
            const distance =
              openingIndex === -1 ? 0 : Math.abs(index - openingIndex);

            return (
              <motion.li
                key={domain.slug}
                className="stack-item"
                // Each book above must paint over the receding top face of
                // the book below it, the way a real pile occludes itself.
                style={{ zIndex: domains.length - index }}
                // Motion has already taken over the opened book — the copy
                // travelling to the detail page belongs to the incoming route
                // — so this original fades fast, taking its contact shadow
                // with it. The other eight fall away, nearest first.
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
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <Link
                    href={`/domain/${domain.slug}`}
                    className="book-box"
                    onClick={() => setOpeningSlug(domain.slug)}
                    aria-label={`${domain.letter}. ${domain.title} — ${domain.questions} questions, ${domain.percent}% of the exam`}
                  >
                    <Book domain={domain} variant="stack" index={index} />
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <BundleCard />
      </div>

      <div className="rail rail--right">
        <p className="eyebrow">Edition</p>
        <p>[[TODO_EDITION_NOTE]]</p>
      </div>
    </div>
  );
}

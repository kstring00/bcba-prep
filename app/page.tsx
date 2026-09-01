"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Book } from "@/components/Book";
import { BOOK_TRANSITION } from "@/components/motion-config";
import { domains } from "@/lib/domains";

export default function ShelfPage() {
  const reduceMotion = useReducedMotion();
  // Which spine was clicked. Used only to decide which rows drop away and
  // which one is the shared element travelling to the domain page.
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);

  return (
    <ul className="shelf">
      {domains.map((domain, index) => {
        const isOpening = domain.slug === openingSlug;
        const openingIndex = domains.findIndex((d) => d.slug === openingSlug);
        const distance =
          openingIndex === -1 ? 0 : Math.abs(index - openingIndex);

        return (
          <motion.li
            key={domain.slug}
            className="shelf-item"
            // Motion has already taken over the selected spine — the copy
            // travelling to the domain page is the one on the incoming route
            // — so this original fades out fast, taking its contact shadow
            // with it. The other eight drop away, nearest to the opened book
            // first.
            exit={
              reduceMotion
                ? { opacity: 0 }
                : isOpening
                  ? { opacity: 0, transition: { duration: 0.12 } }
                  : {
                      opacity: 0,
                      y: 30,
                      transition: {
                        duration: 0.28,
                        delay: Math.min(distance, 4) * 0.03,
                        ease: [0.4, 0, 1, 1],
                      },
                    }
            }
            transition={BOOK_TRANSITION}
          >
            <div className="shelf-row">
              <Link
                href={`/domain/${domain.slug}`}
                className="book-box"
                onClick={() => setOpeningSlug(domain.slug)}
                aria-label={`${domain.letter}. ${domain.title}`}
              >
                <Book domain={domain} variant="spine" />
              </Link>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

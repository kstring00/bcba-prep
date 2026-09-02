"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Book } from "@/components/Book";
import { BundleCard } from "@/components/BundleCard";
import { BOOK_TRANSITION } from "@/components/motion-config";
import { domains } from "@/lib/domains";

/**
 * Hand-stacked jog, in px, one per book. A fixed table rather than random,
 * so the pile is identical on every render and between server and client.
 * Scaled by --jog in CSS, which is reined in on narrow viewports.
 */
const JOG_X = [0, 34, 16, 40, 36, 2, 24, 8, 18];
const JOG_W = [10, 0, 8, 2, 4, 12, 4, 0, 2];

export default function StackPage() {
  const reduceMotion = useReducedMotion();
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);

  /*
    The copy in this hero is transcribed from the reference design the
    project owner supplied, not written here. Anything the reference did not
    show is still a [[TODO_]] token.
  */
  return (
    <>
      <div className="hero">
        <div className="hero-intro">
          <h1 className="site-title">BCBA Prep</h1>
          <p className="site-edition">Sixth Edition</p>

          <hr className="rule-short" style={{ margin: "30px 0 0" }} />

          <p className="lede">
            Mastery across
            <br />
            every domain.
          </p>
          <p className="lede-body">
            Comprehensive study.
            <br />
            Evidence-based.
            <br />
            Exam-ready.
          </p>

          <Link href="#stack" className="explore">
            Explore the domains <span aria-hidden="true">&darr;</span>
          </Link>
        </div>

        <div className="hero-stack">
          <ul className="stack" id="stack">
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
                  // Each book above must paint over the receding top board of
                  // the book below it, the way a real pile occludes itself.
                  style={{ zIndex: domains.length - index }}
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
                      href={`/domain/${domain.slug}`}
                      className="book-box"
                      onClick={() => setOpeningSlug(domain.slug)}
                      aria-label={`Domain ${domain.letter}. ${domain.title} — ${domain.questions} questions, ${domain.percent}% of the exam`}
                    >
                      <Book domain={domain} variant="stack" index={index} />
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="hero-badge">
          <div className="badge-card">
            <span className="badge-shield" aria-hidden="true">
              6E
            </span>
            <div>
              <p className="badge-title">Sixth Edition</p>
              <p className="badge-body">
                All domains updated.
                <br />
                Always aligned.
                <br />
                Always current.
              </p>
              <Link href="/updates" className="btn" style={{ marginTop: 16 }}>
                View updates <span aria-hidden="true">&#8599;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-note">
          <p className="eyebrow">Science. Ethics. Impact.</p>

          <div>
            <hr className="rule-short" style={{ marginLeft: "auto" }} />
            <p className="rail-note" style={{ marginTop: 26 }}>
              Nine domains.
              <br />
              One standard.
              <br />
              Your future.
            </p>
            <p className="rail-sub">
              Aligned to the BACB<sup>&reg;</sup>
              <br />
              Task List (6th Edition)
            </p>
          </div>
        </div>
      </div>

      <BundleCard />
    </>
  );
}

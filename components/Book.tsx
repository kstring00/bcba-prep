"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Domain } from "@/lib/domains";
import { nameColor } from "@/lib/domains";
import { Motif } from "./Motifs";
import {
  BOOK_TILT,
  BOOK_TRANSITION,
  COVER_TILT_X,
  COVER_TILT_Y,
  SCROLL_TILT_DELTA,
  SCROLL_Z_LIFT,
  TAPER_Z,
} from "./motion-config";
import { useCompactViewport } from "./use-compact-viewport";

type Props = {
  domain: Domain;
  /**
   * "stack" — in the pile, hinged so the spine faces the viewer.
   * "cover" — on the detail page, opened to a three-quarter hardcover.
   * Both render the same element (same layoutId), so Motion treats them as
   * one object folding open between routes.
   */
  variant: "stack" | "cover";
  /** Position in the pile. Drives the taper and the edition mark. */
  index?: number;
};

export function Book({ domain, variant, index = 0 }: Props) {
  const reduceMotion = useReducedMotion();
  const compact = useCompactViewport();
  const rowRef = useRef<HTMLDivElement>(null);
  const isCover = variant === "cover";
  const ink = nameColor(domain);

  // Progress as this book crosses the viewport: 0 entering at the bottom,
  // 1 leaving at the top.
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });
  // Peaks at 1 when the book is at the vertical centre of the screen.
  const centrality = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  const taperZ = index * TAPER_Z;

  // A few degrees, capped. Books never fully open on scroll alone — that is
  // reserved for the click.
  const tilt = useTransform(
    centrality,
    [0, 1],
    [BOOK_TILT, BOOK_TILT + SCROLL_TILT_DELTA],
  );
  const lift = useTransform(
    centrality,
    [0, 1],
    [taperZ, taperZ + SCROLL_Z_LIFT],
  );

  const stackStyle =
    reduceMotion || isCover
      ? { rotateX: reduceMotion ? 0 : BOOK_TILT, z: taperZ }
      : { rotateX: tilt, z: lift };

  return (
    <motion.div
      layoutId={`book-${domain.slug}`}
      className="book-box"
      transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
      style={{ borderRadius: 1 }}
    >
      <motion.div
        ref={rowRef}
        className="book"
        // On the detail page the book starts in spine orientation and folds
        // open to a three-quarter cover. That rotation is the visible half of
        // the shared-element transition; the layoutId handles the travel.
        initial={
          isCover && !reduceMotion
            ? { rotateX: BOOK_TILT, rotateY: 0, z: 0 }
            : false
        }
        animate={
          isCover
            ? {
                rotateX: reduceMotion ? 0 : COVER_TILT_X,
                rotateY: reduceMotion || compact ? 0 : COVER_TILT_Y,
                z: 0,
              }
            : undefined
        }
        style={isCover ? undefined : stackStyle}
        transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
      >
        {/*
          Cover face: full size of the book, at the front.

          In the pile this is the top board, lit from above, so it sits a
          shade BRIGHTER than the spine rather than in shade. Opened flat on
          the detail page it is the front cover at full strength.
        */}
        <motion.div
          className="face face--cover"
          style={{ background: domain.cloth, color: domain.foil }}
          initial={
            isCover && !reduceMotion
              ? { opacity: 0, filter: "brightness(1.14)" }
              : false
          }
          animate={{ opacity: 1, filter: `brightness(${isCover ? 1 : 1.14})` }}
          transition={
            reduceMotion ? { duration: 0 } : { ...BOOK_TRANSITION, duration: 0.34 }
          }
        >
          {isCover ? (
            // `layout` here is scale correction, not motion: the parent box
            // animates from a spine-sized band to a full cover, and without
            // an inverse transform this text stretches for the whole flight.
            <motion.div
              layout
              className="cover-inner"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { ...BOOK_TRANSITION, opacity: { duration: 0.3, delay: 0.24 } }
              }
            >
              <div className="cover-head">
                <span className="cover-letter">Domain {domain.letter}</span>
                <span className="cover-motif">
                  <Motif slug={domain.slug} />
                </span>
              </div>
              <div>
                <h2 className="cover-title" style={{ color: ink }}>
                  {domain.title}
                </h2>
                <div className="cover-band">
                  {domain.questions} questions &middot; {domain.percent}% of the
                  exam
                </div>
              </div>
            </motion.div>
          ) : null}
        </motion.div>

        {/*
          Spine face: hinges forward off the cover's top edge.

          It stays visible on the detail page rather than fading out. Once the
          book has folded open the same face is seen almost edge-on and reads
          as the board thickness along the head of the book — without it the
          three-quarter cover is a flat parallelogram. Only its contents are
          dropped; a few pixels of band cannot carry type.
        */}
        <motion.div
          className="face face--spine"
          style={{ background: domain.cloth, color: domain.foil }}
          animate={{ opacity: 1, filter: `brightness(${isCover ? 1.16 : 1})` }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.26, ease: "linear" }
          }
        >
          {!isCover ? (
            <>
              <span className="spine-rule" aria-hidden="true" />
              <span className="spine-text">
                <span className="spine-eyebrow">Domain {domain.letter} &mdash;</span>
                <span className="spine-name" style={{ color: ink }}>
                  {domain.short}
                </span>
              </span>
              <span className="spine-motif" aria-hidden="true">
                <Motif slug={domain.slug} />
              </span>
              <span className="spine-weight">
                {domain.questions} &middot; {domain.percent}%
              </span>
              {/* The topmost board carries the full edition mark. */}
              <span
                className="spine-edition"
                data-lead={index === 0}
                aria-hidden="true"
              >
                6E
                {index === 0 ? <small>Sixth Edition</small> : null}
              </span>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { Domain } from "@/lib/domains";
import {
  BOOK_TILT,
  BOOK_TILT_HOVER,
  BOOK_TILT_MOBILE,
  BOOK_TRANSITION,
} from "./motion-config";
import { useCanHover, useCompactViewport } from "./use-compact-viewport";

type Props = {
  domain: Domain;
  /**
   * "spine" — on the shelf, hinged so the spine faces the viewer.
   * "cover"  — on the domain page, rotated flat so the cover faces the viewer.
   * Both render the same element (same layoutId), so Motion treats them as
   * one object travelling between routes.
   */
  variant: "spine" | "cover";
};

export function Book({ domain, variant }: Props) {
  const reduceMotion = useReducedMotion();
  const compact = useCompactViewport();
  const canHover = useCanHover();
  const [hovered, setHovered] = useState(false);
  const isCover = variant === "cover";
  const lift = hovered && canHover && !isCover;

  // Reduced motion: flat bars, no rotation at all.
  const restTilt = reduceMotion
    ? 0
    : compact
      ? BOOK_TILT_MOBILE
      : BOOK_TILT;

  return (
    <motion.div
      layoutId={`spine-${domain.slug}`}
      className="book-box"
      transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
      style={{ borderRadius: 2 }}
      onHoverStart={canHover ? () => setHovered(true) : undefined}
      onHoverEnd={canHover ? () => setHovered(false) : undefined}
    >
      <motion.div
        className="book"
        // On the shelf the tilt is the resting state, so there is nothing to
        // animate on mount. On the domain page the book starts in spine
        // orientation and rotates flat, which is the visible half of the
        // shared-element transition.
        initial={isCover && !reduceMotion ? { rotateX: restTilt } : false}
        // Hover lift is decoration only: touch pointers never set `hovered`,
        // and nothing on the shelf is reachable through hover alone.
        //
        // The brightness shift deliberately lives on the spine face below,
        // NOT here. A `filter` on an element flattens its 3D rendering
        // context, so putting it on this wrapper collapses the hinged spine
        // into an invisible edge the moment the pointer arrives.
        animate={{
          rotateX: isCover
            ? 0
            : lift && !reduceMotion
              ? BOOK_TILT_HOVER
              : restTilt,
        }}
        transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
      >
        {/* Cover face: full size of the book, at the front of the stack. */}
        <motion.div
          className="face face--cover"
          style={{ background: domain.color, color: domain.textColor }}
          // On the shelf the cover is the receding top surface of the book,
          // so it sits in shade; on the domain page it is lit fully.
          initial={
            isCover && !reduceMotion
              ? { opacity: 0, filter: "brightness(0.55)" }
              : false
          }
          animate={{ opacity: 1, filter: `brightness(${isCover ? 1 : 0.55})` }}
          transition={
            reduceMotion ? { duration: 0 } : { ...BOOK_TRANSITION, duration: 0.3 }
          }
        >
          {isCover ? (
            // `layout` here is scale correction, not motion: the parent's box
            // is being animated from 46px to full cover height, and without
            // an inverse transform on this child the title stretches
            // horizontally for the whole flight.
            <motion.div
              layout
              className="cover-inner"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      ...BOOK_TRANSITION,
                      opacity: { duration: 0.26, delay: 0.22 },
                    }
              }
            >
              <span className="cover-letter">{domain.letter}</span>
              <h1 className="cover-title">{domain.title}</h1>
            </motion.div>
          ) : null}
        </motion.div>

        {/* Spine face: hinges forward off the cover's top edge. */}
        <motion.div
          className="face face--spine"
          style={{ background: domain.color, color: domain.textColor }}
          animate={{
            opacity: isCover ? 0 : 1,
            filter: `brightness(${lift && !reduceMotion ? 1.07 : 1})`,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: isCover ? 0.18 : 0.24, ease: "linear" }
          }
        >
          {!isCover ? (
            <>
              <span className="spine-letter">{domain.letter}</span>
              <span className="spine-title">{domain.title}</span>
              {/* Balances the letter so the title stays optically centred. */}
              <span className="spine-rule" aria-hidden="true" />
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

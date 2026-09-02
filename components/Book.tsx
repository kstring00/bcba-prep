"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";
import type { Domain } from "@/lib/domains";
import { nameColor } from "@/lib/domains";
import { Motif } from "./Motifs";
import {
  BOOK_TILT,
  BOOK_TRANSITION,
  SCROLL_TILT_DELTA,
  SCROLL_Z_LIFT,
  TAPER_Z,
} from "./motion-config";
import tactile from "./BookEnhancements.module.css";

type Props = {
  domain: Domain;
  /**
   * "stack" — in the pile, hinged so the spine faces the viewer.
   * "cover" — on the detail page, opened to a front-facing hardcover.
   * Both render the same element (same layoutId), so Motion treats them as
   * one object folding open between routes.
   */
  variant: "stack" | "cover";
  /** Position in the pile. Drives the taper and the edition mark. */
  index?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function Book({ domain, variant, index = 0 }: Props) {
  const reduceMotion = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);
  const isCover = variant === "cover";
  const ink = nameColor(domain);
  const [dragging, setDragging] = useState(false);

  // Detail-page interaction lives on a wrapper around the existing book
  // geometry. This keeps the shared-element fold and the stack's scroll math
  // completely independent from the user's gentle click-drag tilt.
  const dragRotateX = useMotionValue(0);
  const dragRotateY = useMotionValue(0);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
  } | null>(null);

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

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isCover || reduceMotion || event.pointerType === "touch") return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotateX: dragRotateX.get(),
      rotateY: dragRotateY.get(),
    };
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!isCover || !start || start.pointerId !== event.pointerId) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    // Deliberately narrow limits: enough to reveal the page block and board
    // depth, never enough to turn the cover away from the reader.
    dragRotateY.set(clamp(start.rotateY + dx * 0.055, -9, 9));
    dragRotateX.set(clamp(start.rotateX - dy * 0.045, -6, 6));
  }

  function releasePointer(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    dragStart.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    // A real hardcover settles back onto the table; it does not stay cocked
    // at an arbitrary angle after the hand leaves it.
    animate(dragRotateX, 0, {
      duration: 0.28,
      ease: [0.22, 0.61, 0.36, 1],
    });
    animate(dragRotateY, 0, {
      duration: 0.28,
      ease: [0.22, 0.61, 0.36, 1],
    });
  }

  return (
    <motion.div
      layoutId={`book-${domain.slug}`}
      className={`book-box ${isCover ? tactile.coverBox : tactile.stackBox}`}
      data-dragging={isCover ? dragging : undefined}
      transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
      whileHover={
        !isCover && !reduceMotion
          ? {
              y: -6,
              scale: 1.006,
              transition: { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] },
            }
          : undefined
      }
      whileTap={
        !isCover && !reduceMotion
          ? { y: -3, scale: 1.003, transition: { duration: 0.1 } }
          : undefined
      }
      style={{ borderRadius: 1 }}
    >
      <motion.div
        className={tactile.interactionShell}
        style={
          isCover && !reduceMotion
            ? { rotateX: dragRotateX, rotateY: dragRotateY }
            : undefined
        }
        onPointerDown={isCover ? handlePointerDown : undefined}
        onPointerMove={isCover ? handlePointerMove : undefined}
        onPointerUp={isCover ? releasePointer : undefined}
        onPointerCancel={isCover ? releasePointer : undefined}
      >
        <motion.div
          ref={rowRef}
          className="book"
          // On the detail page the shared book folds all the way open to a
          // readable front view. User-controlled 3D inspection happens on the
          // wrapper above, and is clamped to a few degrees in either axis.
          initial={
            isCover && !reduceMotion
              ? { rotateX: BOOK_TILT, rotateY: 0, z: 0 }
              : false
          }
          animate={
            isCover
              ? {
                  rotateX: 0,
                  rotateY: 0,
                  z: 0,
                }
              : undefined
          }
          style={isCover ? undefined : stackStyle}
          transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
        >
          {isCover ? (
            <>
              <div
                className={tactile.backBoard}
                style={{ backgroundColor: domain.cloth }}
                aria-hidden="true"
              />
              <div className={tactile.pageBlock} aria-hidden="true" />
            </>
          ) : null}

          {/*
            Cover face: full size of the book, at the front.

            In the pile this is the top board, lit from above, so it sits a
            shade BRIGHTER than the spine rather than in shade. Opened flat on
            the detail page it is the front cover at full strength.
          */}
          <motion.div
            className={`face face--cover ${tactile.clothFace} ${
              isCover ? tactile.coverRealistic : ""
            }`}
            style={{ backgroundColor: domain.cloth, color: domain.foil }}
            initial={
              isCover && !reduceMotion
                ? { opacity: 0, filter: "brightness(1.14)" }
                : false
            }
            animate={{ opacity: 1, filter: `brightness(${isCover ? 1 : 1.14})` }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...BOOK_TRANSITION, duration: 0.34 }
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
                    : {
                        ...BOOK_TRANSITION,
                        opacity: { duration: 0.3, delay: 0.24 },
                      }
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
            book has folded open the same face is seen edge-on and reads as the
            board thickness along the head of the book — without it the cover
            would feel like a flat card.
          */}
          <motion.div
            className={`face face--spine ${tactile.clothFace} ${tactile.spineRealistic}`}
            style={{ backgroundColor: domain.cloth, color: domain.foil }}
            animate={{ opacity: 1, filter: `brightness(${isCover ? 1.16 : 1})` }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.26, ease: "linear" }
            }
          >
            {!isCover ? (
              <>
                <span className="spine-rule" aria-hidden="true" />
                <span className="spine-text">
                  <span className="spine-eyebrow">
                    Domain {domain.letter} &mdash;
                  </span>
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
                <span className={tactile.foilSweep} aria-hidden="true" />
              </>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

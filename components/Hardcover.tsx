"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  useRef,
  useState,
} from "react";
import type { Domain } from "@/lib/domains";
import { isLightCloth } from "@/lib/domains";
import { Motif } from "./Motifs";
import { BOOK_TRANSITION } from "./motion-config";
import {
  ENTRY,
  HOVER_BACK,
  HOVER_OUT,
  OPEN_PULL,
  PULL,
  PULL_BEFORE_ROUTE_MS,
  pageDepth,
  placement,
} from "./hardcover-tokens";
import { useCompactViewport } from "./use-compact-viewport";
import s from "./Hardcover.module.css";

type Props = {
  domain: Domain;
  /** Position in the pile, top down. Seeds the jog and the edition mark. */
  index: number;
  /** Number of volumes in the pile; the settle-in runs bottom up. */
  count: number;
  /**
   * True once the pile has scrolled into view. Until then the volume waits
   * at its dropped, transparent pose; when it flips the settle-in plays.
   */
  revealed: boolean;
  /** Skip the settle-in entirely (returning to the page). */
  skipEntry?: boolean;
  /** Pixels this volume shifts to make room for a hovered neighbour. */
  neighbourShift?: number;
  /** True while this volume is the one being opened. */
  opening?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onOpen?: () => void;
};

type Phase = "waiting" | "entering" | "idle";

/**
 * One hardcover volume, lying face-up in the pile.
 *
 * Built from layered CSS only: a cloth board with a spine band and hinge
 * groove, a page block along the tail and fore-edge whose thickness encodes
 * the domain's exam weight, foil-stamped type, and two shadow layers. All
 * motion is transform and opacity; shadows crossfade rather than re-blur.
 *
 * The `layoutId` box inside is the same shared element the detail page's
 * Book uses, so the fold-open route transition is untouched.
 */
export function Hardcover({
  domain,
  index,
  count,
  revealed,
  skipEntry = false,
  neighbourShift = 0,
  opening = false,
  onHoverChange,
  onOpen,
}: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const compact = useCompactViewport();
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState<Phase>(skipEntry ? "idle" : "waiting");
  const navigating = useRef(false);

  const href = `/domain/${domain.slug}`;
  const depth = pageDepth(domain.percent);
  const jog = placement(index);
  const light = isLightCloth(domain);

  const pull = compact ? PULL.hoverCompact : PULL.hover;
  const open = compact ? PULL.openCompact : PULL.open;

  // Rest pose is the hand-placed jog. Hover and open layer on top of it, and
  // the neighbour shift moves the whole thing a few px to make room.
  const rest = { x: jog.x, y: neighbourShift, rotate: jog.rotate, rotateY: 0 };
  const lifted = opening
    ? { ...rest, x: jog.x + open.x, y: neighbourShift + open.y, rotateY: open.rotateY }
    : hovered
      ? { ...rest, x: jog.x + pull.x, y: neighbourShift + pull.y, rotateY: pull.rotateY }
      : rest;

  const entering = phase !== "idle";
  const entryDelay = (count - 1 - index) * ENTRY.stagger;

  // `initial` must not depend on the reduced-motion query: the server does
  // not know it, and a different first render would be a hydration mismatch.
  // Under reduced motion the drop is simply skipped at zero duration, so the
  // settle-in becomes a plain fade.
  const dropped = { ...rest, y: rest.y + ENTRY.dropPx, opacity: 0 };
  const initial = skipEntry ? false : dropped;

  let animate: Record<string, number>;
  let transition: Record<string, unknown>;

  if (entering) {
    animate = revealed ? { ...rest, opacity: 1 } : dropped;
    transition = reduceMotion
      ? {
          default: { duration: 0 },
          opacity: { duration: 0.3, delay: entryDelay * 0.5 },
        }
      : {
          // Per-value transitions do not inherit a top-level delay, so the
          // stagger has to ride on each one.
          default: { ...ENTRY.spring, delay: entryDelay },
          opacity: { ...ENTRY.fade, delay: entryDelay },
        };
  } else {
    animate = { ...lifted, opacity: 1 };
    transition = reduceMotion
      ? { duration: 0 }
      : opening
        ? OPEN_PULL
        : hovered
          ? HOVER_OUT
          : HOVER_BACK;
  }

  function setHover(next: boolean) {
    if (reduceMotion || entering) return;
    setHovered(next);
    onHoverChange?.(next);
  }

  function handleFocus(event: FocusEvent<HTMLAnchorElement>) {
    // Only keyboard focus gets the pulled-out treatment, matching the ring.
    if (event.currentTarget.matches(":focus-visible")) setHover(true);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (navigating.current) return;
    navigating.current = true;
    onOpen?.();
    window.setTimeout(
      () => router.push(href),
      reduceMotion ? 0 : PULL_BEFORE_ROUTE_MS,
    );
  }

  const state = opening ? "opening" : hovered ? "hover" : "rest";

  return (
    <Link
      href={href}
      className={s.link}
      data-light={light ? "true" : undefined}
      style={
        {
          "--hc-cloth": domain.cloth,
          "--hc-foil": domain.foil,
          "--hc-pages": `${depth}px`,
          "--hc-jog-x": `${jog.x}px`,
          "--hc-jog-rot": `${jog.rotate}deg`,
        } as CSSProperties
      }
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={() => setHover(false)}
      aria-label={`Domain ${domain.letter}. ${domain.title} — ${domain.questions} questions, ${domain.percent}% of the exam`}
    >
      {/* Shadows stay on the table while the volume lifts off it. */}
      <span className={s.shadows} data-state={state} aria-hidden="true">
        <span className={`${s.shadow} ${s.ambient}`} />
        <span className={`${s.shadow} ${s.ambientWide}`} />
        <span className={`${s.shadow} ${s.contact}`} />
        <span className={`${s.shadow} ${s.contactTight}`} />
      </span>

      <motion.div
        className={s.pose}
        data-state={state}
        initial={initial}
        animate={animate}
        transition={transition}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        onAnimationComplete={() => {
          if (phase !== "idle" && revealed) setPhase("idle");
        }}
      >
        <motion.div
          layoutId={`book-${domain.slug}`}
          className={s.box}
          style={{ borderRadius: 1 }}
          transition={reduceMotion ? { duration: 0 } : BOOK_TRANSITION}
        >
          {/* Page block: fore-edge on the right, tail along the bottom. */}
          <span className={s.fore} aria-hidden="true" />
          <span className={s.tail} aria-hidden="true" />

          <div className={s.cover}>
            <span className={s.spine} aria-hidden="true">
              <span className={s.headband} />
              <span className={s.tailband} />
            </span>

            <span className="spine-rule" aria-hidden="true" />
            <span className="spine-text">
              <span className="spine-eyebrow">
                Domain {domain.letter} &mdash;
              </span>
              <span
                className={`spine-name ${s.foil}`}
                data-text={domain.short}
              >
                {domain.short}
              </span>
            </span>
            <span className="spine-motif" aria-hidden="true">
              <Motif slug={domain.slug} />
            </span>
            <span className="spine-weight">
              {domain.questions} &middot; {domain.percent}%
            </span>
            {/* The topmost volume carries the full edition mark. */}
            <span
              className="spine-edition"
              data-lead={index === 0}
              aria-hidden="true"
            >
              <span className={s.foil} data-text="6E">
                6E
              </span>
              {index === 0 ? <small>Sixth Edition</small> : null}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}

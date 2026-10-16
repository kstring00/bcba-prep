"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { STRETCHES } from "./StretchArt";
import styles from "./study-break.module.css";

/**
 * Five seated stretches, 30 seconds each, advancing on their own.
 *
 * The countdown is derived from a start timestamp, same rule as the main
 * timer: a background tab must not leave someone stuck on "neck tilt".
 */
type Props = {
  /** Seconds per stretch. */
  secondsEach?: number;
  onDone?: () => void;
  /** Guided mode: starts immediately and hides the manual start control. */
  auto?: boolean;
};

export function DeskStretches({ secondsEach = 30, onDone, auto = false }: Props) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(auto);
  const [remaining, setRemaining] = useState(secondsEach);
  const startedAt = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    setRemaining(secondsEach);

    const id = window.setInterval(() => {
      const elapsed = (Date.now() - (startedAt.current ?? Date.now())) / 1000;
      const left = Math.max(0, secondsEach - elapsed);
      setRemaining(left);

      if (left <= 0) {
        setIndex((current) => {
          if (current + 1 >= STRETCHES.length) {
            setRunning(false);
            onDone?.();
            return current;
          }
          startedAt.current = Date.now();
          setRemaining(secondsEach);
          return current + 1;
        });
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [running, index, secondsEach, onDone]);

  // Keep the active card in view on narrow screens, where the row scrolls.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [index, reduceMotion]);

  const current = STRETCHES[index];
  const pct = 1 - remaining / secondsEach;

  return (
    <div className={styles.stretchBlock}>
      <div className={styles.stretchStage}>
        <div
          className={`${styles.stretchArt}${running && !reduceMotion ? ` ${styles.stretchArtMoving}` : ""}`}
        >
          <current.Art />
        </div>

        <div className={styles.stretchCopy}>
          <p className={styles.stretchCount}>
            {index + 1} of {STRETCHES.length}
          </p>
          {/* Announced on change so a screen-reader user knows which stretch
              is current without watching the card. */}
          <h4 aria-live="polite">{current.name}</h4>
          <p>{current.instruction}</p>

          <div
            className={styles.stretchBar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={secondsEach}
            aria-valuenow={Math.round(secondsEach - remaining)}
            aria-label={`${Math.ceil(remaining)} seconds left on this stretch`}
          >
            <span style={{ transform: `scaleX(${pct})` }} />
          </div>
          <p className={styles.stretchSeconds}>
            {Math.ceil(remaining)}s
          </p>
        </div>
      </div>

      {/* Dots double as direct navigation, so nobody is trapped waiting. */}
      <div ref={trackRef} className={styles.stretchDots}>
        {STRETCHES.map((stretch, i) => (
          <button
            key={stretch.id}
            type="button"
            className={i === index ? styles.dotOn : undefined}
            aria-label={`Go to ${stretch.name}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => {
              setIndex(i);
              startedAt.current = Date.now();
              setRemaining(secondsEach);
            }}
          />
        ))}
      </div>

      {!auto ? (
        <div className={styles.breathControls}>
          <button
            type="button"
            className={styles.primaryControl}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Pause" : index === 0 ? "Begin" : "Resume"}
          </button>
        </div>
      ) : null}

      <p className={styles.stretchDisclaimer}>
        Move gently and skip anything that hurts. Not medical advice.
      </p>
    </div>
  );
}

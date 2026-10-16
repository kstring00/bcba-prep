"use client";

import { useEffect, useRef } from "react";
import type { TimerPrefs } from "@/lib/study-break/config";
import {
  formatClock,
  isRunning,
  phaseLabel,
  progress,
  remainingMs,
  type TimerState,
} from "@/lib/study-break/timer";
import styles from "./study-break.module.css";

/**
 * The timer ring.
 *
 * Presentational: all accounting lives in lib/study-break/timer.ts and all
 * state transitions in StudyBreak.tsx. This draws the current moment and
 * handles the controls.
 *
 * The ring is a single SVG circle animated with stroke-dashoffset. That is the
 * one place this page animates something other than transform/opacity, and it
 * is the right trade: a conic-gradient alternative repaints a large area every
 * frame, while a stroked circle is cheap and crisp at every size.
 */
type Props = {
  state: TimerState;
  prefs: TimerPrefs;
  now: number;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
};

const R = 128;
const CIRC = 2 * Math.PI * R;

export function PomodoroTimer({
  state,
  prefs,
  now,
  onToggle,
  onReset,
  onSkip,
}: Props) {
  const running = isRunning(state);
  const remaining = remainingMs(state, prefs, now);
  const pct = progress(state, prefs, now);
  const clock = formatClock(remaining);
  const label = phaseLabel(state.phase);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /*
   * Space starts and pauses, from anywhere on the page.
   *
   * Skipped when focus is inside a field or on another control, so Space
   * still types a space and still activates a button. Without that guard the
   * timer would hijack the win journal's textarea.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" && event.key !== " ") return;

      const el = document.activeElement as HTMLElement | null;
      if (el) {
        const tag = el.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          tag === "button" ||
          tag === "a" ||
          el.isContentEditable
        ) {
          return;
        }
      }

      event.preventDefault();
      onToggle();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onToggle]);

  /*
   * The tab title carries the clock while running, so the timer is readable
   * from a background tab without switching to it. Restored on cleanup so the
   * title never sticks after navigating away.
   */
  useEffect(() => {
    const original = document.title;
    if (running) {
      document.title = `${clock} · ${label} — BCBA Prep`;
    }
    return () => {
      document.title = original;
    };
  }, [running, clock, label]);

  return (
    <div className={styles.timerWrap}>
      <div className={styles.ring}>
        <svg viewBox="0 0 300 300" aria-hidden="true" className={styles.ringSvg}>
          <circle
            cx="150"
            cy="150"
            r={R}
            className={styles.ringTrack}
            fill="none"
          />
          <circle
            cx="150"
            cy="150"
            r={R}
            className={styles.ringProgress}
            fill="none"
            strokeDasharray={CIRC}
            // Starts full and empties clockwise from twelve o'clock.
            strokeDashoffset={CIRC * (1 - pct)}
            transform="rotate(-90 150 150)"
          />
        </svg>

        <div className={styles.ringInner}>
          <p className={styles.phaseEyebrow}>{label}</p>
          {/*
            role="timer" with aria-live="off": the value changes every second
            and announcing each tick would make the page unusable with a
            screen reader. Phase CHANGES are announced instead, from the live
            region in StudyBreak.tsx, and the remaining time is available on
            demand through the label below.
          */}
          <p className={styles.clock} role="timer" aria-live="off">
            {clock}
          </p>
          <p className={styles.srOnly}>
            {clock.replace(":", " minutes ")} seconds remaining in {label}.
          </p>
        </div>
      </div>

      <div className={styles.timerControls}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.primaryControl}
          onClick={onToggle}
        >
          {running ? "Pause" : state.elapsedBeforePause > 0 ? "Resume" : "Start"}
        </button>
        <button type="button" className={styles.quietControl} onClick={onReset}>
          Reset
        </button>
        <button type="button" className={styles.quietControl} onClick={onSkip}>
          {state.phase === "focus" ? "Skip to break" : "Skip to focus"}
        </button>
      </div>

      <p className={styles.keyHint}>
        Press <kbd>Space</kbd> to start or pause.
      </p>
    </div>
  );
}

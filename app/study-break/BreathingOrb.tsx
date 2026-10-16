"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import styles from "./study-break.module.css";

/**
 * The breathing orb — a drop of honey that swells on the inhale and settles
 * on the exhale.
 *
 * Driven by one CSS custom property (`--breath`, 0 → 1) set from a rAF loop
 * reading wall-clock time. Not a CSS keyframe animation, because the pattern
 * has uneven segments (4-4-6) and a cue that must change exactly on the
 * boundary; keyframes would drift out of step with the text.
 *
 * Only `transform: scale()` and `opacity` are animated.
 *
 * Reduced motion: the orb holds still and cross-fades its opacity instead,
 * with the same text cues on the same schedule. The instruction survives; the
 * movement does not.
 */
type Pattern = "calm" | "box";

const PATTERNS: Record<Pattern, { label: string; segments: Array<{ cue: string; seconds: number; to: number }> }> = {
  // 4 in · 4 hold · 6 out — longer exhale, which is the calming half.
  calm: {
    label: "Calm 4-4-6",
    segments: [
      { cue: "Breathe in…", seconds: 4, to: 1 },
      { cue: "Hold…", seconds: 4, to: 1 },
      { cue: "Breathe out…", seconds: 6, to: 0 },
    ],
  },
  box: {
    label: "Box 4-4-4-4",
    segments: [
      { cue: "Breathe in…", seconds: 4, to: 1 },
      { cue: "Hold…", seconds: 4, to: 1 },
      { cue: "Breathe out…", seconds: 4, to: 0 },
      { cue: "Hold…", seconds: 4, to: 0 },
    ],
  },
};

type Props = {
  /** Session length in seconds. */
  duration: number;
  onDone?: () => void;
  /** Hides the length picker when the guided sequence is driving it. */
  compact?: boolean;
};

export function BreathingOrb({ duration, onDone, compact = false }: Props) {
  const reduceMotion = useReducedMotion();
  const [pattern, setPattern] = useState<Pattern>("calm");
  const [running, setRunning] = useState(compact);
  const [cue, setCue] = useState("Ready when you are");
  const [finished, setFinished] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    const segments = PATTERNS[pattern].segments;
    const cycle = segments.reduce((sum, s) => sum + s.seconds, 0);
    startedAt.current = performance.now();
    let raf = 0;
    let lastCue = "";

    const frame = (t: number) => {
      const elapsed = (t - (startedAt.current ?? t)) / 1000;

      if (elapsed >= duration) {
        setCue("Nice work, Behavior Bae 🐝");
        setFinished(true);
        setRunning(false);
        if (orbRef.current) orbRef.current.style.setProperty("--breath", "0.35");
        onDone?.();
        return;
      }

      // Where in the repeating cycle are we, and which segment is that?
      const inCycle = elapsed % cycle;
      let acc = 0;
      let active = segments[0];
      let from = 0;
      let segProgress = 0;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (inCycle < acc + seg.seconds) {
          active = seg;
          from = i === 0 ? segments[segments.length - 1].to : segments[i - 1].to;
          segProgress = (inCycle - acc) / seg.seconds;
          break;
        }
        acc += seg.seconds;
      }

      // Ease within the segment so the turn at each end is soft, never abrupt.
      const eased = segProgress < 0.5
        ? 2 * segProgress * segProgress
        : 1 - Math.pow(-2 * segProgress + 2, 2) / 2;
      const value = from + (active.to - from) * eased;

      if (orbRef.current) {
        orbRef.current.style.setProperty("--breath", value.toFixed(4));
      }
      if (active.cue !== lastCue) {
        lastCue = active.cue;
        setCue(active.cue);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, pattern, duration, onDone]);

  return (
    <div className={styles.breathBlock}>
      <div
        ref={orbRef}
        className={`${styles.orb}${reduceMotion ? ` ${styles.orbStill}` : ""}${running ? ` ${styles.orbActive}` : ""}`}
        style={{ "--breath": 0.35 } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className={styles.orbHalo} />
        <span className={styles.orbBody} />
      </div>

      {/* The cue is the accessible content: polite, so each change is read
          but never interrupts. */}
      <p className={styles.breathCue} aria-live="polite">
        {cue}
      </p>

      {!compact ? (
        <div className={styles.breathControls}>
          <div
            className={styles.patternSwitch}
            role="radiogroup"
            aria-label="Breathing pattern"
          >
            {(Object.keys(PATTERNS) as Pattern[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={pattern === key}
                className={pattern === key ? styles.patternOn : undefined}
                onClick={() => setPattern(key)}
                disabled={running}
              >
                {PATTERNS[key].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.primaryControl}
            onClick={() => {
              setFinished(false);
              setRunning((r) => !r);
              if (!running) setCue("Breathe in…");
            }}
          >
            {running ? "Stop" : finished ? "Again" : "Begin"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

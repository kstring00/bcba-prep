"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEV_GUIDED_SECONDS,
  GUIDED_STEPS,
  type GuidedStepId,
} from "@/lib/study-break/config";
import { BreathingOrb } from "./BreathingOrb";
import { DeskStretches } from "./DeskStretches";
import { LofiPlayer } from "./LofiPlayer";
import { WinsJournal } from "./WinsJournal";
import styles from "./study-break.module.css";

/**
 * THE GUIDED BREAK — the default when focus ends.
 *
 * One tap plays a five-minute sequence: breathing → stretches → write one win
 * → quiet with music, advancing on its own. This replaces "pick an option",
 * because someone who has just finished 25 minutes of concentration should
 * not be handed a menu.
 *
 * "Skip ahead" stays small and visible throughout — guided, not trapped. The
 * four modules also remain available individually below, for anyone who would
 * rather choose.
 */
type Props = {
  signedIn: boolean;
  dev: boolean;
  onFinish: () => void;
};

export function GuidedBreak({ signedIn, dev, onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const startedAt = useRef<number>(Date.now());

  const step = GUIDED_STEPS[stepIndex];
  const seconds = dev ? DEV_GUIDED_SECONDS : step.seconds;

  useEffect(() => {
    startedAt.current = Date.now();
    setRemaining(seconds);

    const id = window.setInterval(() => {
      // Timestamp-derived, like every other clock on this page.
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        setStepIndex((i) => {
          if (i + 1 >= GUIDED_STEPS.length) {
            onFinish();
            return i;
          }
          return i + 1;
        });
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [stepIndex, seconds, onFinish]);

  function renderStep(id: GuidedStepId) {
    switch (id) {
      case "breathe":
        return <BreathingOrb duration={seconds} compact />;
      case "stretch":
        // Divide the stretch block evenly across the five stretches.
        return <DeskStretches secondsEach={Math.max(3, Math.round(seconds / 5))} auto />;
      case "write":
        return <WinsJournal signedIn={signedIn} compact />;
      case "listen":
        return <LofiPlayer />;
    }
  }

  return (
    <div className={styles.guided}>
      <div className={styles.guidedHead}>
        <ol className={styles.guidedSteps}>
          {GUIDED_STEPS.map((s, i) => (
            <li
              key={s.id}
              className={
                i === stepIndex
                  ? styles.guidedStepOn
                  : i < stepIndex
                    ? styles.guidedStepDone
                    : undefined
              }
            >
              <span>{s.label}</span>
            </li>
          ))}
        </ol>

        <div className={styles.guidedMeta}>
          <p aria-live="polite" className={styles.guidedNow}>
            {step.label}
          </p>
          <span className={styles.guidedSeconds}>{Math.ceil(remaining)}s</span>
        </div>
      </div>

      <div className={styles.guidedStage}>{renderStep(step.id)}</div>

      {/* Small and always present. */}
      <button
        type="button"
        className={styles.skipAhead}
        onClick={() => {
          if (stepIndex + 1 >= GUIDED_STEPS.length) onFinish();
          else setStepIndex(stepIndex + 1);
        }}
      >
        Skip ahead <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

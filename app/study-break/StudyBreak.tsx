"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Sku } from "@/lib/catalog";
import {
  DEFAULT_PREFS,
  DEV_PREFS,
  type TimerPrefs,
} from "@/lib/study-break/config";
import { readLocalPrefs, savePrefs } from "@/lib/study-break/prefs";
import {
  advance,
  initialState,
  isRunning,
  phaseAnnouncement,
  remainingMs,
  resetPhase,
  start,
  toggle,
  type TimerState,
} from "@/lib/study-break/timer";
import { AmbientFlecks } from "./AmbientFlecks";
import { BreakCta } from "./BreakCta";
import { BreathingOrb } from "./BreathingOrb";
import { DeskStretches } from "./DeskStretches";
import { GuidedBreak } from "./GuidedBreak";
import { Honeycomb } from "./Honeycomb";
import { LofiPlayer } from "./LofiPlayer";
import { PomodoroTimer } from "./PomodoroTimer";
import { TimerSettings } from "./TimerSettings";
import { WinsJournal } from "./WinsJournal";
import styles from "./study-break.module.css";

/**
 * The page's state machine and its light.
 *
 * THE SIGNATURE IDEA: the light changes with progress. During focus the page
 * sits in soft morning cream; during a break a warm golden-hour glow floods
 * in. That is one CSS custom property (`--golden`, 0 → 1) on the section,
 * driving a single overlay's opacity and a background interpolation. One
 * property, no repaint storm, and it reads as the sun moving rather than a
 * theme switching.
 *
 * Chimes are off by default and the change is carried visually, through light,
 * not sound.
 */
type Props = { signedIn: boolean; ownedSkus: Sku[] };

type ManualModule = "breathe" | "stretch" | "listen" | "write" | null;

export function StudyBreak({ signedIn, ownedSkus }: Props) {
  const searchParams = useSearchParams();
  const dev = searchParams.get("dev") === "1";

  const [prefs, setPrefs] = useState<TimerPrefs>(dev ? DEV_PREFS : DEFAULT_PREFS);
  const [state, setState] = useState<TimerState>(initialState);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const [guided, setGuided] = useState(false);
  const [manual, setManual] = useState<ManualModule>(null);
  const [pouring, setPouring] = useState<number | null>(null);
  const [combGlow, setCombGlow] = useState(false);
  const prevPhase = useRef(state.phase);

  const onBreak = state.phase !== "focus";

  // ---- preferences -------------------------------------------------------
  useEffect(() => {
    if (dev) return; // dev durations must not be overwritten by saved prefs
    setPrefs(readLocalPrefs());
    if (!signedIn) return;
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data: { prefs?: TimerPrefs }) => {
        if (data.prefs) setPrefs(data.prefs);
      })
      .catch(() => {
        /* local copy already applied */
      });
  }, [dev, signedIn]);

  const updatePrefs = useCallback(
    (next: TimerPrefs) => {
      setPrefs(next);
      setState((s) => resetPhase(s));
      void savePrefs(next, signedIn);
    },
    [signedIn],
  );

  // ---- the display clock -------------------------------------------------
  /*
   * This interval exists ONLY to trigger re-renders. It contributes nothing to
   * the arithmetic — remaining time is always derived from timestamps in
   * lib/study-break/timer.ts — so throttling in a background tab cannot make
   * the timer drift.
   */
  useEffect(() => {
    if (!isRunning(state)) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state]);

  // Recompute the moment the tab comes back, so the jump is immediate.
  useEffect(() => {
    function onVisible() {
      if (!document.hidden) setNow(Date.now());
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // ---- phase completion --------------------------------------------------
  const remaining = remainingMs(state, prefs, now);

  useEffect(() => {
    if (!isRunning(state) || remaining > 0) return;

    const finishedPhase = state.phase;
    let next = advance(state, prefs);

    /*
     * A break starts itself. "The page glides into Break mode" — it does not
     * wait to be asked, and the guided sequence begins at the same moment.
     *
     * This is also what makes the golden-hour light work: --golden is derived
     * from how far through the break we are, and a paused phase never
     * advances `now`, so the light would sit frozen at 0 for the whole break.
     * Caught in testing exactly that way.
     *
     * The next FOCUS block is deliberately left paused. Resuming work should
     * be a decision, not something that happens to you while you stretch.
     */
    if (next.phase !== "focus") {
      next = start(next, Date.now());
      setNow(Date.now());
    }

    setState(next);

    if (finishedPhase === "focus") {
      // The honey pour: fill the cell for the round that just completed.
      const cellIndex = next.round - 1;
      setPouring(cellIndex);
      window.setTimeout(() => setPouring(null), 1300);

      if (next.phase === "longBreak") {
        setCombGlow(true);
      }
      // Guided break is the default when focus ends — one tap, not a menu.
      setGuided(true);
      setManual(null);
    } else {
      setCombGlow(false);
      setGuided(false);
      setManual(null);
    }

    setAnnouncement(phaseAnnouncement(next.phase));

    if (prefs.soundEnabled) {
      playChime();
      notify(phaseAnnouncement(next.phase));
    }
  }, [remaining, state, prefs]);

  useEffect(() => {
    prevPhase.current = state.phase;
  }, [state.phase]);

  // ---- golden hour -------------------------------------------------------
  /*
   * Interpolates toward full golden hour across the break, and sits at 0
   * during focus. A single number, consumed by CSS.
   */
  const golden = useMemo(() => {
    if (!onBreak) return 0;
    const total = Math.max(1, prefs[state.phase === "break" ? "breakMinutes" : "longBreakMinutes"] * 60_000);
    const elapsed = total - remaining;
    return Math.min(1, Math.max(0, elapsed / total));
  }, [onBreak, prefs, state.phase, remaining]);

  return (
    <section
      className={`${styles.page}${onBreak ? ` ${styles.pageBreak}` : ""}`}
      style={{ "--golden": golden.toFixed(3) } as React.CSSProperties}
    >
      {/* The warm overlay. One element, opacity only. */}
      <div className={styles.goldenWash} aria-hidden="true" />
      <AmbientFlecks />

      {/* Phase changes are announced; the ticking clock is not. */}
      <p className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>

      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.script}>Take a breath</p>
          <h1>Study Break</h1>
        </header>

        <PomodoroTimer
          state={state}
          prefs={prefs}
          now={now}
          onToggle={() => setState((s) => toggle(s, Date.now()))}
          onReset={() => {
            setState((s) => resetPhase(s));
            setGuided(false);
            setManual(null);
          }}
          onSkip={() => {
            const next = advance(state, prefs);
            if (state.phase === "focus") {
              setPouring(next.round - 1);
              window.setTimeout(() => setPouring(null), 1300);
              setCombGlow(next.phase === "longBreak");
              setGuided(true);
            } else {
              setCombGlow(false);
              setGuided(false);
            }
            setState(next);
            setAnnouncement(phaseAnnouncement(next.phase));
          }}
        />

        <div className={styles.combRow}>
          <Honeycomb
            total={prefs.roundsBeforeLongBreak}
            filled={state.round}
            pouringIndex={pouring}
            glowing={combGlow}
          />
          <TimerSettings prefs={prefs} onChange={updatePrefs} />
        </div>

        {combGlow ? (
          <p className={styles.combMessage}>Sweet work today 🐝</p>
        ) : null}

        {/* ---- break ---- */}
        {onBreak ? (
          <div className={styles.breakZone}>
            {guided ? (
              <GuidedBreak
                signedIn={signedIn}
                dev={dev}
                onFinish={() => setGuided(false)}
              />
            ) : (
              <>
                <div className={styles.breakOffer}>
                  <p className={styles.script}>Your break</p>
                  <button
                    type="button"
                    className={styles.primaryControl}
                    onClick={() => setGuided(true)}
                  >
                    Start my break
                  </button>
                  <p className={styles.breakHint}>
                    Five guided minutes: breathe, stretch, write one win, then
                    quiet.
                  </p>
                </div>

                <BreakCta signedIn={signedIn} ownedSkus={ownedSkus} />
              </>
            )}
          </div>
        ) : null}

        {/* ---- the four modules, always available individually ---- */}
        <div className={styles.modules}>
          <p className={styles.modulesLabel}>Or pick one</p>
          <div className={styles.moduleRow}>
            {(
              [
                ["breathe", "Breathe"],
                ["stretch", "Stretch"],
                ["listen", "Listen"],
                ["write", "Write a win"],
              ] as Array<[Exclude<ManualModule, null>, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${styles.moduleChip}${manual === id ? ` ${styles.moduleChipOn}` : ""}`}
                aria-expanded={manual === id}
                onClick={() => setManual((m) => (m === id ? null : id))}
              >
                {label}
              </button>
            ))}
          </div>

          {manual ? (
            <div className={styles.modulePanel}>
              {manual === "breathe" ? <BreathingOrb duration={60} /> : null}
              {manual === "stretch" ? <DeskStretches /> : null}
              {manual === "listen" ? <LofiPlayer /> : null}
              {manual === "write" ? <WinsJournal signedIn={signedIn} /> : null}
            </div>
          ) : null}
        </div>

        {!onBreak ? (
          <div className={styles.footCta}>
            <BreakCta signedIn={signedIn} ownedSkus={ownedSkus} />
          </div>
        ) : null}

        {dev ? (
          <p className={styles.devBadge}>
            dev mode — 10s focus / 5s break
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * A short, soft chime built with the Web Audio API — no audio file to ship,
 * and nothing downloaded for a feature that is off by default.
 */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 528;
    // Gentle attack and a long tail, so it reads as a chime, not a beep.
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.7);
    osc.onended = () => void ctx.close();
  } catch {
    /* Audio unavailable; the visual change still carries the phase. */
  }
}

function notify(message: string) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    new Notification("BCBA Prep", { body: message, silent: true });
  } catch {
    /* ignore */
  }
}

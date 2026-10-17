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
 * ONE CALM SCREEN.
 *
 * During focus the viewport holds exactly one thing: the ring, the time, and
 * one primary control. Everything else — the break modules, the domain CTA,
 * the divider — appears only when it is relevant, which for the modules means
 * during a break and for the CTA means after one ends.
 *
 * Sized to fit 375x700 with no scrolling. The ring is driven by --ring-size,
 * which is clamped against BOTH viewport width and height, so a short phone
 * shrinks the circle instead of pushing the controls off-screen.
 *
 * THE SIGNATURE IDEA: the light changes with progress. One CSS custom
 * property, --golden (0 to 1), drives a single overlay's opacity and a
 * background interpolation. It reads as the sun moving, not a theme switching.
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
  /* /study-break?tool=breathe opens that module on arrival — the Mental
     Health Toolkit links to each one directly. */
  const toolParam = searchParams.get("tool");
  useEffect(() => {
    if (
      toolParam === "breathe" ||
      toolParam === "stretch" ||
      toolParam === "listen" ||
      toolParam === "write"
    ) {
      setManual(toolParam);
    }
  }, [toolParam]);
  const [pouring, setPouring] = useState<number | null>(null);
  const [combGlow, setCombGlow] = useState(false);
  /* True once a break has finished, so the domain CTA appears then and not
     before. Cleared when focus starts again. */
  const [breakFinished, setBreakFinished] = useState(false);
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
     * A break starts itself — the page glides into Break mode rather than
     * waiting to be asked, and the guided sequence begins at the same moment.
     *
     * This is also what makes the golden-hour light work: --golden is derived
     * from how far through the break we are, and a paused phase never advances
     * `now`, so the light would sit frozen at 0. Caught in testing that way.
     *
     * The next FOCUS block is deliberately left paused. Resuming work should
     * be a decision, not something that happens while you stretch.
     */
    if (next.phase !== "focus") {
      next = start(next, Date.now());
      setNow(Date.now());
    }

    setState(next);

    if (finishedPhase === "focus") {
      const cellIndex = next.round - 1;
      setPouring(cellIndex);
      window.setTimeout(() => setPouring(null), 1300);
      if (next.phase === "longBreak") setCombGlow(true);
      setGuided(true);
      setManual(null);
      setBreakFinished(false);
    } else {
      setCombGlow(false);
      setGuided(false);
      setManual(null);
      // A break just ended: now the domain CTA is the useful next thing.
      setBreakFinished(true);
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

  // Starting focus again clears the post-break CTA.
  useEffect(() => {
    if (state.phase === "focus" && isRunning(state)) setBreakFinished(false);
  }, [state]);

  // ---- golden hour -------------------------------------------------------
  const golden = useMemo(() => {
    if (!onBreak) return 0;
    const total = Math.max(
      1,
      prefs[state.phase === "break" ? "breakMinutes" : "longBreakMinutes"] *
        60_000,
    );
    const elapsed = total - remaining;
    return Math.min(1, Math.max(0, elapsed / total));
  }, [onBreak, prefs, state.phase, remaining]);

  return (
    <section
      className={`${styles.page}${onBreak ? ` ${styles.pageBreak}` : ""}`}
      style={{ "--golden": golden.toFixed(3) } as React.CSSProperties}
    >
      <div className={styles.goldenWash} aria-hidden="true" />
      <AmbientFlecks />

      <p className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>

      {/* ---- THE ONE SCREEN: ring, time, one control, comb ---- */}
      <div className={styles.stage}>
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
              setBreakFinished(false);
              setState(start(next, Date.now()));
            } else {
              setCombGlow(false);
              setGuided(false);
              setBreakFinished(true);
              setState(next);
            }
            setNow(Date.now());
            setAnnouncement(phaseAnnouncement(next.phase));
          }}
        />

        {/* Small, just under the ring. */}
        <div className={styles.combRow}>
          <Honeycomb
            total={prefs.roundsBeforeLongBreak}
            filled={state.round}
            pouringIndex={pouring}
            glowing={combGlow}
          />
          <TimerSettings prefs={prefs} onChange={updatePrefs} />
        </div>
      </div>

      {/* ---- everything below is break-only ---- */}
      {onBreak || breakFinished ? (
        <div className={styles.belowFold}>
          <div className="col-text">
            {combGlow ? (
              <p className={styles.combMessage}>Sweet work today 🐝</p>
            ) : null}

            {onBreak ? (
              guided ? (
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
                      Five guided minutes: breathe, stretch, write one win,
                      then quiet.
                    </p>
                  </div>

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
                          onClick={() =>
                            setManual((m) => (m === id ? null : id))
                          }
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
                </>
              )
            ) : null}

            {/* The domain CTA appears only after a break ends. */}
            {breakFinished && !onBreak ? (
              <div className={styles.footCta}>
                <BreakCta signedIn={signedIn} ownedSkus={ownedSkus} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {dev ? <p className={styles.devBadge}>dev mode — 10s / 5s</p> : null}
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

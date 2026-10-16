import type { TimerPrefs } from "./config";

/**
 * TIMER ACCOUNTING.
 *
 * Pure functions over a plain state object, deliberately separate from React
 * so the arithmetic can be reasoned about — and tested — on its own.
 *
 * THE RULE: remaining time is always DERIVED from wall-clock timestamps, never
 * accumulated by counting ticks. Browsers throttle timers in background tabs
 * (often to once a minute), so a tick-counting timer silently loses minutes
 * while someone reads a PDF in another tab. An interval still runs here, but
 * only to trigger a re-render; it never contributes to the arithmetic.
 */
export type Phase = "focus" | "break" | "longBreak";

export type TimerState = {
  phase: Phase;
  /** Wall clock ms when the current run segment began; null while paused. */
  runningSince: number | null;
  /** Milliseconds already spent in this phase before the current segment. */
  elapsedBeforePause: number;
  /** Completed focus rounds in the current set. */
  round: number;
};

export function initialState(): TimerState {
  return {
    phase: "focus",
    runningSince: null,
    elapsedBeforePause: 0,
    round: 0,
  };
}

export function phaseDurationMs(phase: Phase, prefs: TimerPrefs): number {
  const minutes =
    phase === "focus"
      ? prefs.focusMinutes
      : phase === "break"
        ? prefs.breakMinutes
        : prefs.longBreakMinutes;
  return Math.round(minutes * 60_000);
}

export function elapsedMs(state: TimerState, now: number): number {
  const live = state.runningSince === null ? 0 : now - state.runningSince;
  return state.elapsedBeforePause + Math.max(0, live);
}

export function remainingMs(
  state: TimerState,
  prefs: TimerPrefs,
  now: number,
): number {
  return Math.max(0, phaseDurationMs(state.phase, prefs) - elapsedMs(state, now));
}

export function progress(
  state: TimerState,
  prefs: TimerPrefs,
  now: number,
): number {
  const total = phaseDurationMs(state.phase, prefs);
  if (total <= 0) return 1;
  return Math.min(1, elapsedMs(state, now) / total);
}

export function isRunning(state: TimerState): boolean {
  return state.runningSince !== null;
}

export function start(state: TimerState, now: number): TimerState {
  if (state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.runningSince === null) return state;
  return {
    ...state,
    elapsedBeforePause: elapsedMs(state, now),
    runningSince: null,
  };
}

export function toggle(state: TimerState, now: number): TimerState {
  return isRunning(state) ? pause(state, now) : start(state, now);
}

/** Back to the start of the current phase, still paused. */
export function resetPhase(state: TimerState): TimerState {
  return { ...state, runningSince: null, elapsedBeforePause: 0 };
}

/**
 * What follows the phase that just ended.
 *
 * A focus block increments the round counter, and the long break arrives after
 * the configured number of rounds rather than on a fixed four, because the
 * count is a user setting. The round counter resets after a long break so the
 * honeycomb starts empty again.
 */
export function advance(state: TimerState, prefs: TimerPrefs): TimerState {
  if (state.phase === "focus") {
    const round = state.round + 1;
    const longBreakDue = round >= prefs.roundsBeforeLongBreak;
    return {
      phase: longBreakDue ? "longBreak" : "break",
      runningSince: null,
      elapsedBeforePause: 0,
      round,
    };
  }

  return {
    phase: "focus",
    runningSince: null,
    elapsedBeforePause: 0,
    round: state.phase === "longBreak" ? 0 : state.round,
  };
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function phaseLabel(phase: Phase): string {
  return phase === "focus"
    ? "Focus"
    : phase === "break"
      ? "Break"
      : "Long break";
}

/** Read aloud by screen readers and shown in the tab title. */
export function phaseAnnouncement(phase: Phase): string {
  return phase === "focus"
    ? "Focus time has started."
    : phase === "break"
      ? "Focus finished. Break time."
      : "Four rounds done. Long break.";
}

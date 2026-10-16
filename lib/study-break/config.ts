/**
 * Study Break configuration.
 *
 * The timer is the spine of the page; everything else is what a break opens
 * into. These are the only tunable numbers, kept together so none of them
 * ends up hardcoded inside a component.
 */

/**
 * ⚠️ KYLE: paste Bryana's playlist here.
 *
 * Any Spotify playlist URL works — the embed URL is derived from it. The
 * player stays behind a facade until someone clicks "Play study music", so an
 * empty value here costs nothing: the card simply says the playlist is coming.
 *
 * Example shape: https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn
 */
export const SPOTIFY_PLAYLIST_URL = "";

export type TimerPrefs = {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  roundsBeforeLongBreak: number;
  soundEnabled: boolean;
};

export const DEFAULT_PREFS: TimerPrefs = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
  // Off by default, and permission is only requested when someone turns it
  // on. A page about calm does not open with a permission prompt.
  soundEnabled: false,
};

export const PREF_LIMITS = {
  focusMinutes: [1, 180],
  breakMinutes: [1, 60],
  longBreakMinutes: [1, 120],
  roundsBeforeLongBreak: [2, 12],
} as const;

export function clampPrefs(input: Partial<TimerPrefs>): TimerPrefs {
  const clamp = (value: unknown, key: keyof typeof PREF_LIMITS) => {
    const [min, max] = PREF_LIMITS[key];
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_PREFS[key];
    return Math.min(max, Math.max(min, n));
  };

  return {
    focusMinutes: clamp(input.focusMinutes, "focusMinutes"),
    breakMinutes: clamp(input.breakMinutes, "breakMinutes"),
    longBreakMinutes: clamp(input.longBreakMinutes, "longBreakMinutes"),
    roundsBeforeLongBreak: clamp(
      input.roundsBeforeLongBreak,
      "roundsBeforeLongBreak",
    ),
    soundEnabled: input.soundEnabled === true,
  };
}

/**
 * DEV MODE — `?dev=1`.
 *
 * Collapses a 25-minute focus block to 10 seconds and a break to 5, so a full
 * four-round cycle can be walked through in under two minutes. Affects
 * durations only: the phase order, the honeycomb fills, the guided sequence
 * and the persistence all behave exactly as in normal mode, so what is tested
 * is the real machine.
 */
export const DEV_PREFS: TimerPrefs = {
  focusMinutes: 10 / 60,
  breakMinutes: 5 / 60,
  longBreakMinutes: 8 / 60,
  roundsBeforeLongBreak: 4,
  soundEnabled: false,
};

/** Guided break: 1 min breathing → 2 min stretches → 1 min win → 1 min quiet. */
export const GUIDED_STEPS = [
  { id: "breathe", label: "Breathe", seconds: 60 },
  { id: "stretch", label: "Stretch", seconds: 120 },
  { id: "write", label: "Write one win", seconds: 60 },
  { id: "listen", label: "Quiet with music", seconds: 60 },
] as const;

export type GuidedStepId = (typeof GUIDED_STEPS)[number]["id"];

export const GUIDED_TOTAL_SECONDS = GUIDED_STEPS.reduce(
  (sum, step) => sum + step.seconds,
  0,
);

/** Dev mode shortens each guided step to 5s for the same reason as above. */
export const DEV_GUIDED_SECONDS = 5;

export const WIN_MAX_LENGTH = 280;

/** Rotates by day, so the page is not identical every visit. */
export const WIN_PROMPTS = [
  "One win from today's study session?",
  "What clicked today?",
  "What did you understand better than yesterday?",
  "Which concept finally made sense?",
  "What did you get through, even when it was hard?",
];

export function winPromptForToday(date = new Date()): string {
  // Day-of-year, so it changes daily and is stable within a day.
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
  return WIN_PROMPTS[day % WIN_PROMPTS.length];
}

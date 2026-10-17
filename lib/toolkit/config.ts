/**
 * Mental Health Toolkit — the rules that do not bend.
 *
 * Every toolkit screen shows SAFETY_NOTE and CRISIS_LINE. Nothing on the
 * toolkit reads free text, asks for a name, or needs a login. The only thing
 * it records is an anonymous tap on one of six fixed feelings, once per
 * device per day, and it shows that count only above COUNT_THRESHOLD.
 */

export const SAFETY_NOTE =
  "This is not therapy, and it is not a substitute for it.";

export const CRISIS_LINE =
  "If you are in crisis or thinking about hurting yourself, call or text 988 — the Suicide & Crisis Lifeline. Free, confidential, 24/7.";

/** Taps per feeling (last seven days) below this are never displayed. */
export const COUNT_THRESHOLD = 5;

/** localStorage key for the random device id behind the one-tap-a-day rule. */
export const DEVICE_KEY = "toolkit-device";

/** localStorage key recording which day this device last tapped. */
export const TAPPED_KEY = "toolkit-tapped";

export const FEELING_SLUGS = [
  "burnt-out",
  "overwhelmed",
  "tired",
  "dreading-a-session",
  "failed-my-exam",
  "doing-okay",
] as const;

export type FeelingSlug = (typeof FEELING_SLUGS)[number];

export function isFeelingSlug(value: unknown): value is FeelingSlug {
  return typeof value === "string" && (FEELING_SLUGS as readonly string[]).includes(value);
}

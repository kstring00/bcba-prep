/**
 * /start — the Founding Member waitlist.
 *
 * One link-in-bio page for Instagram and TikTok. Someone taps it on a phone
 * they cannot realistically study on, and nothing is on sale yet, so the only
 * honest conversion is an email address: be first in line when the doors
 * open, with founding-member pricing locked in.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHAT THIS PAGE MUST NOT SAY
 * ──────────────────────────────────────────────────────────────────────────
 * These are not style preferences. Each one is a promise the site cannot
 * currently keep, and a promise made to a waitlist is the one thing that
 * turns an interested person into an annoyed one:
 *
 *   - No download, PDF, cheat sheet or freebie. There is nothing to send, so
 *     offering one creates an obligation that arrives late or not at all.
 *   - No price, discount, or percentage. "Founding-member pricing" is the
 *     commitment; a number would be a figure nobody has set yet.
 *   - No date, and nothing about Bryana's own certification timeline. The
 *     opening date is not known, and a date that slips is worse than no date.
 *
 * The page offers exactly one thing: first access, at founding pricing.
 */

/** Identifies the list on the lead row. Changing this splits the list. */
export const LEAD_SOURCE = "founding-waitlist";

/** The offer, in one sentence. Change here, changes everywhere. */
export const WAITLIST_HEADLINE =
  "Be first in when BCBA Prep opens, with founding-member pricing locked in.";

/** The short label above the offer. */
export const WAITLIST_EYEBROW = "Founding member";

/** What joining actually gets them, said plainly and without a promise. */
export const WAITLIST_BLURB =
  "Join the founding list and you'll hear from Bryana first when the study materials open, before anyone else.";

/**
 * What the confirmation screen and the email both say.
 *
 * Kept here rather than inline so the page and the email cannot drift apart
 * and tell someone two different stories about what they just joined.
 */
export const WAITLIST_CONFIRM_HEADING = "You're on the founding list.";

export const WAITLIST_CONFIRM_BODY =
  "You'll get an email from Bryana the moment the doors open — before the announcement goes anywhere else.";

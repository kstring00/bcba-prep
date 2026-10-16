/**
 * /start — the mobile funnel.
 *
 * One link-in-bio page for Instagram and TikTok. Someone taps it on a phone
 * they cannot realistically study on, so the job is to get the free cheat
 * sheet into a place they will find later: their inbox.
 */

/**
 * ⚠️ KYLE: drop Bryana's cheat sheet at public/cheat-sheet.pdf and set this
 * to "/cheat-sheet.pdf".
 *
 * `null` is load-bearing, not a placeholder to tidy up:
 *
 *   - The page still captures emails, because building the list is useful
 *     before the file exists.
 *   - The confirmation and the email both say it is coming rather than
 *     claiming a download that is not there.
 *   - Each lead row records delivered = false, so you can see exactly who
 *     signed up during the gap and send to them when the file lands.
 *
 * The moment this is a real path, the same flow delivers immediately. No
 * other change needed.
 */
export const CHEAT_SHEET_FILE: string | null = null;

export function cheatSheetReady(): boolean {
  return typeof CHEAT_SHEET_FILE === "string" && CHEAT_SHEET_FILE.length > 0;
}

/** What the magnet is called, in copy. Change here, changes everywhere. */
export const CHEAT_SHEET_NAME = "BCBA Domain Cheat Sheet";

export const CHEAT_SHEET_BLURB =
  "All nine BACB domains on one page — what each one covers and how much of the exam it is.";

/** Identifies the magnet on the lead row. */
export const LEAD_SOURCE = "cheat-sheet";

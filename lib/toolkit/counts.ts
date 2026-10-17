import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import { COUNT_THRESHOLD, isFeelingSlug, type FeelingSlug } from "./config";

/**
 * Taps per feeling over the last seven days, from the view in 0007.
 *
 * Only values at or above COUNT_THRESHOLD come back; anything smaller is
 * dropped here so no component can show "1 person". Every failure returns an
 * empty map: the page then shows no counts, which is a real state, not an
 * error. Server only (service role).
 */
export type FeelingCounts = Partial<Record<FeelingSlug, number>>;

export async function getFeelingCounts(): Promise<FeelingCounts> {
  if (!hasServiceRole()) return {};
  try {
    const response = await fetch(
      restUrl("/rest/v1/toolkit_checkin_counts?select=feeling,taps"),
      { headers: adminHeaders(), cache: "no-store" },
    );
    if (!response.ok) return {};
    const rows = (await response.json()) as Array<{ feeling: unknown; taps: unknown }>;
    const counts: FeelingCounts = {};
    for (const row of rows) {
      if (isFeelingSlug(row.feeling) && typeof row.taps === "number" && row.taps >= COUNT_THRESHOLD) {
        counts[row.feeling] = row.taps;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

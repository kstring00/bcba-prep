import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { StudyBreak } from "./StudyBreak";
import { CRISIS_LINE, SAFETY_NOTE } from "@/lib/toolkit/config";

export const metadata: Metadata = {
  title: "Study Break | BCBA Prep by Bee the Behavior Bae",
  description:
    "Study breaks for BCBA exam prep: focus timer, breathing, stretches.",
};

export const dynamic = "force-dynamic";

/**
 * /study-break — free and public.
 *
 * Members: part of the daily routine, so it sits in the main nav and in My
 * Library rather than being a side page.
 * Visitors: fully usable without an account. Saving a win is the one thing
 * that asks for sign-up, which is the point — it is a reason to create an
 * account, offered after the page has already been useful.
 */
export default async function StudyBreakPage() {
  const user = await getSessionUser();
  // Used by the post-break CTA to offer a domain the member actually owns.
  const ownedSkus = user ? await getOwnedSkus() : [];

  return (
    <>
      <StudyBreak signedIn={Boolean(user)} ownedSkus={ownedSkus} />
      {/* The toolkit rule: not therapy, and 988, on every one of its screens.
          Fixed to the top of the viewport under the header, as on /toolkit,
          so it is there on the first phone screen and the last. */}
      <p className="toolkit-safety-line" role="note" aria-label="Safety information">
        <span className="toolkit-safety-full">
          <strong>{SAFETY_NOTE}</strong> {CRISIS_LINE}
        </span>
        <span className="toolkit-safety-short">
          <strong>This is not therapy.</strong>
        </span>
        <span className="toolkit-safety-actions">
          <a href="tel:988">Call 988</a>
          <a href="sms:988">Text 988</a>
        </span>
      </p>
    </>
  );
}

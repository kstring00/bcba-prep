import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { StudyBreak } from "./StudyBreak";

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

  return <StudyBreak signedIn={Boolean(user)} ownedSkus={ownedSkus} />;
}

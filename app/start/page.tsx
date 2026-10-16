import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { StartFunnel } from "./StartFunnel";

export const metadata: Metadata = {
  title: "Start here | BCBA Prep by Bee the Behavior Bae",
  description:
    "Free BCBA domain cheat sheet, study materials by exam domain, mock exams and a study break timer — all in one place.",
  // A link-in-bio page is for people who already have the link. Keeping it
  // out of search avoids it competing with the homepage for the brand term.
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

/**
 * /start — the mobile funnel.
 *
 * Deliberately NOT in the site nav. It is the destination for an Instagram or
 * TikTok bio link, and its whole value is being a single uncluttered screen;
 * a nav row of six competing links is the thing it exists to avoid.
 *
 * The conversion is the cheat sheet, because someone arriving from a phone is
 * rarely about to buy — but they will take something free, and the email puts
 * Bryana in front of them again on the machine they actually study on.
 */
export default async function StartPage() {
  const user = await getSessionUser();
  return <StartFunnel signedIn={Boolean(user)} />;
}

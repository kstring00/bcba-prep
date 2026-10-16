import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { StartFunnel } from "./StartFunnel";

export const metadata: Metadata = {
  title: "Start here | BCBA Prep by Bee the Behavior Bae",
  description:
    "Join the founding list for BCBA Prep by Bee the Behavior Bae — study materials by exam domain, mock exams and a free study break timer.",
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
 * The conversion is the founding-member waitlist. Nothing is on sale yet, so
 * there is no purchase to ask for; what IS available is a place in the queue
 * at founding pricing, and an email address that lets Bryana reach them on
 * the machine they actually study on rather than the phone they are holding.
 */
export default async function StartPage() {
  const user = await getSessionUser();
  return <StartFunnel signedIn={Boolean(user)} />;
}

import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import {
  CHEAT_SHEET_FILE,
  CHEAT_SHEET_NAME,
  cheatSheetReady,
  LEAD_SOURCE,
} from "@/lib/funnel/config";

export const runtime = "nodejs";

/*
 * Lead capture for /start.
 *
 * The visitor is not signed in, so there is no user token and RLS has nothing
 * to scope rows to. The write therefore uses the service-role key — the same
 * reasoning as the Stripe webhook — and `leads` has no policies at all, so
 * this route is the only way in. See 0003_leads.sql.
 *
 * Two things this route will not do:
 *
 *   1. Report success for a capture it did not store. If Supabase is
 *      unreachable the visitor is told plainly.
 *   2. Promise a download that does not exist. While CHEAT_SHEET_FILE is null
 *      the response says the sheet is coming and the row records
 *      delivered = false, so the gap is visible in the data rather than
 *      papered over in the copy.
 */

type Submission = {
  email?: unknown;
  /** Honeypot. Real visitors never see this field. */
  company?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  referrer?: unknown;
  device?: unknown;
};

/** Attribution is free-text from a URL; trim, cap, and never trust the shape. */
function attr(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : null;
}

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  // Flood guard counts every request; the capture limit below counts only
  // well-formed ones, so a mistyped address does not lock someone out.
  const flood = rateLimit(clientKey(request, "lead-flood"), 40, 10 * 60 * 1000);
  if (!flood.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(flood.retryAfterSeconds) } },
    );
  }

  let body: Submission;
  try {
    body = (await request.json()) as Submission;
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Accept-and-discard, so automated spam learns nothing from the response.
  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return NextResponse.json({ received: true, delivered: cheatSheetReady() });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (
    email.length < 3 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const capture = rateLimit(clientKey(request, "lead-capture"), 5, 10 * 60 * 1000);
  if (!capture.allowed) {
    return NextResponse.json(
      { error: "You have already signed up. Check your inbox." },
      { status: 429, headers: { "Retry-After": String(capture.retryAfterSeconds) } },
    );
  }

  if (!hasServiceRole()) {
    console.error("[lead] SUPABASE_SERVICE_ROLE_KEY is not set; capture refused");
    return NextResponse.json(
      { error: "Sign-up is unavailable right now. Please try again later." },
      { status: 503 },
    );
  }

  const device = body.device === "mobile" || body.device === "desktop" ? body.device : null;
  const ready = cheatSheetReady();

  try {
    /*
     * Upsert on email. A repeat submit refreshes the attribution and the
     * delivered flag rather than creating a second row, so the table stays a
     * list of people instead of a list of button presses.
     */
    const response = await fetch(restUrl("/rest/v1/leads?on_conflict=email"), {
      method: "POST",
      headers: {
        ...adminHeaders(),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        email,
        source: LEAD_SOURCE,
        utm_source: attr(body.utm_source),
        utm_medium: attr(body.utm_medium),
        utm_campaign: attr(body.utm_campaign),
        utm_content: attr(body.utm_content),
        utm_term: attr(body.utm_term),
        referrer: attr(body.referrer),
        device,
        delivered: ready,
      }),
    });

    if (!response.ok) {
      console.error(
        "[lead] insert failed",
        response.status,
        await response.text().catch(() => ""),
      );
      return NextResponse.json(
        { error: "We could not save that. Please try again." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[lead] insert threw", error);
    return NextResponse.json(
      { error: "We could not save that. Please try again." },
      { status: 500 },
    );
  }

  /*
   * THE HANDOFF.
   *
   * They are on a phone they cannot study on. The email is how the sheet gets
   * to the machine they will actually sit down at, so it carries the download
   * link and the site address.
   *
   * Delivery failure does not fail the capture: the lead is already stored,
   * and telling someone their sign-up did not work when it did would be worse
   * than a late email.
   */
  let emailed = false;
  if (isEmailConfigured()) {
    const origin = siteOrigin(request);
    try {
      await sendEmail({
        to: email,
        subject: ready
          ? `Your ${CHEAT_SHEET_NAME} 🐝`
          : `You're on the list for the ${CHEAT_SHEET_NAME} 🐝`,
        text: ready
          ? [
              "Hi!",
              "",
              `Here is your ${CHEAT_SHEET_NAME}:`,
              `${origin}${CHEAT_SHEET_FILE}`,
              "",
              "Open this on your laptop when you sit down to study — that is",
              "why it is in your inbox rather than only on your phone.",
              "",
              `When you are ready for the full domain materials: ${origin}`,
              "",
              "— Bryana, Bee the Behavior Bae",
            ].join("\n")
          : [
              "Hi!",
              "",
              `You're on the list for the ${CHEAT_SHEET_NAME}.`,
              "",
              "Bryana is finishing it now, and it will land in this inbox the",
              "moment it is ready.",
              "",
              `In the meantime, the domains are here: ${origin}`,
              "",
              "— Bryana, Bee the Behavior Bae",
            ].join("\n"),
      });
      emailed = true;
    } catch (error) {
      console.error("[lead] delivery failed", error);
    }
  } else {
    console.error("[lead] email is not configured; lead stored but not sent");
  }

  return NextResponse.json({ received: true, delivered: ready, emailed });
}

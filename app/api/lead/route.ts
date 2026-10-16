import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import { LEAD_SOURCE } from "@/lib/funnel/config";

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
 *      unreachable the visitor is told plainly, because an address silently
 *      dropped is a person who thinks they are on the list and is not.
 *   2. Promise anything the site cannot deliver. This is a waitlist: there
 *      is no file to send, no date to give and no price to quote. The only
 *      commitment is being emailed first.
 *
 * ON THE `delivered` COLUMN. 0003_leads.sql is already applied to production,
 * so the column stays. Under the waitlist it means "the confirmation email
 * was sent", not "a download was delivered" — there is nothing to download.
 * It is written AFTER the send rather than alongside the insert, so a false
 * in that column means a real person joined and never heard back, which is
 * the one failure here worth being able to query for:
 *
 *   select email, created_at from public.leads
 *    where source = 'founding-waitlist' and delivered = false
 *    order by created_at;
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
    return NextResponse.json({ received: true });
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
        // Set to true below, only once the confirmation has actually sent.
        delivered: false,
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
   * THE CONFIRMATION.
   *
   * A receipt, not a delivery. It exists so that joining a waitlist feels
   * like something happened — an address typed into a box with no reply is
   * indistinguishable from a form that silently failed.
   *
   * It says what they joined and what will happen, and deliberately gives no
   * date: the opening date is not set, and a date that slips costs more
   * goodwill than no date ever does.
   *
   * Delivery failure does not fail the capture. The address is already
   * stored, and telling someone their sign-up did not work when it did would
   * be worse than a late email. The row keeps delivered = false so they can
   * be found and emailed when the problem is fixed.
   */
  let emailed = false;
  if (isEmailConfigured()) {
    const origin = siteOrigin(request);
    try {
      await sendEmail({
        to: email,
        subject: "You're on the BCBA Prep founding list 🐝",
        text: [
          "Hi!",
          "",
          "Thank you for joining the founding list for BCBA Prep.",
          "",
          "You're on it — which means when the study materials open, you'll",
          "hear from me first, before the announcement goes anywhere else,",
          "with founding-member pricing locked in.",
          "",
          "Nothing to do for now. I'll email you when the doors open.",
          "",
          `In the meantime, the free study break timer is here: ${origin}/study-break`,
          "",
          "— Bryana, Bee the Behavior Bae",
        ].join("\n"),
      });
      emailed = true;
    } catch (error) {
      console.error("[lead] confirmation failed", error);
    }
  } else {
    console.error("[lead] email is not configured; lead stored but not confirmed");
  }

  /*
   * Record that the confirmation went out, now that it actually has.
   *
   * Best-effort on purpose: the person is on the list either way, and
   * failing their sign-up because a bookkeeping PATCH did not land would be
   * backwards. A stale false here over-reports who still needs contacting,
   * which is the harmless direction to be wrong in.
   */
  if (emailed) {
    try {
      await fetch(
        restUrl(`/rest/v1/leads?email=eq.${encodeURIComponent(email)}`),
        {
          method: "PATCH",
          headers: { ...adminHeaders(), Prefer: "return=minimal" },
          body: JSON.stringify({ delivered: true }),
        },
      );
    } catch (error) {
      console.error("[lead] could not mark confirmation sent", error);
    }
  }

  return NextResponse.json({ received: true, emailed });
}

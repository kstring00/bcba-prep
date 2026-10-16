import { NextResponse } from "next/server";

import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import { supabaseConfig, supabaseHeaders } from "@/lib/supabase/config";

type Submission = {
  displayName?: unknown;
  email?: unknown;
  quote?: unknown;
  consent?: unknown;
  company?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function notifyReviewer(input: {
  displayName: string;
  email: string;
  quote: string;
}) {
  // Submissions are stored for review whether or not email is configured.
  // Never fail a visitor's submission because notification infrastructure is
  // missing — the note is already safe, only the alert is lost.
  if (!isEmailConfigured()) return;

  await sendEmail({
    to: process.env.TESTIMONIAL_REVIEW_EMAIL || undefined,
    // Stripped of newlines before it reaches a header position. Resend's
    // JSON API encodes headers so this is not SMTP injection, but a CR or LF
    // in a subject line is never something anyone wants.
    subject: `New BCBA Prep testimonial from ${input.displayName.replace(/[\r\n]+/g, " ")}`,
    replyTo: input.email,
    text: [
      "A new testimonial is waiting for review in Supabase.",
      "",
      `Display name: ${input.displayName}`,
      `Reply email:  ${input.email}`,
      "",
      input.quote,
      "",
      "Nothing is published automatically. Set the row's status to 'approved'",
      "in Supabase before it appears on the site.",
    ].join("\n"),
  });
}

/**
 * Approved rows only — see the note in app/testimonials/page.tsx.
 *
 * An empty wall is the correct fallback for every failure here: the page
 * renders its "no notes yet" state and nothing looks broken to a visitor. A
 * 500 would surface a Supabase outage as a broken page instead.
 */
export async function GET() {
  try {
    const { url, publishableKey } = supabaseConfig();

    const response = await fetch(
      `${url}/rest/v1/testimonials?select=id,display_name,quote,created_at&status=eq.approved&order=created_at.desc&limit=16`,
      {
        headers: supabaseHeaders(publishableKey),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[testimonials] read failed", response.status);
      return NextResponse.json({ testimonials: [] }, { status: 200 });
    }

    return NextResponse.json({ testimonials: await response.json() });
  } catch (error) {
    console.error("[testimonials] read failed", error);
    return NextResponse.json({ testimonials: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  /*
   * This was the one public write path with no rate limit. Two tiers, for the
   * same reason as the lead form: a flood guard counts EVERY request so a
   * script cannot hammer the endpoint, while the submission limit counts only
   * requests that passed validation, so somebody fumbling the form half a
   * dozen times is not locked out for an hour.
   */
  const flood = rateLimit(clientKey(request, "testimonial-flood"), 40, 10 * 60 * 1000);
  if (!flood.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(flood.retryAfterSeconds) } },
    );
  }

  let body: Submission;
  try {
    body = (await request.json()) as Submission;
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field. Silently accept bot
  // submissions so automated spam does not learn how the filter works.
  if (cleanString(body.company)) {
    return NextResponse.json({ received: true });
  }

  const displayName = cleanString(body.displayName);
  const email = cleanString(body.email).toLowerCase();
  const quote = cleanString(body.quote);
  const consent = body.consent === true;

  if (displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json(
      { error: "Please enter the name you want displayed." },
      { status: 400 },
    );
  }

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

  if (quote.length < 20 || quote.length > 1200) {
    return NextResponse.json(
      { error: "Please write between 20 and 1,200 characters." },
      { status: 400 },
    );
  }

  if (!consent) {
    return NextResponse.json(
      { error: "Please confirm that Bee may publish your testimonial if approved." },
      { status: 400 },
    );
  }

  const submission = rateLimit(clientKey(request, "testimonial"), 3, 60 * 60 * 1000);
  if (!submission.allowed) {
    return NextResponse.json(
      { error: "Thanks — you have already sent a note recently." },
      { status: 429, headers: { "Retry-After": String(submission.retryAfterSeconds) } },
    );
  }

  /*
   * Written with the SERVICE-ROLE key, not the publishable one.
   *
   * The publishable key is NEXT_PUBLIC_ and ships to every browser. Using it
   * here required `anon` to hold INSERT on the table — and an anon INSERT
   * grant means anyone can POST straight to /rest/v1/testimonials and set
   * status: 'approved' themselves, publishing to the site without review.
   * Writing from the server instead lets 0004 revoke anon's INSERT entirely,
   * which is what makes the moderation queue real rather than a convention.
   *
   * `status` is hard-coded below and is never read from the request body.
   */
  if (!hasServiceRole()) {
    console.error("[testimonials] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      { error: "We could not save your note right now. Please try again later." },
      { status: 503 },
    );
  }

  const response = await fetch(restUrl("/rest/v1/testimonials"), {
    method: "POST",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({
      display_name: displayName,
      email,
      quote,
      consent_to_publish: true,
      status: "pending",
    }),
  });

  if (!response.ok) {
    console.error("[testimonials] Supabase insert failed", await response.text());
    return NextResponse.json(
      { error: "We could not save your note. Please try again." },
      { status: 500 },
    );
  }

  try {
    await notifyReviewer({ displayName, email, quote });
  } catch (error) {
    console.error("[testimonials] reviewer notification threw", error);
  }

  return NextResponse.json({ received: true });
}

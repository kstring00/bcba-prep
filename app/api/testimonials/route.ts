import { NextResponse } from "next/server";

import { isEmailConfigured, sendEmail } from "@/lib/email";
import { supabaseConfig } from "@/lib/supabase/config";

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
    subject: `New BCBA Prep testimonial from ${input.displayName}`,
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
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
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

  const { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY } =
    supabaseConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/testimonials`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
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

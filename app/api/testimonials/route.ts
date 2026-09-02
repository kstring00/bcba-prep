import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kkajncybxhoylvhhprom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_zcwo0785jDmjDOnGAq_N8w_-dRm6PaG";

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
  const apiKey = process.env.RESEND_API_KEY;
  const reviewEmail = process.env.TESTIMONIAL_REVIEW_EMAIL;
  const fromEmail = process.env.TESTIMONIAL_FROM_EMAIL;

  // Submissions are still safely stored for review when email delivery is not
  // configured yet. Never fail a customer submission because notification
  // infrastructure is missing or temporarily unavailable.
  if (!apiKey || !reviewEmail || !fromEmail) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [reviewEmail],
      reply_to: input.email,
      subject: `New BCBA Prep testimonial from ${input.displayName}`,
      text: [
        "A new testimonial is waiting for review in Supabase.",
        "",
        `Display name: ${input.displayName}`,
        `Reply email: ${input.email}`,
        "",
        input.quote,
        "",
        "Nothing is published automatically. Approve the record before it appears on the site.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error(
      "[testimonials] reviewer notification failed",
      response.status,
      await response.text(),
    );
  }
}

export async function GET() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/testimonials?select=id,display_name,quote,created_at&order=created_at.desc&limit=16`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json({ testimonials: [] }, { status: 200 });
  }

  return NextResponse.json({ testimonials: await response.json() });
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

import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/*
 * Contact form delivery.
 *
 * This route replaced a direct browser-to-Supabase insert. That older path had
 * two problems worth remembering so nobody reinstates it: the publishable key
 * it used ships in the client bundle, so anyone could POST rows straight into
 * the table; and nothing ever read the table, so every message a customer sent
 * went nowhere. Messages now go to a real inbox, and the credential stays on
 * the server.
 */

const SUBJECTS = new Set([
  "Question about a domain",
  "Before I purchase",
  "Purchase or access help",
  "Study material feedback",
  "Something else",
]);

type Submission = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  /** Honeypot. Real visitors never see this field. */
  company?: unknown;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  /*
   * Two ceilings, deliberately.
   *
   * The flood guard counts every request, including malformed ones, so a
   * script cannot hammer the route for free. It is set high enough that no
   * person reaches it.
   *
   * The send limit further down counts only messages that pass validation, so
   * someone who mistypes their email five times is not locked out for ten
   * minutes. Counting rejections against a real person is the failure mode
   * this split exists to avoid.
   */
  const flood = rateLimit(clientKey(request, "contact-flood"), 40, 10 * 60 * 1000);
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
  if (clean(body.company)) {
    return NextResponse.json({ received: true });
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const subject = clean(body.subject);
  const message = clean(body.message);

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Please enter your name." },
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

  if (!SUBJECTS.has(subject)) {
    return NextResponse.json(
      { error: "Please choose what your message is about." },
      { status: 400 },
    );
  }

  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Please write between 10 and 5,000 characters." },
      { status: 400 },
    );
  }

  // Only well-formed submissions count toward the send limit.
  const sends = rateLimit(clientKey(request, "contact-send"), 5, 10 * 60 * 1000);
  if (!sends.allowed) {
    return NextResponse.json(
      {
        error:
          "You have already sent several messages. Please give Bee a little time to reply.",
      },
      { status: 429, headers: { "Retry-After": String(sends.retryAfterSeconds) } },
    );
  }

  /*
   * Refuse rather than pretend. If mail is not configured there is nowhere for
   * this message to go, and telling the visitor it was sent would be the exact
   * failure this route exists to remove. The error names an alternative so the
   * person is not simply stuck.
   */
  if (!isEmailConfigured()) {
    console.error("[contact] email is not configured; submission refused");
    return NextResponse.json(
      {
        error:
          "The contact form is not available right now. Please email Bee directly instead.",
      },
      { status: 503 },
    );
  }

  try {
    await sendEmail({
      subject: `BCBA Prep contact — ${subject}`,
      replyTo: email,
      text: [
        `From:    ${name} <${email}>`,
        `Subject: ${subject}`,
        "",
        message,
        "",
        "— Sent from the BCBA Prep contact form. Reply directly to answer.",
      ].join("\n"),
    });
  } catch (error) {
    console.error("[contact] delivery failed", error);
    return NextResponse.json(
      { error: "We could not send your message. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ received: true });
}

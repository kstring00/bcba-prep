/**
 * Outbound transactional email, via Resend.
 *
 * Deliberately small: this project sends two kinds of message (a contact-form
 * relay and a testimonial review alert) and needs no template engine.
 *
 * Configuration is all-or-nothing. `isEmailConfigured()` reports whether the
 * three required variables are present so callers can decide what to do when
 * they are not — and the two callers make *different* choices on purpose:
 *
 *   - Contact form: refuses the submission. A visitor must never be told
 *     "message sent" when it went nowhere.
 *   - Testimonial alert: proceeds silently. The note is already stored, so
 *     losing the notification is not worth failing the visitor's submission.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.CONTACT_INBOX_EMAIL &&
      process.env.CONTACT_FROM_EMAIL,
  );
}

export type OutboundEmail = {
  subject: string;
  text: string;
  /** Set so a reply goes to the person who wrote in, not to the site. */
  replyTo?: string;
  /** Defaults to CONTACT_INBOX_EMAIL. */
  to?: string;
};

export async function sendEmail(message: OutboundEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = message.to ?? process.env.CONTACT_INBOX_EMAIL;

  if (!apiKey || !from || !to) {
    throw new Error("Email is not configured");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: message.subject,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    // The body can carry the reason (bad domain, unverified sender). Log it
    // for the server operator; never return it to the visitor.
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the message (${response.status}) ${detail}`);
  }
}

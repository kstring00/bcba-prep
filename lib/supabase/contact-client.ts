const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kkajncybxhoylvhhprom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_zcwo0785jDmjDOnGAq_N8w_-dRm6PaG";

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactMessage(input: ContactMessageInput) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "new",
    }),
  });

  if (!response.ok) {
    let message = "We could not send your message. Please try again.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      // Keep the friendly fallback message when Supabase returns no JSON body.
    }
    throw new Error(message);
  }
}

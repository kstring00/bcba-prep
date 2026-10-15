import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/supabase-auth";
import { cleanEmail, siteOrigin, validEmail } from "@/lib/auth/validate";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "reset-req"), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = cleanEmail(body.email);
  if (!validEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  /*
   * Always reports success, even for an address with no account.
   *
   * Confirming which emails are registered would turn this form into an
   * account-enumeration oracle. Supabase simply sends nothing when there is
   * no match, so "check your inbox" is the honest and safe answer either way.
   */
  try {
    await requestPasswordReset(
      email,
      `${siteOrigin(request)}/reset-password`,
    );
  } catch (error) {
    console.error("[auth/reset-request]", error);
  }

  return NextResponse.json({ sent: true });
}

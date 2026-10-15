import { NextResponse } from "next/server";
import { AuthError, signUpWithPassword } from "@/lib/auth/supabase-auth";
import { setSessionCookies, tokensFromAuthResponse } from "@/lib/auth/session";
import {
  cleanEmail,
  MIN_PASSWORD_LENGTH,
  siteOrigin,
  validEmail,
  validPassword,
} from "@/lib/auth/validate";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "sign-up"), 5, 60 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many accounts created from here. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
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
  if (!validPassword(body.password)) {
    return NextResponse.json(
      { error: `Please use at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const payload = await signUpWithPassword(
      email,
      body.password,
      `${siteOrigin(request)}/member`,
    );

    // When email confirmation is ON, Supabase returns a user but no session.
    // That is the normal path, not an error — tell the caller to go and
    // confirm rather than dropping them at a sign-in form with no hint.
    const tokens = tokensFromAuthResponse(payload);
    if (!tokens) {
      return NextResponse.json({ needsEmailConfirmation: true });
    }

    await setSessionCookies(tokens);
    return NextResponse.json({
      needsEmailConfirmation: false,
      user: { id: payload.user?.id, email: payload.user?.email ?? email },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[auth/sign-up]", error);
    return NextResponse.json(
      { error: "We could not create your account. Please try again." },
      { status: 500 },
    );
  }
}

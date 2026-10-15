import { NextResponse } from "next/server";
import { AuthError, signInWithPassword } from "@/lib/auth/supabase-auth";
import { setSessionCookies, tokensFromAuthResponse } from "@/lib/auth/session";
import { cleanEmail, validEmail } from "@/lib/auth/validate";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Credential stuffing guard. Generous enough for a forgotten password,
  // tight enough that guessing is not viable.
  const limited = rateLimit(clientKey(request, "sign-in"), 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes." },
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
  if (!validEmail(email) || typeof body.password !== "string" || !body.password) {
    return NextResponse.json(
      { error: "Please enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const payload = await signInWithPassword(email, body.password);
    const tokens = tokensFromAuthResponse(payload);
    if (!tokens || !payload.user?.id) {
      return NextResponse.json(
        { error: "Sign-in did not return a complete session." },
        { status: 502 },
      );
    }

    await setSessionCookies(tokens);
    return NextResponse.json({
      user: { id: payload.user.id, email: payload.user.email ?? email },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[auth/sign-in]", error);
    return NextResponse.json(
      { error: "We could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}

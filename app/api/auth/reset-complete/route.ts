import { NextResponse } from "next/server";
import { AuthError, updatePassword } from "@/lib/auth/supabase-auth";
import { clearSessionCookies } from "@/lib/auth/session";
import { MIN_PASSWORD_LENGTH, validPassword } from "@/lib/auth/validate";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Completes a password reset.
 *
 * The recovery token arrives from the client because Supabase puts it in the
 * URL *fragment*, which the browser never sends to a server. The page reads it
 * from `window.location.hash` and posts it here. It authorises exactly one
 * action — updating this user's password — and is never stored as a session.
 */
export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "reset-done"), 10, 15 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: { accessToken?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.accessToken !== "string" || !body.accessToken) {
    return NextResponse.json(
      { error: "This reset link cannot be used. Please request a new one." },
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
    await updatePassword(body.accessToken, body.password);
    // Force a clean sign-in with the new password rather than carrying the
    // recovery token forward as a session.
    await clearSessionCookies();
    return NextResponse.json({ updated: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[auth/reset-complete]", error);
    return NextResponse.json(
      { error: "We could not update your password. Please try again." },
      { status: 500 },
    );
  }
}

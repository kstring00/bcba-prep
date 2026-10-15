import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_SKEW_SECONDS,
  decodeUnverified,
} from "@/lib/auth/session";

/**
 * Keeps the session alive.
 *
 * Supabase access tokens last about an hour. Cookies can only be written from
 * a Route Handler, a Server Action or middleware — never from a Server
 * Component — so this is the only place a page render can be preceded by a
 * silent token refresh. Without it, someone reading study material would be
 * signed out mid-session and bounced to the sign-in form.
 *
 * Refreshes slightly BEFORE expiry (REFRESH_SKEW_SECONDS) so a request that
 * arrives on the boundary still carries a valid token.
 */
export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) return NextResponse.next();

  if (accessToken) {
    const claims = decodeUnverified(accessToken);
    const now = Math.floor(Date.now() / 1000);
    if (claims && claims.exp - now > REFRESH_SKEW_SECONDS) {
      return NextResponse.next();
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return NextResponse.next();

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      },
    );

    const next = NextResponse.next();

    if (!response.ok) {
      // A refresh token Supabase rejects is spent or revoked. Drop both
      // cookies so the person gets a clean sign-in instead of looping.
      next.cookies.delete(ACCESS_COOKIE);
      next.cookies.delete(REFRESH_COOKIE);
      return next;
    }

    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!payload.access_token || !payload.refresh_token) return next;

    const secure = process.env.NODE_ENV === "production";
    const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };

    next.cookies.set(ACCESS_COOKIE, payload.access_token, {
      ...base,
      maxAge: payload.expires_in ?? 3600,
    });
    next.cookies.set(REFRESH_COOKIE, payload.refresh_token, {
      ...base,
      maxAge: 60 * 60 * 24 * 30,
    });
    return next;
  } catch {
    // Never fail a page render because a refresh could not be attempted.
    return NextResponse.next();
  }
}

export const config = {
  // Skip static assets and the webhook. The webhook is Stripe-authenticated
  // and carries no cookies; running refresh logic on it is pure latency.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/webhook).*)"],
};

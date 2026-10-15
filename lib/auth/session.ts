import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/config";

/**
 * SERVER-SIDE SESSIONS.
 *
 * Tokens live in httpOnly cookies, not localStorage. That is not a style
 * preference — it is what makes everything else in this codebase possible:
 *
 *   - The server can tell who is asking, so /api/content can refuse a
 *     non-owner. With localStorage it never could.
 *   - /api/checkout can require a signed-in user, so a purchase always
 *     attaches to an account.
 *   - A page can render "Open" vs "Unlock" correctly on first paint instead
 *     of flickering after hydration.
 *   - No script on the page can read the tokens, so an XSS bug stops being
 *     an account-takeover bug.
 *
 * Cookies can only be WRITTEN from Route Handlers, Server Actions and
 * middleware — never from a Server Component. That is why sign-in lives in
 * /api/auth/* and why token refresh lives in middleware.ts.
 */

export const ACCESS_COOKIE = "bcba_at";
export const REFRESH_COOKIE = "bcba_rt";

/** Refresh this many seconds before actual expiry, to absorb clock skew. */
export const REFRESH_SKEW_SECONDS = 120;

export type SessionUser = {
  id: string;
  email: string | null;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds. */
  expiresAt: number;
};

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Reads the `sub`, `email` and `exp` claims WITHOUT verifying the signature.
 *
 * Safe here, and only here, because of how the value is used:
 *
 *   - The cookie is httpOnly and only ever set by our own server, so a
 *     browser script cannot plant one.
 *   - The result drives DISPLAY ONLY — whose email to greet, whether to show
 *     "My Library".
 *   - Every authorization decision re-proves identity somewhere that actually
 *     checks the signature: entitlement reads send this token to PostgREST,
 *     which validates it and applies RLS; /api/content additionally verifies
 *     against /auth/v1/user before releasing a file.
 *
 * So a forged token buys a different nav label and nothing else. Do not start
 * authorizing from this function's output.
 */
export function decodeUnverified(
  token: string,
): { sub: string; email: string | null; exp: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const claims = JSON.parse(json) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    if (!claims.sub || !claims.exp) return null;
    return { sub: claims.sub, email: claims.email ?? null, exp: claims.exp };
  } catch {
    return null;
  }
}

/** The raw access token, for calls that must be made as this user. */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

/**
 * Who is signed in, for rendering. Returns null when there is no usable
 * token. Does not hit the network — see decodeUnverified for why that is
 * acceptable for display.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const claims = decodeUnverified(token);
  if (!claims) return null;

  // An expired token is treated as signed out. Middleware refreshes ahead of
  // this point; if it could not, the person signs in again.
  if (claims.exp * 1000 <= Date.now()) return null;

  return { id: claims.sub, email: claims.email };
}

/**
 * Verifies the token against Supabase. One network call. Use this — not
 * getSessionUser — on any path that releases paid content or money.
 */
export async function getVerifiedUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function verifyAccessToken(
  token: string,
): Promise<SessionUser | null> {
  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = supabaseConfig());
  } catch {
    return null;
  }

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id?: string; email?: string };
    if (!user.id) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

export async function setSessionCookies(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  const accessMaxAge = Math.max(
    60,
    tokens.expiresAt - Math.floor(Date.now() / 1000),
  );
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(accessMaxAge));
  // Refresh tokens outlive access tokens; 30 days keeps people signed in
  // across a study week without being indefinite.
  store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Normalises a Supabase auth response into our token shape. */
export function tokensFromAuthResponse(payload: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
}): TokenPair | null {
  if (!payload.access_token || !payload.refresh_token) return null;
  const expiresAt =
    payload.expires_at ??
    Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
  };
}

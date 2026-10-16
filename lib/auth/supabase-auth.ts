import { supabaseConfig, supabaseHeaders } from "@/lib/supabase/config";

/**
 * Thin wrapper over Supabase's GoTrue HTTP API, called only from the server.
 *
 * Replaces the previous browser-side client. Credentials and tokens now never
 * touch client JavaScript: the browser posts an email and password to our own
 * route, and gets back a cookie.
 */
export type AuthPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string; email?: string };
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Supabase's own wording is surfaced for the cases a person can act on
 * ("Invalid login credentials", "User already registered") because a vague
 * "something went wrong" leaves them stuck.
 *
 * Note on account enumeration: Supabase's sign-in error does not distinguish
 * "no such user" from "wrong password", so this does not leak which emails
 * have accounts. Sign-UP does reveal it — unavoidable without a confirm-by-
 * email-only flow, and the standard trade for a usable signup form.
 */
function messageFrom(payload: AuthPayload, fallback: string): string {
  return (
    payload.error_description ??
    payload.msg ??
    payload.message ??
    payload.error ??
    fallback
  );
}

async function authFetch(
  path: string,
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<AuthPayload> {
  const { url, publishableKey } = supabaseConfig();

  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: supabaseHeaders(publishableKey),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as AuthPayload;
  if (!response.ok) {
    throw new AuthError(messageFrom(payload, fallbackError), response.status);
  }
  return payload;
}

export function signInWithPassword(email: string, password: string) {
  return authFetch(
    "/auth/v1/token?grant_type=password",
    { email, password },
    "We could not sign you in.",
  );
}

export function signUpWithPassword(
  email: string,
  password: string,
  redirectTo: string,
) {
  return authFetch(
    "/auth/v1/signup",
    { email, password, redirect_to: redirectTo },
    "We could not create your account.",
  );
}

export function refreshSession(refreshToken: string) {
  return authFetch(
    "/auth/v1/token?grant_type=refresh_token",
    { refresh_token: refreshToken },
    "Your session could not be refreshed.",
  );
}

export function requestPasswordReset(email: string, redirectTo: string) {
  return authFetch(
    "/auth/v1/recover",
    { email, redirect_to: redirectTo },
    "We could not send the reset email.",
  );
}

/** Sets a new password using the short-lived token from a recovery link. */
export async function updatePassword(accessToken: string, password: string) {
  const { url, publishableKey } = supabaseConfig();

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: supabaseHeaders(publishableKey, accessToken),
    body: JSON.stringify({ password }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as AuthPayload;
  if (!response.ok) {
    throw new AuthError(
      messageFrom(payload, "We could not update your password."),
      response.status,
    );
  }
  return payload;
}

export async function signOutToken(accessToken: string): Promise<void> {
  const { url, publishableKey } = supabaseConfig();
  try {
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // Local sign-out must still succeed if the network call fails.
  }
}

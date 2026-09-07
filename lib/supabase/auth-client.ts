import { supabaseConfig } from "./config";

const SESSION_KEY = "bcba-prep-supabase-session";

type AuthUser = {
  id: string;
  email?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
};

type AuthResponse = Partial<AuthSession> & {
  user?: AuthUser;
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

function browserAvailable() {
  return typeof window !== "undefined";
}

function saveSession(session: AuthSession) {
  if (!browserAvailable()) return;
  const expiresAt = Math.floor(Date.now() / 1000) + session.expires_in;
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, expires_at: expiresAt }),
  );
}

function authError(payload: AuthResponse, fallback: string) {
  return new Error(
    payload.error_description ??
      payload.msg ??
      payload.message ??
      payload.error ??
      fallback,
  );
}

async function authFetch(path: string, body: Record<string, unknown>) {
  const { url, publishableKey } = supabaseConfig();
  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as AuthResponse;
  if (!response.ok) throw authError(payload, "Authentication request failed.");
  return payload;
}

export async function signInWithPassword(email: string, password: string) {
  const payload = await authFetch("/auth/v1/token?grant_type=password", {
    email: email.trim(),
    password,
  });

  if (!payload.access_token || !payload.refresh_token || !payload.user) {
    throw new Error("Supabase did not return a complete session.");
  }

  const session = payload as AuthSession;
  saveSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string) {
  const payload = await authFetch("/auth/v1/signup", {
    email: email.trim(),
    password,
  });

  let session: AuthSession | null = null;
  if (payload.access_token && payload.refresh_token && payload.user) {
    session = payload as AuthSession;
    saveSession(session);
  }

  return { user: payload.user ?? null, session };
}

export async function requestPasswordReset(email: string) {
  await authFetch("/auth/v1/recover", {
    email: email.trim(),
    // Supabase appends the recovery token to this URL as a fragment. The
    // origin must also be listed under Authentication → URL Configuration →
    // Redirect URLs in the Supabase dashboard, or the link silently bounces
    // to the site root and the reset cannot be completed.
    redirect_to: `${siteOrigin()}/reset-password`,
  });
}

function siteOrigin(): string {
  if (browserAvailable()) return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Completes a password reset.
 *
 * The recovery link hands back a short-lived access token in the URL
 * fragment. That token authorises exactly one thing — updating this user — so
 * it is used directly rather than being written into the stored session.
 */
export async function updatePasswordWithRecoveryToken(
  accessToken: string,
  password: string,
) {
  const { url, publishableKey } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const payload = (await response.json()) as AuthResponse;
  if (!response.ok) {
    throw authError(payload, "We could not update your password.");
  }
}

export function getStoredSession(): AuthSession | null {
  if (!browserAvailable()) return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.refresh_token || !session.user) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export async function refreshStoredSession() {
  const current = getStoredSession();
  if (!current) return null;

  const now = Math.floor(Date.now() / 1000);
  if (current.expires_at && current.expires_at - now > 60) return current;

  try {
    const payload = await authFetch("/auth/v1/token?grant_type=refresh_token", {
      refresh_token: current.refresh_token,
    });

    if (!payload.access_token || !payload.refresh_token || !payload.user) {
      clearStoredSession();
      return null;
    }

    const session = payload as AuthSession;
    saveSession(session);
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession() {
  if (!browserAvailable()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export async function signOut() {
  const session = getStoredSession();

  if (session) {
    try {
      const { url, publishableKey } = supabaseConfig();
      await fetch(`${url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      // Local sign-out should still succeed if the network request fails.
    }
  }

  clearStoredSession();
}

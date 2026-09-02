const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kkajncybxhoylvhhprom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_zcwo0785jDmjDOnGAq_N8w_-dRm6PaG";

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
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
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
  });
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
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      // Local sign-out should still succeed if the network request fails.
    }
  }

  clearStoredSession();
}

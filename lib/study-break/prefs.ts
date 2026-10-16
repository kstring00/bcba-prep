"use client";

import { clampPrefs, DEFAULT_PREFS, type TimerPrefs } from "./config";

/**
 * Timer settings persistence.
 *
 * Signed in  → Supabase, via /api/preferences, so settings follow the person
 *              between devices.
 * Signed out → localStorage, so the page still remembers within a browser.
 *
 * Every localStorage access is wrapped: in a private window, with site data
 * blocked, or during a thumbnail capture, the accessor can throw outright.
 * A study-break page must never white-screen because storage was unavailable.
 */
const STORAGE_KEY = "bcba-study-break-prefs";

export function readLocalPrefs(): TimerPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return clampPrefs(JSON.parse(raw) as Partial<TimerPrefs>);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeLocalPrefs(prefs: TimerPrefs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Settings simply will not persist. Not worth surfacing to the visitor.
  }
}

export async function savePrefs(
  prefs: TimerPrefs,
  signedIn: boolean,
): Promise<void> {
  writeLocalPrefs(prefs);
  if (!signedIn) return;

  try {
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {
    // The local copy already succeeded, so the UI stays correct for this
    // session even if the round trip failed.
  }
}

/**
 * Remembers the last domain a member opened, for the post-break CTA
 * ("Back to Measurement →").
 *
 * localStorage rather than a cookie or a database column: it is a convenience,
 * it is per-device by nature, and nothing breaks when it is missing.
 */
const LAST_DOMAIN_KEY = "bcba-last-domain";

export function rememberLastDomain(slug: string): void {
  try {
    window.localStorage.setItem(LAST_DOMAIN_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function readLastDomain(): string | null {
  try {
    return window.localStorage.getItem(LAST_DOMAIN_KEY);
  } catch {
    return null;
  }
}

/** Keeps a win typed while signed out, so signing up does not lose it. */
const PENDING_WIN_KEY = "bcba-pending-win";

export function savePendingWin(text: string): void {
  try {
    window.localStorage.setItem(PENDING_WIN_KEY, text);
  } catch {
    /* ignore */
  }
}

export function readPendingWin(): string | null {
  try {
    return window.localStorage.getItem(PENDING_WIN_KEY);
  } catch {
    return null;
  }
}

export function clearPendingWin(): void {
  try {
    window.localStorage.removeItem(PENDING_WIN_KEY);
  } catch {
    /* ignore */
  }
}

"use client";

/**
 * UTM capture.
 *
 * The parameters are on the URL for the first pageview only — one tap through
 * to another page and they are gone. So they are read on arrival and held in
 * sessionStorage, which survives navigation within the visit and clears when
 * the tab closes.
 *
 * sessionStorage rather than localStorage on purpose: attribution belongs to
 * THIS visit. A localStorage copy would still be attached three weeks later
 * and credit the wrong post.
 */
const KEY = "bcba-utm";

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  device?: "mobile" | "desktop";
};

const FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Trim and cap — these land in a database column and a Clarity tag. */
function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : undefined;
}

function detectDevice(): "mobile" | "desktop" {
  // Coarse on purpose: the only question is "could they comfortably study on
  // this right now", and width answers it well enough.
  return window.matchMedia("(max-width: 820px)").matches ? "mobile" : "desktop";
}

/**
 * Reads UTMs from the current URL, merges them over anything already stored,
 * and returns the result. Call once on mount.
 *
 * Merging rather than replacing means a visitor who arrives with UTMs and
 * then navigates to another page on the site keeps their attribution.
 */
export function captureAttribution(): Attribution {
  let stored: Attribution = {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Attribution;
  } catch {
    // Private mode, blocked storage, or a thumbnail capture. Carry on with
    // whatever is on the URL.
  }

  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};
  for (const field of FIELDS) {
    const value = clean(params.get(field));
    if (value) fresh[field] = value;
  }

  // Referrer is only meaningful on the first page of a visit; afterwards it
  // is just the previous page of this same site.
  if (!stored.referrer) {
    const ref = clean(document.referrer);
    if (ref && !ref.startsWith(window.location.origin)) fresh.referrer = ref;
  }

  const merged: Attribution = {
    ...stored,
    ...fresh,
    device: detectDevice(),
  };

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }

  tagClarity(merged);
  return merged;
}

export function readAttribution(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

/**
 * Forwards attribution to Microsoft Clarity as custom tags, so sessions can be
 * filtered by campaign in the dashboard without a second analytics tool.
 *
 * Guarded: Clarity only loads when NEXT_PUBLIC_CLARITY_PROJECT_ID is set, so
 * on local and preview builds `window.clarity` is simply absent.
 */
function tagClarity(attribution: Attribution): void {
  const clarity = (
    window as unknown as {
      clarity?: (method: string, key: string, value: string) => void;
    }
  ).clarity;
  if (typeof clarity !== "function") return;

  for (const [key, value] of Object.entries(attribution)) {
    if (typeof value === "string" && value.length > 0) {
      try {
        clarity("set", key, value);
      } catch {
        /* never let analytics break the page */
      }
    }
  }
}

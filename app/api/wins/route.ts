import { NextResponse } from "next/server";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";
import { WIN_MAX_LENGTH } from "@/lib/study-break/config";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The small-wins journal.
 *
 * Reads and writes go through Supabase with the USER'S OWN token, so RLS is
 * in the path: the policies in 0002_study_break.sql scope every row to
 * auth.uid(), and the insert policy's `with check` makes it impossible to
 * write a row under another user_id even if this route had a bug.
 *
 * Deliberately not using the service-role key. A journal is the most private
 * thing on the site; it should be unreachable with a key that bypasses RLS.
 */
type WinRow = { id: string; text: string; created_at: string };

async function supabaseFor(token: string) {
  const { url, publishableKey } = supabaseConfig();
  return {
    url,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ wins: [], signedIn: false });

  try {
    const { url, headers } = await supabaseFor(token);
    const response = await fetch(
      `${url}/rest/v1/wins?select=id,text,created_at&order=created_at.desc&limit=30`,
      { headers, cache: "no-store" },
    );
    if (!response.ok) {
      console.error("[wins] read failed", response.status);
      return NextResponse.json({ wins: [], signedIn: true });
    }
    const wins = (await response.json()) as WinRow[];
    return NextResponse.json({ wins, signedIn: true });
  } catch (error) {
    console.error("[wins] read threw", error);
    return NextResponse.json({ wins: [], signedIn: true });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "wins"), 30, 60 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "That is a lot of wins. Please try again a little later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const user = await getSessionUser();
  const token = await getAccessToken();

  // Signed-out visitors can type, but saving needs an account. The client
  // keeps their text so signing up does not lose it.
  if (!user || !token) {
    return NextResponse.json(
      {
        error: "Create a free account to keep your wins.",
        requiresSignIn: true,
      },
      { status: 401 },
    );
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length === 0) {
    return NextResponse.json(
      { error: "Write a line first, then save it." },
      { status: 400 },
    );
  }
  if (text.length > WIN_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Please keep it to ${WIN_MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const { url, headers } = await supabaseFor(token);
    const response = await fetch(`${url}/rest/v1/wins`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      // user_id is taken from the verified session, never from the body.
      body: JSON.stringify({ user_id: user.id, text }),
    });

    if (!response.ok) {
      console.error("[wins] insert failed", response.status, await response.text().catch(() => ""));
      return NextResponse.json(
        { error: "We could not save that. Please try again." },
        { status: 502 },
      );
    }

    const rows = (await response.json()) as WinRow[];
    return NextResponse.json({ win: rows[0] ?? null });
  } catch (error) {
    console.error("[wins] insert threw", error);
    return NextResponse.json(
      { error: "We could not save that. Please try again." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";
import { clampPrefs, DEFAULT_PREFS } from "@/lib/study-break/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Timer settings for signed-in members, so they follow the person between
 * devices. Signed-out visitors keep theirs in localStorage instead.
 *
 * Values are clamped on the way in by clampPrefs — the same function the
 * client uses — so a hand-written PUT cannot store a 9,999-minute focus block
 * and leave the UI in a state nobody can get out of.
 */
type PrefRow = {
  focus_minutes: number;
  break_minutes: number;
  long_break_minutes: number;
  rounds_before_long_break: number;
  sound_enabled: boolean;
};

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ prefs: DEFAULT_PREFS, signedIn: false });

  try {
    const { url, publishableKey } = supabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/member_preferences?select=*&limit=1`,
      {
        headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return NextResponse.json({ prefs: DEFAULT_PREFS, signedIn: true });
    }
    const rows = (await response.json()) as PrefRow[];
    const row = rows[0];
    if (!row) return NextResponse.json({ prefs: DEFAULT_PREFS, signedIn: true });

    return NextResponse.json({
      signedIn: true,
      prefs: clampPrefs({
        focusMinutes: row.focus_minutes,
        breakMinutes: row.break_minutes,
        longBreakMinutes: row.long_break_minutes,
        roundsBeforeLongBreak: row.rounds_before_long_break,
        soundEnabled: row.sound_enabled,
      }),
    });
  } catch (error) {
    console.error("[preferences] read threw", error);
    return NextResponse.json({ prefs: DEFAULT_PREFS, signedIn: true });
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  const token = await getAccessToken();
  if (!user || !token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prefs = clampPrefs(body);

  try {
    const { url, publishableKey } = supabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/member_preferences?on_conflict=user_id`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id: user.id,
          focus_minutes: prefs.focusMinutes,
          break_minutes: prefs.breakMinutes,
          long_break_minutes: prefs.longBreakMinutes,
          rounds_before_long_break: prefs.roundsBeforeLongBreak,
          sound_enabled: prefs.soundEnabled,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      console.error("[preferences] write failed", response.status);
      return NextResponse.json({ error: "Could not save settings." }, { status: 502 });
    }
    return NextResponse.json({ prefs });
  } catch (error) {
    console.error("[preferences] write threw", error);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}

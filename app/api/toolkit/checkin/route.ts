import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import { isFeelingSlug } from "@/lib/toolkit/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * One anonymous tap on "How are you feeling?"
 *
 * What arrives: a feeling slug from a fixed list of six, and a random id the
 * browser generated for itself. What is stored: the slug, today's UTC date,
 * and a SHA-256 of that id. See 0007_toolkit_checkins.sql for why that is
 * all, and lib/toolkit/config.ts for the rules.
 *
 * Nothing here is ever shown back per device. The page reads only aggregate
 * counts, and only above a threshold.
 *
 * Service role, because there is no user: the toolkit has no login by
 * design, and the table has no policies, so this route is the only way in.
 * Failure is quiet on purpose — a tap that did not record changes nothing
 * for the person who tapped; the care plan opens either way.
 */

const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const flood = rateLimit(clientKey(request, "toolkit-checkin"), 30, 10 * 60 * 1000);
  if (!flood.allowed) {
    return NextResponse.json(
      { recorded: false },
      { status: 429, headers: { "Retry-After": String(flood.retryAfterSeconds) } },
    );
  }

  let body: { feeling?: unknown; device?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }

  if (!isFeelingSlug(body.feeling)) {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }
  if (typeof body.device !== "string" || !DEVICE_ID.test(body.device)) {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }

  // Until 0007 is applied and the key is set, taps simply are not counted.
  if (!hasServiceRole()) {
    return NextResponse.json({ recorded: false });
  }

  const device_hash = createHash("sha256")
    .update(body.device.toLowerCase())
    .digest("hex");

  try {
    // Upsert on (day, device_hash): a second tap today replaces the first,
    // so a device is one row a day whatever it does.
    const response = await fetch(
      restUrl("/rest/v1/toolkit_checkins?on_conflict=day,device_hash"),
      {
        method: "POST",
        headers: {
          ...adminHeaders(),
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ feeling: body.feeling, day: utcDay(), device_hash }),
      },
    );
    if (!response.ok) {
      console.error("[toolkit] checkin insert failed", response.status);
      return NextResponse.json({ recorded: false });
    }
  } catch (error) {
    console.error("[toolkit] checkin insert threw", error);
    return NextResponse.json({ recorded: false });
  }

  return NextResponse.json({ recorded: true });
}

import { NextResponse } from "next/server";
import { getAccessToken, getVerifiedUser } from "@/lib/auth/session";
import { createSignedUrl, hasServiceRole } from "@/lib/supabase/admin";
import { supabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE ONLY WAY PAID FILES LEAVE THE SYSTEM.
 *
 * Storage is private (`public = false`), so there is no URL anyone can paste
 * to reach a file directly. Everything goes through here, and here runs four
 * checks before it signs anything:
 *
 *   1. A session must exist, and be VERIFIED against Supabase — not merely
 *      decoded from a cookie.
 *   2. The content row is read with the USER'S OWN token, so RLS applies. A
 *      non-owner gets zero rows back from the database itself; the policy,
 *      not this file, is the thing standing in the way.
 *   3. An explicit entitlement check on top of RLS. Belt and braces: if a
 *      policy is ever loosened by accident, this still refuses.
 *   4. Only then is a 60-second signed URL minted, with the service-role key.
 *
 * Both 403s below return the same body as a 404 would tell an attacker less,
 * but the honest status is more useful to a real signed-in customer hitting a
 * genuine problem, so the status differs and the body stays vague.
 */
type ContentRow = {
  id: string;
  sku: string;
  kind: "file" | "interactive";
  title: string;
  storage_path: string | null;
  is_published: boolean;
};

const DENIED = { error: "You do not have access to this item." };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // ---- 1. Session, verified against Supabase ----------------------------
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to open your study materials." },
      { status: 401 },
    );
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(DENIED, { status: 401 });
  }

  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = supabaseConfig());
  } catch {
    console.error("[content] Supabase is not configured");
    return NextResponse.json(
      { error: "Study materials are temporarily unavailable." },
      { status: 503 },
    );
  }

  // ---- 2. Read the row AS THE USER, so RLS decides ----------------------
  let row: ContentRow | undefined;
  try {
    const response = await fetch(
      `${url}/rest/v1/content_items` +
        `?select=id,sku,kind,title,storage_path,is_published` +
        `&id=eq.${encodeURIComponent(id)}&limit=1`,
      {
        headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error("[content] metadata read failed", response.status);
      return NextResponse.json(DENIED, { status: 403 });
    }
    const rows = (await response.json()) as ContentRow[];
    row = rows[0];
  } catch (error) {
    console.error("[content] metadata read threw", error);
    return NextResponse.json(DENIED, { status: 403 });
  }

  // RLS returned nothing: either no such item, or this user does not own it.
  // Both are the same answer from here.
  if (!row || !row.is_published) {
    return NextResponse.json(DENIED, { status: 403 });
  }

  // ---- 3. Explicit entitlement check, independent of RLS ----------------
  let owns = false;
  try {
    const response = await fetch(
      `${url}/rest/v1/entitlements?select=sku` +
        `&sku=eq.${encodeURIComponent(row.sku)}&active=eq.true&limit=1`,
      {
        headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (response.ok) {
      owns = ((await response.json()) as unknown[]).length > 0;
    }
  } catch (error) {
    console.error("[content] entitlement check threw", error);
  }

  if (!owns) {
    return NextResponse.json(DENIED, { status: 403 });
  }

  // ---- Interactive exams are not built yet ------------------------------
  if (row.kind === "interactive") {
    return NextResponse.json(
      {
        error:
          "This item is an interactive exam, which is not available yet. " +
          "Your access is recorded and it will open here when it is ready.",
      },
      { status: 409 },
    );
  }

  if (!row.storage_path) {
    console.error("[content] file item has no storage_path", row.id);
    return NextResponse.json(
      { error: "This item is not ready to download yet." },
      { status: 409 },
    );
  }

  // ---- 4. Sign, briefly -------------------------------------------------
  if (!hasServiceRole()) {
    console.error("[content] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      { error: "Study materials are temporarily unavailable." },
      { status: 503 },
    );
  }

  const signed = await createSignedUrl(row.storage_path);
  if (!signed) {
    return NextResponse.json(
      { error: "We could not open that file. Please try again." },
      { status: 502 },
    );
  }

  // 302 with no-store: the redirect itself must never be cached by a CDN or
  // a shared proxy, or one person's signed URL could be served to another.
  return NextResponse.redirect(signed, {
    status: 302,
    headers: { "Cache-Control": "no-store, private" },
  });
}

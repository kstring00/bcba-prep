import { NextResponse } from "next/server";
import { clearSessionCookies, getAccessToken } from "@/lib/auth/session";
import { signOutToken } from "@/lib/auth/supabase-auth";

export const runtime = "nodejs";

export async function POST() {
  const token = await getAccessToken();

  // Clear local cookies regardless of what Supabase says. A failed network
  // call must never leave someone stuck signed in on a shared computer.
  if (token) await signOutToken(token);
  await clearSessionCookies();

  return NextResponse.json({ signedOut: true });
}

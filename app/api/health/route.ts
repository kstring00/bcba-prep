import { NextResponse } from "next/server";
import { SALES_ENABLED } from "@/lib/launch";
import { missingSupabaseVars, supabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * A deployment self-check, readable from the live site.
 *
 * It exists because of a specific dead end: when a required variable is unset
 * in Vercel, signup fails before any request reaches Supabase. The Supabase
 * auth logs therefore show nothing at all, which looks exactly like an email
 * problem and sends you looking in the wrong place. This route answers "is
 * this deployment actually configured" in one request, without needing the
 * Vercel log viewer.
 *
 * DISCLOSURE: this reports *names* of absent variables and whether secrets are
 * present — never a value, never a partial value, never a length. Naming an
 * absent variable is the whole point; leaking what is in a present one would
 * defeat it. The two Supabase variables are publishable browser values in any
 * case, and the rest are reported only as true/false.
 *
 * If you would rather this not be world-readable once the site has customers,
 * the cheapest change is to require a header checked against a new secret and
 * return 404 without it.
 */

/** Present/absent only. Never returns or logs the value. */
function present(name: string): boolean {
  return Boolean(process.env[name]);
}

/**
 * Does a request from this server actually reach Supabase? This is the half
 * the variable check cannot answer: a URL can be set and still be wrong. The
 * probe is unauthenticated and carries no user data, and any non-ok answer
 * still proves reachability, which is what is being measured.
 */
async function probeSupabase(): Promise<{
  reachable: boolean;
  status: number | null;
  error: string | null;
}> {
  let url: string;
  try {
    ({ url } = supabaseConfig());
  } catch {
    return { reachable: false, status: null, error: "not configured" };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { reachable: true, status: response.status, error: null };
  } catch (error) {
    // The system error code ("ENOTFOUND") is the useful part and contains no
    // credentials. The full error is not echoed, in case it ever carries a URL
    // with a query string.
    const cause = (error as { cause?: { code?: unknown } }).cause;
    const code = typeof cause?.code === "string" ? cause.code : "unknown";
    return { reachable: false, status: null, error: code };
  }
}

export async function GET() {
  const missingSupabase = missingSupabaseVars();
  const supabase = await probeSupabase();

  const accountsWorking = missingSupabase.length === 0 && supabase.reachable;

  const body = {
    ok: accountsWorking,
    checkedAt: new Date().toISOString(),

    // Sign-up, sign-in and password reset all need exactly these.
    accounts: {
      working: accountsWorking,
      missingVars: missingSupabase,
      supabaseReachable: supabase.reachable,
      supabaseProbeStatus: supabase.status,
      supabaseProbeError: supabase.error,
    },

    // Not needed for signup. Listed so one request answers "what else is unset".
    fulfilment: {
      serviceRoleKey: present("SUPABASE_SERVICE_ROLE_KEY"),
      stripeSecretKey: present("STRIPE_SECRET_KEY"),
      stripeWebhookSecret: present("STRIPE_WEBHOOK_SECRET"),
    },
    email: {
      resendApiKey: present("RESEND_API_KEY"),
      contactInbox: present("CONTACT_INBOX_EMAIL"),
      contactFrom: present("CONTACT_FROM_EMAIL"),
    },
    site: {
      salesEnabled: SALES_ENABLED,
      siteUrl: present("NEXT_PUBLIC_SITE_URL"),
    },
  };

  return NextResponse.json(body, {
    // 503 when accounts are broken, so an uptime check notices without
    // having to parse the body.
    status: accountsWorking ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex",
    },
  });
}

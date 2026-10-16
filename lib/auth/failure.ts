import { NextResponse } from "next/server";
import { SupabaseConfigError } from "@/lib/supabase/config";

/**
 * Turns a thrown auth error into a response, and makes sure the real cause
 * reaches the server log.
 *
 * Why this exists: three very different failures used to produce the same
 * opaque 500 and the same "please try again" message —
 *
 *   1. the deployment has no Supabase variables, so nothing is ever sent;
 *   2. Supabase is configured but unreachable, so nothing arrives;
 *   3. something genuinely unexpected went wrong.
 *
 * The first two both fail *before* a request reaches Supabase, which means
 * they leave no trace in the Supabase auth logs at all. Someone debugging
 * from that end sees a signup attempt that simply does not exist, and
 * reasonably concludes the problem is further in than it is. Naming the class
 * of failure in both the log line and a stable `code` on the response is what
 * turns that dead end into a one-line diagnosis.
 *
 * "Please try again" is also withheld for the first two, because it is false:
 * retrying cannot set an environment variable.
 */
type AuthFailure = {
  response: NextResponse;
  /** For the caller's own logging, if it wants to add context. */
  code: "not_configured" | "upstream_unreachable" | "unexpected";
};

/**
 * `fetch` reports a connection problem as a TypeError whose `cause` carries
 * the underlying system error. Reading it is best-effort: the shape is not
 * guaranteed across runtimes, so a miss falls through to "unexpected" rather
 * than mislabelling a real bug as a network blip.
 */
function isUpstreamUnreachable(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const cause = (error as { cause?: unknown }).cause;
  const code =
    typeof cause === "object" && cause !== null
      ? (cause as { code?: unknown }).code
      : undefined;
  return (
    typeof code === "string" &&
    ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "EAI_AGAIN", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(
      code,
    )
  );
}

export function authFailure(scope: string, error: unknown): AuthFailure {
  if (error instanceof SupabaseConfigError) {
    // The message names the missing variables. It goes to the log, never to
    // the browser — the browser gets the code, and /api/health answers "which
    // one" without a round trip through Vercel's log viewer.
    console.error(`[${scope}] NOT CONFIGURED —`, error.message);
    return {
      code: "not_configured",
      response: NextResponse.json(
        {
          error:
            "Accounts are temporarily unavailable. This is a problem on our " +
            "side, not with your details — please check back shortly.",
          code: "not_configured",
        },
        { status: 503 },
      ),
    };
  }

  if (isUpstreamUnreachable(error)) {
    console.error(`[${scope}] UPSTREAM UNREACHABLE — no request reached Supabase:`, error);
    return {
      code: "upstream_unreachable",
      response: NextResponse.json(
        {
          error:
            "We could not reach our accounts service. Please try again in a " +
            "few minutes.",
          code: "upstream_unreachable",
        },
        { status: 503 },
      ),
    };
  }

  console.error(`[${scope}]`, error);
  return {
    code: "unexpected",
    response: NextResponse.json(
      { error: "Something went wrong on our side. Please try again.", code: "unexpected" },
      { status: 500 },
    ),
  };
}

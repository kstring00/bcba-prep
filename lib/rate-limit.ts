/**
 * Small fixed-window rate limiter for public form endpoints.
 *
 * IMPORTANT LIMITATION, stated plainly: this counter lives in the memory of a
 * single serverless instance. Vercel may run several instances concurrently
 * and recycles them freely, so the real ceiling is roughly
 * `limit × instance count`, and it resets on cold start.
 *
 * That is deliberate. It stops casual scripted abuse and accidental
 * double-submits — which is the actual threat to a site this size — without
 * adding a Redis dependency nobody has agreed to run. If this ever needs to be
 * a hard guarantee, move the counter to a shared store; do not tighten the
 * numbers here and call it solved.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Keeps the map from growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client identity. On Vercel `x-forwarded-for` is set by the edge
 * and its first entry is the real client; a spoofed header only ever splits an
 * attacker's own bucket, so it cannot be used to consume someone else's quota.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

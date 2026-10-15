/** Shared credential validation, so every auth route agrees on the rules. */
export const MIN_PASSWORD_LENGTH = 8;

export function cleanEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validEmail(email: string): boolean {
  return (
    email.length >= 3 &&
    email.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

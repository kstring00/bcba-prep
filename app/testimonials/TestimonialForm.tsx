"use client";

import { FormEvent, useState } from "react";
import styles from "./testimonials-minimal.module.css";

/**
 * Open to anyone — no sign-in.
 *
 * Requiring an account would put a wall in front of exactly the people whose
 * words are worth having: someone who arrived from TikTok, liked what they
 * saw, and would write two sentences right now but will not create a
 * password to do it.
 *
 * What makes that safe is not the form, it is the layers behind it. 0004
 * revoked anon's INSERT entirely and the route writes with the service-role
 * key at status 'pending', so nothing reaches the page without Bryana
 * approving it. The honeypot and the two-tier rate limit keep the queue
 * worth reading. The worst case of leaving this open is spam in a queue she
 * already reviews, not anything published.
 */
export function TestimonialForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: String(data.get("displayName") ?? ""),
          email: String(data.get("email") ?? ""),
          quote: String(data.get("quote") ?? ""),
          // Optional. Empty string means "not given", not "invalid".
          passedOn: String(data.get("passedOn") ?? ""),
          consent: data.get("consent") === "on",
          company: String(data.get("company") ?? ""),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "We could not send your note.");
      }

      form.reset();
      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not send your note. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className={styles.success} role="status">
        Thank you — your note is with Bryana. Nothing is posted automatically,
        so it will appear here once she has read it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Name to display</span>
        <input
          type="text"
          name="displayName"
          maxLength={80}
          placeholder="First name and last initial"
          autoComplete="name"
          required
        />
      </label>

      <label className={styles.field}>
        <span>Email</span>
        <input
          type="email"
          name="email"
          maxLength={320}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.field}>
        <span>
          Passed on <span className={styles.optional}>— optional</span>
        </span>
        <input type="date" name="passedOn" />
      </label>

      <label className={styles.field}>
        <span>Your note</span>
        <textarea
          name="quote"
          minLength={20}
          maxLength={1200}
          rows={5}
          placeholder="What helped?"
          required
        />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>Bryana may publish this note and the name above.</span>
      </label>

      <label className={styles.honeypot} aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      <button type="submit" className={styles.send} disabled={loading}>
        {loading ? "Sending…" : "Send →"}
      </button>

      {error ? <p className={styles.error}>{error}</p> : null}

      <p className={styles.trust}>
        Nothing is published without Bryana&rsquo;s approval. Your email stays
        private.
      </p>
    </form>
  );
}

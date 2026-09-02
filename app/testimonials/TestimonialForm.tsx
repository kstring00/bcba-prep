"use client";

import { FormEvent, useState } from "react";
import styles from "./testimonials.module.css";

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
          consent: data.get("consent") === "on",
          company: String(data.get("company") ?? ""),
        }),
      });

      const payload = (await response.json()) as { error?: string };
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <label>
          <span>Name to display</span>
          <input
            type="text"
            name="displayName"
            maxLength={80}
            placeholder="First name + last initial"
            autoComplete="name"
            required
          />
        </label>

        <label>
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
      </div>

      <label>
        <span>Your kind words</span>
        <textarea
          name="quote"
          minLength={20}
          maxLength={1200}
          rows={6}
          placeholder="What did you love about the site or Bee's materials?"
          required
        />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>
          If approved, Bee may publish my words and the display name above on
          this website. My email will stay private.
        </span>
      </label>

      <label className={styles.honeypot} aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      {error ? <p className={styles.formError}>{error}</p> : null}
      {success ? (
        <p className={styles.formSuccess}>
          Thank you. Your note is waiting for Bee&apos;s review — nothing is
          posted automatically.
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? "Sending for review…" : "Send for review"}
        {!loading ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}

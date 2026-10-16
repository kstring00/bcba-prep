"use client";

import { useState } from "react";
import {
  WAITLIST_BLURB,
  WAITLIST_CONFIRM_BODY,
  WAITLIST_CONFIRM_HEADING,
  WAITLIST_EYEBROW,
  WAITLIST_HEADLINE,
} from "@/lib/funnel/config";
import { readAttribution } from "@/lib/funnel/utm";
import styles from "./start.module.css";

/**
 * THE FOUNDING MEMBER WAITLIST.
 *
 * Someone taps this from a bio link on a phone. Nothing is on sale yet, so
 * there is no purchase to ask for and — deliberately — no freebie to dangle
 * either. What is actually on offer is a place in the queue, and that is
 * worth something specific: founding-member pricing, and hearing first.
 *
 * The success state says what they joined rather than just "thanks", because
 * a waitlist someone cannot picture is indistinguishable from an email grab.
 * It does not promise a date, because nobody has set one.
 */
type Phase = "idle" | "sending" | "done";

export function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const value = String(data.get("email") ?? "").trim();

    if (!value) {
      setError("Enter your email to join the founding list.");
      return;
    }

    setPhase("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          company: String(data.get("company") ?? ""),
          // Attribution captured on arrival, so the lead row records which
          // post sent them.
          ...readAttribution(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Something went wrong.");
      }

      setPhase("done");
    } catch (caught) {
      setPhase("idle");
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    }
  }

  if (phase === "done") {
    return (
      <div className={styles.capture} role="status">
        <p className={styles.captureEyebrow}>
          <span aria-hidden="true">✓</span> You&rsquo;re in
        </p>
        <h2>{WAITLIST_CONFIRM_HEADING}</h2>
        <p className={styles.captureBody}>{WAITLIST_CONFIRM_BODY}</p>
        {/*
         * No download button and no "check your inbox for your file" — there
         * is no file. The confirmation email is a receipt, not a delivery,
         * and saying otherwise would send someone hunting for an attachment.
         */}
      </div>
    );
  }

  return (
    <div className={styles.capture}>
      <p className={styles.captureEyebrow}>{WAITLIST_EYEBROW}</p>
      <h2>{WAITLIST_HEADLINE}</h2>
      <p className={styles.captureBody}>{WAITLIST_BLURB}</p>

      <form onSubmit={submit} className={styles.captureForm}>
        <label className={styles.srOnly} htmlFor="lead-email">
          Your email address
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={320}
        />

        {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
        <label className={styles.honeypot} aria-hidden="true">
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>

        <button
          type="submit"
          className={styles.captureSubmit}
          disabled={phase === "sending"}
        >
          {phase === "sending" ? "Joining…" : "Join the founding list"}
        </button>
      </form>

      {error ? <p className={styles.captureError}>{error}</p> : null}

      <p className={styles.captureFine}>
        One email when the doors open. No spam, and you can unsubscribe any
        time.
      </p>
    </div>
  );
}

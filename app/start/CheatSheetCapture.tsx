"use client";

import { useState } from "react";
import {
  CHEAT_SHEET_BLURB,
  CHEAT_SHEET_FILE,
  CHEAT_SHEET_NAME,
  cheatSheetReady,
} from "@/lib/funnel/config";
import { readAttribution } from "@/lib/funnel/utm";
import styles from "./start.module.css";

/**
 * THE PHONE → COMPUTER HANDOFF.
 *
 * Someone taps this from a bio link on a phone they cannot realistically
 * study on. Handing them a download right there means a file lost in an iOS
 * Files folder they will never open again.
 *
 * So the email IS the handoff: the sheet goes to the inbox they will have
 * open on their laptop tonight. That is also why the confirmation says where
 * it went rather than just "thanks" — the mechanism has to be legible, or it
 * reads like an email grab.
 *
 * When the file already exists the page offers the direct download too, for
 * the minority on a desktop who want it immediately.
 */
type Phase = "idle" | "sending" | "done";

export function CheatSheetCapture() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(false);
  const ready = cheatSheetReady();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const value = String(data.get("email") ?? "").trim();

    if (!value) {
      setError("Enter your email and I'll send it over.");
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
        delivered?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Something went wrong.");
      }

      setDelivered(Boolean(payload.delivered));
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
          <span aria-hidden="true">✓</span> Check your email
        </p>
        <h2>
          {delivered
            ? "It's in your inbox."
            : "You're on the list."}
        </h2>
        <p className={styles.captureBody}>
          {delivered ? (
            <>
              Open that email on your laptop when you sit down to study —
              that&rsquo;s why I sent it there instead of straight to your
              phone.
            </>
          ) : (
            <>
              I&rsquo;m finishing the {CHEAT_SHEET_NAME} now. It lands in your
              inbox the moment it&rsquo;s ready.
            </>
          )}
        </p>

        {delivered && CHEAT_SHEET_FILE ? (
          <a className={styles.captureSubmit} href={CHEAT_SHEET_FILE} download>
            Download it now
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.capture}>
      <p className={styles.captureEyebrow}>Free</p>
      <h2>{CHEAT_SHEET_NAME}</h2>
      <p className={styles.captureBody}>{CHEAT_SHEET_BLURB}</p>

      {!ready ? (
        /* Honest about the gap, and still worth signing up for. */
        <p className={styles.captureNote}>
          Almost ready — add your email and I&rsquo;ll send it the day it&rsquo;s done.
        </p>
      ) : null}

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
          {phase === "sending"
            ? "Sending…"
            : ready
              ? "Email it to me"
              : "Send it when it's ready"}
        </button>
      </form>

      {error ? <p className={styles.captureError}>{error}</p> : null}

      <p className={styles.captureFine}>
        One email with the sheet. No spam, and you can unsubscribe any time.
      </p>
    </div>
  );
}

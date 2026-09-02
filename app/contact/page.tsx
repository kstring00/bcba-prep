"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { submitContactMessage } from "@/lib/supabase/contact-client";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = new FormData(event.currentTarget);

    try {
      await submitContactMessage({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        subject: String(form.get("subject") ?? ""),
        message: String(form.get("message") ?? ""),
      });

      event.currentTarget.reset();
      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not send your message. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.shell}>
        <Link href="/" className={styles.back}>
          <span aria-hidden="true">←</span> Back to the library
        </Link>

        <div className={styles.layout}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Questions are welcome</p>
            <h1>
              Get in touch with
              <span> Bryana.</span>
            </h1>
            <p className={styles.lede}>
              Have a question about a domain, what is included, your purchase, or
              the study materials? Send a note here and it will be saved directly
              to the BCBA Prep contact inbox for Bryana to review.
            </p>

            <div className={styles.noteCard}>
              <p className={styles.script}>A real person is reading this</p>
              <h2>What can you ask about?</h2>
              <ul>
                <li>What comes with a specific domain</li>
                <li>Questions before purchasing</li>
                <li>Access or account questions</li>
                <li>Feedback about the study materials</li>
              </ul>
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHead}>
              <p className={styles.script}>Send Bryana a note</p>
              <h2>How can I help?</h2>
              <p>Share a little context so she can give you a useful answer.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <label>
                  <span>Your name</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={120}
                    placeholder="First and last name"
                    required
                  />
                </label>

                <label>
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={320}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <label>
                <span>What is this about?</span>
                <select name="subject" defaultValue="" required>
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  <option value="Question about a domain">Question about a domain</option>
                  <option value="Before I purchase">Before I purchase</option>
                  <option value="Purchase or access help">Purchase or access help</option>
                  <option value="Study material feedback">Study material feedback</option>
                  <option value="Something else">Something else</option>
                </select>
              </label>

              <label>
                <span>Your message</span>
                <textarea
                  name="message"
                  rows={7}
                  minLength={10}
                  maxLength={5000}
                  placeholder="Tell Bryana what you need help with..."
                  required
                />
              </label>

              {error && <p className={styles.error}>{error}</p>}
              {success && (
                <p className={styles.success}>
                  Your message is in. Bryana can review it from the BCBA Prep inbox.
                </p>
              )}

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? "Sending…" : "Send my message"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className={styles.privacy}>
              Your contact details are used only to respond to your message and
              support your BCBA Prep experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

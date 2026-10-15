"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../sign-in/sign-in.module.css";

/**
 * Completes the "Forgot password?" flow.
 *
 * Supabase sends the recovery token in the URL *fragment* (`#access_token=…`),
 * never the query string. A fragment is not sent to the server, which is what
 * keeps the token out of request logs — and it is also why this page has to be
 * a client component that reads `window.location.hash` after mount.
 *
 * The hash is cleared from the address bar as soon as it is read, so the token
 * does not linger in browser history or get copied into a shared link.
 */
type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);

    const token = params.get("access_token");
    const type = params.get("type");
    const described = params.get("error_description");

    // Take the token out of the address bar immediately.
    if (hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (described) {
      setLinkError(described.replace(/\+/g, " "));
      setPhase("invalid");
      return;
    }

    if (!token || type !== "recovery") {
      setPhase("invalid");
      return;
    }

    setAccessToken(token);
    setPhase("ready");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Please use at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }

    if (!accessToken) {
      setPhase("invalid");
      return;
    }

    setLoading(true);
    try {
      // The token goes to our own route, which performs the update server-side
      // and clears any session cookie, so the person signs in fresh.
      const response = await fetch("/api/auth/reset-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "We could not update your password.");
      }
      setPhase("done");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <Link href="/sign-in" className={styles.back}>
          <span aria-hidden="true">←</span> Back to sign in
        </Link>

        <div className={styles.layout}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Account access</p>
            <h1>
              Choose a new
              <span> password.</span>
            </h1>
            <p className={styles.lede}>
              You reached this page from the reset link in your email. Pick a
              new password and you will be able to sign in with it right away.
            </p>
          </div>

          <div className={styles.card}>
            {phase === "checking" ? (
              <p>Checking your reset link…</p>
            ) : null}

            {phase === "invalid" ? (
              <>
                <div className={styles.cardHead}>
                  <h2>This link cannot be used</h2>
                  <p>
                    {linkError ??
                      "Reset links expire after a short time, and each one only works once."}
                  </p>
                </div>
                <p className={styles.privacy}>
                  Go back to sign in, enter your email, and choose{" "}
                  <strong>Forgot password?</strong> to get a fresh link.
                </p>
                <Link href="/sign-in" className={styles.submit}>
                  Back to sign in <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}

            {phase === "done" ? (
              <>
                <div className={styles.cardHead}>
                  <p className={styles.script}>All set</p>
                  <h2>Your password is updated</h2>
                  <p>You can now sign in with your new password.</p>
                </div>
                <button
                  type="button"
                  className={styles.submit}
                  onClick={() => router.push("/sign-in")}
                >
                  Go to sign in <span aria-hidden="true">→</span>
                </button>
              </>
            ) : null}

            {phase === "ready" ? (
              <>
                <div className={styles.cardHead}>
                  <p className={styles.script}>Almost done</p>
                  <h2>Set a new password</h2>
                  <p>Use at least 8 characters.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <label>
                    <span>New password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                  </label>

                  <label>
                    <span>Confirm new password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      minLength={8}
                      required
                    />
                  </label>

                  {error ? <p className={styles.error}>{error}</p> : null}

                  <button
                    type="submit"
                    className={styles.submit}
                    disabled={loading}
                  >
                    {loading ? "Saving…" : "Save new password"}
                    {!loading ? <span aria-hidden="true">→</span> : null}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

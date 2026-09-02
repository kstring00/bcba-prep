"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredSession,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabase/auth-client";
import styles from "./sign-in.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredSession()) router.replace("/member");
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === "sign-in") {
        await signInWithPassword(email, password);
        router.push("/member");
        router.refresh();
        return;
      }

      const result = await signUpWithPassword(email, password);
      if (result.session) {
        router.push("/member");
        router.refresh();
      } else {
        setMessage(
          "Your account has been created. Check your email to confirm it, then come back here to sign in.",
        );
        setMode("sign-in");
        setPassword("");
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first, then choose Forgot password.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setMessage("Password reset email sent. Check your inbox for the next step.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not send the reset email. Please try again.",
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
            <p className={styles.eyebrow}>Your study library</p>
            <h1>
              Welcome back to
              <span> BCBA Prep by Bryana.</span>
            </h1>
            <p className={styles.lede}>
              Sign in to return to the domains and study materials connected to
              your account. New here? Create your account now so your library has
              a home as BCBA Prep grows.
            </p>

            <div className={styles.promise}>
              <span className={styles.promiseMark}>B</span>
              <div>
                <strong>One account. One library.</strong>
                <p>
                  Domains are the product. Everything created for a domain will
                  eventually live together behind your member access.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.tabs} role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-in"}
                className={mode === "sign-in" ? styles.activeTab : ""}
                onClick={() => {
                  setMode("sign-in");
                  setError(null);
                  setMessage(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                className={mode === "create" ? styles.activeTab : ""}
                onClick={() => {
                  setMode("create");
                  setError(null);
                  setMessage(null);
                }}
              >
                Create account
              </button>
            </div>

            <div className={styles.cardHead}>
              <p className={styles.script}>
                {mode === "sign-in" ? "Good to see you" : "Begin your library"}
              </p>
              <h2>{mode === "sign-in" ? "Member sign in" : "Create your account"}</h2>
              <p>
                {mode === "sign-in"
                  ? "Use the email and password connected to your BCBA Prep account."
                  : "Create the account that will hold your purchased domains and materials."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "create" ? "At least 8 characters" : "Your password"}
                  minLength={8}
                  required
                />
              </label>

              {mode === "sign-in" && (
                <button
                  type="button"
                  className={styles.forgot}
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              )}

              {error && <p className={styles.error}>{error}</p>}
              {message && <p className={styles.success}>{message}</p>}

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading
                  ? "Please wait…"
                  : mode === "sign-in"
                    ? "Enter my library"
                    : "Create my account"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className={styles.privacy}>
              Your account is used to manage BCBA Prep access. Payment details are
              handled separately by Stripe.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

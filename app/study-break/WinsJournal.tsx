"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WIN_MAX_LENGTH, winPromptForToday } from "@/lib/study-break/config";
import {
  clearPendingWin,
  readPendingWin,
  savePendingWin,
} from "@/lib/study-break/prefs";
import styles from "./study-break.module.css";

/**
 * The small-wins journal.
 *
 * Signed out, the input WORKS — someone can think, type, and press save, and
 * only then is an account asked for. Their text is kept in localStorage, so
 * signing up does not lose the thing they just wrote. Putting the sign-up
 * wall in front of the textarea instead would ask for an account before the
 * page had been useful.
 *
 * Private by design. Nothing here is ever shown to anyone else; the RLS
 * policies in 0002_study_break.sql make that structural.
 */
type Win = { id: string; text: string; created_at: string };

type Props = { signedIn: boolean; compact?: boolean };

/** Consecutive days with at least one win, counting back from today. */
function streakFrom(wins: Win[]): number {
  if (wins.length === 0) return 0;

  const days = new Set(
    wins.map((w) => new Date(w.created_at).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();
  // Allow the streak to start yesterday, so it does not read 0 all morning
  // before today's session.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function WinsJournal({ signedIn, compact = false }: Props) {
  const [text, setText] = useState("");
  const [wins, setWins] = useState<Win[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [saved, setSaved] = useState(false);
  const prompt = winPromptForToday();

  // Restore anything typed before signing up, then flush it.
  useEffect(() => {
    const pending = readPendingWin();
    if (!pending) return;
    if (signedIn) {
      setText(pending);
      setNeedsAccount(false);
    } else {
      setText(pending);
    }
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    let canceled = false;
    fetch("/api/wins")
      .then((r) => r.json())
      .then((data: { wins?: Win[] }) => {
        if (!canceled) setWins(data.wins ?? []);
      })
      .catch(() => {
        /* An unreachable journal should not break the break page. */
      });
    return () => {
      canceled = true;
    };
  }, [signedIn]);

  async function save() {
    const value = text.trim();
    if (!value) {
      setError("Write a line first, then save it.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const payload = (await response.json()) as {
        error?: string;
        requiresSignIn?: boolean;
        win?: Win;
      };

      if (payload.requiresSignIn) {
        // Hold the text so signing up does not throw away their thinking.
        savePendingWin(value);
        setNeedsAccount(true);
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Could not save.");

      if (payload.win) setWins((prev) => [payload.win as Win, ...prev]);
      setText("");
      setSaved(true);
      clearPendingWin();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const streak = streakFrom(wins);
  const left = WIN_MAX_LENGTH - text.length;

  return (
    <div className={styles.winsBlock}>
      <p className={styles.winPrompt}>{prompt}</p>

      <label className={styles.winField}>
        <span className={styles.srOnly}>{prompt}</span>
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value.slice(0, WIN_MAX_LENGTH));
            setSaved(false);
          }}
          rows={compact ? 2 : 3}
          maxLength={WIN_MAX_LENGTH}
          placeholder="Even a small one counts."
        />
      </label>

      <div className={styles.winFoot}>
        <span className={styles.winCount} aria-live="polite">
          {left} left
        </span>
        <button
          type="button"
          className={styles.primaryControl}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save this win"}
        </button>
      </div>

      {error ? <p className={styles.winError}>{error}</p> : null}
      {saved ? (
        <p className={styles.winSaved} aria-live="polite">
          Saved. 🐝
        </p>
      ) : null}

      {needsAccount ? (
        <div className={styles.winSignup} role="status">
          <strong>Create a free account to keep your wins.</strong>
          <p>
            Your note is saved on this device and will be stored to your
            account as soon as you sign up.
          </p>
          <Link href="/sign-in?next=/study-break" className={styles.primaryControl}>
            Create a free account <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}

      {signedIn && streak > 0 ? (
        <p className={styles.streak}>
          <span aria-hidden="true">🐝</span> {streak}{" "}
          {streak === 1 ? "day" : "days"} of wins
        </p>
      ) : null}

      {signedIn && wins.length > 0 && !compact ? (
        <ul className={styles.winList}>
          {wins.slice(0, 6).map((win) => (
            <li key={win.id} className={styles.winPaper}>
              <p>{win.text}</p>
              <time dateTime={win.created_at}>
                {new Date(win.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SPOTIFY_PLAYLIST_URL } from "@/lib/study-break/config";
import styles from "./study-break.module.css";

/**
 * Study music.
 *
 * The Spotify iframe is NOT rendered until someone asks for it. That embed
 * pulls in a substantial amount of third-party script and would show up in
 * the mobile performance budget on every page view, for a feature most
 * visitors never touch. Until then this is a styled facade — no network cost
 * at all.
 *
 * The playlist URL lives in one constant in lib/study-break/config.ts.
 */
function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("spotify.com")) return null;
    // /playlist/{id} → /embed/playlist/{id}
    const match = parsed.pathname.match(/\/(playlist|album|track)\/([A-Za-z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

export function LofiPlayer() {
  const [playing, setPlaying] = useState(false);
  const embed = SPOTIFY_PLAYLIST_URL ? toEmbedUrl(SPOTIFY_PLAYLIST_URL) : null;

  if (!embed) {
    return (
      <div className={styles.vinylCard}>
        <div className={styles.vinyl} aria-hidden="true">
          <span className={styles.vinylLabel} />
        </div>
        <div className={styles.vinylCopy}>
          <h4>Study music</h4>
          <p>
            Bee is putting her study playlist together. It will play right here
            once it is ready.
          </p>
        </div>
      </div>
    );
  }

  if (!playing) {
    return (
      <div className={styles.vinylCard}>
        <div className={styles.vinyl} aria-hidden="true">
          <span className={styles.vinylLabel} />
        </div>
        <div className={styles.vinylCopy}>
          <h4>Study music</h4>
          <p>Soft instrumental sound to study to.</p>
          <button
            type="button"
            className={styles.primaryControl}
            onClick={() => setPlaying(true)}
          >
            Play study music
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playerFrame}>
      <iframe
        src={embed}
        title="BCBA Prep study playlist"
        width="100%"
        height="152"
        frameBorder="0"
        // `encrypted-media` is what Spotify needs to play; nothing else is granted.
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

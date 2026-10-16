"use client";

import { useEffect, useRef, useState } from "react";
import { clampPrefs, PREF_LIMITS, type TimerPrefs } from "@/lib/study-break/config";
import { Gear } from "./TimerIcons";
import styles from "./study-break.module.css";

/**
 * Timer settings, in a small popover so the page stays uncluttered.
 *
 * Sound is off until someone turns it on, and the browser notification
 * permission is requested at that moment — never on page load. A page about
 * calm should not greet anyone with a permission dialog.
 */
type Props = {
  prefs: TimerPrefs;
  onChange: (prefs: TimerPrefs) => void;
};

export function TimerSettings({ prefs, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [notifyDenied, setNotifyDenied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function setNumber(key: keyof typeof PREF_LIMITS, raw: string) {
    onChange(clampPrefs({ ...prefs, [key]: Number(raw) }));
  }

  async function toggleSound(next: boolean) {
    if (!next) {
      onChange({ ...prefs, soundEnabled: false });
      return;
    }

    // Ask only now, and only once.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        const result = await Notification.requestPermission();
        if (result === "denied") setNotifyDenied(true);
      } catch {
        // Permission API unavailable; the chime still works without it.
      }
    } else if (
      typeof Notification !== "undefined" &&
      Notification.permission === "denied"
    ) {
      setNotifyDenied(true);
    }

    onChange({ ...prefs, soundEnabled: true });
  }

  const fields: Array<{ key: keyof typeof PREF_LIMITS; label: string }> = [
    { key: "focusMinutes", label: "Focus" },
    { key: "breakMinutes", label: "Break" },
    { key: "longBreakMinutes", label: "Long break" },
    { key: "roundsBeforeLongBreak", label: "Rounds first" },
  ];

  return (
    <div className={styles.settingsWrap} ref={panelRef}>
      {/* A gear, not a labelled button: at 375px the word cost a line of
          vertical space the one-screen layout cannot spare. */}
      <button
        type="button"
        className={styles.settingsToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Timer settings"
        title="Timer settings"
      >
        <Gear />
      </button>

      {open ? (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsGrid}>
            {fields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={PREF_LIMITS[field.key][0]}
                  max={PREF_LIMITS[field.key][1]}
                  value={prefs[field.key]}
                  onChange={(event) => setNumber(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <label className={styles.settingsCheck}>
            <input
              type="checkbox"
              checked={prefs.soundEnabled}
              onChange={(event) => toggleSound(event.target.checked)}
            />
            <span>Soft chime and notification when a phase ends</span>
          </label>

          {notifyDenied ? (
            <p className={styles.settingsNote}>
              Notifications are blocked in your browser settings. The chime
              will still play.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

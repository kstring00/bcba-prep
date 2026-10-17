import type { Metadata } from "next";
import Link from "next/link";
import { HexCluster, HexField } from "@/components/HexMotif";
import { CRISIS_LINE, SAFETY_NOTE } from "@/lib/toolkit/config";
import { getFeelingCounts } from "@/lib/toolkit/counts";
import { FeelingsCheckIn } from "./FeelingsCheckIn";
import { SafetyBar } from "./SafetyBar";
import styles from "./toolkit.module.css";

export const metadata: Metadata = {
  title: "Mental Health Toolkit | BCBA Prep by Bee the Behavior Bae",
  description:
    "A small, free toolkit for people studying for the BCBA exam: a feelings check-in with two-minute resets, the Study Break timer, breathing, stretches, and where to find real support. Not therapy.",
};

export const dynamic = "force-dynamic";

/*
 * /toolkit — the hub.
 *
 * Modelled on a card-grid resource hub: one calm page that routes to small
 * tools. The Study Break timer is one of them now, not the whole page.
 *
 * The rules (lib/toolkit/config.ts): "not therapy" and 988 on every screen,
 * no free-text input, nothing reads what anyone types, no login, no names.
 */
const TOOLS = [
  {
    href: "/study-break",
    name: "Study Break timer",
    body: "Focus rounds and real breaks, with the light that changes as you go. Sized to be the only thing on the screen.",
    tag: "Focus",
  },
  {
    href: "/study-break?tool=breathe",
    name: "One minute of breathing",
    body: "An orb that breathes with you. Slower out than in, which is the part that settles a nervous system.",
    tag: "Reset",
  },
  {
    href: "/study-break?tool=stretch",
    name: "Desk stretches",
    body: "Neck, shoulders, wrists, back. For the hours of session notes and the hours of flashcards after them.",
    tag: "Body",
  },
  {
    href: "/study-break?tool=listen",
    name: "Something to listen to",
    body: "Low-key sound for studying, so the room is not silent and the phone is not the answer.",
    tag: "Sound",
  },
  {
    href: "/study-break?tool=write",
    name: "Small wins",
    body: "Write down one thing that went right. Members can keep theirs; everyone can write one.",
    tag: "Keep",
  },
  {
    href: "#support",
    name: "Talk to a person",
    body: "The lines that answer at 3 a.m., and the words for asking your supervisor for help.",
    tag: "Support",
  },
] as const;

const SUPPORT = [
  {
    label: "988 Suicide & Crisis Lifeline",
    detail: "Call or text 988. Free, confidential, 24/7, in the US.",
    href: "https://988lifeline.org",
  },
  {
    label: "Crisis Text Line",
    detail: "Text HOME to 741741 to reach a trained counselor by text.",
    href: "https://www.crisistextline.org",
  },
  {
    label: "SAMHSA National Helpline",
    detail: "1-800-662-4357 for referrals to local mental health and substance-use support.",
    href: "https://www.samhsa.gov/find-help/national-helpline",
  },
  {
    label: "Your program or employer",
    detail: "Many graduate programs have counseling services, and many ABA employers have an Employee Assistance Program. Both are usually free and confidential.",
  },
];

export default async function ToolkitPage() {
  const counts = await getFeelingCounts();

  return (
    <>
      <SafetyBar />

      {/* ---------- hero ---------- */}
      <section className={`sec ${styles.hero}`} data-reveal>
        <div className={styles.heroHex} aria-hidden="true">
          <HexField size={36} opacity={0.14} />
        </div>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <p className="eyebrow">Mental Health Toolkit</p>
            <h1 className="display-xl">
              Study hard. Be kind to the <em className={styles.em}>person</em> doing it.
            </h1>
          </div>
          <div className={styles.heroAside}>
            <HexCluster className={styles.heroCluster} size={22} honey={1} />
            <p className="lede">
              Small, free tools for the long middle of exam prep: a check-in
              that meets you where you are, two-minute resets, and the words
              for asking for help. Nothing here reads what you type, because
              you never type anything.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- how are you feeling ---------- */}
      <section className={`sec--tight ${styles.feelings}`} aria-labelledby="feelings-title">
        <div className="container">
          <div className={styles.feelingsHead} data-reveal>
            <h2 className="display-lg" id="feelings-title">
              How are you feeling?
            </h2>
            <p className={styles.feelingsSub}>
              Tap the closest one. A short care plan opens: a few honest
              sentences, a two-minute reset, what to say to your supervisor,
              and where to go for more.
            </p>
          </div>
          <FeelingsCheckIn counts={counts} />
        </div>
      </section>

      {/* ---------- the tools ---------- */}
      <section className={`sec ${styles.tools}`} aria-labelledby="tools-title">
        <div className="container">
          <div className={styles.toolsHead} data-reveal>
            <p className="eyebrow">The tools</p>
            <h2 className="display-lg" id="tools-title">
              Pick one. Two minutes is enough.
            </h2>
          </div>
          <ul className={`card-grid card-grid--3 ${styles.toolGrid}`} data-reveal-group>
            {TOOLS.map((tool) => (
              <li key={tool.name} data-reveal>
                <Link href={tool.href} className={`card ${styles.tool}`}>
                  <span className={styles.toolTag}>{tool.tag}</span>
                  <h3>{tool.name}</h3>
                  <p>{tool.body}</p>
                  <span className={styles.toolGo} aria-hidden="true">
                    Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- support: night band ---------- */}
      <section className={`sec sec--band ${styles.support}`} id="support" aria-labelledby="support-title">
        <HexField className="hex-field" size={40} opacity={0.06} />
        <div className={`container ${styles.supportGrid}`}>
          <div data-reveal>
            <p className="eyebrow">Talk to a person</p>
            <h2 className="display-lg" id="support-title">
              Real support, any hour.
            </h2>
            <p className="lede">
              <strong>{SAFETY_NOTE}</strong> {CRISIS_LINE}
            </p>
          </div>
          <ul className={styles.supportList} data-reveal>
            {SUPPORT.map((s) => (
              <li key={s.label}>
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ) : (
                  <strong>{s.label}</strong>
                )}
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

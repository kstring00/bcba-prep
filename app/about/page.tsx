"use client";

import Link from "next/link";
import { Florals, Ornament } from "@/components/Florals";
import {
  ArrowRight,
  BookIcon,
  Brain,
  Chart,
  Envelope,
  Pencil,
  Trophy,
} from "@/components/Icons";
import compact from "./about-compact.module.css";

/*
  Section headings and the five philosophy steps are transcribed/adapted from
  the reference direction the owner supplied.

  This page deliberately carries NO checkable claim about the business or about
  Bee personally. An earlier version reserved space for four statistics ("years
  in ABA", "students helped", and so on), a personal story, a portrait and a
  studio photograph, each held by a placeholder token. Those tokens rendered
  literally to visitors, so the blocks were removed rather than filled in:
  inventing a number or a personal history is not a design decision.

  To restore them, Bee supplies the real figures and copy first. Until then the
  page stands on what is actually true — how the materials are organised and
  how she teaches.
*/

const STEPS = [
  {
    icon: <BookIcon size={22} />,
    name: "Know",
    body: "Focus on high-yield content aligned with the test.",
  },
  {
    icon: <Brain />,
    name: "Understand",
    body: "Learn with visuals, examples, and real-world context.",
  },
  {
    icon: <Pencil />,
    name: "Practice",
    body: "Apply what you learn with targeted practice questions.",
  },
  {
    icon: <Chart />,
    name: "Refine",
    body: "Strengthen weak areas and build exam stamina.",
  },
  {
    icon: <Trophy />,
    name: "Succeed",
    body: "Walk into exam day prepared, calm, and confident.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ---------- compact hero ---------- */}
      <section className={`about-hero bleed ${compact.hero}`}>
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className={`bleed-inner about-hero-grid ${compact.heroGrid}`}>
          <div className={compact.heroCopy}>
            <p className="script">Hi, I&rsquo;m Bee</p>
            <h1 className="display">BCBA Prep Materials, Built With Intention</h1>
            <Ornament />
            <p className={`about-lede ${compact.lede}`}>
              I created BCBA Prep by Bee the Behavior Bae to help future BCBAs{" "}
              <span className="accent">
                study smarter, feel prepared, and walk into exam day with confidence.
              </span>{" "}
              Each domain brings together the materials I created for that part
              of the exam, so your studying stays focused in one place.
            </p>
          </div>

        </div>
      </section>

      {/* ---------- story + philosophy ---------- */}
      <section className={`split ${compact.split}`}>
        <div className={`philosophy bleed ${compact.philosophy}`}>
          <Florals variant="band-right" className="floral floral--band-right" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <p className="script">My Teaching Philosophy</p>
            <h2 className="display">You Don&rsquo;t Need More Hours. You Need a Better System.</h2>

            <ol className={`steps ${compact.steps}`}>
              {STEPS.map((s, i) => (
                <li className="step" key={s.name}>
                  <span className="step-icon">{s.icon}</span>
                  <div className="step-n">{i + 1}</div>
                  <p className="step-name">{s.name}</p>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- premium resources ---------- */}
      <section className={`resources bleed ${compact.resources}`}>
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className={`bleed-inner ${compact.resourcesInner}`}>
          <div className={compact.resourcesHeading}>
            <div className="section-head">
              <Ornament />
              <h2 className="display">
                Premium Resources. <span className="accent">Built the Hard Way.</span>
              </h2>
              <Ornament />
            </div>
          </div>

          <div className={compact.resourcesCopy}>
            <p className="section-sub">
              These materials were not assembled overnight. They are the fruit of
              long hours spent studying, organizing, writing, revising, and
              designing until the information felt clear, useful, and worth
              studying from.
            </p>
            <p className="section-sub">
              There are no separate mock-exam, study-guide, or coaching products
              to chase around the site. Choose the domain you need, and your
              purchase gives you access to the materials Bee created for that
              domain&mdash;kept together as one focused body of work.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={`closing bleed ${compact.closing}`}>
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className="closing-inner">
          <div
            className="cta"
            style={{
              gridColumn: "1 / -1",
              width: "min(720px, 100%)",
              justifySelf: "center",
            }}
          >
            <span className="cta-icon" aria-hidden="true">
              <Envelope />
            </span>
            <div>
              <h2 className="display">Ready to Choose Your Next Domain?</h2>
              <p>
                Start with the part of the exam you&rsquo;re ready to work on next.
              </p>
              <Link href="/" className="btn btn--solid">
                Explore the domains <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

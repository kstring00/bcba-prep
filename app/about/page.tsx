"use client";

import Link from "next/link";
import { useState } from "react";
import { Florals, Ornament } from "@/components/Florals";
import {
  ArrowRight,
  BookIcon,
  Brain,
  Chart,
  Envelope,
  Pencil,
  People,
  Sparkle,
  Target,
  Trophy,
} from "@/components/Icons";

/*
  Section headings and the five philosophy steps are transcribed/adapted from
  the reference direction the owner supplied.

  Everything that is a CHECKABLE CLAIM about the business or a person is a
  [[TODO_]] token instead — the four stat figures, the personal story, and
  the testimonials. Those are Bryana's to write; inventing a number or
  putting words in a named reviewer's mouth is not a design decision.
*/

const STATS = [
  { icon: <Sparkle />, value: "[[TODO_STAT_YEARS]]", label: "Years in ABA" },
  {
    icon: <People />,
    value: "[[TODO_STAT_STUDENTS]]",
    label: "Students Helped",
  },
  {
    icon: <BookIcon />,
    value: "[[TODO_STAT_RESOURCES]]",
    label: "Study Resources",
  },
  {
    icon: <Target />,
    value: "[[TODO_STAT_FRAMEWORK]]",
    label: "Pass-Focused Framework",
  },
];

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

const TESTIMONIALS = [
  "[[TODO_TESTIMONIAL_1]]",
  "[[TODO_TESTIMONIAL_2]]",
  "[[TODO_TESTIMONIAL_3]]",
];

const ATTRIBUTIONS = [
  "[[TODO_TESTIMONIAL_1_NAME]]",
  "[[TODO_TESTIMONIAL_2_NAME]]",
  "[[TODO_TESTIMONIAL_3_NAME]]",
];

export default function AboutPage() {
  const [quote, setQuote] = useState(0);

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="about-hero bleed">
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className="bleed-inner about-hero-grid">
          <div>
            <p className="script">Hi, I&rsquo;m Bryana</p>
            <h1 className="display">
              BCBA Prep Materials,
              <br />
              Built With Intention
            </h1>
            <Ornament />
            <p className="about-lede">
              I created BCBA Prep by Bryana to help future BCBAs{" "}
              <span className="accent">
                study smarter, feel prepared, and walk into exam day with confidence.
              </span>{" "}
              Each domain brings together the materials I created for that part
              of the exam, so your studying stays focused in one place.
            </p>
          </div>

          <div className="portrait">
            <div className="portrait-inner">[[TODO_PORTRAIT_BRYANA]]</div>
          </div>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <section className="stats" aria-label="At a glance">
        <div className="stats-inner">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              {s.icon}
              <div>
                <div
                  className={`stat-num${s.value.startsWith("[[") ? " stat-num--todo" : ""}`}
                >
                  {s.value}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- the work behind the materials ---------- */}
      <section className="resources bleed">
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className="bleed-inner">
          <div className="section-head">
            <p className="script">The work behind the materials</p>
            <Ornament />
            <h2 className="display">
              Premium Resources. <span className="accent">Built the Hard Way.</span>
            </h2>
            <Ornament />
          </div>
          <p className="section-sub">
            These materials were not assembled overnight. They are the fruit of
            long hours spent studying, organizing, writing, revising, and
            designing until the information felt clear, useful, and worth
            studying from.
          </p>
          <p className="section-sub">
            There are no separate mock-exam, study-guide, or coaching products
            to chase around the site. Choose the domain you need, and your
            purchase gives you access to the materials Bryana created for that
            domain&mdash;kept together as one focused body of work.
          </p>
        </div>
      </section>

      {/* ---------- story + philosophy ---------- */}
      <section className="split">
        <div className="story">
          <div>
            <p className="script script--gold">My Story</p>
            <h2 className="display">
              Why I Built
              <br />
              BCBA Prep by Bryana
            </h2>
            <p>[[TODO_STORY_PARAGRAPH_1]]</p>
            <p>[[TODO_STORY_PARAGRAPH_2]]</p>
            <p className="signature" aria-hidden="true">
              Bryana
            </p>
          </div>
          <div className="story-art">
            <div className="story-art-inner">[[TODO_IMAGE_STUDIO]]</div>
          </div>
        </div>

        <div className="philosophy bleed">
          <Florals variant="band-right" className="floral floral--band-right" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <p className="script">My Teaching Philosophy</p>
            <h2 className="display">
              You Don&rsquo;t Need More Hours.
              <br />
              You Need a Better System.
            </h2>

            <ol className="steps">
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

      {/* ---------- testimonial + CTA ---------- */}
      <section className="closing bleed">
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className="closing-inner">
          <figure className="quote">
            <span className="quote-mark" aria-hidden="true">
              &ldquo;
            </span>
            <div>
              <p>{TESTIMONIALS[quote]}</p>
              <cite>&mdash; {ATTRIBUTIONS[quote]}</cite>
              <div className="dots" role="tablist" aria-label="Testimonials">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    className="dot"
                    aria-current={i === quote}
                    aria-label={`Testimonial ${i + 1}`}
                    onClick={() => setQuote(i)}
                  />
                ))}
              </div>
            </div>
          </figure>

          <div className="closing-rule" aria-hidden="true" />

          <div className="cta">
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

/**
 * The nine BACB Test Content Outline domains.
 *
 * These titles, short labels, question counts and percentages were supplied
 * by the project owner as verified against the BACB source document. Do not
 * paraphrase, reorder, or regenerate them.
 *
 * Counts sum to 175 scored items; percentages are of that 175.
 */
export type Domain = {
  letter: string;
  slug: string;
  title: string; // full official name
  short: string; // display label on the spine
  questions: number;
  percent: number;
  cloth: string; // spine/cover color
  foil: string; // accent + text color
};

/** Foil on the seven dark cloths. */
const FOIL_LIGHT = "#C9A961";
/** Foil on the two light cloths (bone, stone) — dark ink, not gold. */
const FOIL_DARK = "#3A3428";

export const domains: Domain[] = [
  {
    letter: "A",
    slug: "foundations",
    title: "Behaviorism and Philosophical Foundations",
    short: "Foundations",
    questions: 8,
    percent: 5,
    cloth: "#DED5C4", // bone
    foil: FOIL_DARK,
  },
  {
    letter: "B",
    slug: "principles",
    title: "Concepts and Principles",
    short: "Principles",
    questions: 24,
    percent: 14,
    cloth: "#1E2C44", // navy
    foil: FOIL_LIGHT,
  },
  {
    letter: "C",
    slug: "measurement",
    title: "Measurement, Data Display, and Interpretation",
    short: "Measurement",
    questions: 21,
    percent: 12,
    cloth: "#2C3823", // forest
    foil: FOIL_LIGHT,
  },
  {
    letter: "D",
    slug: "experimental-design",
    title: "Experimental Design",
    short: "Experimental Design",
    questions: 13,
    percent: 7,
    cloth: "#16171A", // ink
    foil: FOIL_LIGHT,
  },
  {
    letter: "E",
    slug: "ethics",
    title: "Ethical and Professional Issues",
    short: "Ethics",
    questions: 22,
    percent: 13,
    cloth: "#5A2A1E", // oxblood
    foil: FOIL_LIGHT,
  },
  {
    letter: "F",
    slug: "assessment",
    title: "Behavior Assessment",
    short: "Assessment",
    questions: 23,
    percent: 13,
    cloth: "#B8B2A6", // stone
    foil: FOIL_DARK,
  },
  {
    letter: "G",
    slug: "behavior-change",
    title: "Behavior-Change Procedures",
    short: "Behavior Change",
    questions: 25,
    percent: 14,
    cloth: "#1B3A38", // teal
    foil: FOIL_LIGHT,
  },
  {
    letter: "H",
    slug: "interventions",
    title: "Selecting and Implementing Interventions",
    short: "Interventions",
    questions: 20,
    percent: 11,
    cloth: "#3B1F35", // plum
    foil: FOIL_LIGHT,
  },
  {
    letter: "I",
    slug: "supervision",
    title: "Personnel Supervision and Management",
    short: "Supervision",
    questions: 19,
    percent: 11,
    cloth: "#22242A", // charcoal
    foil: FOIL_LIGHT,
  },
];

/** Total scored items on the exam. */
export const SCORED_ITEMS = 175;

export function getDomain(slug: string): Domain | undefined {
  return domains.find((d) => d.slug === slug);
}

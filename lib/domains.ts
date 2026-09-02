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

/**
 * True for the two pale cloths. They need dark stamping and a darker lit
 * edge, so several places in the UI branch on this rather than re-deriving
 * it from the hex each time.
 */
export function isLightCloth(domain: Domain): boolean {
  return domain.foil === FOIL_DARK;
}

/**
 * The domain name is stamped a shade lighter than the rule and eyebrow, the
 * way foil catches more light than the blind-stamped lines around it.
 */
export function nameColor(domain: Domain): string {
  return isLightCloth(domain) ? "#2E2A21" : "#E7DEC9";
}

export const domains: Domain[] = [
  {
    letter: "A",
    slug: "foundations",
    title: "Behaviorism and Philosophical Foundations",
    short: "Foundations",
    questions: 8,
    percent: 5,
    cloth: "#DCD3BF", // bone
    foil: FOIL_DARK,
  },
  {
    letter: "B",
    slug: "principles",
    title: "Concepts and Principles",
    short: "Principles",
    questions: 24,
    percent: 14,
    cloth: "#1E3050", // navy
    foil: FOIL_LIGHT,
  },
  {
    letter: "C",
    slug: "measurement",
    title: "Measurement, Data Display, and Interpretation",
    short: "Measurement",
    questions: 21,
    percent: 12,
    cloth: "#3A4426", // olive
    foil: FOIL_LIGHT,
  },
  {
    letter: "D",
    slug: "experimental-design",
    title: "Experimental Design",
    short: "Experimental Design",
    questions: 13,
    percent: 7,
    cloth: "#141519", // ink
    foil: FOIL_LIGHT,
  },
  {
    letter: "E",
    slug: "ethics",
    title: "Ethical and Professional Issues",
    short: "Ethics",
    questions: 22,
    percent: 13,
    cloth: "#613321", // oxblood
    foil: FOIL_LIGHT,
  },
  {
    letter: "F",
    slug: "assessment",
    title: "Behavior Assessment",
    short: "Assessment",
    questions: 23,
    percent: 13,
    cloth: "#C3BDB1", // stone
    foil: FOIL_DARK,
  },
  {
    letter: "G",
    slug: "behavior-change",
    title: "Behavior-Change Procedures",
    short: "Behavior Change",
    questions: 25,
    percent: 14,
    cloth: "#1D3B36", // teal
    foil: FOIL_LIGHT,
  },
  {
    letter: "H",
    slug: "interventions",
    title: "Selecting and Implementing Interventions",
    short: "Interventions",
    questions: 20,
    percent: 11,
    cloth: "#43213C", // plum
    foil: FOIL_LIGHT,
  },
  {
    letter: "I",
    slug: "supervision",
    title: "Personnel Supervision and Management",
    short: "Supervision",
    questions: 19,
    percent: 11,
    cloth: "#292B31", // charcoal
    foil: FOIL_LIGHT,
  },
];

/** Total scored items on the exam. */
export const SCORED_ITEMS = 175;

export function getDomain(slug: string): Domain | undefined {
  return domains.find((d) => d.slug === slug);
}

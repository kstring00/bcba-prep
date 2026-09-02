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

/**
 * Foil on the seven dark cloths. A shade lighter than the site's --gold so
 * it clears WCAG AA against the mid-tone cloths in this palette; the plain
 * gold does not.
 */
const FOIL_LIGHT = "#D9BE83";
/** Foil on the two pale cloths — dark ink, not gold. */
const FOIL_DARK = "#4A4038";

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
  return isLightCloth(domain) ? "#2A241F" : "#F6F0E4";
}

export const domains: Domain[] = [
  {
    letter: "A",
    slug: "foundations",
    title: "Behaviorism and Philosophical Foundations",
    short: "Foundations",
    questions: 8,
    percent: 5,
    cloth: "#E9DFCB", // cream
    foil: FOIL_DARK,
  },
  {
    letter: "B",
    slug: "principles",
    title: "Concepts and Principles",
    short: "Principles",
    questions: 24,
    percent: 14,
    cloth: "#5C4767", // plum
    foil: FOIL_LIGHT,
  },
  {
    letter: "C",
    slug: "measurement",
    title: "Measurement, Data Display, and Interpretation",
    short: "Measurement",
    questions: 21,
    percent: 12,
    cloth: "#485140", // sage
    foil: FOIL_LIGHT,
  },
  {
    letter: "D",
    slug: "experimental-design",
    title: "Experimental Design",
    short: "Experimental Design",
    questions: 13,
    percent: 7,
    cloth: "#2B2429", // ink
    foil: FOIL_LIGHT,
  },
  {
    letter: "E",
    slug: "ethics",
    title: "Ethical and Professional Issues",
    short: "Ethics",
    questions: 22,
    percent: 13,
    cloth: "#5A4763", // mauve
    foil: FOIL_LIGHT,
  },
  {
    letter: "F",
    slug: "assessment",
    title: "Behavior Assessment",
    short: "Assessment",
    questions: 23,
    percent: 13,
    cloth: "#C7BDB6", // smoke
    foil: FOIL_DARK,
  },
  {
    letter: "G",
    slug: "behavior-change",
    title: "Behavior-Change Procedures",
    short: "Behavior Change",
    questions: 25,
    percent: 14,
    cloth: "#66444D", // rose
    foil: FOIL_LIGHT,
  },
  {
    letter: "H",
    slug: "interventions",
    title: "Selecting and Implementing Interventions",
    short: "Interventions",
    questions: 20,
    percent: 11,
    cloth: "#554E32", // olive
    foil: FOIL_LIGHT,
  },
  {
    letter: "I",
    slug: "supervision",
    title: "Personnel Supervision and Management",
    short: "Supervision",
    questions: 19,
    percent: 11,
    cloth: "#3B3340", // violet
    foil: FOIL_LIGHT,
  },
];

/** Total scored items on the exam. */
export const SCORED_ITEMS = 175;

export function getDomain(slug: string): Domain | undefined {
  return domains.find((d) => d.slug === slug);
}

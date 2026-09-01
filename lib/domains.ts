export type Domain = {
  slug: string; // url segment, e.g. "measurement"
  letter: string; // "A" through "I"
  title: string;
  color: string; // spine background
  textColor: string; // text on spine and cover
};

// Domain names and slugs come from the current BACB Test Content Outline.
// They are intentionally NOT guessed here — the project owner supplies them.
// Replace each [[TODO_...]] token below with the real value.
const SPINE_TEXT = "#F2EDE4";

export const domains: Domain[] = [
  {
    slug: "[[TODO_DOMAIN_1_SLUG]]",
    letter: "A",
    title: "[[TODO_DOMAIN_1_TITLE]]",
    color: "#23324A", // deep navy
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_2_SLUG]]",
    letter: "B",
    title: "[[TODO_DOMAIN_2_TITLE]]",
    color: "#2C4034", // forest
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_3_SLUG]]",
    letter: "C",
    title: "[[TODO_DOMAIN_3_TITLE]]",
    color: "#4A2326", // oxblood
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_4_SLUG]]",
    letter: "D",
    title: "[[TODO_DOMAIN_4_TITLE]]",
    color: "#3A4450", // slate
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_5_SLUG]]",
    letter: "E",
    title: "[[TODO_DOMAIN_5_TITLE]]",
    color: "#43492C", // olive
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_6_SLUG]]",
    letter: "F",
    title: "[[TODO_DOMAIN_6_TITLE]]",
    color: "#3E2E42", // plum
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_7_SLUG]]",
    letter: "G",
    title: "[[TODO_DOMAIN_7_TITLE]]",
    color: "#5A3520", // rust
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_8_SLUG]]",
    letter: "H",
    title: "[[TODO_DOMAIN_8_TITLE]]",
    color: "#23423F", // teal
    textColor: SPINE_TEXT,
  },
  {
    slug: "[[TODO_DOMAIN_9_SLUG]]",
    letter: "I",
    title: "[[TODO_DOMAIN_9_TITLE]]",
    color: "#35322E", // charcoal
    textColor: SPINE_TEXT,
  },
];

export function getDomain(slug: string): Domain | undefined {
  return domains.find((d) => d.slug === slug);
}

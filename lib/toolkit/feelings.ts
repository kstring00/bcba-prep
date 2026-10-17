import type { FeelingSlug } from "./config";

/**
 * The six care plans.
 *
 * Written for a person studying for the BCBA exam while working in ABA,
 * usually under supervision, usually tired. Each plan has the same four
 * parts so the page has one shape whatever someone tapped: a few honest
 * sentences, a reset that takes about two minutes, words for a supervisor,
 * and where to go for more.
 *
 * None of this is clinical advice and none of it diagnoses anything. The
 * safety note and the crisis line sit on every screen; see config.ts.
 */
export type Resource = { label: string; detail: string; href?: string };

export type CarePlan = {
  slug: FeelingSlug;
  /** The tap label, as a feeling someone would actually say. */
  label: string;
  /** A short line under the label on the tap. */
  hint: string;
  encouragement: string[];
  reset: { title: string; steps: string[] };
  supervisor: { intro: string; say: string };
  resources: Resource[];
};

const SHARED_RESOURCES: Resource[] = [
  {
    label: "988 Suicide & Crisis Lifeline",
    detail: "Call or text 988, any hour. For you, or for someone you are worried about.",
    href: "https://988lifeline.org",
  },
  {
    label: "Crisis Text Line",
    detail: "Text HOME to 741741 to reach a trained counselor by text.",
    href: "https://www.crisistextline.org",
  },
  {
    label: "SAMHSA National Helpline",
    detail: "1-800-662-4357. Free, confidential referrals for mental health and substance use, 24/7.",
    href: "https://www.samhsa.gov/find-help/national-helpline",
  },
];

export const CARE_PLANS: Record<FeelingSlug, CarePlan> = {
  "burnt-out": {
    slug: "burnt-out",
    label: "Burnt out",
    hint: "Running on empty",
    encouragement: [
      "Burnout is not a character flaw and it is not a sign you chose the wrong field. It is what happens when output stays high and recovery stays low for too long.",
      "You do not have to earn rest by finishing the task list first. Rest is part of how the list gets finished.",
    ],
    reset: {
      title: "Two minutes: put something down",
      steps: [
        "Close the laptop lid or turn the phone face down. Not forever. Two minutes.",
        "Stand up, roll your shoulders back five times, and let your jaw unclench.",
        "Name one thing you can take off today's plate, even if it is small. Say it out loud.",
        "Drink some water before you pick anything back up.",
      ],
    },
    supervisor: {
      intro: "Supervisors would rather hear this early than find out when something slips.",
      say: "“I want to flag that I’m running close to empty right now. Can we look at my caseload or my hours this week and find one thing to lighten, so I can keep showing up well for clients?”",
    },
    resources: SHARED_RESOURCES,
  },
  overwhelmed: {
    slug: "overwhelmed",
    label: "Overwhelmed",
    hint: "Too much, all at once",
    encouragement: [
      "When everything feels urgent, it is usually because everything is in your head at the same time, not because everything is actually due at the same time.",
      "You can only do one thing at once anyway. The goal of the next two minutes is to pick which one.",
    ],
    reset: {
      title: "Two minutes: empty your head onto paper",
      steps: [
        "Write every open loop you can think of, fast and messy. Nothing is too small.",
        "Circle the one thing that matters most in the next 24 hours.",
        "Draw a line under it. Everything else waits until that one is done.",
        "Take one slow breath out, longer than the breath in.",
      ],
    },
    supervisor: {
      intro: "Ask for order, not rescue. Most supervisors can prioritise for you faster than you can alone.",
      say: "“I have more on my plate than I can sequence well on my own right now. If you had to pick, what should come first this week, and what can wait?”",
    },
    resources: SHARED_RESOURCES,
  },
  tired: {
    slug: "tired",
    label: "Tired",
    hint: "Not enough sleep, not enough you",
    encouragement: [
      "Tired is information, not a verdict. A tired brain does not encode new material well, so pushing through a reading right now often costs more than it gives.",
      "If you have been up early for sessions and up late for flashcards, you are doing two jobs. It makes sense that you are tired.",
    ],
    reset: {
      title: "Two minutes: lower the lights",
      steps: [
        "Dim the screen, or step away from it entirely.",
        "Sit back. Let your eyes rest on something far away for thirty seconds.",
        "Decide now what time you are going to stop tonight. Pick an earlier time than you want to.",
        "If you still study, make it review, not new material.",
      ],
    },
    supervisor: {
      intro: "Fatigue affects session quality, and supervisors know it.",
      say: "“I’ve been running short on sleep and I want to be honest about it before it shows up in a session. Is there any flexibility in my schedule this week, even a later start one day?”",
    },
    resources: SHARED_RESOURCES,
  },
  "dreading-a-session": {
    slug: "dreading-a-session",
    label: "Dreading a session",
    hint: "A client, a parent, a room",
    encouragement: [
      "Dread before a hard session is common and it does not mean you are bad at this. It usually means you care how it goes and you are not sure it will go well.",
      "You do not have to feel ready. You have to walk in with a plan and a way to ask for help if it goes sideways.",
    ],
    reset: {
      title: "Two minutes: shrink the session to its first five minutes",
      steps: [
        "Write down what the first five minutes will look like. Just the opening.",
        "Name the one behavior or moment you are most worried about.",
        "Write one sentence for what you will do if it happens.",
        "Breathe out slowly. You only have to start.",
      ],
    },
    supervisor: {
      intro: "This is exactly what supervision is for. Asking is competence, not weakness.",
      say: "“I’m anxious about my session with [client] on [day]. Could we walk through the plan together, or could you observe part of it? I want to feel steadier going in.”",
    },
    resources: SHARED_RESOURCES,
  },
  "failed-my-exam": {
    slug: "failed-my-exam",
    label: "Failed my exam",
    hint: "The result you did not want",
    encouragement: [
      "A failed attempt is a data point about one day, not a measurement of your worth or your future as a behavior analyst. Many excellent BCBAs did not pass the first time.",
      "You are allowed to be upset about it. Grieve the result. Then, when you are ready and not before, the score report will tell you where to focus.",
    ],
    reset: {
      title: "Two minutes: separate today from the plan",
      steps: [
        "Tell one person who is safe to tell. You do not have to carry this alone.",
        "Decide that today is not a study day. Let it be a day.",
        "Write down the date you will look at the score report. Not today.",
        "Put the books out of sight until then.",
      ],
    },
    supervisor: {
      intro: "Your supervisor has almost certainly seen this before, and may have lived it.",
      say: "“I didn’t pass this attempt. I’m taking a few days before I plan the retake. When I’m ready, could we look at the score report together and talk about what to change?”",
    },
    resources: SHARED_RESOURCES,
  },
  "doing-okay": {
    slug: "doing-okay",
    label: "Doing okay",
    hint: "Steady, and keeping it that way",
    encouragement: [
      "Good. Notice it. Steady days are easy to skip past on the way to the next worry, and they are the days that teach you what is working.",
      "Okay is a fine place to study from. It is also a fine place to stop early and keep the okay.",
    ],
    reset: {
      title: "Two minutes: bank it",
      steps: [
        "Write down one thing that made today steadier than usual.",
        "Write down one thing you got right this week, however small.",
        "Decide one thing you will protect tomorrow: sleep, a walk, a stop time.",
        "That is it. You are allowed to just be okay.",
      ],
    },
    supervisor: {
      intro: "Steady is a good time to ask for what you want, not just what you need.",
      say: "“Things feel manageable right now. While they are, I’d love to talk about what I should be learning next, or a case I could take more of a lead on.”",
    },
    resources: SHARED_RESOURCES,
  },
};

export const FEELINGS_IN_ORDER = Object.values(CARE_PLANS);

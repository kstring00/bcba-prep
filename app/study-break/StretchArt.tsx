/**
 * Line-art illustrations for the desk stretches.
 *
 * Inline SVG, brand stroke colour, no raster assets and no stock photography —
 * consistent with the rest of the site, which uses no image files at all.
 *
 * Each figure is drawn seated, because every one of these is a stretch you do
 * without leaving your chair. The gentle motion is a slow transform on one
 * group per figure, so a reduced-motion user simply sees the still pose.
 */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Shared seated base: chair, torso, legs. */
function SeatedBase() {
  return (
    <g {...STROKE}>
      {/* chair */}
      <path d="M26 86 L26 62 L54 62 L54 86" />
      <path d="M54 62 L58 40" />
      {/* torso */}
      <path d="M40 62 L40 40" />
      {/* legs */}
      <path d="M40 62 L26 72" />
    </g>
  );
}

export function NeckTilt() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
      <SeatedBase />
      <g {...STROKE} className="stretch-move">
        {/* head, tilted toward the shoulder */}
        <circle cx="47" cy="28" r="8" />
        <path d="M40 40 L45 35" />
        {/* hand guiding the tilt */}
        <path d="M40 40 L52 22" />
      </g>
      <g {...STROKE} opacity="0.4">
        <path d="M33 22 Q38 18 43 20" />
      </g>
    </svg>
  );
}

export function ShoulderRolls() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
      <SeatedBase />
      <circle cx="40" cy="28" r="8" {...STROKE} />
      <g {...STROKE} className="stretch-move">
        {/* shoulders lifted and rolling back */}
        <path d="M30 42 Q40 36 50 42" />
        <path d="M30 42 L24 52" />
        <path d="M50 42 L56 52" />
      </g>
      {/* rotation hint */}
      <g {...STROKE} opacity="0.4">
        <path d="M56 38 A7 7 0 1 1 50 34" />
      </g>
    </svg>
  );
}

export function WristStretch() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
      <SeatedBase />
      <circle cx="40" cy="28" r="8" {...STROKE} />
      <g {...STROKE}>
        <path d="M40 44 L56 48" />
      </g>
      <g {...STROKE} className="stretch-move">
        {/* extended hand, fingers drawn back */}
        <path d="M56 48 L66 44" />
        <path d="M66 44 L64 38" />
        <path d="M66 44 L68 39" />
        {/* other hand applying the stretch */}
        <path d="M40 44 L60 40" />
      </g>
    </svg>
  );
}

export function SeatedTwist() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
      <SeatedBase />
      <g {...STROKE} className="stretch-move">
        <circle cx="46" cy="28" r="8" />
        {/* torso rotated, one arm across to the chair back */}
        <path d="M40 62 L44 40" />
        <path d="M44 44 L58 52" />
        <path d="M44 44 L30 50" />
      </g>
      <g {...STROKE} opacity="0.4">
        <path d="M24 34 Q30 30 36 33" />
      </g>
    </svg>
  );
}

export function ChestOpener() {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
      <SeatedBase />
      <circle cx="40" cy="26" r="8" {...STROKE} />
      <g {...STROKE} className="stretch-move">
        {/* chest lifted, both arms opened back */}
        <path d="M40 44 Q40 38 40 36" />
        <path d="M34 42 L20 36" />
        <path d="M46 42 L60 36" />
      </g>
      <g {...STROKE} opacity="0.4">
        <path d="M40 16 L40 10" />
      </g>
    </svg>
  );
}

export const STRETCHES = [
  {
    id: "neck-tilt",
    name: "Neck tilt",
    instruction:
      "Drop one ear toward your shoulder. Rest a hand on your head for a little weight. Swap sides halfway.",
    Art: NeckTilt,
  },
  {
    id: "shoulder-rolls",
    name: "Shoulder rolls",
    instruction:
      "Lift both shoulders toward your ears, roll them back, and let them drop. Slow and round.",
    Art: ShoulderRolls,
  },
  {
    id: "wrist-stretch",
    name: "Wrist stretch",
    instruction:
      "Straighten one arm, fingers up, and draw them gently back with the other hand. Then swap.",
    Art: WristStretch,
  },
  {
    id: "seated-twist",
    name: "Seated twist",
    instruction:
      "Sit tall. Turn your chest to one side and hold the chair back. Breathe, then turn the other way.",
    Art: SeatedTwist,
  },
  {
    id: "chest-opener",
    name: "Chest opener",
    instruction:
      "Reach both arms back and open your chest. Lift through the top of your head.",
    Art: ChestOpener,
  },
] as const;

/**
 * Blind-stamped line art, one per domain.
 *
 * Decorative only — these carry no subject matter, they are the abstract
 * device a binder would emboss on a spine. Drawn as inline stroke-only SVG
 * at low opacity so they read as pressed into the cloth rather than printed
 * on it. No image assets anywhere.
 */
import type { ReactElement } from "react";

const VB = "0 0 220 46";

const common = {
  viewBox: VB,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

/** Contour lines. */
function Foundations() {
  return (
    <svg {...common}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 8 + i * 6;
        return (
          <path
            key={i}
            d={`M4 ${y} C 46 ${y - 5}, 78 ${y + 6}, 112 ${y} S 178 ${y - 6}, 216 ${y + 1}`}
            opacity={0.9 - i * 0.09}
          />
        );
      })}
    </svg>
  );
}

/** Overlapping sets. */
function Principles() {
  return (
    <svg {...common}>
      <circle cx="82" cy="23" r="17" />
      <circle cx="110" cy="23" r="17" />
      <circle cx="138" cy="23" r="17" />
      <path d="M52 23h12M156 23h12" opacity="0.6" />
      <path d="M30 23h6M184 23h6" opacity="0.35" />
    </svg>
  );
}

/** Ruled grid with a rising trace. */
function Measurement() {
  const ticks = Array.from({ length: 26 }, (_, i) => 8 + i * 4);
  const pts = [
    [116, 34],
    [132, 30],
    [148, 31],
    [164, 24],
    [180, 20],
    [196, 13],
  ];
  return (
    <svg {...common}>
      {ticks.map((x, i) => (
        <path
          key={x}
          d={`M${x} ${38 - (i % 5 === 0 ? 22 : 12)}V38`}
          opacity={i % 5 === 0 ? 0.55 : 0.28}
        />
      ))}
      <path d={`M${pts.map((p) => p.join(" ")).join(" L")}`} opacity="0.9" />
      {pts.map(([x, y]) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="1.6"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </svg>
  );
}

/** A to B, then a branch. */
function ExperimentalDesign() {
  return (
    <svg {...common}>
      <text
        x="6"
        y="27"
        fontSize="11"
        fill="currentColor"
        stroke="none"
        fontFamily="var(--font-display)"
        letterSpacing="1"
      >
        A
      </text>
      <path d="M22 23h20" opacity="0.7" />
      <text
        x="48"
        y="27"
        fontSize="11"
        fill="currentColor"
        stroke="none"
        fontFamily="var(--font-display)"
        letterSpacing="1"
      >
        B
      </text>
      <path d="M64 23h22" opacity="0.7" />
      <path d="M90 23 118 9M90 23 118 37M90 23h6" opacity="0.8" />
      <circle cx="122" cy="9" r="3" />
      <circle cx="122" cy="37" r="3" />
      <path d="M132 23h34" opacity="0.45" />
      <circle cx="172" cy="23" r="2.2" fill="currentColor" stroke="none" />
      <path d="M182 23h30" opacity="0.3" />
    </svg>
  );
}

/** Balance. */
function Ethics() {
  return (
    <svg {...common}>
      <circle cx="110" cy="23" r="20" opacity="0.55" />
      <path d="M110 11v24M100 35h20" />
      <path d="M96 16h28" />
      <path d="M96 16 90 26M96 16 102 26" opacity="0.8" />
      <path d="M124 16 118 26M124 16 130 26" opacity="0.8" />
      <path d="M88 26a6 6 0 0 0 4 0" opacity="0.6" />
      <path d="M116 26a6 6 0 0 0 4 0" opacity="0.6" />
      <path d="M60 23h22M138 23h22" opacity="0.3" />
    </svg>
  );
}

/** Dot matrix with rule marks. */
function Assessment() {
  const cols = [3, 5, 2, 4, 6, 3, 5, 2, 4, 3];
  return (
    <svg {...common}>
      {cols.map((n, c) =>
        Array.from({ length: n }, (_, r) => (
          <circle
            key={`${c}-${r}`}
            cx={12 + c * 13}
            cy={36 - r * 6}
            r="1.5"
            fill="currentColor"
            stroke="none"
            opacity={0.75}
          />
        )),
      )}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${152 + i * 14} 8V38`} opacity={0.5 - i * 0.08} />
      ))}
    </svg>
  );
}

/** Waves. */
function BehaviorChange() {
  return (
    <svg {...common}>
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M4 ${20 + i * 5} C 44 ${6 + i * 5}, 74 ${34 + i * 4}, 112 ${20 + i * 5} S 180 ${6 + i * 5}, 216 ${18 + i * 5}`}
          opacity={0.8 - i * 0.14}
        />
      ))}
    </svg>
  );
}

/** Modules. */
function Interventions() {
  return (
    <svg {...common}>
      {[0, 1].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={70 + col * 17}
            y={9 + row * 16}
            width="12"
            height="12"
            opacity={0.75}
          />
        )),
      )}
      <path d="M40 23h20M162 23h20" opacity="0.3" />
    </svg>
  );
}

/** Radiating oversight. */
function Supervision() {
  return (
    <svg {...common}>
      {[10, 17, 24, 31].map((r, i) => (
        <path
          key={r}
          d={`M${110 - r} 40 A ${r} ${r} 0 0 1 ${110 + r} 40`}
          opacity={0.75 - i * 0.14}
        />
      ))}
      <circle cx="110" cy="40" r="2" fill="currentColor" stroke="none" />
      {[-2, -1, 0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={110 + i * 15}
          cy={12 - Math.abs(i) * 2}
          r="1.3"
          fill="currentColor"
          stroke="none"
          opacity={0.5}
        />
      ))}
    </svg>
  );
}

const BY_SLUG: Record<string, () => ReactElement> = {
  foundations: Foundations,
  principles: Principles,
  measurement: Measurement,
  "experimental-design": ExperimentalDesign,
  ethics: Ethics,
  assessment: Assessment,
  "behavior-change": BehaviorChange,
  interventions: Interventions,
  supervision: Supervision,
};

export function Motif({ slug }: { slug: string }) {
  const Component = BY_SLUG[slug];
  return Component ? <Component /> : null;
}

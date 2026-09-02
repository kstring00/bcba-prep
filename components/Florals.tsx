"use client";

import { useId } from "react";

/**
 * Watercolour florals, drawn as inline SVG.
 *
 * There are no image assets in this project, so these are built from layered
 * petal paths: a soft blurred underlay for the bleed, a translucent radial
 * fill for the wash, and a gold hairline for the pressed outline. Three
 * layers per petal is what separates this from a flat vector flower.
 *
 * NOTE ON GRADIENTS: the earlier dark-editorial direction banned them
 * outright. Watercolour is the opposite brief — a wash has no flat fill —
 * so they are used deliberately here, and only inside these florals.
 */

type Palette = {
  /** Wash colour at the base of the petal. */
  from: string;
  /** Wash colour at the tip. */
  to: string;
};

export const PETAL_PALETTES: Record<string, Palette> = {
  mauve: { from: "#C6ACCB", to: "#7E6389" },
  plum: { from: "#B294B8", to: "#5F4A69" },
  blush: { from: "#E6CCD6", to: "#BE93A9" },
  cream: { from: "#F3EADA", to: "#D9C7A9" },
  sage: { from: "#C8CDBE", to: "#8E9781" },
  smoke: { from: "#DAD3D0", to: "#A79C9C" },
};

const GOLD = "#C6A667";

/** A single petal, base at the origin, pointing up. */
const PETAL_PATH =
  "M0 0 C -34 -30 -46 -86 -14 -132 C -6 -142 6 -142 14 -132 C 46 -86 34 -30 0 0 Z";

type BloomProps = {
  x: number;
  y: number;
  size: number;
  rotate?: number;
  petals?: number;
  palette: Palette;
  opacity?: number;
  /** Squashes petals for a three-quarter view rather than a flat rosette. */
  flatten?: number;
};

function Bloom({
  x,
  y,
  size,
  rotate = 0,
  petals = 6,
  palette,
  opacity = 0.5,
  flatten = 1,
}: BloomProps) {
  const uid = useId().replace(/:/g, "");
  const wash = `wash-${uid}`;
  const soft = `soft-${uid}`;

  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 130})`}
      opacity={opacity}
    >
      <defs>
        <radialGradient id={wash} cx="50%" cy="96%" r="88%">
          <stop offset="0%" stopColor={palette.from} stopOpacity="0.66" />
          <stop offset="58%" stopColor={palette.from} stopOpacity="0.4" />
          <stop offset="100%" stopColor={palette.to} stopOpacity="0.6" />
        </radialGradient>
        <filter id={soft} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Bleed underlay: the pigment that ran past the pencil line. */}
      <g filter={`url(#${soft})`} opacity="0.26">
        {Array.from({ length: petals }, (_, i) => (
          <path
            key={i}
            d={PETAL_PATH}
            fill={palette.to}
            transform={`rotate(${(360 / petals) * i}) scale(${1.06 * flatten} 1.06)`}
          />
        ))}
      </g>

      {/* Wash + pressed outline. */}
      {Array.from({ length: petals }, (_, i) => {
        const a = (360 / petals) * i;
        const jitter = ((i * 37) % 11) / 100 + 0.94;
        return (
          <path
            key={i}
            d={PETAL_PATH}
            fill={`url(#${wash})`}
            stroke={GOLD}
            strokeWidth={1.2}
            strokeOpacity={0.72}
            transform={`rotate(${a}) scale(${jitter * flatten} ${jitter})`}
          />
        );
      })}

      {/* Stamens. */}
      <g stroke={GOLD} strokeWidth="1.3" strokeOpacity="0.8" fill={GOLD}>
        {Array.from({ length: 5 }, (_, i) => {
          const a = -46 + i * 23;
          const r = 40 + ((i * 13) % 17);
          const px = Math.sin((a * Math.PI) / 180) * r;
          const py = -Math.cos((a * Math.PI) / 180) * r;
          return (
            <g key={i}>
              <path
                d={`M0 0 Q ${px * 0.5} ${py * 0.75} ${px} ${py}`}
                fill="none"
              />
              <circle
                cx={px}
                cy={py}
                r="3.4"
                fillOpacity="0.85"
                stroke="none"
              />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** A long, curved leaf on a hairline stem. */
function Leaf({
  x,
  y,
  size,
  rotate = 0,
  palette,
  opacity = 0.6,
}: Omit<BloomProps, "petals" | "flatten">) {
  const uid = useId().replace(/:/g, "");
  const wash = `leaf-${uid}`;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 130})`}
      opacity={opacity}
    >
      <defs>
        <linearGradient id={wash} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={palette.from} stopOpacity="0.8" />
          <stop offset="100%" stopColor={palette.to} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M0 0 C -30 -46 -32 -112 0 -160 C 32 -112 30 -46 0 0 Z"
        fill={`url(#${wash})`}
        stroke={GOLD}
        strokeWidth="1.1"
        strokeOpacity="0.62"
      />
      <path
        d="M0 -6 L0 -150"
        stroke={GOLD}
        strokeWidth="1.2"
        strokeOpacity="0.45"
        fill="none"
      />
    </g>
  );
}

export type FloralVariant =
  | "hero-left"
  | "hero-right"
  | "corner-right"
  | "band-right"
  | "sprig";

/**
 * Positioned decoration. Always aria-hidden and pointer-events:none — these
 * sit behind content and must never intercept a tap.
 */
export function Florals({
  variant,
  className,
  style,
}: {
  variant: FloralVariant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const P = PETAL_PALETTES;

  const art: Record<FloralVariant, { box: string; children: React.ReactNode }> =
    {
      "hero-left": {
        box: "0 0 460 700",
        children: (
          <>
            <Leaf
              x={120}
              y={250}
              size={230}
              rotate={-38}
              palette={P.sage}
              opacity={0.5}
            />
            <Leaf
              x={40}
              y={470}
              size={200}
              rotate={22}
              palette={P.cream}
              opacity={0.45}
            />
            <Bloom
              x={110}
              y={170}
              size={250}
              rotate={-14}
              palette={P.cream}
              petals={6}
              opacity={0.8}
            />
            <Bloom
              x={38}
              y={352}
              size={215}
              rotate={26}
              palette={P.sage}
              petals={6}
              opacity={0.62}
            />
            <Bloom
              x={150}
              y={470}
              size={270}
              rotate={-6}
              palette={P.mauve}
              petals={7}
              opacity={0.72}
            />
            <Bloom
              x={30}
              y={610}
              size={190}
              rotate={40}
              palette={P.blush}
              petals={6}
              opacity={0.6}
            />
          </>
        ),
      },
      "hero-right": {
        box: "0 0 430 700",
        children: (
          <>
            <Leaf
              x={330}
              y={210}
              size={210}
              rotate={34}
              palette={P.sage}
              opacity={0.42}
            />
            <Bloom
              x={330}
              y={150}
              size={245}
              rotate={16}
              palette={P.blush}
              petals={6}
              opacity={0.72}
            />
            <Bloom
              x={215}
              y={300}
              size={205}
              rotate={-22}
              palette={P.mauve}
              petals={6}
              opacity={0.6}
            />
            <Bloom
              x={360}
              y={430}
              size={280}
              rotate={8}
              palette={P.plum}
              petals={7}
              opacity={0.7}
            />
            <Bloom
              x={240}
              y={600}
              size={215}
              rotate={-30}
              palette={P.smoke}
              petals={6}
              opacity={0.55}
            />
          </>
        ),
      },
      "corner-right": {
        box: "0 0 420 520",
        children: (
          <>
            <Bloom
              x={300}
              y={120}
              size={230}
              rotate={20}
              palette={P.smoke}
              petals={6}
              opacity={0.6}
            />
            <Bloom
              x={355}
              y={330}
              size={300}
              rotate={-10}
              palette={P.plum}
              petals={7}
              opacity={0.68}
            />
            <Bloom
              x={215}
              y={455}
              size={200}
              rotate={34}
              palette={P.mauve}
              petals={6}
              opacity={0.52}
            />
          </>
        ),
      },
      "band-right": {
        box: "0 0 480 460",
        children: (
          <>
            <Leaf
              x={300}
              y={190}
              size={200}
              rotate={-28}
              palette={P.sage}
              opacity={0.34}
            />
            <Bloom
              x={370}
              y={150}
              size={260}
              rotate={12}
              palette={P.smoke}
              petals={6}
              opacity={0.5}
            />
            <Bloom
              x={300}
              y={330}
              size={290}
              rotate={-16}
              palette={P.plum}
              petals={7}
              opacity={0.55}
            />
            <Bloom
              x={440}
              y={400}
              size={220}
              rotate={28}
              palette={P.mauve}
              petals={6}
              opacity={0.48}
            />
          </>
        ),
      },
      sprig: {
        box: "0 0 240 240",
        children: (
          <>
            <Leaf
              x={92}
              y={168}
              size={140}
              rotate={-24}
              palette={P.sage}
              opacity={0.5}
            />
            <Bloom
              x={128}
              y={122}
              size={150}
              rotate={14}
              palette={P.mauve}
              petals={6}
              opacity={0.66}
            />
          </>
        ),
      },
    };

  const { box, children } = art[variant];

  return (
    <svg
      className={className}
      style={style}
      viewBox={box}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** The small gold rule-and-diamond used under headings. */
export function Ornament({ wide = false }: { wide?: boolean }) {
  const w = wide ? 210 : 130;
  return (
    <svg
      className="ornament"
      width={w}
      height="14"
      viewBox={`0 0 ${w} 14`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={`M0 7H${w / 2 - 12}`}
        stroke={GOLD}
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d={`M${w / 2 + 12} 7H${w}`}
        stroke={GOLD}
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d={`M${w / 2} 1.5 L${w / 2 + 6} 7 L${w / 2} 12.5 L${w / 2 - 6} 7 Z`}
        stroke={GOLD}
        strokeWidth="1"
        fill={GOLD}
        fillOpacity="0.3"
      />
    </svg>
  );
}

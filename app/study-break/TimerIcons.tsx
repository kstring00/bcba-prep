/**
 * Timer control glyphs.
 *
 * Inline SVG at 1em so each one scales with its button's font-size, and
 * `currentColor` so they inherit state colours without a second rule. Every
 * icon is aria-hidden: the accessible name lives on the button.
 */
const BASE = {
  viewBox: "0 0 24 24",
  width: "1em",
  height: "1em",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Play() {
  // Filled, because it is the one primary control on the page.
  return (
    <svg {...BASE}>
      <path d="M9 6.5 18 12l-9 5.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Pause() {
  return (
    <svg {...BASE}>
      <path d="M9.5 6.5v11M14.5 6.5v11" {...STROKE} strokeWidth="2.2" />
    </svg>
  );
}

export function Reset() {
  return (
    <svg {...BASE}>
      <path d="M4.5 9.5A8 8 0 1 1 4 13.2" {...STROKE} />
      <path d="M4 5.5v4.2h4.2" {...STROKE} />
    </svg>
  );
}

export function Skip() {
  return (
    <svg {...BASE}>
      <path d="M7 6.5 14 12l-7 5.5Z" {...STROKE} />
      <path d="M17.5 6.5v11" {...STROKE} />
    </svg>
  );
}

export function Gear() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="3.1" {...STROKE} />
      <path
        d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18.01 5.99l-1.42 1.42M7.41 16.59l-1.42 1.42M18.01 18.01l-1.42-1.42M7.41 7.41 5.99 5.99"
        {...STROKE}
      />
    </svg>
  );
}

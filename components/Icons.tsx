/** Small line icons, drawn inline. No icon-font, no sprite sheet. */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

export function Sparkle({ size = 26 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2.5 13.9 9 20.5 12 13.9 15 12 21.5 10.1 15 3.5 12 10.1 9Z" />
    </svg>
  );
}

export function People({ size = 26 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2" />
      <path d="M16.2 5.4a3 3 0 0 1 0 5.6M17 13.9c2.4.5 4 2.4 4 5.1" />
    </svg>
  );
}

export function BookIcon({ size = 26 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 6.4C10.3 5 8.2 4.4 4 4.6v13.2c4.2-.2 6.3.4 8 1.8 1.7-1.4 3.8-2 8-1.8V4.6c-4.2-.2-6.3.4-8 1.8Z" />
      <path d="M12 6.4v13.2" />
    </svg>
  );
}

export function Target({ size = 26 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 1.6v3.2M12 19.2v3.2M1.6 12h3.2M19.2 12h3.2" />
    </svg>
  );
}

export function Bag({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M4.6 8h14.8l-1.1 11.4H5.7Z" />
      <path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8" />
    </svg>
  );
}

export function Tablet({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <rect x="5.5" y="3" width="13" height="18" rx="2" />
      <path d="M10.5 17.6h3" />
    </svg>
  );
}

export function Globe({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.4 3.6 8.6S14.4 18.2 12 20.6c-2.4-2.4-3.6-5.4-3.6-8.6S9.6 5.8 12 3.4Z" />
    </svg>
  );
}

export function Brain({ size = 22 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 5.4a2.6 2.6 0 0 0-5 .9 2.6 2.6 0 0 0-1.4 4.5A2.7 2.7 0 0 0 7 15.4a2.6 2.6 0 0 0 5 .8Z" />
      <path d="M12 5.4a2.6 2.6 0 0 1 5 .9 2.6 2.6 0 0 1 1.4 4.5A2.7 2.7 0 0 1 17 15.4a2.6 2.6 0 0 1-5 .8Z" />
      <path d="M12 5.4v13.2" />
    </svg>
  );
}

export function Pencil({ size = 22 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M15.6 3.9 20.1 8.4 8.2 20.3 3 21l.7-5.2Z" />
      <path d="M13.6 5.9 18.1 10.4" />
    </svg>
  );
}

export function Chart({ size = 22 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M4 20V9.5M10 20V4.5M16 20v-7M22 20H2" />
    </svg>
  );
}

export function Trophy({ size = 22 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M7.5 3.4h9v5.2a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 5h-3v1.6a3 3 0 0 0 3 3M16.5 5h3v1.6a3 3 0 0 1-3 3" />
      <path d="M12 13.1v3.6M8.8 20.6h6.4l-.8-3.9H9.6Z" />
    </svg>
  );
}

export function Envelope({ size = 24 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2" />
      <path d="m3.6 6.6 8.4 6.4 8.4-6.4" />
    </svg>
  );
}

export function ArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M3.5 12h17M14 5.5 20.5 12 14 18.5" />
    </svg>
  );
}

export function Menu({ size = 20 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </svg>
  );
}

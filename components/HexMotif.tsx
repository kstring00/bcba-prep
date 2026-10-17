/**
 * The honeycomb — the site's signature motif.
 *
 * Regular flat-top hexagons, hairline gold. It is the bee without drawing a
 * bee, and it is structural rather than cute: a honeycomb is a grid, which is
 * what a study system is.
 *
 * Four pieces, in decreasing size: a frame for a photo, a tessellated field
 * for a background, a cluster for a section corner, and a single cell for a
 * divider. All inline SVG — no image assets, nothing to load, nothing to
 * shift the layout.
 *
 * Not puzzle pieces, ever. See DESIGN_DIRECTION.md.
 */
import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";

/** A flat-top regular hexagon centred on (cx, cy) with circumradius r. */
export function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** The same shape as a CSS clip-path polygon, pointy-top, for portraits. */
export const HEX_CLIP =
  "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)";

type FieldProps = {
  className?: string;
  /** Cell circumradius in px. Bigger reads as texture; smaller as pattern. */
  size?: number;
  /** 0–1. Keep it low: this is a field behind content, not a wallpaper. */
  opacity?: number;
  style?: CSSProperties;
};

/**
 * A tessellated field. Absolutely positioned by the caller; this fills it.
 * Uses an SVG pattern so a full-bleed band costs one tile, not one path per
 * cell.
 */
export function HexField({ className, size = 28, opacity = 0.05, style }: FieldProps) {
  const id = useId().replace(/:/g, "");
  // Flat-top hex tiling: tile width = 3r, tile height = sqrt(3) r, second
  // hex offset by half a tile each way.
  const w = size * 3;
  const h = size * Math.sqrt(3);
  return (
    <svg
      className={className}
      style={{ opacity, ...style }}
      aria-hidden="true"
      focusable="false"
      width="100%"
      height="100%"
    >
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          <polygon points={hexPoints(size, h / 2, size - 0.5)} fill="none" stroke="currentColor" strokeWidth="1" />
          <polygon points={hexPoints(size * 2.5, 0, size - 0.5)} fill="none" stroke="currentColor" strokeWidth="1" />
          <polygon points={hexPoints(size * 2.5, h, size - 0.5)} fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

type ClusterProps = {
  className?: string;
  /** Which cell carries honey. -1 for none. */
  honey?: number;
  size?: number;
};

/**
 * Three to five cells in a loose group, one filled with honey. The
 * "signature in the margin" for a section corner. `data-honey` lets CSS
 * animate the fill in as the section reveals.
 */
export function HexCluster({ className, honey = 1, size = 22 }: ClusterProps) {
  const id = useId().replace(/:/g, "");
  const r = size;
  const h = r * Math.sqrt(3);
  // Positions in a tight honeycomb arrangement.
  const cells = [
    [r, h / 2],
    [r * 2.5, 0],
    [r * 2.5, h],
    [r * 4, h / 2],
    [r * 4, h / 2 + h],
  ] as const;
  const W = r * 5.2;
  const H = h * 2.2;
  return (
    <svg
      className={className}
      viewBox={`-1 -1 ${W + 2} ${H + 2}`}
      width={W}
      height={H}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-honey`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3c57a" />
          <stop offset="1" stopColor="#c6a667" />
        </linearGradient>
      </defs>
      {cells.map(([cx, cy], i) => (
        <polygon
          key={i}
          points={hexPoints(cx, cy + h / 2, r - 1)}
          fill={i === honey ? `url(#${id}-honey)` : "none"}
          stroke="currentColor"
          strokeWidth="1"
          data-honey={i === honey ? "" : undefined}
          opacity={i === honey ? 1 : 0.75 - i * 0.08}
        />
      ))}
    </svg>
  );
}

/** A single cell, for a divider between two short pieces of text. */
export function HexDot({ size = 8, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <polygon points={hexPoints(10, 10, 8)} fill="currentColor" />
    </svg>
  );
}

type FrameProps = {
  children: ReactNode;
  className?: string;
  /** Pixel offset of the hairline hex behind the photo. */
  offset?: number;
};

/**
 * Clips its child to a pointy-top hexagon and draws a gold hairline hex
 * offset behind it. The child is expected to be an image that fills its box.
 */
export function HexFrame({ children, className, offset = 14 }: FrameProps) {
  return (
    <div className={`hex-frame${className ? ` ${className}` : ""}`} style={{ "--hex-offset": `${offset}px` } as CSSProperties}>
      <span className="hex-frame-line" aria-hidden="true" />
      <div className="hex-frame-clip">{children}</div>
    </div>
  );
}

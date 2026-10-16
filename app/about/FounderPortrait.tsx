"use client";

import { useEffect, useRef, useState } from "react";
import { BeeMark } from "@/components/BeeMark";

/**
 * Bryana's portrait, with a branded fallback.
 *
 * /public/bryana.jpg does not exist yet (see the TODO below). A missing image
 * normally renders as the browser's broken-image icon beside raw alt text,
 * which looks like a bug on the page that introduces the founder — the worst
 * possible place for it.
 *
 * So the `onError` path swaps in the honeycomb mark on a soft gradient. It is
 * deliberate and on-brand, and it disappears by itself the moment the real
 * file is added: no code change needed.
 */
export function FounderPortrait({
  className,
  rounded = false,
}: {
  className?: string;
  /** Circular crop, for the small homepage teaser. */
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  /*
   * `onError` alone is not enough.
   *
   * The <img> is server-rendered, so the browser starts fetching it during the
   * initial HTML parse — often finishing, and failing, BEFORE React hydrates
   * and attaches the error handler. The event fires into nothing and the
   * broken-image icon stays on screen. Caught exactly that way in testing.
   *
   * So on mount we also ask the element directly: a request that has finished
   * (`complete`) with no pixels (`naturalWidth === 0`) is a failure that
   * already happened.
   */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        className={`portrait-fallback${rounded ? " portrait-fallback--round" : ""}${className ? ` ${className}` : ""}`}
        role="img"
        aria-label="Portrait of Bryana, founder of Bee the Behavior Bae, coming soon"
      >
        <span className="portrait-fallback-mark" aria-hidden="true">
          <BeeMark size={rounded ? 34 : 64} />
        </span>
      </div>
    );
  }

  return (
    /*
      TODO — PHOTO NEEDED.
      Add Bryana's photo at /public/bryana.jpg (portrait crop, at least 900px
      on the short edge). Until it exists, the branded fallback above renders
      instead. Nothing else needs changing when the file lands.
    */
    <img
      ref={imgRef}
      src="/bryana.jpg"
      alt="Bryana, founder of Bee the Behavior Bae"
      width={720}
      height={900}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

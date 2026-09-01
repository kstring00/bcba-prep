"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
// Internal Next export. Pinned deliberately: there is no public API for
// freezing the App Router's segment context, and without it the exiting
// subtree re-renders with the *incoming* route's content, so the outgoing
// spines never animate out.
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import { useContext, useRef, type ReactNode } from "react";

/**
 * Holds the router context captured at mount, so the copy of the page that
 * AnimatePresence keeps around for its exit animation keeps rendering the
 * route it was rendered for.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * Shared-element route transition.
 *
 * TRADEOFF, deliberate deviation from the brief: this uses
 * `mode="popLayout"`, not `mode="wait"`.
 *
 * `mode="wait"` serialises the two pages — the outgoing tree finishes its
 * exit and unmounts *before* the incoming tree mounts. Motion's `layoutId`
 * handoff needs the two elements to be registered in the same LayoutGroup at
 * overlapping times: the incoming element reads the outgoing element's
 * measured box and animates from it. Under `mode="wait"` there is nothing
 * left to read from, so the spine would vanish and the cover would hard-cut
 * in — the exact failure the brief rules out.
 *
 * `popLayout` keeps both trees alive for one transition and pulls the
 * outgoing one out of flow (absolutely positioned at its measured size), so
 * the eight unselected spines fade and drop away *while* the ninth travels
 * and rotates. That is the described behaviour; `wait` cannot produce it.
 *
 * The alternative was the native View Transitions API, which does shared
 * elements across a document swap without any of this. It was not taken
 * because it has no support in the older WebViews a lot of TikTok in-app
 * traffic arrives on, and it gives much less control over the rotation
 * curve than animating rotateX directly.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={pathname} className="route">
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  );
}

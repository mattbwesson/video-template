import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";
import { orderPillars, type PillarId } from "./cuts/plan";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * A multi-pillar cut, as the wizard drives it.
 *
 * Same relationship `CustomizedZoetest` has to `Zoetest`: one serialisable customisation
 * object flows from the wizard's state into the `<Player>` and then into the render.
 *
 * `reference="wizard"` for the same load-bearing reason as the other three — the deployed
 * container ships only the 45 MB CRF 24 re-encode, not the 310 MB master, so a component
 * pointing at the master would work locally and 404 in production.
 *
 * Worth knowing about every cut in this family: the intro and outro are largely REFERENCE
 * footage rather than rebuilt scenes — the workvivo HQ title card, all three states of the
 * pillar wheel, the endcard and the strapline exist only in that encode. Those stretches
 * are therefore NOT customisable beyond the logo on the opening card: a prospect's brand
 * appears in the chapters' scenes and in the customer wall, and the framing at either end
 * stays Workvivo's own. That is a property of the cut, not a bug in the plumbing.
 */

/**
 * WHY THIS IS A FACTORY, and cached.
 *
 * The renderer and the `<Player>` are both handed a COMPONENT, not a component plus props
 * of our choosing — `inputProps` is the customisation object and nothing else. So the
 * pillar selection has to be closed over rather than passed, which means one component per
 * selection.
 *
 * They must also be stable across renders. Building a fresh `React.FC` on every call would
 * give React a different component type each time the wizard re-rendered, which unmounts
 * and remounts the whole scene tree — for the Player that is a stall and a reset to frame
 * 0 on every keystroke in the edit panel, and mid-render it would be worse. The cache is
 * what makes "the same pillars" mean "the same component".
 *
 * There are at most seven entries, and in practice four: a single pillar plays its own
 * approved cut and never reaches this file. See web/templates.ts.
 */
const cache = new Map<string, React.FC<Partial<VideoInputProps>>>();

/** The cache key, and the reason order does not matter to a caller. */
const keyOf = (pillars: readonly PillarId[]): string => orderPillars(pillars).join("+");

export const customizedCombined = (
  pillars: readonly PillarId[],
): React.FC<Partial<VideoInputProps>> => {
  const key = keyOf(pillars);
  const hit = cache.get(key);
  if (hit) return hit;

  const chosen = orderPillars(pillars);
  const Component: React.FC<Partial<VideoInputProps>> = (input) => (
    <CustomizationProvider input={input}>
      <CombinedCut pillars={chosen} reference="wizard" />
    </CustomizationProvider>
  );
  Component.displayName = `CustomizedCombined(${key})`;

  cache.set(key, Component);
  return Component;
};

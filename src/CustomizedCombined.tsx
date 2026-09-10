import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";
import { orderPillars, type PillarId } from "./cuts/plan";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * A cut of any pillars, as the wizard drives it.
 *
 * One serialisable customisation object flows from the wizard's state into the `<Player>`
 * and then into the render.
 *
 * There is no `reference` prop and no video to choose an encode for. Every frame of every
 * window is a scene now — including the workvivo HQ title card, all three states of the
 * pillar wheel, the endcard and the strapline, which used to exist only as footage and so
 * carried Virgin's branding into every customer's video. A prospect's brand now reaches
 * both ends of the film as well as its chapters. All the original edit still supplies is
 * the soundtrack; see src/cuts/parts.tsx.
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
 * There are at most seven entries — every non-empty subset of three pillars. Single pillars
 * come through here too, since the three forked single-pillar cuts were retired; see the
 * header of CombinedCut for why.
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
      <CombinedCut pillars={chosen} />
    </CustomizationProvider>
  );
  Component.displayName = `CustomizedCombined(${key})`;

  cache.set(key, Component);
  return Component;
};

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { DipThrough } from "./cuts/parts";
import {
  CommsBlock,
  IntroBlock,
  OutroBlock,
  PeopleBlock,
  SearchBlock,
  type BlockProps,
} from "./cuts/blocks";
import { planFor, type PillarId, type SlotKey } from "./cuts/plan";

/**
 * One video out of any combination of the film's three pillars.
 *
 * The film's own opening, then each chosen chapter in the order the film puts them in, then
 * the film's own ending — one intro and one outro, however many chapters are in between.
 *
 * EVERY cut comes through here, including a cut of one pillar. It did not used to: there
 * were three hand-forked single-pillar compositions, and this existed only for the
 * combinations they could not express. Those forks were copies of a timeline rather than of
 * a technique, so when the film rebuilt its last stretches of reference footage as scenes
 * they silently kept playing the footage — an opening title card and a closing strapline
 * with Virgin's branding on them, in every customer's video, uncustomisable. They are gone,
 * and this is the only assembly left. A single pillar is a plan with one chapter in it.
 *
 * WHAT IT IS AND IS NOT
 *
 * It is the film's own windows with the window list as an argument — see src/cuts/plan.ts
 * for the windows and for how the joins between them are decided. Every scene sits on the
 * global frame it sat on in L2VirginAirline, so a cut is the film with stretches removed,
 * not a new edit.
 *
 * It is NOT a new set of transitions. Each join reproduces whichever treatment the approved
 * cut for that boundary already used — a dissolve into a chapter that arrives on a cut, a
 * dip through brand leaving the Search chapter for the ending, the logo wall dissolving up
 * when People Intelligence runs straight into it, and nothing at all at the three joins
 * where two windows are consecutive frames of one film. The only join in the set that no
 * approved cut has an opinion about is a chapter running into `people` from something other
 * than the intro, and that takes the same 15-frame dissolve every other arrival at a pillar
 * card takes.
 *
 * PAINT ORDER is the one structural rule. Blocks are mounted in play order, because the
 * export paints in DOM order and ignores z-index: a chapter dissolving in has to fade up
 * over the previous block's scenes, and it can only do that from below in time and after in
 * the tree. The dip is mounted last of everything, for the same reason.
 */

/**
 * Every block that takes nothing but its slot.
 *
 * The outro is missing on purpose rather than by oversight: it needs `gridDissolve`, which
 * is a property of the join and not of the window, so it is mounted by hand below. Typing
 * this table as a partial record is what makes leaving it out a fact the compiler knows
 * instead of a hole someone has to remember.
 */
const BLOCKS: Partial<Record<SlotKey, React.FC<BlockProps>>> = {
  intro: IntroBlock,
  "zoe-test-comms": CommsBlock,
  "zoe-test-search": SearchBlock,
  "zoe-test-people": PeopleBlock,
};

export const CombinedCut: React.FC<{
  /** Which pillars to include, in any order. The film's own order is imposed by the plan. */
  pillars: readonly PillarId[];
}> = ({ pillars }) => {
  const { theme } = useCustomization();
  const plan = planFor(pillars);
  const outro = plan.slots[plan.slots.length - 1];

  return (
    // The brand custom properties are set once, here, and inherit down to every ported
    // Workvivo stylesheet. Those files cannot take props, and each still carries the
    // baseline green as its `var()` fallback so it renders correctly on its own.
    <AbsoluteFill style={{ backgroundColor: "#000", ...theme.vars }}>
      {plan.slots.map((slot) => {
        if (slot.key === "outro") {
          return (
            <OutroBlock key={slot.key} slot={slot} gridDissolve={plan.gridDissolve} />
          );
        }
        const Block = BLOCKS[slot.key];
        return Block ? <Block key={slot.key} slot={slot} /> : null;
      })}

      {/* LAST in the tree, and that is the whole mechanism: it has to paint over every
          block above it, and DOM order is what decides that in the export. Centred on the
          outro's first frame so it is fully opaque on the frame the shot changes hands.

          Only mounted for the one join that wants it — a cut ending on the Search chapter,
          where the outgoing shot is a phone on near-black and the incoming one is the
          bright logo wall. `outroDip` is 0 everywhere else and this renders nothing. */}
      {plan.outroDip > 0 && (
        <Sequence
          name="Dip to brand (chapter -> outro)"
          from={outro.localOffset - plan.outroDip}
          durationInFrames={plan.outroDip * 2}
        >
          <DipThrough colour={theme.brand} frames={plan.outroDip} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

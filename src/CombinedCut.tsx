import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import type { REFERENCE_VIDEO } from "./referenceVideo";
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
 * The wizard's first step is a multi-select now rather than a single pick, and this is what
 * it produces when more than one box is ticked: the film's own opening, then each chosen
 * chapter in the order the film puts them in, then the film's own ending — one intro and
 * one outro, however many chapters are in between.
 *
 * A cut of ONE pillar does not come through here. The wizard plays the approved
 * single-pillar composition for that case (`Zoe-test-comms`, `Zoe-test-search`,
 * `Zoe-test-people`), because those three are signed off frame by frame and there is no
 * reason to re-derive a film that already exists. See web/templates.ts, where that choice
 * is made. This composition exists for the combinations that had no cut before.
 *
 * WHAT IT IS AND IS NOT
 *
 * It is the same windows-of-the-original technique the Search and People cuts use, with the
 * window list as an argument instead of a constant — see src/cuts/plan.ts for the windows
 * and for how the joins between them are decided. Every scene sits on the global frame it
 * sat on in L2VirginAirline, so a combined cut is the film with stretches removed, not a
 * new edit.
 *
 * It is NOT a new set of transitions. Each join reproduces whichever treatment the approved
 * cut for that boundary already uses — a dissolve into a chapter that arrives on a cut, a
 * dip through brand leaving the Search chapter for the ending, the logo wall dissolving up
 * when People Intelligence runs straight into it, and nothing at all at the three joins
 * where two windows are consecutive frames of one film. The only join in the set that no
 * approved cut has an opinion about is a chapter running into `people` from something other
 * than the intro, and that takes the same 15-frame dissolve every other arrival at a pillar
 * card takes.
 *
 * PAINT ORDER is the one structural rule. Blocks are mounted in play order and each mounts
 * its reference before its scenes, because the export paints in DOM order and ignores
 * z-index: a chapter dissolving in has to fade up over the previous block's SCENES, not
 * just over its footage, and it can only do that from below in time and after in the tree.
 * The dip is mounted last of everything, for the same reason.
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
  /** Which encode to lay underneath. Defaults to the full one, as the Studio needs. */
  reference?: keyof typeof REFERENCE_VIDEO;
}> = ({ pillars, reference = "full" }) => {
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
            <OutroBlock
              key={slot.key}
              slot={slot}
              reference={reference}
              gridDissolve={plan.gridDissolve}
            />
          );
        }
        const Block = BLOCKS[slot.key];
        return Block ? (
          <Block key={slot.key} slot={slot} reference={reference} />
        ) : null;
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

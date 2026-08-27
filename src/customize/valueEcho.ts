/**
 * A renamed company value, carried to the other places the cut quotes it.
 *
 * The four values are typed once, in the Select Value picker at global 1003-1031, and
 * read three more times afterwards: the published post is tagged "Value: X", the picker's
 * own tick is decided by comparing the tag against each row, and a billboard story
 * carries the value it was posted under. All four sites hold the same PHRASE — there is
 * no id anywhere — so an operator who fixes "Care Deeply" to this company's real wording
 * used to fix it in one frame and leave the other two saying the old thing, with the tick
 * quietly gone from the picker because the string no longer matched anything in the list.
 *
 * Derived rather than written into the overrides at edit time, for the same reason
 * `shoutOut.ts` is: the operator can rename the same value five times, go back and rename
 * it again, and each pass recomputes from the copy the research pass produced. Nothing
 * accumulates and nothing can drift out of step with what they last typed.
 *
 * The rule is deliberately EXACT-MATCH and one-directional. A story tagged with something
 * that is merely value-ish ("Passionate & Innovative" against a list that says "Be
 * Passionate") is left alone, because guessing wrong here rewrites a line the operator
 * never asked us to touch.
 */

import { readCopyText, textSlotAt } from "./copyPaths";
import type { WorkvivoCopy } from "./videoCopy";

/** How many values the picker holds; also how many renames there can be. */
const VALUE_COUNT = 4;

/**
 * Every path that quotes one of the four values verbatim.
 *
 * `composed.value` is the tag on the published post, which is also what the picker's tick
 * is compared against. The billboard stories each carry the value they were posted under.
 * Generated and then filtered through the shape, so a list that changes length here does
 * not leave a dead path behind — `textSlotAt` answers null for anything the copy table no
 * longer has.
 */
const ECHO_PATHS: string[] = [
  "composed.value",
  ...Array.from({ length: 3 }, (_, i) => `signage.stories.${i}.value`),
].filter((path) => textSlotAt(path) !== null);

/**
 * What the echo paths should say, given the values before and after the operator's edits.
 *
 * `before` is the copy as the research pass left it — the state in which the tag and the
 * stories were written to match the list. `after` is what the operator has since typed
 * over it. A path is followed only when what it says is exactly one of the OLD values, so
 * the index it was pointing at is not in doubt.
 *
 * `pinned` are the paths the operator has edited by hand. They win: somebody who retypes
 * the post's tag has said what it should be, and having a rename overwrite it a keystroke
 * later would read as the panel fighting them.
 *
 * Returns only the paths that actually change, so the common run — nobody renamed a value
 * — returns an empty object and the caller can skip the merge entirely.
 */
export const followValueRenames = (
  before: WorkvivoCopy,
  after: WorkvivoCopy,
  pinned: ReadonlySet<string>,
): Record<string, string> => {
  const renames = new Map<string, string>();
  for (let i = 0; i < VALUE_COUNT; i++) {
    const was = readCopyText(before, `composed.values.${i}`).trim();
    const now = readCopyText(after, `composed.values.${i}`).trim();
    // A blank is somebody mid-retype, with the field emptied before the new wording goes
    // in. Following it would blank the tag on the way past and put "Value:" on the post
    // with nothing after it.
    if (!was || !now || was === now) continue;
    renames.set(was, now);
  }
  if (renames.size === 0) return {};

  const out: Record<string, string> = {};
  for (const path of ECHO_PATHS) {
    if (pinned.has(path)) continue;
    const next = renames.get(readCopyText(after, path).trim());
    if (next) out[path] = next;
  }
  return out;
};

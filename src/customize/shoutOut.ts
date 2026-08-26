/**
 * The main character cannot thank themselves.
 *
 * The film shows them typing the shout-out at global 950-1100, so `composed.recipient`
 * has to be somebody else. The model is told this twice — in the slot guides and in the
 * input — and still reaches for the one name it has been given, because that name is the
 * most company-specific thing in its context.
 *
 * This lives in `src/customize/` rather than beside the prompt because it has to run in
 * TWO places now:
 *
 *  - server-side, straight after the decode, when the caller supplied a person;
 *  - client-side in `toInputProps`, because the copywriting pass starts when the COMPANY
 *    is submitted and the operator has not typed the main character's name yet. At that
 *    point the model is writing the shout-out with no idea who the film is addressed to,
 *    so the collision can only be caught once both halves are known.
 *
 * Pure and idempotent: running it twice is the same as running it once, which is what
 * lets both call sites keep it without coordinating.
 */

import type { WorkvivoCopy } from "./videoCopy";
import { DEFAULT_COPY } from "./videoCopy";

const normalizeName = (v: string): string =>
  v.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();

/**
 * Loose on purpose. "Sean", "Sean Evans" and "sean evans " are all the same author, and a
 * model that half-remembers the instruction tends to return a shortened form rather than
 * a different person.
 */
export const isSamePerson = (a: string, b: string): boolean => {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // "Sean" against "Sean Evans": one is the whole of the other's leading words.
  const xs = x.split(" ");
  const ys = y.split(" ");
  const short = xs.length <= ys.length ? xs : ys;
  const long = xs.length <= ys.length ? ys : xs;
  return short.every((w, i) => w === long[i]);
};

export type ShoutOutRepair = {
  copy: WorkvivoCopy;
  /** The name that was swapped out, or null when nothing needed doing. */
  swappedFrom: string | null;
};

/**
 * Swap the recipient out if the shout-out thanks the person writing it.
 *
 * Falls back to the approved baseline name rather than to another invention: by the time
 * this runs the model has had its turn, and a second guess would be no better founded
 * than the first. Generic and correct beats specific and wrong.
 */
export const repairSelfShoutOut = (
  copy: WorkvivoCopy,
  author: string | undefined,
): ShoutOutRepair => {
  const who = author?.trim();
  if (!who) return { copy, swappedFrom: null };

  const { recipient, body } = copy.composed;
  if (!isSamePerson(recipient, who) && !body.includes(who)) {
    return { copy, swappedFrom: null };
  }

  const fallback = DEFAULT_COPY.composed.recipient;
  // Guard against the degenerate case where the operator's own name IS the baseline's:
  // swapping it for itself would leave the post still thanking its author.
  if (isSamePerson(fallback, who)) return { copy, swappedFrom: null };

  const fixedBody = body.split(recipient).join(fallback).split(who).join(fallback);

  return {
    copy: {
      ...copy,
      composed: { ...copy.composed, recipient: fallback, body: fixedBody },
    },
    swappedFrom: recipient,
  };
};

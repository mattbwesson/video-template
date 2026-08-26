/**
 * Reading and writing ONE line of copy by its dotted path.
 *
 * The copy table is a tree and every consumer so far has walked it whole — the model
 * writes the entire object, `merge` folds one whole object over another. The review
 * screen is the first thing that needs to touch a single leaf: the operator clicks a
 * space card and retypes its name, and nothing else about the cut may move.
 *
 * Paths use the same dotted form as `COPY.limits`, except that a list index is the real
 * index rather than `[]` — `feed.spaces.0.name`, not `feed.spaces[].name`. The `[]` form
 * is for talking ABOUT a slot (its cap, its field guide, which are shared across the
 * list); this form is for talking about one VALUE.
 */

import { COPY } from "./videoCopy";
import type { WorkvivoCopy } from "./videoCopy";
import type { AnySlot, ListSlot, SlotShape, TextSlot } from "./slots";

type Node = SlotShape | AnySlot | ListSlot;

const isSlotNode = (v: unknown): v is AnySlot | ListSlot =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as { kind?: unknown }).kind === "string";

/**
 * Walk the shape to the node a path names, or null if the path does not exist.
 *
 * Returns the SHAPE node, not a value: it is what knows the cap and whether the slot is
 * multi-line, which is what the panel needs to size and limit its input.
 */
const nodeAt = (path: string): Node | null => {
  let node: Node = COPY.shape;
  for (const seg of path.split(".")) {
    if (isSlotNode(node)) {
      // Only a list can be descended into by index; every other slot is a leaf.
      if (node.kind !== "list") return null;
      if (!/^\d+$/.test(seg)) return null;
      if (Number(seg) >= node.length) return null;
      node = node.of;
      continue;
    }
    const next: Node | undefined = (node as SlotShape)[seg];
    if (next === undefined) return null;
    node = next;
  }
  return node;
};

/** The text slot a path names, or null if the path is missing or not text. */
export const textSlotAt = (path: string): TextSlot | null => {
  const node = nodeAt(path);
  return isSlotNode(node) && node.kind === "text" ? node : null;
};

/** The current value at a path in a merged copy object. "" if the path is missing. */
export const readCopyText = (copy: WorkvivoCopy, path: string): string => {
  let cur: unknown = copy;
  for (const seg of path.split(".")) {
    if (cur === null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === "string" ? cur : "";
};

/**
 * `{ "feed.spaces.0.name": "Crew Room" }` -> `{ feed: { spaces: [ { name: … } ] } }`.
 *
 * Built as a patch for `COPY.merge`, which fills every branch this leaves out from the
 * layer beneath — so a sparse map of the two lines somebody retyped is enough, and the
 * other three hundred keep whatever the research pass wrote.
 *
 * A list becomes a sparse ARRAY rather than an object with numeric keys, because
 * `mergeInto` reaches for `patch[i]` on a list and an object would answer `undefined` for
 * every index. The shape decides which container to create; a path segment that looks
 * like a number is not enough on its own, since a slot could legitimately be named "0".
 */
export const expandCopyOverrides = (
  overrides: Record<string, string>,
): Record<string, unknown> => {
  const root: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(overrides)) {
    if (!textSlotAt(path)) continue; // stale key from an older build of the table
    const segs = path.split(".");
    let shape: Node = COPY.shape;
    let cur: Record<string, unknown> | unknown[] = root;

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const key: string | number = Array.isArray(cur) ? Number(seg) : seg;
      const childShape: Node = isSlotNode(shape)
        ? (shape as ListSlot).of
        : (shape as SlotShape)[seg];

      if (i === segs.length - 1) {
        (cur as Record<string, unknown>)[key] = value;
        break;
      }

      const wantsArray = isSlotNode(childShape) && childShape.kind === "list";
      const existing: unknown = (cur as Record<string, unknown>)[key];
      const next: Record<string, unknown> | unknown[] =
        existing && typeof existing === "object"
          ? (existing as Record<string, unknown> | unknown[])
          : wantsArray
            ? []
            : {};
      (cur as Record<string, unknown>)[key] = next;
      cur = next;
      shape = childShape;
    }
  }

  return root;
};

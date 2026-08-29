/**
 * The icon positions in the cut, and where their replacements come from.
 *
 * A sibling of `imagery.ts`, deliberately NOT folded into it, because the two answer
 * different questions and behave differently:
 *
 *  • An image position holds a PHOTOGRAPH the operator uploaded. There is a pool, and
 *    `assignImagery` deals it across every position so a short upload still dresses the
 *    whole cut. Filling one is the default; leaving it empty is the exception.
 *
 *  • An icon position holds a piece of WORKVIVO ARTWORK — a space badge, a value disc.
 *    There is no pool and no deal: the artwork already in the composition is correct
 *    Workvivo art, and an operator swaps one only when their company happens to have a
 *    space or a value the shipped icon does not suit. Empty is the default.
 *
 * So there is no `assignIcons`. An unset position renders the baseline art the scene was
 * built with, and `iconOverrides` stays sparse for the whole run.
 */

/**
 * Every operator-swappable icon position, in timeline order.
 *
 * Ordering carries no allocation meaning here (nothing is dealt), but it is what the
 * wizard would list them in, so it still reads front to back through the cut.
 */
export const ICON_SLOTS = [
  // --- global 417-534: the three Trending Spaces cards on the desktop homepage ------
  "space.badge.0",
  "space.badge.1",
  "space.badge.2",
  // Right-hand column of the same screen ("Run Club").
  "space.badge.3",
  // --- global 738+: the same card again inside the in-app screen -------------------
  "space.badge.4",

  // --- global ~1020-1031: the four rows of the Select Value overlay ----------------
  "value.disc.0",
  "value.disc.1",
  "value.disc.2",
  "value.disc.3",

  // --- the three Quick Links tiles ------------------------------------------------
  // ONE slot per position, not one per screen. The same three apps are drawn at global
  // ~498 on the desktop homepage, again on the mobile home screen, and again on the
  // mobile Spotlight tab — so an operator who swaps Workday for their own HR system
  // expects it swapped in all three, not to hunt down two more copies of the same tile.
  "app.quicklink.0",
  "app.quicklink.1",
  "app.quicklink.2",
] as const;

export type IconSlotKey = (typeof ICON_SLOTS)[number];

/**
 * The attribute an icon position carries in the rendered DOM.
 *
 * Distinct from `SLOT_ATTR` rather than reusing it with a prefix, so the swap overlay can
 * tell the two kinds apart with a selector instead of by parsing the key — the drawer
 * shows a completely different picker for each, and getting that wrong would offer an
 * operator their holiday photos as a value icon.
 */
export const ICON_SLOT_ATTR = "data-vc-icon";

/**
 * Where to CLICK for an icon position, when the glyph is not the thing to click.
 *
 * `SlotIcon` marks the glyph, which is right for a space badge: the badge is a picture
 * hanging off a card, and the card is the target. It is wrong for a value disc, whose
 * whole row — disc, name, "Organization Value" — is one thing an operator wants to fix,
 * and whose disc is 42 composition pixels inside a stage scaled down twice, i.e. a
 * fifteen-pixel circle in the preview that nobody thinks to aim at.
 *
 * An element carrying this attribute REPLACES the marked glyph with the same key rather
 * than adding to it, so a position still gets exactly one hit target. Separate from
 * `ICON_SLOT_ATTR` because the glyph must stay marked either way: that mark is what says
 * a swapped icon goes here, and losing it to a hand-placed one somewhere up the tree is
 * the failure `SlotIcon` was written to make impossible.
 */
export const ICON_HIT_ATTR = "data-vc-icon-hit";

export type IconAssignment = Partial<Record<IconSlotKey, string>>;

/**
 * Which shipped set the drawer offers, PER ROLE.
 *
 * A key into the assets route's whitelist, not a path — the folder it stands for is
 * decided server-side (see `server/assetsRoute.ts`), so the browser never gets to name a
 * directory to read.
 *
 * Split by role because the two sets are not interchangeable: a space badge wants
 * Workvivo's own value and space artwork, and a Quick Links tile wants a vendor logo.
 * Offering an operator the wrong one is how a company value ends up as the Slack mark.
 */
const ROLE_LIBRARY: Record<IconRole, string> = {
  "space.badge": "values-and-spaces",
  "value.disc": "values-and-spaces",
  "app.quicklink": "integrations",
};

/** The set to offer for a given position. */
export const iconLibraryFor = (key: IconSlotKey): string =>
  ROLE_LIBRARY[key.slice(0, key.lastIndexOf(".")) as IconRole];

type RoleOf<K extends string> = K extends `${infer Head}.${infer Tail}`
  ? Tail extends `${bigint}`
    ? Head
    : `${Head}.${RoleOf<Tail>}`
  : never;

export type IconRole = RoleOf<IconSlotKey>;

const ROLE_LABELS: Record<IconRole, string> = {
  "space.badge": "Space icon",
  // Not "Value icon": the target is the whole picker row and the panel it opens edits
  // the value's NAME as well as the disc beside it.
  "value.disc": "Company value",
  "app.quicklink": "Quick link",
};

const roleCounts = ICON_SLOTS.reduce<Record<string, number>>((acc, key) => {
  const role = key.slice(0, key.lastIndexOf("."));
  acc[role] = (acc[role] ?? 0) + 1;
  return acc;
}, {});

/** `"space.badge.2"` -> `"Space icon · 3"`. */
export const iconSlotLabel = (key: IconSlotKey): string => {
  const cut = key.lastIndexOf(".");
  const role = key.slice(0, cut) as IconRole;
  const label = ROLE_LABELS[role];
  return roleCounts[role] > 1
    ? `${label} · ${Number(key.slice(cut + 1)) + 1}`
    : label;
};

const ICON_SLOT_SET: ReadonlySet<string> = new Set(ICON_SLOTS);

/** Narrows an arbitrary string — a DOM attribute, a stored override key — to a slot. */
export const isIconSlot = (key: string): key is IconSlotKey =>
  ICON_SLOT_SET.has(key);

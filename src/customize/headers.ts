/**
 * The three page headers, and what a reviewer may change about them.
 *
 * A header is not just a photograph. It is a photograph, a coloured wash over it, and
 * optionally the company mark centred on top — three decisions that only make sense
 * together, which is why they are one editable rather than three. Swapping the photo
 * without being able to lift the wash off it is the most common thing to want and the
 * one thing the image picker alone cannot do.
 *
 * Closed set, exhaustive lookups, same discipline as `imagery.ts`: a header that is not
 * named here has no treatment, and adding one to `HEADER_SLOTS` without giving it
 * defaults or a label is a type error rather than a blank panel.
 */

import type { CSSProperties } from "react";
import { brandRamp } from "./brandTheme";
import { cleanHex, isHex, type Hex } from "./color";

export const HEADER_SLOTS = [
  /** Desktop homepage banner, global ~417-534. */
  "home.hero",
  /** The phone's header, global ~534-600. */
  "mobile.hero",
  /** The in-app screen's banner, global ~738-896 and 1032+. */
  "app.hero",
] as const;

export type HeaderSlotKey = (typeof HEADER_SLOTS)[number];

export type HeaderTreatment = {
  /**
   * The wash colour, without the hash.
   *
   * Empty means "follow the brand colour", which is not the same as storing today's brand:
   * a header left alone keeps tracking the picker, so changing the brand on the Brand step
   * still moves all three headers. Only an explicit choice pins one.
   */
  overlayHex: string;
  /** 0 = the bare photograph, 1 = the wash alone. */
  overlayOpacity: number;
  /** Draw the white company mark centred on the header. */
  showLogo: boolean;
};

/**
 * What each header does with no override — i.e. exactly what the approved cut renders.
 *
 * The opacities are the values already in the stylesheets (`.hero::after` 0.65, the two
 * `-herowash` layers 0.78). Getting these wrong would silently restyle the baseline.
 *
 * The phone header carries the customer's mark now (global 541, 1659 and 2727 — the home
 * screen, the Spotlight tab, and the home screen again through the iris). It is the one
 * screen in the cut that reads as "their app" and had nothing on it saying whose; the
 * artwork, the placement and the width cap were already there (`.wm-heroM`) and only this
 * flag was holding it back. Still an override, so an operator can switch it off per cut.
 */
export const HEADER_DEFAULTS: Record<HeaderSlotKey, HeaderTreatment> = {
  "home.hero": { overlayHex: "", overlayOpacity: 0.65, showLogo: false },
  "mobile.hero": { overlayHex: "", overlayOpacity: 0.78, showLogo: true },
  "app.hero": { overlayHex: "", overlayOpacity: 0.78, showLogo: true },
};

export const HEADER_LABELS: Record<HeaderSlotKey, string> = {
  "home.hero": "Homepage header",
  "mobile.hero": "Phone header",
  "app.hero": "In-app header",
};

/** Sparse: a header with no entry renders its default. */
export type HeaderOverrides = Partial<
  Record<HeaderSlotKey, Partial<HeaderTreatment>>
>;

export type ResolvedHeader = HeaderTreatment & {
  /**
   * Custom properties to spread on the header element.
   *
   * The wash lives in the ported stylesheets, which cannot take props, so the colour and
   * opacity arrive as `--wv-hdr*` variables that those rules read with the brand
   * variables as their fallback. When the operator has not picked a colour the ramp
   * variables are left UNSET rather than set to the current brand — that is what lets the
   * brand keep flowing through.
   */
  style: CSSProperties;
};

/**
 * Resolve one header: defaults, then the override, then the CSS variables to apply.
 *
 * `overlayOpacity` is clamped rather than trusted. It arrives from a range input today,
 * but it also arrives from `inputProps`, which is a JSON blob that a render could be
 * handed by anything.
 */
export const resolveHeader = (
  slot: HeaderSlotKey,
  overrides: HeaderOverrides | undefined,
): ResolvedHeader => {
  const base = HEADER_DEFAULTS[slot];
  const patch = overrides?.[slot] ?? {};

  const hex = cleanHex(patch.overlayHex ?? base.overlayHex);
  const overlayHex = isHex(hex) ? (hex as Hex) : "";
  const overlayOpacity = Math.min(
    1,
    Math.max(0, Number(patch.overlayOpacity ?? base.overlayOpacity)),
  );
  const showLogo = patch.showLogo ?? base.showLogo;

  const style: CSSProperties = {
    "--wv-hdr-op": String(
      Number.isFinite(overlayOpacity) ? overlayOpacity : base.overlayOpacity,
    ),
  } as CSSProperties;

  if (overlayHex) {
    const ramp = brandRamp(overlayHex);
    Object.assign(style, {
      "--wv-hdr": ramp.brand,
      "--wv-hdr-d1": ramp.d1,
      "--wv-hdr-d3": ramp.d3,
    });
  }

  return { overlayHex, overlayOpacity, showLogo, style };
};

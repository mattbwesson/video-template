import React, { createContext, useContext, useMemo } from "react";
import type { CSSProperties } from "react";
import {
  DEFAULT_BRAND_HEX,
  clampBrandAccentHex,
  css,
  inkOn,
  rgba,
  shade,
  toHsl,
  withLightness,
  type Hex,
} from "./color";

/**
 * One brand theme for the whole video, derived from one hex.
 *
 * The guide's §5.6 complaint is that three videos grew three accent implementations and
 * drifted; the fix is a single context with a derived palette rather than a colour
 * threaded through props or a stylesheet variable set in three places. Values are
 * consumed as inline styles at the element that needs them, plus a small set of CSS
 * custom properties for the ported Workvivo stylesheets, which cannot take props.
 *
 * The baseline green (#44D760) is reproduced exactly when no colour is supplied, so the
 * approved demo still renders byte-for-byte the way it was signed off.
 */

/**
 * The baseline's gradient stops, expressed as fractions of its own lightness. The
 * Workvivo screens paint brand gradients (#44D760 -> #2ECC71 -> #1E824C, and a deeper
 * #27AE60 -> #145A32 pair); reading those off as ratios means any hue reproduces the
 * same depth of fall rather than only green.
 */
const STEPS = { d1: 0.87, d2: 0.76, d3: 0.57, d4: 0.39 } as const;

export type Ramp = { brand: string; d1: string; d2: string; d3: string; d4: string };

/**
 * The five gradient stops for a colour, as CSS strings.
 *
 * Split out of `buildBrandTheme` so a header overlay can be given its own colour and
 * still paint the SAME treatment — the phone and in-app headers are three-stop gradients,
 * and an overlay that flattened to one colour would read as a different design rather
 * than as the same design in another hue.
 *
 * Unclamped, unlike the theme: `clampBrandAccentHex` exists to keep white type legible on
 * a full-frame field, and an overlay is neither full-frame nor type-bearing. An operator
 * who wants a pale wash over a photograph should get one.
 */
export const brandRamp = (hex: Hex): Ramp => {
  const { l } = toHsl(hex);
  const step = (k: keyof typeof STEPS) => css(withLightness(hex, l * STEPS[k]));
  return {
    brand: css(hex),
    d1: step("d1"),
    d2: step("d2"),
    d3: step("d3"),
    d4: step("d4"),
  };
};

export type BrandTheme = {
  /** The clamped hex, no hash. */
  hex: Hex;
  /** `#RRGGBB`, ready for a style value. */
  brand: string;
  /** Black or white, whichever reads on `brand`. */
  ink: string;
  /** Progressively deeper stops for gradients. */
  d1: string;
  d2: string;
  d3: string;
  d4: string;
  /** Secondary colours pulled from the logo. May be empty. */
  palette: string[];
  /** `theme.alpha(0.2)` -> `rgba(r, g, b, 0.2)` of the brand colour. */
  alpha: (a: number) => string;
  /** `theme.shade(-0.3)` -> 30% darker. Positive lightens. */
  shade: (amount: number) => string;
  /** Nth palette colour, wrapping, falling back to the brand when the palette is empty. */
  accent: (index: number) => string;
  /** Spread onto a wrapper so the ported Workvivo stylesheets pick the brand up. */
  vars: CSSProperties;
};

export const buildBrandTheme = (
  inputHex: string | undefined,
  palette: string[] = [],
): BrandTheme => {
  const hex = clampBrandAccentHex(inputHex ?? DEFAULT_BRAND_HEX);
  const { brand, d1, d2, d3, d4 } = brandRamp(hex);
  const ink = inkOn(hex);
  const clean = palette.filter(Boolean).map((p) => css(p));

  return {
    hex,
    brand,
    ink,
    d1,
    d2,
    d3,
    d4,
    palette: clean,
    alpha: (a) => rgba(hex, a),
    shade: (amount) => css(shade(hex, amount)),
    accent: (index) => (clean.length ? clean[index % clean.length] : brand),
    vars: {
      "--wv-brand": brand,
      "--wv-brand-d1": d1,
      "--wv-brand-d2": d2,
      "--wv-brand-d3": d3,
      "--wv-brand-d4": d4,
      "--wv-brand-ink": ink,
      "--wv-brand-soft": rgba(hex, 0.14),
      /** The hero's brand wash sits at 65% over the photo behind it. */
      "--wv-brand-65": rgba(hex, 0.65),
      /** The mobile Spotlight's three scrims, each washing a photo at its own strength:
       *  the header at 70%, the Featured News hero at 45%, the Journeys hero at 35%. A
       *  stop cannot take its alpha from --wv-brand at use site, so the alphas that are
       *  actually needed are mixed here. */
      "--wv-brand-70": rgba(hex, 0.7),
      "--wv-brand-45": rgba(hex, 0.45),
      "--wv-brand-35": rgba(hex, 0.35),
    } as CSSProperties,
  };
};

const BrandThemeContext = createContext<BrandTheme>(
  buildBrandTheme(DEFAULT_BRAND_HEX),
);

export const BrandThemeProvider: React.FC<{
  accentHex?: string;
  palette?: string[];
  children: React.ReactNode;
}> = ({ accentHex, palette, children }) => {
  const value = useMemo(
    () => buildBrandTheme(accentHex, palette),
    [accentHex, palette],
  );
  return (
    <BrandThemeContext.Provider value={value}>
      {children}
    </BrandThemeContext.Provider>
  );
};

export const useBrandTheme = (): BrandTheme => useContext(BrandThemeContext);

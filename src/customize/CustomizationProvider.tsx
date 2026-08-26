import React, { createContext, useContext, useMemo } from "react";
import { SymbolSvg } from "../components/workvivo/symbolRegistry";
import type { CSSProperties } from "react";
import { staticFile } from "remotion";
import { BrandThemeProvider, useBrandTheme, type BrandTheme } from "./brandTheme";
import { assignImagery, type ImageSlotKey } from "./imagery";
import {
  resolveHeader,
  type HeaderSlotKey,
  type ResolvedHeader,
} from "./headers";
import type { IconSlotKey } from "./icons";
import { substituteBrandInCopy } from "./substituteBrand";
import {
  COPY,
  DEFAULT_BRAND,
  DEFAULT_COPY,
  type BrandInput,
  type VideoInputProps,
  type WorkvivoCopy,
} from "./videoCopy";

/**
 * The one thing every scene in the customised cut reads from.
 *
 * Scenes ask for meaning ("the person's headshot", "the second billboard image"), not
 * for props threaded down through six components. The alternative — passing copy and
 * brand through `WorkvivoDesktop` -> `WorkvivoLeftColumn` -> `WorkvivoBillboards` — was
 * what made the accent colour drift across three videos in the first place.
 */

export type Person = {
  name: string;
  /** Derived, not collected: nobody wants to type their first name twice. */
  firstName: string;
  title: string;
  /** The photo as supplied — full frame. For contexts that show more than a face. */
  photoUrl: string;
  /**
   * The photo framed for a circular avatar. Baseline runs get the pre-cropped square;
   * an upload passes through as-is and `avatarFit` does the biasing.
   */
  avatarUrl: string;
  /** Spread onto the avatar `<img>`'s style: object-fit/position for this photo. */
  avatarFit: CSSProperties;
};

export type Customization = {
  copy: WorkvivoCopy;
  brand: BrandInput;
  theme: BrandTheme;
  person: Person;
  /** The logo to draw on light ground, and the knockout for brand/dark ground. */
  logo: { onLight: string; onDark: string };
  /**
   * A page header's wash colour, wash opacity and whether to centre the mark on it.
   *
   * Returned resolved rather than raw, so a component spreads `.style` and reads
   * `.showLogo` without knowing that "no colour chosen" means "leave the variables unset
   * and let the brand flow through".
   */
  header: (slot: HeaderSlotKey) => ResolvedHeader;
  /** An operator upload for this position, or the baseline asset passed as `fallback`. */
  image: (slot: ImageSlotKey, fallback: string) => string;
  /**
   * A swapped-in icon for this position as a ready-to-render URL, or `null` for "keep the
   * artwork the scene already draws".
   *
   * Null rather than a `fallback` argument, because an icon's baseline is a piece of JSX
   * — an `<SymbolSvg href="#i-ui-networking" />`, a CSS-drawn glyph — and not a URL
   * that could be passed in. `<SlotIcon>` is what turns the null back into that JSX.
   */
  icon: (slot: IconSlotKey) => string | null;
  /** True while nothing has been customised — i.e. this is the approved baseline demo. */
  isBaseline: boolean;
};

// --- the baseline demo's own assets ------------------------------------------------
// Kept as a named record rather than inline `staticFile()` calls so there is one list of
// what the video falls back to, and so it can be asserted against the disk in a test.

export const BASELINE_ASSETS = {
  logoOnLight: "img/Spotify_Full_Logo_RGB_Green.png",
  logoOnDark: "img/Spotify_Full_Logo_RGB_White.png",
  personPhoto: "img/Daniel-Ek.png",
  /** The same headshot pre-cropped square to the avatar framing — see `avatarUrl`. */
  personAvatar: "img/Daniel-Ek-avatar.png",
} as const;

/**
 * How every avatar is DRAWN changed from a background-image to a real `<img>`, because
 * the in-browser export paints `<img>` and silently drops `background-image`
 * (docs/browser-render-best-practices.md; verified with the probe in web/renderProbe.tsx
 * — the img control rendered, both background variants came out blank).
 *
 * That swap is also why the baseline headshot is pre-cropped. Daniel-Ek.png is a wide
 * 3:2 portrait, and the old style zoomed it with `background-size: auto 175%` — a
 * framing `object-fit` has no equivalent for. Rather than emulating it with absolute
 * positioning (which would impose layout requirements on two dozen call sites),
 * Daniel-Ek-avatar.png IS that crop, computed once from the same numbers (see the
 * repo script history), so a plain `cover` now reproduces the approved framing exactly.
 * An operator's upload is an unknown crop, and `cover` biased slightly high remains the
 * safest thing to do to a headshot sight-unseen.
 */
const avatarFitFor = (isBaseline: boolean): CSSProperties => ({
  objectFit: "cover",
  objectPosition: isBaseline ? "50% 50%" : "50% 30%",
  display: "block",
});

const firstNameOf = (full: string): string => full.trim().split(/\s+/)[0] || full;

/**
 * The company's first letter, for the watermark the mobile headers carry.
 *
 * Both phone headers draw a 105px initial at 10% white behind their content. It was a
 * hardcoded "V" — Virgin's — which is invisible enough to survive a long time and wrong
 * for every other customer. Letters only: a name that starts with a digit or a symbol
 * ("3M", "@Home") would set a watermark that reads as a glitch, so those fall back to the
 * first letter further in, and a name with none falls back to the baseline's.
 */
export const companyInitialOf = (name: string): string => {
  const letter = name.trim().match(/\p{L}/u);
  return (letter?.[0] ?? "W").toUpperCase();
};

const CustomizationContext = createContext<Customization | null>(null);

/**
 * Everything the composition needs, built once per `inputProps` change.
 *
 * `capLengths` is false here on purpose: caps are meant to apply exactly once, upstream
 * of the render, so that an operator who deliberately types a long title does not watch
 * it get quietly truncated on the way to the preview (guide §1).
 */
export const buildCustomization = (
  input: Partial<VideoInputProps> | undefined,
  theme: BrandTheme,
): Customization => {
  const merged = COPY.merge(input?.copy, { capLengths: false });
  const copy = substituteBrandInCopy(merged);
  const brand: BrandInput = { ...DEFAULT_BRAND, ...(input?.brand ?? {}) };

  const assigned = assignImagery(brand.imagery);
  const overrides = brand.imageOverrides ?? {};
  const iconOverrides = brand.iconOverrides ?? {};
  const personPhotoUrl =
    brand.personPhotoUrl || staticFile(BASELINE_ASSETS.personPhoto);
  const usingBaselinePhoto = !brand.personPhotoUrl;

  const onLight = brand.logoUrl || staticFile(BASELINE_ASSETS.logoOnLight);
  /**
   * Every UI header in the cut is near-black, so this should always be a white knockout.
   *
   * The wizard derives one from the same upload as `logoUrl` (web/logoProcess.ts), so in
   * practice the first branch always wins. The fallback to the colour mark is for the
   * case where processing failed: a slightly dark logo on the topbar is a much smaller
   * problem than the baseline's white *Spotify* mark, which would put another company's
   * logo on screen.
   */
  const onDark =
    brand.logoLightUrl ||
    brand.logoUrl ||
    staticFile(BASELINE_ASSETS.logoOnDark);

  return {
    copy,
    brand,
    theme,
    person: {
      name: copy.person.name,
      firstName: firstNameOf(copy.person.name),
      title: copy.person.title,
      photoUrl: personPhotoUrl,
      avatarUrl: usingBaselinePhoto
        ? staticFile(BASELINE_ASSETS.personAvatar)
        : personPhotoUrl,
      avatarFit: avatarFitFor(usingBaselinePhoto),
    },
    logo: { onLight, onDark },
    header: (slot) => resolveHeader(slot, brand.headerOverrides),
    // Override first, then the deterministic deal, then the baseline asset.
    image: (slot, fallback) => overrides[slot] ?? assigned[slot] ?? fallback,
    icon: (slot) => {
      const picked = iconOverrides[slot];
      if (!picked) return null;
      // A library pick arrives as a path under public/ ("img/values and spaces/…"), which
      // only staticFile() can turn into something that resolves in a headless render as
      // well as in the browser. Anything already absolute — a data URL from a paste, an
      // http URL — is passed through untouched, because staticFile() would mangle it.
      return /^(data:|blob:|https?:|\/)/.test(picked)
        ? picked
        : staticFile(picked);
    },
    isBaseline:
      !brand.logoUrl &&
      !brand.personPhotoUrl &&
      !brand.imagery.length &&
      copy.companyName === DEFAULT_COPY.companyName,
  };
};

/**
 * Splits in two so the theme is a context of its own: the Workvivo stylesheets read it
 * as CSS custom properties from a wrapper, while scenes read the same object as values.
 */
const CustomizationInner: React.FC<{
  input?: Partial<VideoInputProps>;
  children: React.ReactNode;
}> = ({ input, children }) => {
  const theme = useBrandTheme();
  const value = useMemo(() => buildCustomization(input, theme), [input, theme]);
  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
};

export const CustomizationProvider: React.FC<{
  input?: Partial<VideoInputProps>;
  children: React.ReactNode;
}> = ({ input, children }) => (
  <BrandThemeProvider
    accentHex={input?.brand?.accentHex}
    palette={input?.brand?.palette}
  >
    <CustomizationInner input={input}>{children}</CustomizationInner>
  </BrandThemeProvider>
);

/**
 * The customization if there is one, `null` if not — for components that are registered
 * as their own <Composition> as well as being used inside a scene, and so cannot assume
 * a provider is above them. Anything that is only ever mounted by a scene should use
 * `useCustomization()` instead and let the missing provider throw.
 */
export const useOptionalCustomization = (): Customization | null =>
  useContext(CustomizationContext);

export const useCustomization = (): Customization => {
  const ctx = useContext(CustomizationContext);
  if (!ctx) {
    throw new Error(
      "useCustomization() outside a <CustomizationProvider>. Every customised scene must render inside CustomizedWorkvivo.",
    );
  }
  return ctx;
};

/** The person alone — by far the most-read slice, so it gets its own hook. */
export const usePerson = (): Person => useCustomization().person;

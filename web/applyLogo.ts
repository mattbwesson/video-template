/**
 * Accepting a logo — the whole of it, in one place.
 *
 * There are two ways a logo arrives: dropped on the Brand step, or pasted anywhere while
 * that step is open. They must do the same thing, and for a while they did not — paste
 * stored the raw file, so a pasted logo kept its white box and showed a colour mark in
 * every dark header. One function, both callers.
 */

import { processLogo } from "./logoProcess";
import { extractPalette } from "./logoPalette";
import { isImageFile, newUploadId, type Upload } from "./uploads";
import type { Hex } from "../src/customize/color";
import type { WizardState } from "./wizardState";

export type LogoPatch = {
  logo: Upload;
  logoWhite: string;
  /** Brand colour first, then the rest. Empty when nothing could be read off the mark. */
  palette: Hex[];
};

/**
 * Monotonic across BOTH entry points, at module scope on purpose.
 *
 * Processing and palette extraction are async, so replacing a logo twice in quick
 * succession can finish out of order and leave the first file's knockout paired with the
 * second file's colour mark. A counter shared by drop and paste is what makes "newest
 * wins" true regardless of which route each one came in by; a ref inside the step would
 * only order the drops against each other.
 */
let seq = 0;

/**
 * Returns null when there is no usable file, or when a newer logo superseded this one
 * while it was being processed. Callers apply the result as a single patch, so there is
 * never a frame pairing a new mark with the previous one's knockout.
 */
export const acceptLogoFile = async (
  files: FileList | File[],
): Promise<LogoPatch | null> => {
  const file = Array.from(files).find(isImageFile);
  if (!file) return null;
  const mine = ++seq;

  // Knocked off its white box, cropped to its own ink, and rendered a second time in
  // pure white for the UI headers. No downscale — logos have flat edges that resampling
  // softens, and an SVG is rasterized rather than passed through (see logoProcess.ts).
  const { colour, white } = await processLogo(file);
  if (mine !== seq) return null;

  // Read off the PROCESSED mark, not the original: the matte is transparent by now, so
  // the extractor's alpha test skips the box instead of having to guess at it.
  const palette = await extractPalette(colour);
  if (mine !== seq) return null;

  return {
    logo: { id: newUploadId(), url: colour, name: file.name },
    logoWhite: white,
    palette,
  };
};

/**
 * Turn an accepted logo into the wizard patch to apply.
 *
 * The colour decision lives here rather than at either call site, so a drop and a paste
 * cannot disagree about when a logo is allowed to overwrite the brand colour: it may
 * only do so while the operator has not picked one themselves. After that its colours
 * are offered as palette additions instead, and anything already on the palette or
 * already the brand colour is skipped rather than added twice.
 */
export const logoPatch = (
  accepted: LogoPatch,
  state: WizardState,
): Partial<WizardState> => {
  // `logoWhiteUpload: null` because a hand-supplied reversed file belongs to the logo it
  // was uploaded alongside; carrying it onto a different mark would show two companies.
  const base = {
    logo: accepted.logo,
    logoWhite: accepted.logoWhite,
    logoWhiteUpload: null,
  };
  if (!accepted.palette.length) return base;

  if (state.colorTouched) {
    const extra = accepted.palette.filter(
      (h) => h !== state.color && !state.palette.includes(h),
    );
    return extra.length ? { ...base, palette: [...state.palette, ...extra] } : base;
  }
  return { ...base, color: accepted.palette[0], palette: accepted.palette.slice(1) };
};

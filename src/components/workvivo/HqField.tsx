import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";

/**
 * The HQ opening's background: the reference's own mesh gradient, keyframed.
 *
 * The field is not static and it is not a gradient. A bright blob orbits on a ~112-frame
 * cycle; sampled at eight fixed points it swings by up to 163/255, and opposite corners
 * move in opposite directions. It is also not a shader — the source project's was, but this
 * repo sets no `setChromiumOpenGlRenderer`, so a shader draws nothing here, and the
 * wizard's in-browser export is stricter still.
 *
 * So it is 29 keyframes at 160x90, cross-faded. Measured against the reference with the
 * copy excluded, interpolating between keys 10 frames apart costs a mean error of 0.67/255
 * and a 99th percentile of 2.0, which on a gradient this smooth is nothing. See
 * scripts/prep-hq-field.py, which also removes the burnt-in lockup and fan.
 *
 * Two <Img> layers with a cross-fade rather than one that swaps: a swap would step the
 * whole background by up to 20/255 on a single frame, ten times a second.
 */

/**
 * Global frames the keyframes were cut at. MUST match RANGES in scripts/prep-hq-field.py —
 * a key listed here with no file behind it renders as a broken image, and a file the list
 * does not know about is simply never shown.
 *
 * One entry per stretch the background is drawn under. They are kept separate rather than
 * merged into one long range because the film cuts away in between: interpolating across
 * the gap would cross-fade between two backgrounds that never meet on screen.
 */
export const FIELD_RANGES: ReadonlyArray<readonly [number, number, number]> = [
  [139, 416, 10],
  // Last frame, not the exclusive end: the frame after each beat is a hard cut to a
  // different scene, and keying it drags that scene's background into this one.
  [2236, 2267, 8],
  [3326, 3387, 8],
  // The sign-off. 5299 rather than 5300 for the same reason the two above stop where they
  // do: the composition is 5300 frames long, so 5299 is the last frame it ever shows.
  [5166, 5299, 10],
];

/**
 * The range a frame belongs to, and for a frame outside all of them, the NEAREST one.
 *
 * Nearest rather than the first: a beat may be drawn a frame or two past the last frame
 * that was keyed — the fan holds under the ask bar's opening mask at 2268-2269, which is
 * deliberately not keyed because those reference frames have the mask burnt into them —
 * and falling back to FIELD_RANGES[0] would swap the background for the HQ opening's.
 * Clamping to the nearest range holds the field where it was instead.
 */
const rangeFor = (g: number) => {
  const hit = FIELD_RANGES.find(([a, b]) => g >= a && g <= b);
  if (hit) return hit;
  return FIELD_RANGES.reduce((best, r) =>
    Math.min(Math.abs(g - r[0]), Math.abs(g - r[1])) <
    Math.min(Math.abs(g - best[0]), Math.abs(g - best[1]))
      ? r
      : best,
  );
};

const keysFor = ([first, last, step]: readonly [number, number, number]) => {
  const out: number[] = [];
  for (let g = first; g <= last; g += step) out.push(g);
  if (out[out.length - 1] !== last) out.push(last);
  return out;
};

const src = (g: number) => staticFile(`img/hq-field/f${String(g).padStart(3, "0")}.png`);

/** Upscaled 12x from 160x90. The browser's own bilinear filtering is enough on a field with
    no edges in it; anything sharper would only resample noise that is not there. */
const fill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export const HqField: React.FC<{ globalFrame: number }> = ({ globalFrame }) => {
  const range = rangeFor(globalFrame);
  const keyFrames = keysFor(range);
  const g = Math.max(range[0], Math.min(range[1], globalFrame));
  let i = 0;
  while (i < keyFrames.length - 2 && keyFrames[i + 1] <= g) i++;
  const a = keyFrames[i];
  const b = keyFrames[i + 1] ?? a;
  const t = b === a ? 0 : interpolate(g, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Img src={src(a)} style={fill} alt="" />
      <Img src={src(b)} style={{ ...fill, opacity: t }} alt="" />
    </AbsoluteFill>
  );
};

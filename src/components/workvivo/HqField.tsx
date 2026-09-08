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

/** Global frames the keyframes were cut at — must match scripts/prep-hq-field.py. */
export const FIELD_FIRST = 139;
export const FIELD_LAST = 416;
export const FIELD_STEP = 10;

const keyFrames = (() => {
  const out: number[] = [];
  for (let g = FIELD_FIRST; g <= FIELD_LAST; g += FIELD_STEP) out.push(g);
  if (out[out.length - 1] !== FIELD_LAST) out.push(FIELD_LAST);
  return out;
})();

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
  const g = Math.max(FIELD_FIRST, Math.min(FIELD_LAST, globalFrame));
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

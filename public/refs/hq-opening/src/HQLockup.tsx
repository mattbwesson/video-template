import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// All geometry below is in the units of the original lockup artwork
// (public/refs/workvivo-hq.svg, viewBox 0 0 730.38 187.04), so the code-drawn
// square lands exactly where the baked-in one did.
const ART_W = 730.38;
const ART_H = 187.04;

// The rounded square, read off the .cls-1 path in workvivo-hq.svg.
const SQUARE = {
  left: 541.28, // 565.06 - 23.78
  width: 189.1, // reaches the right edge of the artboard
  height: ART_H, // full height of the artboard
  radius: 23.78, // outer corner radius
  stroke: 7, // outer radius 23.78 - inner radius 16.78
};

// workvivo-hq-nosquare.svg is the same artwork cropped tight to the glyphs:
// identical x coordinates, y shifted up by 34.89, viewBox 0 0 701.67 100.91.
const MARK = { top: 34.89, width: 701.67 };

// Stroke gradient: userSpaceOnUse from (548.75, 6.45) to (722.9, 180.59) —
// a true 45° run, i.e. CSS 135deg. Its endpoints are inset half a stroke from
// the corners, which is what these two stop positions reproduce.
const gradientStart = ((548.75 - SQUARE.left + 6.45) / (SQUARE.width + ART_H)) * 100;
const gradientEnd = ((722.9 - SQUARE.left + 180.59) / (SQUARE.width + ART_H)) * 100;

// The artwork's angle. The stops hold as the angle turns, so the bright end of
// the ramp keeps its intensity all the way around instead of pulsing.
const BASE_ANGLE = 135;

const squareGradient = (angle: number) =>
  `linear-gradient(${angle.toFixed(2)}deg, rgba(255,255,255,1) ` +
  `${gradientStart.toFixed(2)}%, rgba(255,255,255,0.2) ${gradientEnd.toFixed(2)}%)`;

export interface HQLockupProps {
  /** Rendered width of the full lockup, square included. */
  width: number;
  /** Seconds for the square's gradient to turn a full 360°. 0 = hold still. */
  gradientPeriodInSeconds?: number;
  style?: React.CSSProperties;
  /** Style hook for the code-drawn square, e.g. to animate it on its own. */
  squareStyle?: React.CSSProperties;
}

export const HQLockup: React.FC<HQLockupProps> = ({
  width,
  gradientPeriodInSeconds = 6,
  style,
  squareStyle,
}) => {
  const s = width / ART_W;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const angle = gradientPeriodInSeconds
    ? BASE_ANGLE + (360 * (frame / fps)) / gradientPeriodInSeconds
    : BASE_ANGLE;

  return (
    <div
      style={{
        position: "relative",
        width,
        height: ART_H * s,
        ...style,
      }}
    >
      <Img
        src={staticFile("refs/workvivo-hq-nosquare.svg")}
        style={{
          position: "absolute",
          left: 0,
          top: MARK.top * s,
          width: MARK.width * s,
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SQUARE.left * s,
          top: 0,
          width: SQUARE.width * s,
          height: SQUARE.height * s,
          boxSizing: "border-box",
          borderRadius: SQUARE.radius * s,
          padding: SQUARE.stroke * s,
          background: squareGradient(angle),
          // Knock the middle out so only the stroke remains; the inner corner
          // radius falls out of outer radius minus stroke, as in the artwork.
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          ...squareStyle,
        }}
      />
    </div>
  );
};

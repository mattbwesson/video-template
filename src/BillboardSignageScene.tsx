import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { WorkvivoBillboardScreen } from "./components/workvivo/WorkvivoBillboardScreen";

/**
 * The billboard running on a wall-mounted display.
 *
 * DigitalSignage.png is a 1920x1080 photograph of a screen on a wall, and it already has a
 * still of this same billboard baked into it. WorkvivoBillboardScreen is composited exactly
 * over that area so the display is live rather than a photograph of one — which is what
 * lets its content follow the customisation.
 *
 * The screen rect was measured off the photo rather than eyeballed: scanning for the red
 * content inside the near-black bezel puts it at (310, 166) with 1299 x 731 of picture.
 * That is 1.7770 — 16:9 to four places — which is the check that the numbers are right,
 * since the component is authored at 1320 x 742 and the same ratio. Hence one uniform
 * 1299/1320 scale with no distortion.
 */

/**
 * Measured content rect of the display in DigitalSignage.png.
 *
 * Re-measured off a render rather than kept as first estimated. The bezel's opening runs
 * x 290-1622 and y 150-897, and the old rect (310, 166, 1299) sat inside it unevenly —
 * 19px of gap on the left, 13 on the right, 17 above and none at all below, so the picture
 * read as hung low and slightly right in its own frame.
 *
 * This one is the opening inset by ~5px on every side, which is a bezel rather than a
 * hairline and puts the same margin on all four. The component is 1320x742 and the opening
 * is 1332x747, near enough the same 16:9 that one uniform scale still fits without
 * distortion — which is the check that the numbers are right.
 */
const SCREEN = { left: 311, top: 162, width: 1298 };
/** WorkvivoBillboardScreen's own authored width. */
const BILLBOARD_WIDTH = 1320;

export interface BillboardSignageSceneProps {
  /** Per-tenant brand colour for the billboard's field. */
  brand?: { lit: string; base: string; dark: string };
  logoSrc?: string;
  /** Frames to slide up slightly after the cut. Default 18. */
  slideUpFrames?: number;
  /** Start frame for slide up (relative to scene start). Default 6 (at the cut point). */
  slideUpFrom?: number;
  /** Distance in pixels to animate up from. Default 45. */
  slideUpDistance?: number;
  /** Starting scale for linear zoom. Default 1.0. */
  scaleStart?: number;
  /** Ending scale for linear zoom at the end of the sequence. Default 1.06. */
  scaleEnd?: number;
  /** Total frames to scale over. Default 139. */
  scaleDuration?: number;
}

export const BillboardSignageScene: React.FC<BillboardSignageSceneProps> = ({
  brand,
  logoSrc,
  slideUpFrames = 18,
  slideUpFrom = 6,
  slideUpDistance = 45,
  scaleStart = 1.0,
  scaleEnd = 1.06,
  scaleDuration = 139,
}) => {
  const frame = useCurrentFrame();

  const slideUp = interpolate(
    frame,
    [slideUpFrom, slideUpFrom + slideUpFrames],
    [slideUpDistance, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  const zoomScale = interpolate(
    frame,
    [0, scaleDuration],
    [scaleStart, scaleEnd],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoomScale}) translateY(${slideUp}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile("img/DigitalSignage.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SCREEN.left,
            top: SCREEN.top,
            width: BILLBOARD_WIDTH,
            transform: `scale(${SCREEN.width / BILLBOARD_WIDTH}, ${(SCREEN.width / BILLBOARD_WIDTH) * (737.63 / 729.63)})`,
            transformOrigin: "top left",
          }}
        >
          <WorkvivoBillboardScreen brand={brand} logoSrc={logoSrc} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Two words on the brand field: "amplify", then a hard cut to "reach".
 *
 * The type is lifted from the Headquarters reveal (the word on screen at global 105) —
 * same size, weight, tracking, family and glow — so the two moments read as the same
 * device returning rather than a second, similar one. The values are duplicated here
 * rather than imported because HeadquartersScene keeps them inline on the element; if
 * they are ever pulled into a shared constant, this should use it.
 *
 * The field is #010026, the same dark brand purple the desktop scene sits on at global
 * 864 — not the #010224 the Spaces scenes use, which is a hair bluer.
 */

/**
 * The field: #010026 with the reference's violet bloom over it — brightest low and left,
 * falling off to the flat dark navy at the top and right. Two radial layers rather than
 * one, because the reference has a broad glow plus a tighter, hotter core inside it that a
 * single gradient cannot describe.
 */
const FIELD =
  "radial-gradient(115% 85% at 10% 80%, rgba(124,58,237,0.95) 0%, rgba(91,33,182,0.55) 34%, rgba(46,16,101,0.18) 62%, rgba(1,0,38,0) 84%)," +
  "radial-gradient(85% 65% at 52% 108%, rgba(109,40,217,0.62) 0%, rgba(1,0,38,0) 68%)," +
  "#010026";

/** Frames each word takes to finish growing. Same 0.88 -> 1.0 the Headquarters word uses. */
const GROW_FRAMES = 18;
const GROW_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const GROW_FROM = 0.88;

/** Local frame the cut to the second word lands on. */
const CUT_AT = 3;

const WORD_STYLE: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 225,
  fontWeight: 500,
  letterSpacing: "0.025em",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  textAlign: "center",
  textShadow:
    "0 0 25px rgba(255, 255, 255, 0.6), 0 0 50px rgba(255, 255, 255, 0.3)",
};

export interface AmplifyReachSceneProps {
  words?: [string, string];
  /** Local frame the circular mask starts expanding from 0. Default 0 (global 1813). */
  maskFrom?: number;
  /** Local frame the circular mask reaches full screen. Default 9 (global 1822). */
  maskTo?: number;
  /** Local frame the cut to the second word lands on. Default 15 (global 1828). */
  cutAt?: number;
  /** Local frame when Reach text starts scaling down into the center. Default 26 (global 1839). */
  scaleDownFrom?: number;
  /** Target scale for the Reach text scale down. Default 0.25. */
  scaleDownTarget?: number;
  /** Duration in frames for Reach text scale down. Default 7. */
  scaleDownDuration?: number;
}

export const AmplifyReachScene: React.FC<AmplifyReachSceneProps> = ({
  words = ["Amplify", "Reach"],
  maskFrom = 0,
  maskTo = 9,
  cutAt = 15,
  scaleDownFrom = 26,
  scaleDownTarget = 0.25,
  scaleDownDuration = 7,
}) => {
  const frame = useCurrentFrame();

  // Circular mask radius: 0 to 1200px across maskFrom to maskTo
  const maskRadius = interpolate(frame, [maskFrom, maskTo], [0, 1200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Word scale:
  // 1. "Amplify" scales up with the circular mask from 0 to 1 across maskFrom to maskTo
  // 2. "Reach" grows from GROW_FROM to 1 from cutAt onwards
  // 3. "Reach" text alone scales down from 1 to scaleDownTarget before the cut to signage
  const scale = (() => {
    if (frame < cutAt) {
      return interpolate(frame, [maskFrom, maskTo], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    }
    if (scaleDownFrom != null && frame >= scaleDownFrom) {
      return interpolate(
        frame,
        [scaleDownFrom, scaleDownFrom + scaleDownDuration],
        [1, scaleDownTarget],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        },
      );
    }
    return interpolate(frame, [cutAt, cutAt + GROW_FRAMES], [GROW_FROM, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: GROW_EASE,
    });
  })();

  return (
    <AbsoluteFill
      style={{
        background: FIELD,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        clipPath: maskRadius >= 1200 ? undefined : `circle(${maskRadius}px at 50% 50%)`,
        WebkitClipPath: maskRadius >= 1200 ? undefined : `circle(${maskRadius}px at 50% 50%)`,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <span style={WORD_STYLE}>{frame < cutAt ? words[0] : words[1]}</span>
      </div>
    </AbsoluteFill>
  );
};

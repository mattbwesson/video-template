import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/** The house grow-in, shared with AmplifyReachScene. */
const GROW_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const GROW_FROM = 0.88;
const GROW_FRAMES = 16;

/**
 * The word sits slightly ABOVE centre in the reference, not on it — 47.8% rather than
 * 50%. Optical centring for a short cap-height word; leaving it at 50% reads as low.
 */
const WORD_CY = 0.478;

export interface BrandWordSceneProps {
  word?: string;
  /** The field behind it. The cut passes `theme.brand`. */
  background?: string;
  /** Against a 1080-tall frame. */
  fontSize?: number;
  fontWeight?: number;
  /**
   * What the word scales FROM before landing on 1.
   *
   * Below 1 it grows in, which is the house device the Ask / Answer / Job Done run uses.
   * Above 1 it settles down onto the frame instead — same curve, same landing, read the
   * other way round, which is what the sign-off the survey irises onto wants.
   */
  scaleFrom?: number;
}

/**
 * A single word on the brand field.
 *
 * The type is the same device AmplifyReachScene uses — white, wide-tracked, with a
 * two-stop white glow — so the title cards through the cut read as one family. It is
 * heavier and larger here than the amplify/reach pair because the reference for this one
 * is, and a three-letter word carries the extra weight where a longer one would not.
 *
 * Hard cut in, then a small grow, matching how amplify/reach each arrive.
 */
export const BrandWordScene: React.FC<BrandWordSceneProps> = ({
  word = "Ask",
  background = "#E10A0A",
  fontSize = 320,
  fontWeight = 700,
  scaleFrom = GROW_FROM,
}) => {
  const frame = useCurrentFrame();

  const grow = interpolate(frame, [0, GROW_FRAMES], [scaleFrom, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: GROW_EASE,
  });

  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${WORD_CY * 100}%`,
          transform: `translate(-50%, -50%) scale(${grow})`,
          transformOrigin: "center center",
          color: "#ffffff",
          fontSize,
          fontWeight,
          letterSpacing: "0.025em",
          lineHeight: 1,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
          whiteSpace: "nowrap",
          textShadow:
            "0 0 25px rgba(255, 255, 255, 0.6), 0 0 50px rgba(255, 255, 255, 0.3)",
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};

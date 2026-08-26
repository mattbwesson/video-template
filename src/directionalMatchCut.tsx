import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

/**
 * A whip-pan match cut for TransitionSeries — the directional sibling of
 * scaleDownMatchCut.
 *
 * Both scenes travel the SAME direction along one axis: the outgoing one keeps going and
 * leaves frame, the incoming one is already further along that identical path and settles.
 * Because the incoming's position at the cut is exactly where the outgoing's was heading,
 * it reads as one continuous move rather than two.
 *
 * Opacity swaps across p 0.45-0.55, the same 10% window scaleDownMatchCut uses, so the two
 * presentations cut on the same beat and a scene can hand off to either without the timing
 * feeling different. Only one side draws at a time.
 *
 * `travel` is a fraction of the frame, not pixels, so it reads the same at any composition
 * size. The default 1 means the outgoing scene clears the frame exactly as it cuts.
 */

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** The whip curve: fast out of the gate, decelerating into rest. */
const WHIP = Easing.bezier(0.16, 1, 0.3, 1);

export type DirectionalMatchCutProps = {
  /** Which way the pair travels. */
  direction?: "left" | "right" | "up" | "down";
  /** Distance as a fraction of the frame. */
  travel?: number;
};

const AXIS: Record<string, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

const DirectionalMatchCutPresentation: React.FC<
  TransitionPresentationComponentProps<DirectionalMatchCutProps>
> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const { direction = "left", travel = 1 } = passedProps;
  const [ax, ay] = AXIS[direction] ?? AXIS.left;
  const p = presentationProgress;
  const entering = presentationDirection === "entering";

  // One curve, sampled twice. The outgoing runs 0 -> travel over the whole window; the
  // incoming runs travel -> 0 along the same shape, so at the cut the two are the same
  // distance apart as they would be if it were one object continuing.
  const distance = entering
    ? interpolate(p, [0, 1], [travel, 0], { ...clampOpts, easing: WHIP })
    : interpolate(p, [0, 1], [0, -travel], { ...clampOpts, easing: WHIP });

  const opacity = entering
    ? interpolate(p, [0.45, 0.55], [0, 1], clampOpts)
    : interpolate(p, [0.45, 0.55], [1, 0], clampOpts);

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translate(${ax * distance * 100}%, ${ay * distance * 100}%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export function directionalMatchCut(
  props: DirectionalMatchCutProps = {},
): TransitionPresentation<DirectionalMatchCutProps> {
  return {
    component: DirectionalMatchCutPresentation,
    props,
  };
}

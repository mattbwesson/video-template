import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type ScaleDownMatchCutProps = {
  scaleOutTarget?: number;
  scaleOutRoot?: boolean;
};

const ScaleDownMatchCutPresentation: React.FC<
  TransitionPresentationComponentProps<ScaleDownMatchCutProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { scaleOutTarget = 0.25, scaleOutRoot = true } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    // Exiting scene: Scale down into center if scaleOutRoot is true; cut opacity out from 0.45 to 0.55
    const exitOpacity = interpolate(p, [0.45, 0.55], [1, 0], clampOpts);
    const exitScale = interpolate(p, [0, 0.55], [1, scaleOutTarget], {
      ...clampOpts,
      easing: Easing.in(Easing.cubic),
    });

    return (
      <AbsoluteFill
        style={{
          opacity: exitOpacity,
          transform: scaleOutRoot ? `scale(${exitScale})` : undefined,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  // Entering scene: Cut in opacity from 0.45 to 0.55 (middle 10%) with no blur
  const enterOpacity = interpolate(p, [0.45, 0.55], [0, 1], clampOpts);

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export function scaleDownMatchCut(
  props: ScaleDownMatchCutProps = {},
): TransitionPresentation<ScaleDownMatchCutProps> {
  return {
    component: ScaleDownMatchCutPresentation,
    props,
  };
}

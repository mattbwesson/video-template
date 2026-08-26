import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { WorkvivoIntegrationsMarketplace } from "./components/workvivo/WorkvivoIntegrationsMarketplace";

const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export interface WorkvivoIntegrationsMarketplaceSceneProps {
  background?: string;
  entranceDuration?: number;
  exitStartFrame?: number;
  exitDuration?: number;
}

/**
 * WorkvivoIntegrationsMarketplace is a centered modal on brand red.
 * Slides up on entrance, and slides down out of frame on exit at exitStartFrame (local 62 = global 4459).
 */
export const WorkvivoIntegrationsMarketplaceScene: React.FC<
  WorkvivoIntegrationsMarketplaceSceneProps
> = ({ background, entranceDuration = 18, exitStartFrame = 62, exitDuration = 18 }) => {
  const frame = useCurrentFrame();
  const { theme } = useCustomization();
  const bg = background ?? theme.brand;

  const entranceY = interpolate(frame, [0, entranceDuration], [1080, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitY = interpolate(frame, [exitStartFrame, exitStartFrame + exitDuration], [0, 1200], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = entranceY + exitY;
  const isExiting = frame >= exitStartFrame;

  return (
    <AbsoluteFill style={{ background: isExiting ? "transparent" : bg, overflow: "hidden" }}>
      <div style={{ transform: `translateY(${translateY}px)`, willChange: "transform" }}>
        <WorkvivoIntegrationsMarketplace brand={bg} />
      </div>
    </AbsoluteFill>
  );
};

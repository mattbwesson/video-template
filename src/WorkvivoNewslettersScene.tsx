import React from "react";
import { AbsoluteFill } from "remotion";
import { WorkvivoNewsletters } from "./components/workvivo/WorkvivoNewsletters";

/** Same device box WorkvivoHomeContainer uses. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;

export interface WorkvivoNewslettersSceneProps {
  /** Defaults to the largest scale that fits 1920x1080 with the device intact. */
  scale?: number;
}

/**
 * Stages the Newsletters device on the Workvivo page background.
 *
 * Needs a <CustomizationProvider> ABOVE it — it does not make its own. WorkvivoTopbar
 * reads the operator's logo and persona through the context and throws outside one, and a
 * prop-less provider added here would yield the BASELINE instead, quietly replacing the
 * operator's brand with the demo's. The cut supplies one; Root.tsx's `withCustomization`
 * supplies one to the standalone still.
 *
 * `flexDirection: "row"` and `alignItems: "center"` are stated explicitly — AbsoluteFill
 * defaults to `column` and `stretch`, either of which quietly pins the device to the wrong
 * axis or stretches it (see docs/PORTING-HTML-REFS.md).
 */
export const WorkvivoNewslettersScene: React.FC<WorkvivoNewslettersSceneProps> = ({
  scale,
}) => {
  const z = scale ?? Math.min(1920 / DEVICE_WIDTH, 1080 / DEVICE_HEIGHT);

  return (
    <AbsoluteFill
      style={{
        background: "#F3F4F6",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          overflow: "hidden",
          transform: `scale(${z})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
          <WorkvivoNewsletters />
      </div>
    </AbsoluteFill>
  );
};

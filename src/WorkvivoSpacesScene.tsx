import React from "react";
import { AbsoluteFill } from "remotion";
import { WorkvivoSpaces } from "./components/workvivo/WorkvivoSpaces";

/** Natural size of the content column WorkvivoSpaces draws. */
const PANE_WIDTH = 1320;

export interface WorkvivoSpacesSceneProps {
  /** How far the page is scrolled, in the pane's own (unscaled) pixels. */
  scrollTop?: number;
  /** Defaults to filling the frame width. Pass a number to zoom out and show more rows. */
  scale?: number;
}

/**
 * Stages the Spaces directory on the Workvivo page background.
 *
 * The pane has no chrome of its own — no top bar, no nav rail — so the stage owns the
 * background and the scale, per docs/PORTING-HTML-REFS.md step 4. `flexDirection: "row"`
 * and `alignItems: "flex-start"` are stated explicitly: AbsoluteFill defaults to `column`
 * and `stretch`, either of which quietly pins the pane to the wrong axis.
 */
export const WorkvivoSpacesScene: React.FC<WorkvivoSpacesSceneProps> = ({
  scrollTop = 0,
  scale,
}) => {
  const frameWidth = 1920;
  const z = scale ?? frameWidth / PANE_WIDTH;

  return (
    <AbsoluteFill
      style={{
        background: "#F3F4F6",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: PANE_WIDTH,
          transform: `scale(${z}) translateY(${-scrollTop}px)`,
          transformOrigin: "top center",
          willChange: "transform",
        }}
      >
        <WorkvivoSpaces />
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  WorkvivoSeerSurveyMobile,
  WorkvivoSeerSurveyMobileProps,
} from "./components/workvivo/WorkvivoSeerSurveyMobile";
import { MobileClick } from "./components/workvivo";
import { useCustomization } from "./customize/CustomizationProvider";
import "./components/workvivo/WorkvivoGlassEdge.css";

const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export interface WorkvivoSeerSurveyMobileSceneProps
  extends WorkvivoSeerSurveyMobileProps {
  background?: string;
  entranceDuration?: number;
  /** Global frame 3590 (local 19) click position */
  click1Frame?: number;
  click1X?: string;
  click1Y?: string;
  /** Global frame 3617 (local 46) click position */
  click2Frame?: number;
  click2X?: string;
  click2Y?: string;
  /** Global frame 3633 (local 62) click position */
  click3Frame?: number;
  click3X?: string;
  click3Y?: string;
  /** Global frame 3673 (local 102) completion screen */
  completeAtFrame?: number | null;
}

/**
 * Stages the Seer Mobile Survey on the dark field.
 *
 * Rises up from below the viewport and renders the phone with the signature Workvivo glass bezel,
 * complete with animated mobile tap clicks and completion screen.
 */
export const WorkvivoSeerSurveyMobileScene: React.FC<
  WorkvivoSeerSurveyMobileSceneProps
> = ({
  background = "#010320",
  entranceDuration = 18,
  framesPerQuestion = 48,
  answerAtFrame = 23, // Local frame within question step when option gets selected as click lands
  click1Frame = 19, // Global 3590 (3590 - 3571)
  click1X = "53.8%",
  click1Y = "50.0%",
  click2Frame = 46, // Global 3617 (3617 - 3571)
  click2X = "57.4%",
  click2Y = "85.5%",
  click3Frame = 62, // Global 3633 (3633 - 3571)
  click3X = "58.2%",
  click3Y = "50.0%",
  completeAtFrame = 102, // Global 3673 (3673 - 3571)
  picks = [3, 4, 4, 3, 4], // Full 5-question picks array: Q1=3(Agree), Q2=4(Strongly Agree), Q3=4, Q4=3(Agree), Q5=4(Strongly Agree)
  ...props
}) => {
  const frame = useCurrentFrame();
  const { logo } = useCustomization();

  // Animate up from bottom (translateY: 1050px -> 0px)
  const translateY = interpolate(frame, [0, entranceDuration], [1050, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${translateY}px)`,
          willChange: "transform",
        }}
      >
        <WorkvivoSeerSurveyMobile
          background="transparent"
          glassBorder
          // Knockout, not the colour mark: the survey header is near-black.
          logoSrc={logo.onDark}
          framesPerQuestion={framesPerQuestion}
          answerAtFrame={answerAtFrame}
          completeAtFrame={completeAtFrame}
          picks={picks}
          {...props}
        />
      </div>

      {/* Click 1 at global frame 3590 (local 19): Agree option on Question 4 */}
      {click1Frame !== undefined && click1Frame >= 0 && (
        <MobileClick
          startFrame={click1Frame}
          durationInFrames={10}
          x={click1X}
          y={click1Y}
          zIndex={60}
        />
      )}

      {/* Click 2 at global frame 3617 (local 46): Next button */}
      {click2Frame !== undefined && click2Frame >= 0 && (
        <MobileClick
          startFrame={click2Frame}
          durationInFrames={10}
          x={click2X}
          y={click2Y}
          zIndex={60}
        />
      )}

      {/* Click 3 at global frame 3633 (local 62): Strongly Agree option on Question 5 */}
      {click3Frame !== undefined && click3Frame >= 0 && (
        <MobileClick
          startFrame={click3Frame}
          durationInFrames={10}
          x={click3X}
          y={click3Y}
          zIndex={60}
        />
      )}
    </AbsoluteFill>
  );
};

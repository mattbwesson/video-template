import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { WorkvivoFeedbackArticle } from "./components/workvivo/WorkvivoFeedbackArticle";

const ARTICLE_W = 920;
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SCROLL_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EXIT_EASE = Easing.bezier(0.81, -0.01, 1.0, 0.31);

export interface WorkvivoFeedbackArticleSceneProps {
  fill?: number;
  top?: number;
  background?: string;
  entranceDuration?: number;
  scrollStartFrame?: number;
  scrollEndFrame?: number;
  scrollDistance?: number;
  exitStartFrame?: number;
  exitDurationMs?: number;
}

export const WorkvivoFeedbackArticleScene: React.FC<
  WorkvivoFeedbackArticleSceneProps
> = ({
  fill = 0.557,
  top = 80,
  background,
  entranceDuration = 36,
  scrollStartFrame = 65,
  scrollEndFrame = 95,
  scrollDistance = 170,
  exitStartFrame = 125, // Local frame 125 = global 4235 (4235 - 4110 = 125)
  exitDurationMs = 600,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { theme } = useCustomization();

  const bg = background ?? theme.brand;
  const cardWidth = ARTICLE_W;
  const z = (1920 * fill) / cardWidth;
  const pageLeft = (1920 - cardWidth * z) / 2;

  // Entrance from bottom (translateY: 1050px -> 0px in page space)
  const entranceY = interpolate(frame, [0, entranceDuration], [1050 / z, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Smooth scroll up to reveal section 2
  const scrollY = interpolate(
    frame,
    [scrollStartFrame, scrollEndFrame],
    [0, -scrollDistance],
    {
      easing: SCROLL_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Animate article back down all the way off screen starting at global frame 4235 (local 125) over 600ms
  const exitFrames = (exitDurationMs / 1000) * fps;
  const exitY = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitFrames],
    [0, 1600 / z],
    {
      easing: EXIT_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const translateY = entranceY + scrollY + exitY;

  const glowOpacity = interpolate(frame, [2, entranceDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowFade = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const finalGlowOpacity = glowOpacity * glowFade;

  return (
    <AbsoluteFill
      style={{
        background: bg,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      {/* Soft ambient white glow behind the card top */}
      <div
        style={{
          position: "absolute",
          left: pageLeft - 60,
          top: top - 50,
          width: cardWidth * z + 120,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.3) 55%, rgba(255, 255, 255, 0) 100%)",
          filter: "blur(50px)",
          opacity: finalGlowOpacity,
          pointerEvents: "none",
          transform: `translateY(${(entranceY + exitY) * z}px)`,
        }}
      />

      {/* Scaled page container */}
      <div
        style={{
          width: cardWidth * z,
          marginTop: top,
          flex: "none",
          position: "relative",
          transform: `translateY(${translateY * z}px)`,
          willChange: "transform",
        }}
      >
        <div style={{ transform: `scale(${z})`, transformOrigin: "top left" }}>
          <WorkvivoFeedbackArticle />
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ARTICLE_W, WorkvivoArticle } from "./components/workvivo/WorkvivoArticle";

/** The deep navy field the page floats on. */
const BACKDROP = "#010320";
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export interface WorkvivoArticleSceneProps {
  /** Fraction of the frame width the page takes. The reference has it at 55.7%. */
  fill?: number;
  /** Distance from the top of the frame to the top of the page. */
  top?: number;
  background?: string;
  entranceDuration?: number;
  textEndFrame?: number;
  fig1Frame?: number;
  fig2Frame?: number;
  exitDownFrom?: number;
  exitDownTo?: number;
}

/**
 * Stages a single Workvivo article on the dark field.
 *
 * The page is deliberately taller than the space below `top`, so it runs off the bottom
 * of the frame with the image row half-shown — that is what the reference does, and
 * scaling it to fit would change the crop rather than reproduce it.
 */
export const WorkvivoArticleScene: React.FC<WorkvivoArticleSceneProps> = ({
  fill = 0.557,
  top = 80,
  background = BACKDROP,
  entranceDuration = 18,
  textEndFrame = 23,
  fig1Frame = 28,
  fig2Frame = 36,
  exitDownFrom = 50,
  exitDownTo = 62,
}) => {
  const frame = useCurrentFrame();
  const z = (1920 * fill) / ARTICLE_W;
  /** Frame-space x of the page's left edge, which the bloom is positioned against. */
  const pageLeft = (1920 - ARTICLE_W * z) / 2;

  // Animate up from bottom (translateY: 1050px -> 0px)
  const entranceY = interpolate(frame, [0, entranceDuration], [1050, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Start animating down just before local 62
  const exitY = interpolate(frame, [exitDownFrom, exitDownTo], [0, 600], {
    easing: Easing.bezier(0.35, 0, 0.8, 0.2),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = entranceY + exitY;

  const bloomOpacity = interpolate(frame, [4, entranceDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // AI Summary bar animation
  const aiOpacity = interpolate(frame, [2, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const aiY = interpolate(frame, [2, 8], [12, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const aiStyle: React.CSSProperties = {
    opacity: aiOpacity,
    transform: `translateY(${aiY}px)`,
    willChange: "transform, opacity",
  };

  // Body blocks staggered to complete around textEndFrame (local 23 / global 3287)
  const paragraphStyle = (index: number): React.CSSProperties => {
    const start = 4 + index * 3.5;
    const pOpacity = interpolate(frame, [start, start + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const pY = interpolate(frame, [start, start + 5], [14, 0], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      opacity: pOpacity,
      transform: `translateY(${pY}px)`,
      willChange: "transform, opacity",
    };
  };

  // Image figures: Fig 1 at fig1Frame (local 28 / global 3292), Fig 2 at fig2Frame (local 36 / global 3300)
  const figureStyle = (index: number): React.CSSProperties => {
    const start = index === 0 ? fig1Frame : fig2Frame;
    const fOpacity = interpolate(frame, [start, start + 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fScale = interpolate(frame, [start, start + 8], [0.88, 1], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fY = interpolate(frame, [start, start + 8], [24, 0], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      opacity: fOpacity,
      transform: `translateY(${fY}px) scale(${fScale})`,
      transformOrigin: "center center",
      willChange: "transform, opacity",
    };
  };

  return (
    <AbsoluteFill
      style={{
        background,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      {/* The violet bloom behind the page's top-left corner */}
      <div
        style={{
          position: "absolute",
          left: pageLeft + 15 - 350,
          top: top + 30 - 230,
          width: 700,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(139,74,255,0.85) 0%, rgba(96,32,205,0.42) 42%, rgba(60,12,140,0) 100%)",
          filter: "blur(58px)",
          opacity: bloomOpacity,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: ARTICLE_W * z,
          marginTop: top,
          flex: "none",
          position: "relative",
          transform: `translateY(${translateY}px)`,
          willChange: "transform",
        }}
      >
        <div style={{ transform: `scale(${z})`, transformOrigin: "top left" }}>
          <WorkvivoArticle
            aiStyle={aiStyle}
            paragraphStyle={paragraphStyle}
            figureStyle={figureStyle}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

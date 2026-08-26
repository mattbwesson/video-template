import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  HQ_SEARCH_H,
  HQ_SEARCH_W,
  WorkvivoHqSearch,
} from "./components/workvivo/WorkvivoHqSearch";

/** Virgin red, the default field. The cut passes `theme.brand` instead. */
const BACKDROP = "#E10A0A";
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Margin from the frame edge to the modal, at 1920x1080.
 *
 * The reference has the modal inset the same amount left and right and slightly less at
 * the top, with the result list running off the bottom edge — so the modal is taller
 * than the frame allows and gets clipped, rather than sitting neatly inside it.
 */
const SIDE_MARGIN = 110;
const TOP_MARGIN = 72;

/**
 * Stages the HQ Agent search overlay on the red field.
 *
 * The modal is built at its own 988x582 scale and scaled here to fill the frame width,
 * the same arrangement WorkvivoSpacesScene and WorkvivoNewslettersScene use: the
 * component keeps design-space numbers, the scene owns the zoom.
 *
 * `flexDirection: "row"` and `alignItems: "flex-start"` are stated explicitly —
 * AbsoluteFill defaults to `column` and `stretch`, either of which would pin the modal
 * to the wrong axis.
 */
export const HqSearchScene: React.FC<{ scale?: number; background?: string }> = ({
  scale,
  background = BACKDROP,
}) => {
  const frame = useCurrentFrame();
  const z = scale ?? (1920 - SIDE_MARGIN * 2) / HQ_SEARCH_W;

  // HQ search component animates up from the bottom across local frames 0 to 18 (global 2317 to 2335)
  const riseTravel = interpolate(frame, [0, 18], [950, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor stays at (77.9%, 50.0%) from 0 to 52, then animates over to
  // Centre X: 12.0%, Centre Y: 23.1% across frames 52 to 74, clicking at frame 74 (global 2391)
  const cursorTransit = interpolate(frame, [52, 74], [0, 1], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorArc =
    frame >= 52 && frame <= 74
      ? Math.sin(interpolate(frame, [52, 74], [0, Math.PI])) * -30
      : 0;

  const cursorX = interpolate(cursorTransit, [0, 1], [1920 * 0.779, 1920 * 0.12]);
  const cursorY = interpolate(cursorTransit, [0, 1], [1080 * 0.5, 1080 * 0.231]) + cursorArc;

  const cursorPress = interpolate(frame, [71, 74, 75], [1, 0.84, 0.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeNav = frame >= 73 ? "new-chat" : "search";

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
      <div
        style={{
          width: HQ_SEARCH_W * z,
          height: HQ_SEARCH_H * z,
          marginTop: TOP_MARGIN,
          transform: `translateY(${riseTravel}px)`,
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `scale(${z})`, transformOrigin: "top left" }}>
          <WorkvivoHqSearch activeNav={activeNav} />
        </div>
      </div>

      {/* Animated cursor: holds at (77.9%, 50.0%), travels to (12.0%, 23.1%), and clicks at global 2391 */}
      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          transform: `translate(-12px, -3.75px) scale(${cursorPress})`,
          transformOrigin: "12px 3.75px",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <Img
          src={staticFile("img/cursor.svg")}
          style={{
            width: 85.5,
            height: 85.5,
            filter: "brightness(0) drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

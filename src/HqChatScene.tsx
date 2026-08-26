import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  HQ_CHAT_H,
  HQ_CHAT_W,
  WorkvivoHqChat,
} from "./components/workvivo/WorkvivoHqChat";

/** Virgin red, the field the overlay floats on. */
const BACKDROP = "#E10A0A";
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const SIDE_MARGIN = 110;
const TOP_MARGIN = 72;

export interface HqChatSceneProps {
  brand?: string;
}

export const HqChatScene: React.FC<HqChatSceneProps> = ({
  brand = BACKDROP,
}) => {
  const frame = useCurrentFrame();
  const z = (1920 - SIDE_MARGIN * 2) / HQ_CHAT_W;

  // Scale down transition from Search to Chat across frames 0 to 18
  const containerScale = interpolate(frame, [0, 18], [1.0, 0.88], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const containerMarginTop = interpolate(frame, [0, 18], [72, 86], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const containerShadow = interpolate(frame, [0, 18], [0, 0.22], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor handoff: starts right at the "New chat" button where it clicked at global 2391, then gently lifts and fades
  const cursorOpacity = interpolate(frame, [0, 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorX = interpolate(frame, [0, 10], [1920 * 0.12, 1920 * 0.12 + 10], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, [0, 10], [1080 * 0.231, 1080 * 0.231 + 6], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: brand,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: HQ_CHAT_W * z,
          height: HQ_CHAT_H * z,
          marginTop: containerMarginTop,
          transform: `scale(${containerScale})`,
          transformOrigin: "top center",
          willChange: "transform",
          overflow: "hidden",
          borderRadius: 16,
          boxShadow: `0 24px 60px rgba(0, 0, 0, ${containerShadow})`,
        }}
      >
        <div style={{ transform: `scale(${z})`, transformOrigin: "top left" }}>
          <WorkvivoHqChat />
        </div>
      </div>

      {/* Seamless cursor handoff from previous click */}
      {frame <= 12 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: "translate(-12px, -3.75px)",
            transformOrigin: "12px 3.75px",
            opacity: cursorOpacity,
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
      )}
    </AbsoluteFill>
  );
};

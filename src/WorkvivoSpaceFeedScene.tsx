import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { WorkvivoSpaceFeed } from "./components/workvivo/WorkvivoSpaceFeed";
import "./components/workvivo/WorkvivoGlassEdge.css";

/** Same device box WorkvivoHomeContainer uses. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Cursor timing: global frame 4100 is local frame 34 (4100 - 4066). */
const CURSOR_IN = 18;
const CLICK_AT = 34;
const CLICK_TARGET_X = 0.804;
const CLICK_TARGET_Y = 0.643;

export interface WorkvivoSpaceFeedSceneProps {
  scale?: number;
  background?: string;
  entranceDuration?: number;
  entranceStartFrame?: number;
}

export const WorkvivoSpaceFeedScene: React.FC<WorkvivoSpaceFeedSceneProps> = ({
  scale,
  background,
  entranceDuration = 18,
  entranceStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = useCustomization();

  const bg = background ?? theme.brand;
  const z = scale ?? 0.965;

  // Entrance from bottom (translateY: 1050px -> 0px)
  const entranceY = interpolate(
    frame,
    [entranceStartFrame, entranceStartFrame + entranceDuration],
    [1050, 0],
    {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // cursor.svg point sits (12, 3.75) inside its 85.5px box
  const targetX = width * CLICK_TARGET_X - 12;
  const targetY = height * CLICK_TARGET_Y - 3.75;

  const cursorX = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [width * 0.95, targetX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorY = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [height * 0.85, targetY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorPress = interpolate(
    frame,
    [CLICK_AT - 3, CLICK_AT, CLICK_AT + 3],
    [1, 0.84, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const cursorOpacity = interpolate(frame, [CURSOR_IN, CURSOR_IN + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      <div
        className="wv-glass-edge"
        style={
          {
            position: "absolute",
            left: "50%",
            top: 112,
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            marginLeft: -DEVICE_WIDTH / 2,
            borderRadius: 36,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
            ["--wv-glass-radius" as string]: "36px",
            ["--wv-glass-width" as string]: "24px",
            transform: `translateY(${entranceY}px) scale(${z})`,
            transformOrigin: "center top",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
        <div style={{ borderRadius: 36, overflow: "hidden", height: DEVICE_HEIGHT }}>
          <WorkvivoSpaceFeed />
        </div>
      </div>

      {/* Cursor in Workvivo purple (#7F39F3) clicking at Centre X 80.4%, Centre Y 64.3% at global frame 4100 */}
      {frame >= CURSOR_IN && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorPress})`,
            transformOrigin: "12px 3.75px",
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <CursorArrow color="black"
            style={{
              width: 85.5,
              height: 85.5,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Stages the Space feed on the brand background.
 *
 * Needs a <CustomizationProvider> ABOVE it — it does not make its own. WorkvivoTopbar
 * reads the operator's logo and persona through the context and throws outside one, and a
 * prop-less provider added here would yield the BASELINE instead, quietly replacing the
 * operator's brand with the demo's. The cut supplies one; Root.tsx's `withCustomization`
 * supplies one to the standalone still.
 */

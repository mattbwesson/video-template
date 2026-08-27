import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import {
  WorkvivoSeerManagerInsights,
  WorkvivoSeerManagerInsightsProps,
} from "./components/workvivo/WorkvivoSeerManagerInsights";
import "./components/workvivo/WorkvivoGlassEdge.css";
import { GlassRing } from "./components/workvivo/GlassRing";

/** Same device box WorkvivoAdminHub and WorkvivoSeerRater use. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Cursor click on the Rater tab, at Centre X 33.2%, Centre Y 32.0% of the frame — global
 * 3790, local 32 (the scene mounts at 3758). Same convention as NewslettersRevealScene:
 * travels in from a bottom-right rest position, presses at CLICK_AT, holds after.
 */
const CURSOR_IN = 18;
const CLICK_AT = 32;
const CLICK_TARGET_X = 0.332;
const CLICK_TARGET_Y = 0.32;

export interface WorkvivoSeerManagerInsightsSceneProps
  extends WorkvivoSeerManagerInsightsProps {
  scale?: number;
  background?: string;
  entranceDuration?: number;
}

export const WorkvivoSeerManagerInsightsScene: React.FC<
  WorkvivoSeerManagerInsightsSceneProps
> = ({
  scale,
  background,
  entranceDuration = 18,
  ...props
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = useCustomization();

  const bg = background ?? theme.brand;
  // 1478 of the 1920 frame, which is what the reference frame at 3780 measures — the
  // device sits a little smaller and a little lower there than a 1560 fit puts it.
  const z = scale ?? 1478 / DEVICE_WIDTH;

  // Entrance from bottom (translateY: 1050px -> 0px)
  const entranceY = interpolate(frame, [0, entranceDuration], [1050, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // cursor.svg's point sits about (12, 3.75) inside its 85.5px box, so the click target
  // is offset by that much — the same correction LivestreamScene and
  // NewslettersRevealScene make.
  const targetX = width * CLICK_TARGET_X - 12;
  const targetY = height * CLICK_TARGET_Y - 3.75;

  const cursorX = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [width * 0.95, targetX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorY = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [height * 0.75, targetY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorPress = interpolate(
    frame,
    [CLICK_AT - 3, CLICK_AT, CLICK_AT + 3],
    [1, 0.84, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const cursorOpacity = interpolate(frame, [CURSOR_IN, CURSOR_IN + 6], [0, 1], {
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
            top: 176,
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            marginLeft: -DEVICE_WIDTH / 2,
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
            ["--wv-glass-radius" as string]: "16px",
            transform: `translateY(${entranceY}px) scale(${z})`,
            transformOrigin: "center top",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
          <GlassRing />
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <WorkvivoSeerManagerInsights {...props} />
        </div>
      </div>

      {/* Cursor in black clicking at Centre X 33.2%, Centre Y 32.0% at global frame 3790 */}
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
 * Stages the Seer Manager Insights (Engagement) dashboard on the brand field.
 *
 * Rises up from below the viewport with the signature Workvivo glass bezel,
 * matching the 3758 reference framing on Virgin red.
 */

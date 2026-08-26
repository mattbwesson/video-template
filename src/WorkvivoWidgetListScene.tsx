import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  WIDGET_LIST_W,
  WorkvivoWidgetList,
} from "./components/workvivo/WorkvivoWidgetList";
import { WorkvivoWidgetStore } from "./components/workvivo/WorkvivoWidgetStore";

const BACKDROP = "#C4291C";
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const ENTRANCE_EASE = Easing.bezier(0.51, 0.68, 0.48, 0.98);
const EXIT_EASE = Easing.bezier(0.4, 0, 0.9, 0.2);

export interface WorkvivoWidgetListSceneProps {
  brand?: string;
  /** Fraction of the frame width the list takes. The reference has it at 68.2%. */
  fill?: number;
  /**
   * How far the list is scrolled, in its own design points. The reference is caught
   * mid-scroll with the first card cut off at the top, which is what 56 gives.
   */
  scrollTop?: number;
  entranceDuration?: number;
  storeExitDuration?: number;
  exitFrom?: number;
  exitTo?: number;
}

/**
 * Stages the widget catalogue on the brand field.
 *
 * Cropped top and bottom on purpose: the reference is a scrolled view with the first
 * card running off above the frame and the last off below it. Fitting the whole list
 * into 1080 would change the crop rather than reproduce it.
 */
export const WorkvivoWidgetListScene: React.FC<WorkvivoWidgetListSceneProps> = ({
  brand = BACKDROP,
  fill = 0.682,
  scrollTop = 56,
  entranceDuration = 126,
  storeExitDuration = 18,
  exitFrom = 128,
  exitTo = 136,
}) => {
  const frame = useCurrentFrame();
  const z = (1920 * fill) / WIDGET_LIST_W;

  // Store modal animates down off-screen with 100% opacity and no fading across frames 0 to 18
  const storeExitY = interpolate(frame, [0, storeExitDuration], [0, 1300], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Entrance: Left row animates TOP DOWN (starts just off top edge at -1045px at frame 0, entering immediately on frame 1)
  const leftEntranceY = interpolate(frame, [0, entranceDuration], [-1045, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Entrance: Right row animates BOTTOM UP (starts just off bottom edge at +900px at frame 0, entering immediately on frame 1)
  const rightEntranceY = interpolate(frame, [0, entranceDuration], [900, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit at global 3011 (local 128) -> fully out by global 3019 (local 136)
  // Left row reverses direction (animates UP off-screen: 0 -> -1500px)
  const leftExitY = interpolate(frame, [exitFrom, exitTo], [0, -1500], {
    easing: EXIT_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Right row reverses direction (animates DOWN off-screen: 0 -> 1500px)
  const rightExitY = interpolate(frame, [exitFrom, exitTo], [0, 1500], {
    easing: EXIT_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Motion blur on the exit
  const exitBlur = interpolate(frame, [exitFrom, exitFrom + 4, exitTo], [0, 14, 28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftOffset = frame < exitFrom ? leftEntranceY : leftExitY;
  const rightOffset = frame < exitFrom ? rightEntranceY : rightExitY;

  const motionBlurFilter = frame >= exitFrom && exitBlur > 0.5 ? `blur(0px ${exitBlur}px)` : undefined;

  // Subtle scroll synced with entrance
  const currentScrollTop = interpolate(frame, [0, entranceDuration], [0, scrollTop], {
    easing: ENTRANCE_EASE,
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
      {/* Store modal sliding down off-screen */}
      {frame <= storeExitDuration + 2 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${storeExitY}px)`,
            willChange: "transform",
          }}
        >
          <WorkvivoWidgetStore brand={brand} />
        </AbsoluteFill>
      )}

      {/* Two rows of widgets entering and exiting with direction reversal and motion blur */}
      <div style={{ width: WIDGET_LIST_W * z, flex: "none", overflow: "hidden", zIndex: 2 }}>
        <div
          style={{
            transform: `scale(${z}) translateY(${-currentScrollTop}px)`,
            transformOrigin: "top left",
          }}
        >
          <WorkvivoWidgetList
            leftOffset={leftOffset}
            rightOffset={rightOffset}
            leftOpacity={1}
            rightOpacity={1}
            leftFilter={motionBlurFilter}
            rightFilter={motionBlurFilter}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { WorkvivoAnalytics } from "./components/workvivo/WorkvivoAnalytics";
import { DataMatrixField } from "./components/workvivo/DataMatrixField";
import "./components/workvivo/WorkvivoGlassEdge.css";

/** Same device box WorkvivoHomeContainer uses. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const EXIT_EASE = Easing.bezier(0.81, -0.01, 1.0, 0.3);

export interface WorkvivoAnalyticsSceneProps {
  scale?: number;
  background?: string;
  entranceDuration?: number;
  gaugeDuration?: number;
  originX?: number;
  originY?: number;
  panStartFrame?: number; // local frame 28 (global 3416)
  panDuration?: number;
  chartsStartFrame?: number; // local frame 44 (global 3432)
  zoomOutStartFrame?: number; // local frame 87 (global 3475)
  zoomOutDuration?: number;
  exitDownStartFrame?: number; // local frame 146 (global 3534)
  exitDownDuration?: number; // 37.5 frames (1500ms at 25fps)
}

/**
 * Stages Analytics & Reporting on the dark field.
 *
 * Needs a <CustomizationProvider> ABOVE it — it does not make its own. WorkvivoTopbar
 * reads the operator's logo and persona through the context and throws outside one, and a
 * prop-less provider added here would yield the BASELINE instead, quietly replacing the
 * operator's brand with the demo's. The cut supplies one; Root.tsx's `withCustomization`
 * supplies one to the standalone still.
 */
export const WorkvivoAnalyticsScene: React.FC<WorkvivoAnalyticsSceneProps> = ({
  scale,
  background = "#010320",
  entranceDuration = 18,
  gaugeDuration = 38, // Completes at global 3426 (3388 + 38 = 3426)
  originX = 1085,
  originY = 530,
  panStartFrame = 42, // Global 3430 (3388 + 42 = 3430)
  panDuration = 18,
  chartsStartFrame = 46, // Global 3434 (3388 + 46 = 3434)
  zoomOutStartFrame = 87, // Global 3475 (3388 + 87 = 3475)
  zoomOutDuration = 22,
  exitDownStartFrame = 146, // Global 3534 (3388 + 146 = 3534)
  exitDownDuration = 37.5, // 1500ms at 25fps
}) => {
  const frame = useCurrentFrame();
  // Calibrated initial zoom
  const z = scale ?? 1.33;

  // Entrance from bottom
  const entranceY = interpolate(frame, [0, entranceDuration], [1050, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gauge bars and percentage numbers animate up from 0 to 100% completing at frame 38 (global 3426)
  const gaugeProgress = interpolate(frame, [0, gaugeDuration], [0, 1], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // At global 3430 (local frame 42), move UI up and to the left to focus on the bar charts
  const panProgress = interpolate(
    frame,
    [panStartFrame, panStartFrame + panDuration],
    [0, 1],
    {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const panX = interpolate(panProgress, [0, 1], [0, -70]); // Subtler left pan
  const panY = interpolate(panProgress, [0, 1], [0, -480]); // Moderated upward pan

  // Whole segment for each bar graph animates in starting at global 3432 (local frame 44)
  const segmentStyle = (index: number): React.CSSProperties => {
    const start = chartsStartFrame + index * 5;
    const sOpacity = interpolate(frame, [start, start + 7], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const sY = interpolate(frame, [start, start + 10], [30, 0], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const sScale = interpolate(frame, [start, start + 10], [0.93, 1], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      opacity: sOpacity,
      transform: `translateY(${sY}px) scale(${sScale})`,
      transformOrigin: "center bottom",
      willChange: "transform, opacity",
    };
  };

  // Bar charts bars rise in
  const chartProgress = (index: number) => {
    const start = chartsStartFrame + index * 5 + 2;
    return interpolate(frame, [start, start + 14], [0, 1], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // At global 3475 (local frame 87), zoom out so the whole screen is visible and expand container
  const zoomOutProgress = interpolate(
    frame,
    [zoomOutStartFrame, zoomOutStartFrame + zoomOutDuration],
    [0, 1],
    {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const currentScale = interpolate(zoomOutProgress, [0, 1], [z, 0.70]); // 20% larger
  const finalPanX = interpolate(zoomOutProgress, [0, 1], [panX, 0]);
  const finalPanY = interpolate(zoomOutProgress, [0, 1], [panY, 180]); // Shifted 100px further up

  // Line charts animate in starting at global 3475 (local frame 87)
  const lineSegmentStyle = (index: number): React.CSSProperties => {
    const start = zoomOutStartFrame + index * 5;
    const sOpacity = interpolate(frame, [start, start + 7], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const sY = interpolate(frame, [start, start + 10], [30, 0], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const sScale = interpolate(frame, [start, start + 10], [0.93, 1], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      opacity: sOpacity,
      transform: `translateY(${sY}px) scale(${sScale})`,
      transformOrigin: "center bottom",
      willChange: "transform, opacity",
    };
  };

  const lineChartProgress = (index: number) => {
    const start = zoomOutStartFrame + index * 5 + 3;
    return interpolate(frame, [start, start + 18], [0, 1], {
      easing: SCENE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // At global 3534 (local frame 146), animate whole component down with cubic-bezier(0.81, -0.01, 1.00, 0.30) 1500ms
  const exitDownProgress = interpolate(
    frame,
    [exitDownStartFrame, exitDownStartFrame + exitDownDuration],
    [0, 1],
    {
      easing: EXIT_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const exitY = interpolate(exitDownProgress, [0, 1], [0, 1400]);

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
      {/* Procedural glowing data matrix wave field behind UI */}
      <DataMatrixField startFrame={98} peakFrame={120} endFrame={144} />

      <div
        className="wv-glass-edge"
        style={{
          width: DEVICE_WIDTH,
          borderRadius: 16,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.65)",
          ["--wv-glass-radius" as string]: "16px",
          transform: `translateY(${entranceY + finalPanY + exitY}px) translateX(${finalPanX}px) scale(${currentScale})`,
          transformOrigin: `${originX}px ${originY}px`,
          willChange: "transform",
        } as React.CSSProperties}
      >
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
            <WorkvivoAnalytics
              gaugeProgress={gaugeProgress}
              chartProgress={chartProgress}
              segmentStyle={segmentStyle}
              lineChartProgress={lineChartProgress}
              lineSegmentStyle={lineSegmentStyle}
            />
        </div>
      </div>
    </AbsoluteFill>
  );
};

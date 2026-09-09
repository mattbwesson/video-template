import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { WorkvivoAdminHub } from "./components/workvivo/WorkvivoAdminHub";
import "./components/workvivo/WorkvivoGlassEdge.css";
import { GlassRing } from "./components/workvivo/GlassRing";

const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export interface WorkvivoAdminHubSceneProps {
  /** Defaults to 1478/1760 matching the reference framing on #000021. */
  scale?: number;
  /** Background colour. Defaults to #000021. */
  background?: string;
  /** Duration of upward entrance animation in frames. Default 24. */
  entranceDuration?: number;
  /**
   * Local frame on which the hub starts dropping back out of frame. Its top edge is at
   * 128 settled and then, measured off the reference, 165, 379, 702, 875, 973, 1043 and
   * gone — fast through the middle, easing as it leaves. Omit to hold.
   */
  exitFrom?: number;
}

/** Top edge offset per frame from `exitFrom`, off the reference at 4584-4588. */
const EXIT_DROP = [37, 251, 574, 747, 845, 915, 960, 1000];

export const WorkvivoAdminHubScene: React.FC<WorkvivoAdminHubSceneProps> = ({
  scale,
  background = "#000021",
  entranceDuration = 24,
  exitFrom,
}) => {
  const frame = useCurrentFrame();
  const { theme } = useCustomization();

  const bg = background ?? "#000021";
  // 1478px of the 1920 frame matching the reference framing on #000021
  const z = scale ?? 1478 / DEVICE_WIDTH;

  // Entrance from bottom (translateY: 1050px -> 0px)
  const entranceY = interpolate(frame, [0, entranceDuration], [1050, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY =
    exitFrom !== undefined && frame >= exitFrom
      ? EXIT_DROP[Math.min(EXIT_DROP.length - 1, frame - exitFrom)]
      : 0;

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
            transform: `translateY(${entranceY + exitY}px) scale(${z})`,
            transformOrigin: "center top",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
          <GlassRing />
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <WorkvivoAdminHub />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Stages the Admin Hub device scaled down to 1478px on #000021 background matching the reference frame.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { WorkvivoSeerRater } from "./components/workvivo/WorkvivoSeerRater";
import "./components/workvivo/WorkvivoGlassEdge.css";

/** Same device box WorkvivoAdminHub and WorkvivoNewsletters use. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;

export interface WorkvivoSeerRaterSceneProps {
  /** Defaults to the largest scale that fits 1920x1080 with the device intact. */
  scale?: number;
  background?: string;
}

/**
 * Stages the Seer Insights Rater tab on the Workvivo page background.
 *
 * Needs a <CustomizationProvider> ABOVE it — it does not make its own. WorkvivoTopbar
 * reads the operator's logo and persona through the context and throws outside one, and a
 * prop-less provider added here would yield the BASELINE instead, quietly replacing the
 * operator's brand with the demo's. The cut supplies one; Root.tsx's `withCustomization`
 * supplies one to the standalone still.
 *
 * `flexDirection: "row"` and `alignItems: "center"` are stated explicitly — AbsoluteFill
 * defaults to `column` and `stretch` (see docs/PORTING-HTML-REFS.md).
 */
export const WorkvivoSeerRaterScene: React.FC<WorkvivoSeerRaterSceneProps> = ({
  scale,
  background = "#F3F4F6",
}) => {
  const z = scale ?? Math.min(1920 / DEVICE_WIDTH, 1080 / DEVICE_HEIGHT);

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
      {/* The standard glass edge — 16px radius, the default 10.5px band — the same
          bezel WorkvivoAnalyticsScene and the desktop home wear, so a Rater still reads
          as the same kind of window as every other standalone desktop screen. The host
          must not clip (its rings draw outside the box on negative inset), so the actual
          `overflow: hidden` lives on the inner wrapper instead. */}
      <div
        className="wv-glass-edge"
        style={
          {
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.65)",
            ["--wv-glass-radius" as string]: "16px",
            transform: `scale(${z})`,
          } as React.CSSProperties
        }
      >
        <div style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT, borderRadius: 16, overflow: "hidden" }}>
            <WorkvivoSeerRater />
        </div>
      </div>
    </AbsoluteFill>
  );
};

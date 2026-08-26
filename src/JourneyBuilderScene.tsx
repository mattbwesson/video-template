import React from "react";
import { AbsoluteFill } from "remotion";
import {
  JOURNEY_BOARD_H,
  JOURNEY_BOARD_W,
  WorkvivoJourneyBuilder,
} from "./components/workvivo/WorkvivoJourneyBuilder";

export interface JourneyBuilderSceneProps {
  /** Per-tenant brand colour — the field and the phone banner's burn. */
  brand?: string;
  /** Local frame the side palette starts arriving on. Omit for a static board. */
  columnsFrom?: number;
}

/**
 * Stages the Journeys builder board.
 *
 * The board is already authored at 1920x1080, so this is a straight mount rather than a
 * scaled device — the scale lives inside the phone, which is drawn at 393pt and scaled
 * once onto its screen.
 *
 * `flexDirection: "row"` and `alignItems: "center"` are stated explicitly — AbsoluteFill
 * defaults to `column` and `stretch` (see docs/PORTING-HTML-REFS.md).
 */
export const JourneyBuilderScene: React.FC<JourneyBuilderSceneProps> = ({
  brand = "#E10A0A",
  columnsFrom,
}) => (
  <AbsoluteFill
    style={{
      background: brand,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    }}
  >
    <div style={{ width: JOURNEY_BOARD_W, height: JOURNEY_BOARD_H, flex: "none" }}>
      <WorkvivoJourneyBuilder brand={brand} columnsFrom={columnsFrom} />
    </div>
  </AbsoluteFill>
);

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MobileClick } from "./components/workvivo";
import { WorkvivoMobileSpotlight } from "./components/workvivo/WorkvivoMobileSpotlight";
import "./components/workvivo/WorkvivoGlassEdge.css";

const PHONE_WIDTH = 393;
const PHONE_HEIGHT = 850;

/** The bezel, and with it the glass band — the same 16.5px WorkvivoMobileHome's .wm-phone
 *  uses, so the two phones in this cut have the same edge rather than two thicknesses. */
const BEZEL = 16.5;

/** The device including its bezel. This, not the screen, is what the framing below is
 *  measured against — the reference's phone is measured to its outer edge. */
const FRAME_WIDTH = PHONE_WIDTH + BEZEL * 2;
const FRAME_HEIGHT = PHONE_HEIGHT + BEZEL * 2;

/** .wms-phone is already 32px, and a bezel's inner radius is the outer minus its width, so
 *  the outer has to be 48.5 for the screen inside to keep the radius it was ported with. */
const FRAME_RADIUS = BEZEL + 32;

/** Where the reference edit puts the device on the 1920x1080 frame, measured off its own
 *  frame 1647: the bezel spans x 574-1344 and its top edge is on y 118. That is a device
 *  0.4 of the frame wide, sitting low enough to run off the bottom — which is the shot,
 *  not an accident of centring. */
const TARGET_FRAME_WIDTH = 770;
const TARGET_TOP = 118;

export interface WorkvivoMobileSpotlightSceneProps {
  scrollTop?: number;
  /** Overrides the reference framing's scale. The vertical placement follows it. */
  scale?: number;
  /**
   * The field the phone sits on. Defaults to the reference's Virgin red so the standalone
   * composition is unchanged; inside the cut it is passed `theme.brand`, so a customer run
   * gets its own colour here rather than Virgin's.
   */
  background?: string;
  /** Frame at which the mobile click occurs (local to this scene, default 35 / global 1665). Set to null or negative to disable. */
  clickFrame?: number | null;
  /** Animate the phone up on entrance (defaults to true). */
  animateUp?: boolean;
  /** Duration of the upward entrance animation in frames (defaults to 18). */
  riseFrames?: number;
  /** Distance the phone travels upward on entrance in pixels (defaults to 1050). */
  riseDistance?: number;
}

/**
 * Stages the mobile Spotlight screen on the field the reference shows it on.
 *
 * The device is framed as the reference edit frames it rather than fitted to the height:
 * 770px wide with its top edge on y 118, which is bigger than a fit-to-height phone and
 * sits low enough to run off the bottom of the frame.
 *
 * The <CustomizationProvider> is needed because the component reads the signed-in
 * persona's avatar through it.
 *
 * `flexDirection: "row"` and `alignItems: "center"` are stated explicitly — AbsoluteFill
 * defaults to `column` and `stretch` (see docs/PORTING-HTML-REFS.md).
 */
export const WorkvivoMobileSpotlightScene: React.FC<
  WorkvivoMobileSpotlightSceneProps
> = ({
  scrollTop = 0,
  scale,
  background = "#E10A0A",
  clickFrame = 35,
  animateUp = true,
  riseFrames = 18,
  riseDistance = 1050,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const z = scale ?? TARGET_FRAME_WIDTH / FRAME_WIDTH;

  // The device is centred by the flex row above it, so the drop is the distance from where
  // centring leaves its top edge to where the reference puts it. translateY is written to
  // the LEFT of scale so it reads in frame pixels rather than in scaled device ones.
  const dy = TARGET_TOP - (height - FRAME_HEIGHT * z) / 2;

  // Smooth upward entrance as the circular mask opens onto the scene
  const enterY = animateUp
    ? interpolate(frame, [0, riseFrames], [riseDistance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 0;

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
      {/* The glass edge goes on this wrapper rather than inside the component: the bezel IS
          this box's padding with .wv-glass-phone's band showing through it, and the screen
          starts a full bezel-width in. See WorkvivoGlassEdge.css. */}
      <div
        className="wv-glass-phone"
        style={
          {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            padding: BEZEL,
            boxSizing: "border-box",
            borderRadius: FRAME_RADIUS,
            transform: `translateY(${dy + enterY}px) scale(${z})`,
            transformOrigin: "center center",
            willChange: "transform",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.55)",
            ["--wv-glass-radius" as string]: `${FRAME_RADIUS}px`,
          } as React.CSSProperties
        }
      >
          <WorkvivoMobileSpotlight scrollTop={scrollTop} />
      </div>

      {/* Mobile click at local frame 35 (global 1665) at Centre X 62.7%, Centre Y 66.8% */}
      {clickFrame !== null && clickFrame !== undefined && clickFrame >= 0 && (
        <MobileClick
          startFrame={clickFrame}
          durationInFrames={10}
          x="62.7%"
          y="66.8%"
          zIndex={50}
        />
      )}
    </AbsoluteFill>
  );
};

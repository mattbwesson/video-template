import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { WorkvivoSpaces } from "./components/workvivo/WorkvivoSpaces";

/** Same curve every other scene transition in this cut uses. */
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Frames the panel takes to travel its own height. */
const WIPE_FRAMES = 20;

/** Natural width of the content pane WorkvivoSpaces draws. */
const PANE_WIDTH = 1320;
/** Seats the 1320 pane in 1600 of the 1920 frame. */
const PANE_SCALE = 1600 / PANE_WIDTH;
/** Pane's top edge before it is scaled, and its resulting left edge on the frame. */
const PANE_TOP = 56;
const PANE_LEFT = 960 - (PANE_WIDTH / 2) * PANE_SCALE;

// --- beats, all local to this scene (it starts at global 1468) ------------------
const SCROLL_START = 26;
const SCROLL_FRAMES = 30;
/**
 * How far the pane scrolls, in its own unscaled pixels.
 *
 * "Annual Employee Summit" is the middle card of row two. Down the pane that is
 * banner 250 + header block 64 + row one 329 + 24 gap = 667 to the row's top, and the card
 * is 329 tall, so its centre sits at 832. Scrolling 420 brings that to
 * 56 + (832 - 420) * 1.2121 = 555 on the frame — mid-height, where the click reads.
 */
const SCROLL_TO = 420;

const CURSOR_IN = 40;
/** Global 1545. */
const CLICK_AT = 77;

/** Card-five centre once the scroll has settled. */
const TARGET_X = PANE_LEFT + (312 + 24 + 156) * PANE_SCALE;
const TARGET_Y = PANE_TOP + (832 - SCROLL_TO) * PANE_SCALE;
/**
 * cursor.svg's point sits about (12, 3.75) inside its 85.5px box, so the image's top-left
 * is offset from the thing being clicked — same correction LivestreamScene makes.
 */
const CURSOR_X = TARGET_X - 12;
const CURSOR_Y = TARGET_Y - 3.75;

export interface SpacesRevealSceneProps {
  scale?: number;
}

/**
 * The Spaces directory arriving on a dark field, then scrolling to Annual Employee Summit
 * and being clicked.
 *
 * No cross-fade on the entrance: the panel is fully opaque for the whole travel and simply
 * translates in, so it reads as a card pushed up rather than dissolving over the scene
 * beneath. Opacity is never touched — that is the point of the transition.
 *
 * The click at local 77 (global 1545) is the last thing that happens here; the cut to
 * WorkvivoSpacePage follows it in WorkvivoCut, which is why this sequence is short.
 */
export const SpacesRevealScene: React.FC<SpacesRevealSceneProps> = ({ scale }) => {
  const frame = useCurrentFrame();
  const z = scale ?? PANE_SCALE;

  // 1 -> fully below the frame, 0 -> seated.
  const travel = interpolate(frame, [0, WIPE_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const scrollTop = interpolate(
    frame,
    [SCROLL_START, SCROLL_START + SCROLL_FRAMES],
    [0, SCROLL_TO],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCENE_EASE },
  );

  // Glides in from off-frame right and lands on the card as the scroll settles.
  const cursorX = interpolate(frame, [CURSOR_IN, CLICK_AT - 8], [2010, CURSOR_X], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });
  const cursorY = interpolate(frame, [CURSOR_IN, CLICK_AT - 8], [880, CURSOR_Y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });
  // Press and release around the click frame.
  const cursorPress = interpolate(
    frame,
    [CLICK_AT - 3, CLICK_AT, CLICK_AT + 3],
    [1, 0.86, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Subtle scale-down after click leading into the 1549 Space page cut
  const exitScale = interpolate(frame, [74, 80], [1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: "#010224",
          transform: `translateY(${travel * 1080}px)`,
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: PANE_TOP,
            width: PANE_WIDTH,
            marginLeft: -PANE_WIDTH / 2,
            transform: `scale(${z * exitScale}) translateY(${-scrollTop}px)`,
            transformOrigin: "center 40%",
          }}
        >
          <WorkvivoSpaces />
        </div>

        {/* No press feedback on the card. There was a purple ring here — a 3px
            rgba(97,3,237) box-shadow pulsed over ~6 frames on the click — and at this
            speed it read as a stray stroke flashing on screen rather than as a button
            responding. The cursor's own scale-down still carries the click. */}
      </AbsoluteFill>

      {/* Cursor sits outside the wiping panel — it is on the viewer's screen, not in the
          product, so it must not ride the entrance transform. */}
      {frame >= CURSOR_IN && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorPress})`,
            transformOrigin: "top left",
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

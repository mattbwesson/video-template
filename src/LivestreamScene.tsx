import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MobileClick, WorkvivoLiveReplay, WorkvivoLivestream } from "./components/workvivo";
import { useCustomization } from "./customize/CustomizationProvider";

/**
 * The desktop livestream player on the brand colour, revealed as the closing circular mask on
 * VirginWorkvivoDesktopFullscreenScene shrinks to nothing at global 1285, then handing off to
 * the mobile live-replay screen.
 *
 * This scene sits BELOW that one in VirginAirline's tree.
 *
 * Both screens are native components (ported from public/refs/workvivo-livestream.html and
 * workvivo-live-replay.html). They were <IFrame>s until the ports landed, which is why the
 * old code needed `?transparent=1` on each ref to stop a baked-in #E30613 page fill covering
 * the green, and why each had to be mounted early to give the document time to load. Neither
 * applies now: the components draw on transparent ground and paint on their first frame.
 */

const STAGE_HEIGHT = 1080;

/** The refs' <body> rules — `display:flex; justify-content:center; padding:<v> <h>` — were
 *  what positioned each screen inside its iframe. The ports are bare frames, so the stage
 *  reproduces that centring here. Keeping the exact padding values keeps the geometry
 *  identical to the iframe era, which the pill measurements below depend on.
 *
 *  flexDirection MUST be stated: AbsoluteFill defaults to `column`, where justifyContent
 *  would centre vertically and leave the screen pinned to the left padding. The refs' <body>
 *  was the CSS default `row`. alignItems is flex-start for the same reason `body` had nothing
 *  to stretch against — the page was content-height, whereas an AbsoluteFill is a full 1080. */
const stage = (padding: string): React.CSSProperties => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
  padding,
});

const LIVESTREAM_STAGE: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
};
const REPLAY_STAGE = stage("40px 20px");

const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// --- entrance ---------------------------------------------------------------
// The livestream frame rises from below and is settled by local 20. Only the frame moves —
// the brand field behind it is static, so the panel slides up ONTO the brand colour rather
// than dragging it along.
//
// This scene starts at global 1275 but is not visible until the mask above it opens at
// global 1285 (local 10), so the first half of the travel plays behind that mask. On the
// house ease that is deliberate: by the time the mask opens the frame is already most of
// the way up and still moving, so the reveal lands on motion rather than on a static card.
const ENTER_END = 20;

// --- the replay swap ---------------------------------------------------------
// At local 75 the livestream leaves SIDEWAYS while workvivo-live-replay.html rises from
// below — two axes, so the two frames never overlap or cross each other on the way past.
// Both ride one progress curve, the same way the quote card hands off to the settings panel.
// The brand field stays put through it, as it does for the entrance.
const REPLAY_SWAP_START = 75;
const REPLAY_SWAP_END = 91;

// --- opening the comments panel -----------------------------------------------
// The stream comes up with the panel collapsed. At local 22 the cursor enters, reaches
// the expand control on local 30 (global 1305), clicks, and the panel wipes open —
// leaving it on screen until the replay swap takes over at local 75.
const CURSOR_IN = 22;
const PANEL_CLICK = 30;
const PANEL_OPEN_END = 44;

/** Top-left of the cursor image at the moment of the click. Not the button's centre:
 *  cursor.svg's point sits about (12, 3.75) inside its 85.5px box, so this is the button
 *  centre (1554, 170) less that inset when vertically centered in 1080p stage. */
const EXPAND_BTN = { x: 1542, y: 166 };

// --- clicking the Key Business Results chapter --------------------------------
// At local 150 (global 1425), the mobile tap clicks "Key Business Results" in the Chapters
// sheet, activating the third chapter and switching the video to webinar2.mp4.
const CHAPTER_CLICK = 150;
const CHAPTER_CLICK_DURATION = 10;
const CHAPTER_BTN_X = "31.4%";
const CHAPTER_BTN_Y = "96.5%";

/** How the replay comes to rest: half again as big, and dropped 400px from where the
 *  reference's own centring puts it. Scaled about the stage centre, then shifted — so the
 *  phone grows in place and only then moves down, rather than the scale amplifying the
 *  offset. The bottom of the phone runs off-frame at this size, which is intended. */
const REPLAY_SCALE = 1.65;
const REPLAY_REST_Y = 400;

// --- the feature pills --------------------------------------------------------
// At local 105 the phone slides left and three pills fan out from behind it to the right.
//
// The phone is 393px wide (border-box, so the 7px bezel is inside that), centred in the
// 1920 stage at 763.5 -> 1156.5 and then scaled 1.5x about the stage centre, putting its
// resting right edge on 1254.75. The clip line below is set at 1265 — about 10px to the
// RIGHT of that edge, i.e. deliberately conservative: erring outward keeps a pill hidden a
// fraction longer, where erring inward would let one peek past the bezel.
const PHONE_RIGHT_AT_REST = 1265;
const PHONE_SHIFT_X = -400;

const PILL_SHIFT_START = 105;
const PILL_MOVE_FRAMES = 16;

// The status pill draws attention to itself once the row has settled: a slight scale up
// and back, and a highlight travelling one full lap of its rim, both across 145 -> 185.
//
// Frame-driven rather than a CSS @keyframes: keyframes run on wall-clock time, so in a
// render each frame is captured independently and the animation either sits at its start
// or lands somewhere arbitrary. See docs/PORTING-HTML-REFS.md.
const PILL_PULSE_START = 145;
const PILL_PULSE_END = 185;
const PILL_PULSE_MID = (PILL_PULSE_START + PILL_PULSE_END) / 2;
/** Peak scale. Deliberately small — this is a nudge, not a bounce. */
const PILL_PULSE_SCALE = 1.055;
/** How far the glow ring sits outside the pill's own box. */
const PILL_GLOW_SPREAD = 5;

type Pill = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  /** Filled white with dark type (the status pill) vs. outlined with white type. */
  filled?: boolean;
  /** Frames after PILL_SHIFT_START that this pill starts moving — they fan, not fire together. */
  delay: number;
};

/**
 * Geometry only — the labels come from `copy.livestream.pills`, in this order.
 *
 * `width` is fixed rather than shrink-to-fit because the reveal depends on it: a pill
 * starts tucked so its RIGHT edge sits on the phone's resting right edge, and that start
 * position is computed from the width below. An auto-width pill would have no width to
 * compute from until after layout, so the copy cap (19 chars) is what keeps a label
 * inside its box.
 */
const PILLS: Omit<Pill, "label">[] = [
  { left: 1228, top: 241, width: 433, height: 93, fontSize: 44, filled: true, delay: 0 },
  { left: 989, top: 386, width: 606, height: 147, fontSize: 56, delay: 6 },
  { left: 1161, top: 594, width: 673, height: 148, fontSize: 56, delay: 12 },
];

const PILL_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

/** Four-point sparkle, with the smaller companion the reference sets above and right of it. */
const Sparkle: React.FC<{ size: number }> = ({ size }) => (
  <svg
    viewBox="0 0 32 32"
    width={size}
    height={size}
    style={{ flex: "none", display: "block" }}
  >
    <path
      d="M13 3 C14.2 11 17 13.8 25 15 C17 16.2 14.2 19 13 27 C11.8 19 9 16.2 1 15 C9 13.8 11.8 11 13 3 Z"
      fill="#FFFFFF"
    />
    <path
      d="M25.5 2 C26 5.2 27.3 6.5 30.5 7 C27.3 7.5 26 8.8 25.5 12 C25 8.8 23.7 7.5 20.5 7 C23.7 6.5 25 5.2 25.5 2 Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const LivestreamScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { copy, theme } = useCustomization();
  const pills: Pill[] = PILLS.map((geometry, i) => ({
    ...geometry,
    label: copy.livestream.pills[i],
  }));

  const enterY = interpolate(frame, [0, ENTER_END], [STAGE_HEIGHT, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const swap = interpolate(frame, [REPLAY_SWAP_START, REPLAY_SWAP_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  // Exits a full stage-width left, so the 1280px frame centred inside it clears the edge.
  const exitX = interpolate(swap, [0, 1], [0, -1920]);
  const replayY = interpolate(swap, [0, 1], [STAGE_HEIGHT, 0]);

  const phoneShiftX = interpolate(
    frame,
    [PILL_SHIFT_START, PILL_SHIFT_START + PILL_MOVE_FRAMES],
    [0, PHONE_SHIFT_X],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCENE_EASE },
  );

  const panelOpen = interpolate(frame, [PANEL_CLICK, PANEL_OPEN_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  // Cursor glides in from off-frame right and lands on the control.
  const cursorX = interpolate(frame, [CURSOR_IN, PANEL_CLICK], [1980, EXPAND_BTN.x], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.3, 1),
  });
  const cursorY = interpolate(frame, [CURSOR_IN, PANEL_CLICK], [430, EXPAND_BTN.y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.3, 1),
  });
  const cursorPress = interpolate(
    frame,
    [PANEL_CLICK, PANEL_CLICK + 2, PANEL_CLICK + 4],
    [1, 0.82, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // Leaves once the panel has opened, well before the replay swap.
  const cursorOpacity = interpolate(
    frame,
    [CURSOR_IN, CURSOR_IN + 3, PANEL_OPEN_END + 2, PANEL_OPEN_END + 8],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );



  // The pills are clipped to the phone's CURRENT right edge, not its final one. That single
  // line is what sells "from behind it": while the phone is still travelling the clip travels
  // with it, so a pill is never visible in the gap the phone has already vacated.
  const phoneRightNow = PHONE_RIGHT_AT_REST + phoneShiftX;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.brand, overflow: "hidden" }}>
      {/* Livestream: rises on Y, then leaves on X. Unmounted once it is fully off-frame
          rather than left parked off-canvas, where it would keep paying for layout and
          paint while contributing nothing. */}
      {frame <= REPLAY_SWAP_END && (
        <AbsoluteFill
          style={{ ...LIVESTREAM_STAGE, transform: `translate(${exitX}px, ${enterY}px)` }}
        >
          <WorkvivoLivestream panelOpen={panelOpen} />
        </AbsoluteFill>
      )}

      {/* Cursor sits OUTSIDE the livestream stage so it does not ride the entrance /
          exit transforms — it is on the viewer's screen, not in the product. */}
      {frame >= CURSOR_IN && frame <= PANEL_OPEN_END + 8 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorPress})`,
            transformOrigin: "top left",
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <CursorArrow color="white"
            style={{
              width: 85.5,
              height: 85.5,
            }}
          />
        </div>
      )}

      {/* Mobile click on Key Business Results chapter at local 155 (global 1430) */}
      <MobileClick
        startFrame={CHAPTER_CLICK}
        durationInFrames={CHAPTER_CLICK_DURATION}
        x={CHAPTER_BTN_X}
        y={CHAPTER_BTN_Y}
        zIndex={50}
      />

      {/* Pills sit BELOW the phone and are clipped to its right edge, so they are hidden
          both ways — occluded by the device where they overlap it, and cut off by the clip
          where they would otherwise poke out past its left side. */}
      {frame >= PILL_SHIFT_START && (
        <AbsoluteFill style={{ clipPath: `inset(0px 0px 0px ${phoneRightNow}px)` }}>
          {pills.map((pill) => {
            const start = PILL_SHIFT_START + pill.delay;
            const progress = interpolate(
              frame,
              [start, start + PILL_MOVE_FRAMES],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCENE_EASE },
            );
            // Starts tucked so its RIGHT edge is on the phone's resting right edge, i.e.
            // entirely inside the clip, then travels out to its measured resting left.
            const hiddenX = PHONE_RIGHT_AT_REST + PHONE_SHIFT_X - pill.left - pill.width;
            const x = interpolate(progress, [0, 1], [hiddenX, 0]);

            // Only the filled status pill pulses. Eased per half so the ease-out on the way
            // up and the ease-in on the way down are separate curves, not one curve stretched
            // across both — easing the whole span once gives visibly different motion.
            const pulseT = pill.filled
              ? frame <= PILL_PULSE_MID
                ? interpolate(frame, [PILL_PULSE_START, PILL_PULSE_MID], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: SCENE_EASE,
                  })
                : interpolate(frame, [PILL_PULSE_MID, PILL_PULSE_END], [1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: SCENE_EASE,
                  })
              : 0;
            const scale = 1 + (PILL_PULSE_SCALE - 1) * pulseT;

            // One full lap, linear, so the highlight travels at a constant rate rather than
            // hesitating at the ends.
            const glowAngle = interpolate(
              frame,
              [PILL_PULSE_START, PILL_PULSE_END],
              [0, 360],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            // Faded at both ends so the ring does not pop on at full strength.
            const glowOpacity = pill.filled
              ? interpolate(
                  frame,
                  [PILL_PULSE_START, PILL_PULSE_START + 8, PILL_PULSE_END - 8, PILL_PULSE_END],
                  [0, 1, 1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                )
              : 0;
            const transform = `translateX(${x}px) scale(${scale})`;

            return (
              <React.Fragment key={pill.label}>
                {glowOpacity > 0 && (
                  // A conic gradient behind the pill, showing only through the few pixels of
                  // margin around it — the opaque pill covers the middle, so what reads is a
                  // bright arc sweeping the rim. White, so it only registers where it spills
                  // onto the brand colour: a rim light rather than a coloured ring.
                  <div
                    style={{
                      position: "absolute",
                      left: pill.left - PILL_GLOW_SPREAD,
                      top: pill.top - PILL_GLOW_SPREAD,
                      width: pill.width + PILL_GLOW_SPREAD * 2,
                      height: pill.height + PILL_GLOW_SPREAD * 2,
                      transform,
                      transformOrigin: "center center",
                      borderRadius: (pill.height + PILL_GLOW_SPREAD * 2) / 2,
                      background: `conic-gradient(from ${glowAngle}deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 275deg, rgba(255,255,255,0.85) 325deg, #FFFFFF 350deg, rgba(255,255,255,0) 360deg)`,
                      filter: "blur(5px)",
                      opacity: glowOpacity,
                    }}
                  />
                )}
              <div
                style={{
                  position: "absolute",
                  left: pill.left,
                  top: pill.top,
                  width: pill.width,
                  height: pill.height,
                  transform,
                  transformOrigin: "center center",
                  borderRadius: pill.height / 2,
                  background: pill.filled ? "#FFFFFF" : "transparent",
                  border: pill.filled ? "none" : "3px solid rgba(255,255,255,0.95)",
                  color: pill.filled ? "#0A1A33" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 24,
                  fontFamily: PILL_FONT,
                  fontSize: pill.fontSize,
                  fontWeight: 700,
                  letterSpacing: pill.filled ? 1 : -0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {!pill.filled && <Sparkle size={pill.fontSize * 0.95} />}
                {pill.label}
              </div>
              </React.Fragment>
            );
          })}
        </AbsoluteFill>
      )}

      {frame >= REPLAY_SWAP_START && (
        <AbsoluteFill
          style={{
            ...REPLAY_STAGE,
            transform: `translate(${phoneShiftX}px, ${REPLAY_REST_Y + replayY}px) scale(${REPLAY_SCALE})`,
            transformOrigin: "center center",
          }}
        >
          <Sequence from={REPLAY_SWAP_START} layout="none">
            <WorkvivoLiveReplay
              activeChapterIndex={frame >= CHAPTER_CLICK ? 2 : 1}
              videoSrc={frame >= CHAPTER_CLICK ? "img/webinar2.mp4" : "img/webinar.mp4"}
              chapterClickFrame={CHAPTER_CLICK - REPLAY_SWAP_START}
            />
          </Sequence>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

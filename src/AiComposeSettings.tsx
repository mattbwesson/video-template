import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SETTINGS_SWAP_START, settingsSwapProgress } from "./QuoteCard";
import { WorkvivoAiComposeSettings } from "./components/workvivo/WorkvivoAiComposeSettings";

/**
 * The AI Compose Settings panel, rising from below the frame as the quote card is pushed off
 * the top — one swap, both halves on `settingsSwapProgress` so they can never drift apart.
 *
 * At global frame 1213 (local frame 325), the UI animates up on curve cubic-bezier(0.34, 0.47, 0.15, 0.92)
 * easing into its final hero position at global frame 1255 (local frame 367), followed by the purple
 * cursor clicking the CEO Voice toggle switch.
 */

const REST_SCALE = 2.15;
const REST_LEFT = 210;
const REST_TOP = 132;

/** Enough to park the scaled panel's top edge below the 1080 frame before it rises. */
const ENTER_TRAVEL_Y = 1080;

/**
 * Where the pointer's TIP comes to rest, in stage pixels.
 *
 * Measured off the frame rather than guessed: the CEO Voice toggle's pill spans x
 * 1390-1523 and y 458-530, so its centre is (1456, 494).
 *
 * The tip sits BELOW that centre on purpose. The pointer is #7000FF and the toggle, once
 * on, is Workvivo's own purple — at the pill's mid-line the two merge into one shape and
 * the point disappears into the thing it is pressing. Dropping it into the pill's lower
 * half keeps the arrow's body over the white row beneath, so the tip reads against an
 * edge instead of against itself.
 */
const CURSOR_TIP_X = 1424.9;
const CURSOR_TIP_Y = 523;

/**
 * Tip -> box centre, which is what the element is actually positioned by.
 *
 * The SVG is placed with `translate(-50%, -50%)`, so `top`/`left` address the centre of
 * its 85 x 93.75 box, while the arrow's point is at (90.03, 0.04) of the 938.07 x 1041.37
 * viewBox — i.e. 8.2px right of the box's left edge and level with its top. Stating the
 * offset here is what lets the constants above be the thing being aimed at; the old code
 * carried the box centre directly and there was nothing to say how it related to the
 * toggle, which is how it came to sit half a pill too high.
 */
const CURSOR_TIP_DX = (90.03 / 938.07) * 85;
const CURSOR_REST_X = CURSOR_TIP_X + 85 / 2 - CURSOR_TIP_DX;
const CURSOR_REST_Y = CURSOR_TIP_Y + 93.75 / 2;

/** Push animation from global 1213 (local 325) to global 1255 (local 367) */
const PUSH_START = 325;
const PUSH_END = 367;
const PUSH_EASE = Easing.bezier(0.34, 0.47, 0.15, 0.92);
const PUSH_TRAVEL_Y = -1050;

export const AiComposeSettings: React.FC = () => {
  const frame = useCurrentFrame();

  // Initial rise at local 286
  const enterY = interpolate(settingsSwapProgress(frame), [0, 1], [ENTER_TRAVEL_Y, 0]);

  // Second push up at local 325 to 367
  const pushProgress = interpolate(frame, [PUSH_START, PUSH_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: PUSH_EASE,
  });
  const pushY = interpolate(pushProgress, [0, 1], [0, PUSH_TRAVEL_Y]);
  const totalY = enterY + pushY;

  // Cursor glide-in to CEO Voice toggle switch starting at global 1240 (local 352), landing at global 1255 (local 367)
  const cursorProgress = interpolate(frame, [352, 367], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.3, 1),
  });

  const cursorX = interpolate(cursorProgress, [0, 1], [1750, CURSOR_REST_X]);
  const cursorY = interpolate(cursorProgress, [0, 1], [850, CURSOR_REST_Y]);
  const cursorOpacity = interpolate(frame, [352, 356, 385, 394], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorClick = interpolate(frame, [372, 374, 376], [1, 0.84, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ceoVoiceOn = frame >= 374;

  if (frame < SETTINGS_SWAP_START) return null;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: REST_LEFT,
          top: REST_TOP,
          transform: `translateY(${totalY}px) scale(${REST_SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        <WorkvivoAiComposeSettings ceoVoiceOn={ceoVoiceOn} />
      </div>

      {/* Purple Cursor gliding to CEO Voice toggle switch (25% bigger, starts global 1240) */}
      {frame >= 352 && frame <= 394 && (
        <div
          style={{
            position: "absolute",
            top: cursorY,
            left: cursorX,
            transform: `translate(-50%, -50%) scale(${cursorClick})`,
            transformOrigin: "center center",
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <svg
            viewBox="0 0 938.07 1041.37"
            style={{
              width: 85,
              height: 93.75,
              fill: "#7000FF",
              filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))",
            }}
          >
            <path d="M90.03.04c16.97-.65,32.79,6.47,48.24,15.24,197.2,111.95,394.45,223.83,591.68,335.73,54.31,30.81,108.87,61.21,162.85,92.59,39.07,22.71,54.48,64.61,39.8,105.86-10.96,30.81-32.71,50.36-64.93,56.56-109.14,20.99-218.32,41.77-327.6,62-30.62,5.67-53.03,21.08-69.12,47.68-56.69,93.76-113.69,187.33-171,280.71-32.85,53.53-103.89,60.37-143.72,14.52-11.52-13.26-17.79-28.88-20.46-45.92-26.74-170.98-53.28-341.99-80-512.97C37.77,336.79,19.8,221.54,1.33,106.37-7.9,48.79,31.8-.09,90.03.04Z" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};

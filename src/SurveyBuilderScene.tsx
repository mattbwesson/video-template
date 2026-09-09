import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CursorArrow } from "./components/CursorArrow";
import {
  MODAL_H_COLLAPSED,
  MODAL_H_EXPANDED,
  PANEL,
  WorkvivoAddQuestionPanel,
  WorkvivoQuestionActionBar,
  WorkvivoSurveyAiModal,
} from "./components/workvivo/WorkvivoSurveyBuilder";

/**
 * Surveys & Forms — global 4253 to 4397.
 *
 * The AI generate modal opens on its own, a suggestion is picked, the survey is generated,
 * and the card then shrinks aside to make room for the Add Question palette and the
 * per-question action bar. It was reference footage; it is now the component, so the copy
 * customises and translates with the rest of the film.
 *
 * THE BEAT, MEASURED
 * The whole thing is one layout being moved and scaled, not several. Tracking the modal's
 * white rectangle frame by frame gives four phases:
 *
 *   4253-4265  the card scales in, 1.07x -> 1.563x, and settles centred
 *   4265-4313  it holds while a suggestion is chosen and the prompt is submitted
 *   4314-4326  it grows: the body appears and the card's height runs 367 -> 820 units,
 *              which at 1.563x is 1282px and taller than the frame, so it is clipped
 *   4331-4392  it scales back to 1.0x and settles into the right-hand column while the
 *              palette and the action bar slide up on the left
 *
 * WHY THE MODAL IS DRIVEN BY THREE TABLES AND NOT A TRANSFORM
 * Its left edge, top edge and scale do not share one origin — the card grows upward as it
 * expands (top 254 -> 127) while its left edge holds, then the left edge travels 390 -> 816
 * while the top barely moves. Expressed as a scale about some point that would need an
 * origin that itself moves, which is two fitted curves instead of three measured ones.
 * Every number below is read off the reference.
 */

export const SURVEY_FROM = 4253;
export const SURVEY_TO = 4397;
export const SURVEY_DURATION = SURVEY_TO - SURVEY_FROM;

type Table = [number, number][];

/** Modal width over the design width of 741, i.e. its scale. */
const SCALE: Table = [
  // The open is an ease-out and it finishes at 4261, not 4265 — three points across it
  // read as a straight ramp and arrived visibly big. Every frame of it is listed.
  [4253, 1.072], [4254, 1.242], [4255, 1.355], [4256, 1.433], [4257, 1.487],
  [4258, 1.522], [4259, 1.547], [4260, 1.557], [4261, 1.563], [4331, 1.563], [4337, 1.541],
  [4343, 1.468], [4346, 1.382], [4349, 1.175], [4352, 1.04], [4355, 1.021],
  [4374, 1.021], [4392, 1.0], [4396, 0.985],
];
/** Modal left edge, in frame pixels. */
const LEFT: Table = [
  [4253, 572], [4254, 509], [4255, 467], [4256, 438], [4257, 418], [4258, 405],
  [4259, 396], [4260, 392], [4261, 390], [4331, 390], [4337, 407], [4343, 464],
  [4346, 531], [4349, 693], [4352, 798], [4355, 813], [4374, 813], [4392, 816],
  [4396, 818],
];
/** Modal top edge, in frame pixels. It rises as the card grows. */
const TOP: Table = [
  [4253, 350], [4254, 317], [4255, 295], [4256, 280], [4257, 269], [4258, 262],
  [4259, 258], [4260, 255], [4261, 254], [4314, 254], [4316, 252], [4317, 216],
  [4318, 176], [4319, 156], [4320, 145], [4321, 137], [4322, 132], [4323, 129],
  [4325, 127], [4349, 127], [4352, 126], [4374, 126], [4392, 135], [4396, 141],
];
/** Card height in design units. */
const HEIGHT: Table = [
  [4314, MODAL_H_COLLAPSED], [4316, 500], [4318, 660], [4320, 750], [4323, 800],
  [4326, MODAL_H_EXPANDED],
];
/** The generated survey fading up inside the growing card. */
const BODY: Table = [[4314, 0], [4317, 1]];

/**
 * The suggestion fills at 4288. Measured, not guessed: the purple area in the pill row runs
 * about 3,970px² while only the outline is drawn and jumps to 15,895 on 4288. The first
 * value here was 4281, read off a contact sheet sampled every twelve frames, which put the
 * pill in seven frames before the click that causes it.
 */
const PILL_AT = 4288;
/**
 * The button's label changes at 4315, not on the click at 4313.
 *
 * Measured on its width, which is the tell: the pill is 145px across while it reads
 * "Submit" and 209 for "Redo Survey". It holds at 145 through 4314 and the swap itself
 * happens off-screen — the card grows past the frame's bottom edge from 4315 and the
 * button, which is anchored to the card's bottom, goes with it. Flipping on the click put
 * "Redo Survey" on screen for two frames before the survey it refers to existed.
 */
const SUBMIT_AT = 4315;

/**
 * The left column slides up into place, every frame of it measured off the palette's own
 * top edge. It arrives at FULL SIZE and travels — it does not scale in — so this is a
 * translate. The travel is much larger than it looks: 738px below its rest at 4351, easing
 * to nothing by 4364. Sampling it at four points, which is what this was first, put it
 * roughly 300px out in the middle of the move.
 */
const PANEL_Y: Table = [
  [4351, 738], [4352, 502], [4353, 350], [4354, 251], [4355, 180], [4356, 127],
  [4357, 88], [4358, 58], [4359, 35], [4360, 18], [4361, 6], [4362, -2],
  [4363, -6], [4364, -8], [4396, -8],
];
const PANEL_IN: Table = [[4350, 0], [4351, 1]];
/**
 * The action bar travels on its OWN clock, about seven frames behind the palette — it is
 * still 194px low when the palette is 58 low, and it settles at 4367 against the palette's
 * 4364. Sharing one translate put it 78px out of place in the middle of the move.
 */
const BAR_Y: Table = [
  [4353, 420], [4355, 330], [4357, 250], [4358, 194], [4359, 142], [4360, 102],
  [4361, 72], [4362, 49], [4363, 33], [4364, 21], [4365, 13], [4366, 8],
  [4367, 7], [4396, 7],
];

/**
 * The whole screen settles at the end — the modal's width goes 757 -> 741 and the
 * palette's 388 -> 380 over the same frames, which is one number, not two. It does not
 * stop at the design size either: the shot keeps easing in past 4392, reaching 0.985 by
 * the cut at 4396, so the table runs to the end of the beat rather than to the frame the
 * layout was measured at.
 */
const SETTLE: Table = [[4374, 1.021], [4392, 1.0], [4396, 0.985]];

/**
 * The pointer, tracked frame by frame off its own solid black shape — the one thing on the
 * white card dense enough to find without catching type. The bounding box is 55x63, which
 * is CursorArrow at 56 wide.
 *
 * It appears at 4272 already fully formed and already moving up-left, so the four frames
 * before that are an entrance rather than a measurement: it fades in along the same path it
 * is already on. Everything from 4272 is the reference's own track.
 *
 * It leaves at 4319, before the card starts to shrink, so it never has to be reconciled
 * with the modal's own transform — the pointer is drawn in frame pixels, over everything.
 */
const CURSOR_X: Table = [
  [4268, 903], [4272, 881], [4274, 872], [4276, 867], [4278, 865], [4280, 864],
  [4282, 863], [4294, 862], [4296, 919], [4298, 1174], [4300, 1305], [4302, 1369],
  [4304, 1404], [4306, 1424], [4308, 1430], [4318, 1431],
];
const CURSOR_Y: Table = [
  [4268, 645], [4272, 613], [4274, 599], [4276, 592], [4278, 587], [4280, 585],
  [4282, 584], [4294, 584], [4296, 601], [4298, 677], [4300, 716], [4302, 735],
  [4304, 746], [4306, 752], [4308, 754], [4318, 754],
];
const CURSOR_IN: Table = [[4268, 0], [4272, 1], [4318, 1], [4319, 0]];

/** The two clicks, each a short dip in the pointer's size. */
const CLICKS = [4285, 4313];
const clickScale = (g: number) =>
  CLICKS.reduce(
    (s, at) => s * (1 - 0.12 * Math.max(0, 1 - Math.abs(g - at) / 3)),
    1,
  );

const at = (table: Table, g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const SurveyBuilderScene: React.FC = () => {
  const g = useCurrentFrame() + SURVEY_FROM;
  const scale = at(SCALE, g);
  const height = at(HEIGHT, g);
  const settle = at(SETTLE, g);
  const panelY = at(PANEL_Y, g);

  return (
    <AbsoluteFill style={{ backgroundColor: "#010320", overflow: "hidden" }}>
      {/* The left column, scaled with the same settle as the modal so the two cannot
          drift apart at the end of the beat. */}
      {/* The settle scales about the FRAME's centre, not the column's. Solved from the
          measurement: at 1.021 the palette's left edge sits at 366 against a design 378,
          which puts the origin at x 949.5, and the modal's own 813-against-816 puts it at
          957 — the frame centre, from two independent elements. Scaling about the column's
          own centre left it 8px out. */}
      <AbsoluteFill
        style={{
          opacity: at(PANEL_IN, g),
          transform: `scale(${settle.toFixed(4)})`,
          transformOrigin: "960px 540px",
        }}>
        <WorkvivoAddQuestionPanel style={{ transform: `translateY(${panelY.toFixed(1)}px)` }} />
        <WorkvivoQuestionActionBar style={{ transform: `translateY(${at(BAR_Y, g).toFixed(1)}px)` }} />
      </AbsoluteFill>

      {/* The pointer, over everything and in frame pixels. */}
      {/* The modal. Positioned by its measured left/top and scaled about that corner, so
          the three tables stay independent of each other. */}
      <AbsoluteFill>
        <WorkvivoSurveyAiModal
          selected={g >= PILL_AT ? 1 : null}
          height={height}
          body={at(BODY, g)}
          cta={g >= SUBMIT_AT ? "Redo Survey" : "Submit"}
          style={{
            left: 0,
            top: 0,
            transform:
              `translate(${at(LEFT, g).toFixed(1)}px, ${at(TOP, g).toFixed(1)}px) ` +
              `scale(${scale.toFixed(4)})`,
            transformOrigin: "0 0",
          }}
        />
      </AbsoluteFill>

      <CursorArrow
        color="black"
        style={{
          position: "absolute",
          left: at(CURSOR_X, g),
          top: at(CURSOR_Y, g),
          width: 56,
          opacity: at(CURSOR_IN, g),
          transform: `scale(${clickScale(g).toFixed(3)})`,
          transformOrigin: "0 0",
        }}
      />
    </AbsoluteFill>
  );
};

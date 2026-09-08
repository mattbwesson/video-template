import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MatchCut } from "./match-cut";
import { HqField } from "./components/workvivo/HqField";
import { HqLockup } from "./components/workvivo/HqLockup";
import { WorkvivoHqFan } from "./components/workvivo/WorkvivoHqFan";
import { useT } from "./customize/uiStrings";

/**
 * The HQ opening — global frames 139 to 416, rebuilt from the reference.
 *
 * This stretch used to be reference footage showing through a gap between two scenes. It
 * holds two beats: the `workvivo HQ` lockup with its tagline, and then the capability fan,
 * joined by a fast rotate. Rebuilding it makes the copy customisable like the rest of the
 * film — the tagline is a UI string, so the Japanese cut translates it — and puts the fan
 * on screen as the component it already was rather than as a picture of one.
 *
 * EVERY NUMBER BELOW IS MEASURED, NOT DESIGNED
 * The tables are read straight off the reference at 1920x1080, one measurement per listed
 * frame, and fed to `interpolate` unchanged. That is deliberate: the motion here is not a
 * spring or a named easing, it is two animations meeting, and fitting a curve to it would
 * be guessing at the artist's rig. What the reference does is knowable; what it was made
 * with is not.
 *
 * The shape those measurements found, which is worth stating because it is not obvious
 * from watching:
 *
 *  - The card never stops moving. The lockup is 934px wide when this scene starts and
 *    688px when it leaves, shrinking the whole time.
 *  - It is TWO eases, not one. The rate slows from -3.0 px/frame to -0.67 by frame 190,
 *    then speeds back up to -3.2 by 263. A settle, then an exit.
 *  - The tagline arrives at 190 and the lockup springs up ~58px to make room, which is
 *    the same 60px move the source project's own opening makes.
 *  - The tagline scales with the lockup at a constant 1.801x its width across the whole
 *    beat, so one scale drives both.
 *
 * Frame numbers in the tables are GLOBAL, matching src/WorkvivoCut.tsx's sequence names,
 * because that is what they were measured against and translating them to local frames
 * would make every one of them unverifiable.
 */

export const HQ_OPENING_FROM = 139;
export const HQ_OPENING_TO = 417;
export const HQ_OPENING_DURATION = HQ_OPENING_TO - HQ_OPENING_FROM;

/**
 * Horizontal centre. Measured: the reference's card sits at 962, not at the frame's 960.
 * The tagline's own ink centre is half a pixel further left again, which is side bearings,
 * not a different centre — both are kept as measured rather than averaged into one.
 */
const LOCKUP_CX = 962;
const TAGLINE_CX = 960.5;

/** Lockup width in px, by global frame. The scale that drives the entire card. */
const LOCKUP_W: [number, number][] = [
  [139, 934], [145, 918], [151, 902], [157, 886], [163, 868], [169, 850],
  [175, 836], [181, 824], [187, 816], [193, 810], [199, 806], [205, 802],
  [211, 794], [217, 790], [223, 782], [229, 774], [235, 762], [241, 752],
  [247, 738], [253, 722], [259, 702], [263, 688],
];

/** Lockup centre Y. Flat at 538 until the tagline arrives, then up ~58px and a slow drift. */
const LOCKUP_Y: [number, number][] = [
  [139, 538], [190, 538], [193, 530], [196, 506], [199, 493], [202, 486],
  [205, 483], [208, 480], [217, 479], [229, 479], [241, 481], [253, 484], [263, 486],
];

/** Tagline centre Y: slides up as it fades in, then rides the card's scale. */
const TAGLINE_Y: [number, number][] = [
  [190, 762], [193, 760], [196, 753], [199, 739], [202, 732], [205, 728],
  [208, 725], [217, 720], [229, 716], [241, 711], [253, 704], [263, 705],
];

/**
 * Lockup opacity. Derived from the measured peak by undoing the composite over the field
 * (`peak = a*255 + (1-a)*bg`, bg ~60), not read off as brightness — brightness over a mesh
 * this bright is not opacity.
 *
 * It starts at 0.45, not 0: the reference began this fade before frame 139, and the film
 * cuts into the middle of it. Starting from 0 here would be a different shot.
 */
const LOCKUP_O: [number, number][] = [[139, 0.45], [142, 0.6], [145, 0.74], [148, 0.91], [151, 1]];
const TAGLINE_O: [number, number][] = [[190, 0], [193, 0.36], [196, 0.79], [199, 0.95], [202, 1]];

/** The tagline is this multiple of the lockup's width, constant to 0.2% across the beat. */
const TAGLINE_RATIO = 1.801;
/**
 * InterX 600, and both halves of that were measured rather than chosen.
 *
 * The WEIGHT came from ink density — the share of the text's bounding box that is actually
 * lit. Matching the width alone is not enough to identify a face: at the reference's own
 * 1359px the first attempt sat at 0.120 against the reference's 0.294, i.e. less than half
 * the ink, which is what Light looks like next to Semibold. Comparing candidates at the
 * size that hits the target width, InterX 600 lands at 0.281.
 *
 * The FAMILY is InterX alone, with no Helvetica ahead of it, even though Helvetica scored
 * marginally better. InterX is the font this repo EMBEDS as base64, so it is the only one
 * guaranteed to exist in the container — and a stack whose first entry is missing at render
 * time silently sets the line at the wrong width, which is exactly the failure the size
 * calibration above cannot survive.
 */
const TAGLINE_FONT = "InterX, sans-serif";
const TAGLINE_WEIGHT = 600;
/**
 * How many pixels of this line one em buys, for the weight below. Font size is derived from
 * the card's width through this, so the tagline cannot drift out of proportion with the
 * lockup; there is one scale in this scene, not two.
 */
const TAGLINE_WIDTH_PER_EM = 21.47;

/**
 * Where the type's INK sits relative to the box it is placed in, as a fraction of an em.
 *
 * A text node is positioned by its line box, and the tables above are measurements of ink —
 * the pixels that are lit. The two are not the same point: this line's ink centre is 0.109em
 * BELOW its line box's centre, because the line box carries room for ascenders and
 * descenders that "The AI-native..." does not fill symmetrically. Placing by the table
 * directly put the tagline 8px low at every frame.
 */
const TAGLINE_INK_DX = 0.047;
const TAGLINE_INK_DY = 0.109;

/**
 * The lockup-to-fan cut: the same rotational match cut the film already uses at global 792,
 * with its numbers, not a hand-rolled rotate.
 *
 * The first version was a bespoke transform fitted to the reference — clockwise, about 55
 * degrees, scaling up and drifting down-left — and it was wrong in a way measurement could
 * not catch. The reference's own cut is heavily motion-blurred, so a sharp copy of its
 * geometry scores badly against it however well the geometry is fitted, and matching the
 * blur meant a CSS filter, which is not scoped in this project's exporter and would have
 * bled over the fan arriving underneath.
 *
 * MatchCut solves both at once: it is the film's established device, and its shutter
 * sampling produces real motion blur by compositing the subtree at sub-frame positions
 * rather than blurring the result.
 */
const SPIN_AT = 262;
const SPIN_DURATION = 15;
const SPIN = {
  direction: "cw" as const,
  totalDegrees: 720,
  ease: Easing.bezier(0.7, 0.18, 0.14, 0.99),
  shutterAngle: 180,
  /** 24 copies of the subtree per frame: right for a render, unplayable in the Studio, so
      preview drops to 4. Same split as VirginWorkvivoDesktopScene. */
  shutterSamples: 24,
  previewShutterSamples: 4,
};
const CUT_START = 0.25;
const CUT_END = 0.6;

/**
 * The fan's move across its beat: it does not move. It only grows.
 *
 * Two wrong answers came before this one, and both were "faithful" in a way that looked bad.
 * The first tracked the badge frame by frame and reproduced the reference's swooping fly-in
 * and every pixel of jitter in the measurement, which read as the fan wobbling rather than
 * as a camera moving. The second smoothed that to five anchors and still had it drifting.
 *
 * Measuring the RIM instead settles it. The fan's outer edge is a 1440px baseline where the
 * badge is a 200px one, so it pins the geometry roughly seven times harder — and read that
 * way the centre does not move at all: (953, 867) at every frame where both edges are
 * detectable. All that changes is the scale, and it changes smoothly and in one direction.
 *
 * The scale is accelerating rather than linear — 0.00012 per frame at the start and 0.00093
 * by the end — so the points below are the measurements, not a fitted line. They are sparse
 * and monotonic, which is what keeps it from wobbling.
 *
 * (This also corrected a 1.3% oversize the badge-based version had, which came from using a
 * mark that is deliberately NOT concentric with the fan to position the fan; see the note
 * about that in WorkvivoHqFan's header.)
 */
/** The fan's own centre in the component's coordinates, and where the reference puts it. */
const FAN_ORIGIN: [number, number] = [950, 869];
const FAN_OFFSET: [number, number] = [3, -2];
const FAN_SCALE: [number, number][] = [
  [277, 0.9722], [285, 0.9731], [300, 0.9745], [320, 0.9772],
  [350, 0.9827], [380, 0.9953], [400, 1.0078], [416, 1.0226],
];

/**
 * When each pane fills, and when the last two drop back to glass. Read off the reference by
 * sampling the middle of each pane and finding the frames where it steps.
 */
const FILL: Record<"comm" | "search" | "people", [number, number][]> = {
  comm: [[268, 0], [272, 1]],
  search: [[284, 0], [285, 0], [293, 1], [393, 1], [399, 0]],
  people: [[305, 0], [306, 0], [313, 1], [393, 1], [399, 0]],
};

const at = (table: [number, number][], g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const HqOpeningScene: React.FC = () => {
  // Local 0 is global HQ_OPENING_FROM. The tables are global, so convert once, here.
  const g = useCurrentFrame() + HQ_OPENING_FROM;
  const t = useT();

  const lockupW = at(LOCKUP_W, g);
  const taglineSize = (lockupW * TAGLINE_RATIO) / TAGLINE_WIDTH_PER_EM;
  const fanScale = at(FAN_SCALE, g);

  /* The card: lockup over tagline, both riding one scale. Handed to MatchCut as a plain
     element, not a <Sequence>, so `g` above is the frame it is actually drawn on. */
  const card = (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: LOCKUP_CX,
          top: at(LOCKUP_Y, g),
          transform: "translate(-50%, -50%)",
          opacity: at(LOCKUP_O, g),
        }}>
        {/* One turn every 6s, as in the source artwork's own rig. */}
        <HqLockup width={lockupW} gradientAngle={((g - HQ_OPENING_FROM) / 25 / 6) * 360} />
      </div>
      <div
        style={{
          position: "absolute",
          left: TAGLINE_CX + TAGLINE_INK_DX * taglineSize,
          top: at(TAGLINE_Y, g) - TAGLINE_INK_DY * taglineSize,
          transform: "translate(-50%, -50%)",
          opacity: at(TAGLINE_O, g),
          // Sized off the lockup, not set independently: the two hold a constant ratio in
          // the reference, so one number moving is one fewer that can drift.
          fontSize: taglineSize,
          fontFamily: TAGLINE_FONT,
          fontWeight: TAGLINE_WEIGHT,
          color: "#ffffff",
          letterSpacing: "0.005em",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}>
        {t("The AI-native employee experience platform")}
      </div>
    </AbsoluteFill>
  );

  const fan = (
    <AbsoluteFill
      style={{
        transform: `translate(${FAN_OFFSET[0]}px, ${FAN_OFFSET[1]}px) scale(${fanScale.toFixed(4)})`,
        transformOrigin: `${FAN_ORIGIN[0]}px ${FAN_ORIGIN[1]}px`,
      }}>
      <WorkvivoHqFan
        field={false}
        fills={{
          comm: at(FILL.comm, g),
          search: at(FILL.search, g),
          people: at(FILL.people, g),
        }}
      />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e1a82", overflow: "hidden" }}>
      {/* The field runs underneath both sides of the cut and does not rotate with them —
          the reference's background holds still through the whip, only the card spins. */}
      <HqField globalFrame={g} />
      <MatchCut
        mode="rotational"
        rotational={SPIN}
        holdBefore={SPIN_AT - HQ_OPENING_FROM}
        transitionDurationInFrames={SPIN_DURATION}
        holdAfter={HQ_OPENING_TO - SPIN_AT - SPIN_DURATION}
        cutStart={CUT_START}
        cutEnd={CUT_END}
        outgoing={card}
        incoming={fan}
      />
    </AbsoluteFill>
  );
};

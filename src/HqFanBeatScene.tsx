import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HqField } from "./components/workvivo/HqField";
import { WorkvivoHqFan } from "./components/workvivo/WorkvivoHqFan";

/**
 * The capability fan as a short beat — twice in the film's back half.
 *
 * The cut returns to the fan on the run-up to the ask bar (2236) and again before the
 * analytics screen (3326), each time to put one capability forward: Search & Knowledge,
 * then People Intelligence. Both were reference footage; both are now the same component
 * the opening uses, so they customise and translate with everything else.
 *
 * WHAT THE MOTION IS, AND WHY IT IS MEASURED TWICE
 * Both beats do the same thing — the fan arrives high, drops, settles, then pushes in — and
 * the two are close enough for most of their length that sharing one table is tempting. They
 * are kept separate because they demonstrably diverge: the 3326 beat is 62 frames against
 * 32 and keeps descending after the shorter one has been cut away from, so a shared curve
 * would have to be right about which one's tail was the real shape. Measuring both is
 * cheaper than being wrong about that.
 *
 * The tracking is off the badge, which is the only feature in these shots with a hard enough
 * edge — the two unlit panes barely register against the field, so the rim method that
 * pinned the opening's fan does not work here.
 *
 *   - It arrives HIGH and drops. The badge falls 787 -> 841 in the first eight frames in
 *     BOTH beats, to the pixel, then eases on more slowly. Almost all of the travel is in
 *     the first quarter.
 *   - Then it grows, only once it has nearly landed: a little over 6% across the rest.
 *
 * The first few frames' radius is deliberately NOT in the tables. The measurement reads 116
 * at the first frame and falls to 103 three frames later, which is not the badge shrinking:
 * it is the previous scene's circular mask, still closing over the same spot and darker than
 * anything else on screen. Fitting the scale to it would make the fan lurch inward as it
 * enters.
 *
 * WHEN THE PANE LIGHTS
 * Once the fan has settled — eight frames after the drop finishes — over an eight-frame
 * reveal, which is the same length the opening beat gives a pane at 285-293.
 *
 * This is NOT what the reference does. Measured at the middle of each pane, its lit pane is
 * already climbing in the first frames of both beats and is at full strength before the fan
 * has stopped moving. Lighting after the settle was asked for, and it reads as three panes
 * of glass arriving and one of them then being chosen.
 */

type Table = [number, number][];

export type HqFanBeat = {
  /** Global frames. `to` is exclusive, matching the Sequence that mounts it. */
  from: number;
  to: number;
  /** Badge centre Y by global frame: the fall. */
  drop: Table;
  /** Badge centre X: a slight drift left, an order of magnitude smaller than the fall. */
  slide: Table;
  /** Badge radius: flat through the fall, then the push in. */
  grow: Table;
  /** Which pane is put forward, and the frame it lights on. */
  lit: "comm" | "search" | "people";
  litAt: number;
};

/** How long a pane takes to fill, in frames. Matches the opening beat's 285-293. */
const REVEAL = 8;

/** The badge's centre in the component's own coordinates — what the tables move. */
const BADGE: [number, number] = [961, 864];
/** The radius the component's artwork is calibrated at, by the same measurement. */
const BADGE_R = 101.8;

export const HQ_FAN_BEATS = {
  /** Between the catch-up card and the ask bar. Search & Knowledge. */
  askBar: {
    from: 2236,
    // 2270, not the 2268 the ask bar starts on. The ask bar opens a circular mask over
    // frames 2268-2270, and a mask has to open ONTO something: with this beat ending at
    // 2268 the ring outside the circle was the reference footage, and those two frames
    // were the only two in the whole film that no rebuilt scene covered. The reference
    // opens that mask over the fan, which is what this now does. The tables below all end
    // at 2268 and clamp, so the fan holds its last pose for the two frames it spends
    // behind the growing circle.
    to: 2270,
    drop: [
      [2236, 787], [2238, 808], [2240, 824], [2242, 834], [2244, 841],
      [2248, 847], [2252, 850], [2256, 852], [2260, 856], [2264, 862], [2268, 871],
    ],
    slide: [[2236, 961], [2244, 958], [2252, 956], [2260, 954], [2268, 952]],
    grow: [
      [2236, 100.6], [2244, 100.5], [2250, 101.0], [2256, 101.9],
      [2262, 103.3], [2268, 106.9],
    ],
    lit: "search",
    litAt: 2252,
  },
  /** Between the article and the analytics screen. People Intelligence. */
  analytics: {
    from: 3326,
    to: 3388,
    drop: [
      [3326, 787], [3328, 808], [3330, 824], [3332, 830], [3334, 841],
      [3338, 847], [3342, 848], [3346, 849], [3350, 850], [3354, 853],
      [3358, 855], [3362, 857], [3366, 860], [3370, 864], [3374, 868],
      [3378, 872], [3382, 877], [3388, 889],
    ],
    slide: [
      [3326, 962], [3334, 958], [3342, 956], [3350, 954],
      [3358, 953], [3366, 951], [3374, 951], [3388, 950],
    ],
    grow: [
      [3326, 100.6], [3334, 100.5], [3342, 100.6], [3350, 100.9],
      [3358, 101.5], [3366, 102.1], [3374, 103.7], [3382, 105.7], [3388, 109.0],
    ],
    lit: "people",
    litAt: 3342,
  },
} satisfies Record<string, HqFanBeat>;

const at = (table: Table, g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const HqFanBeatScene: React.FC<{ beat: HqFanBeat }> = ({ beat }) => {
  const g = useCurrentFrame() + beat.from;
  const scale = at(beat.grow, g) / BADGE_R;
  const dx = at(beat.slide, g) - BADGE[0];
  const dy = at(beat.drop, g) - BADGE[1];
  const on = interpolate(g, [beat.litAt, beat.litAt + REVEAL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e1a82", overflow: "hidden" }}>
      <HqField globalFrame={g} />
      <AbsoluteFill
        style={{
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`,
          transformOrigin: `${BADGE[0]}px ${BADGE[1]}px`,
        }}>
        {/* Three panes of glass while the fan drops; one of them lights once it has landed
            and the other two stay glass to the cut. */}
        <WorkvivoHqFan
          field={false}
          fills={{
            comm: beat.lit === "comm" ? on : 0,
            search: beat.lit === "search" ? on : 0,
            people: beat.lit === "people" ? on : 0,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

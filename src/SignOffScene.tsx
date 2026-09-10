import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HqField } from "./components/workvivo/HqField";
import { HqLockup } from "./components/workvivo/HqLockup";
import { useT } from "./customize/uiStrings";

/**
 * The sign-off — global frames 5166 to the end of the film, rebuilt from the reference.
 *
 * The last 134 frames were the only stretch of reference footage left after the customer
 * grid, and they are the one shot every viewer is guaranteed to watch to the end: the
 * `workvivo HQ` lockup on the mesh field, dissolving into the tagline, held to the last
 * frame. Leaving it as footage meant the film signed off in English with Workvivo's own
 * lockup no matter whose logo the rest of it carried, and the Japanese cut ended on a line
 * it had already translated everywhere else.
 *
 * NOTHING HERE IS NEW ARTWORK
 * The shot is the HQ opening's own furniture — the same HqField, the same HqLockup, the
 * same tagline string — so this file is timing and geometry only. What it is NOT is a
 * replay of the opening: the two beats share components and share nothing else.
 *
 *  - The lockup enters at 646px and leaves at 465, where the opening runs 934 to 688. It is
 *    a smaller card, shrinking at a near-constant 3.2 px/frame the whole way, with none of
 *    the opening's settle-then-exit.
 *  - The lockup and the tagline are NOT one card here. In the opening the tagline is
 *    pinned to 1.801x the lockup's width and one scale drives both; here they cross-
 *    dissolve, and at the moment they swap the lockup implies a 854px tagline while the
 *    tagline is actually 1110. Two elements, two scales, drawn on the same centre.
 *  - The tagline does not rise into place. It arrives full width and settles: 1110px at
 *    5220, 1011 by 5248, then a 14px crawl over the remaining two seconds.
 *
 * EVERY NUMBER BELOW IS MEASURED, NOT DESIGNED
 * Read off the reference at 1920x1080, one measurement per listed frame, and handed to
 * `interpolate` unchanged — the same method as src/HqOpeningScene.tsx, and for the same
 * reason: what the reference does is knowable, what it was made with is not.
 *
 * Frame numbers in the tables are GLOBAL, matching the sequence names in
 * src/WorkvivoCut.tsx.
 */

export const SIGNOFF_FROM = 5166;
/**
 * Exclusive, and it is the whole composition: CUSTOMIZED_CUT_DURATION is 5300, so the last
 * frame the film shows is 5299.
 */
export const SIGNOFF_TO = 5300;
export const SIGNOFF_DURATION = SIGNOFF_TO - SIGNOFF_FROM;

/**
 * WHERE THE MEASUREMENTS COME FROM, AND WHY THEY ARE NOT USED RAW
 *
 * Every table below is the bounding box of LIT PIXELS — the reference frame minus a
 * 9px blur of itself, thresholded — because that is the only thing a video frame actually
 * tells you. A placed element's box is not the same rectangle, so each table is converted
 * once, here, by the offsets that a render of this project's own components at a known size
 * produces against that same measurement. Calibrated on the HQ opening at global 226, where
 * the lockup is placed at width 778 and the tagline at 65.26px:
 *
 *   lockup   ink box 777 wide, centred (961.0, 478.0)  ->  +1px in x and y, 1.0013 in width
 *   tagline  ink box 1409 wide, centred (962.0, 715.5) ->  0.024em right, 0.086em below
 *
 * Doing this conversion in the tables instead would leave numbers in the file that match
 * neither the reference nor the code.
 */
const LOCKUP_INK_DX = 0.25;
const LOCKUP_INK_DY = 0;
const LOCKUP_INK_W = 1.0013;
const TAGLINE_INK_DX = 0.024;
const TAGLINE_INK_DY = 0.086;

/** Both marks sit on one centre for the whole beat; neither moves. Ink centres. */
const LOCKUP_CX = 962.0;
const LOCKUP_CY = 539.5;
const TAGLINE_CX = 960.5;
const TAGLINE_CY = 541.2;

/** Lockup ink width by global frame. Measured every four frames; it only ever shrinks. */
const LOCKUP_W: [number, number][] = [
  [5166, 646], [5170, 634], [5174, 621], [5178, 607], [5182, 593], [5186, 579],
  [5190, 565], [5194, 551], [5198, 537], [5202, 525], [5206, 511], [5210, 499],
  [5214, 487], [5218, 477], [5222, 465],
];

/**
 * Lockup opacity, in and out.
 *
 * Read as the 99.5th percentile of local contrast over the lockup's box, normalised to its
 * own plateau — not as brightness. Brightness over a field this bright is not opacity, and
 * the field underneath the lockup changes by 60/255 across the beat.
 *
 * The out half is measured in the band ABOVE the tagline (y 462-510) rather than over the
 * whole lockup, because from 5220 the two overlap and a box that holds both reads the
 * tagline's arrival as the lockup failing to leave.
 */
const LOCKUP_O: [number, number][] = [
  [5166, 0.038], [5167, 0.092], [5168, 0.152], [5169, 0.211], [5170, 0.271],
  [5171, 0.336], [5172, 0.407], [5173, 0.477], [5174, 0.547], [5175, 0.612],
  [5176, 0.683], [5177, 0.753], [5178, 0.818], [5179, 0.873], [5180, 0.932],
  [5181, 0.976], [5182, 1], [5210, 1], [5211, 0.961], [5212, 0.876], [5213, 0.801],
  [5214, 0.713], [5215, 0.618], [5216, 0.517], [5217, 0.421], [5218, 0.326],
  [5219, 0.225], [5220, 0.124], [5221, 0.039], [5222, 0],
];

/**
 * The tagline's size and tracking, and the table of ink widths they are derived from.
 *
 * TWO NUMBERS, BECAUSE WIDTH ALONE DOES NOT IDENTIFY A SETTING
 * Matched on line width only, this came out 4.5% too small: the ink box was the right
 * 1006px wide and the glyphs inside it were short, because a size that is too small and
 * tracking that is too loose land on the same total. What separates them is INK MASS — the
 * lit area of the line, which goes as the square of the size and not at all with tracking.
 * The reference carries 9.2% more of it than a width-matched setting does, so the size is
 * up by the square root of that and the tracking absorbs the difference. Set that way the
 * line matches the reference on all three at once: 459-1463 across, 518-564 down, and its
 * ink area within 1%.
 *
 * This is NOT the pairing src/HqOpeningScene.tsx uses for the same sentence (21.47 px/em at
 * +0.005em). That beat was fitted to width alone, so it has the same 4% compensating error,
 * and correcting it is a change to a shot that is not this one — worth doing, separately.
 *
 * TAGLINE_W is an ink width and TAGLINE_WIDTH_PER_EM turns it into a SIZE, deliberately: a
 * width table would be a table about this English sentence, and the tagline is a UI string.
 * The Japanese cut sets a different line, and it has to arrive at the same size, not at the
 * same number of pixels wide.
 */
const TAGLINE_WIDTH_PER_EM = 20.66;
const TAGLINE_TRACKING = "-0.0177em";
const TAGLINE_W: [number, number][] = [
  [5220, 1110], [5222, 1101], [5224, 1090], [5226, 1079], [5228, 1069], [5230, 1059],
  [5232, 1050], [5234, 1042], [5236, 1035], [5238, 1028], [5240, 1023], [5242, 1018],
  [5244, 1015], [5246, 1012], [5248, 1011], [5256, 1009], [5266, 1007], [5276, 1004],
  [5286, 1001], [5299, 997],
];

/** Tagline opacity. Faster in than the lockup was, and it never leaves. */
const TAGLINE_O: [number, number][] = [
  [5219, 0], [5220, 0.047], [5221, 0.145], [5222, 0.32], [5223, 0.506], [5224, 0.645],
  [5225, 0.721], [5226, 0.785], [5227, 0.855], [5228, 0.895], [5229, 0.924],
  [5230, 0.948], [5231, 0.977], [5232, 0.988], [5233, 0.994], [5234, 1],
];

/** Matching src/HqOpeningScene.tsx: the face is the one this repo embeds, at the weight
    its ink density identifies. See that file's note — it is the same line of type. */
const TAGLINE_FONT = "InterX, sans-serif";
const TAGLINE_WEIGHT = 600;

/**
 * Behind the field images, never seen once they load. The field's own mean, so a frame that
 * arrives late is the wrong picture rather than the wrong colour.
 */
const FIELD_BASE = "#2e1d8c";

const at = (table: [number, number][], g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const SignOffScene: React.FC = () => {
  // Local 0 is global SIGNOFF_FROM. The tables are global, so convert once, here.
  const g = useCurrentFrame() + SIGNOFF_FROM;
  const t = useT();

  const lockupW = at(LOCKUP_W, g) * LOCKUP_INK_W;
  const lockupO = at(LOCKUP_O, g);
  const taglineSize = at(TAGLINE_W, g) / TAGLINE_WIDTH_PER_EM;
  const taglineO = at(TAGLINE_O, g);

  return (
    <AbsoluteFill style={{ backgroundColor: FIELD_BASE, overflow: "hidden" }}>
      <HqField globalFrame={g} />
      {/* Both marks are mounted for the whole beat and carry their own opacity, rather
          than being swapped at 5220. They overlap for three frames — the dissolve is real,
          not a cut — and a swap would drop whichever one was still on screen. */}
      <div
        style={{
          position: "absolute",
          left: LOCKUP_CX + LOCKUP_INK_DX,
          top: LOCKUP_CY + LOCKUP_INK_DY,
          transform: "translate(-50%, -50%)",
          opacity: lockupO,
        }}>
        {/* One turn every 6s from the cut, as in the opening and in the source artwork. */}
        <HqLockup width={lockupW} gradientAngle={((g - SIGNOFF_FROM) / 25 / 6) * 360} />
      </div>
      <div
        style={{
          position: "absolute",
          left: TAGLINE_CX + TAGLINE_INK_DX * taglineSize,
          top: TAGLINE_CY - TAGLINE_INK_DY * taglineSize,
          transform: "translate(-50%, -50%)",
          opacity: taglineO,
          fontSize: taglineSize,
          fontFamily: TAGLINE_FONT,
          fontWeight: TAGLINE_WEIGHT,
          color: "#ffffff",
          letterSpacing: TAGLINE_TRACKING,
          whiteSpace: "nowrap",
          textAlign: "center",
        }}>
        {t("The AI-native employee experience platform")}
      </div>
    </AbsoluteFill>
  );
};

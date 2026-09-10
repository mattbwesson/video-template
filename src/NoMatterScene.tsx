import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FIXED_COPY } from "./customize/videoCopy";
import { useT, useWordGap } from "./customize/uiStrings";

/**
 * "No matter where they are" — global frames 2760 to 2822, rebuilt from the reference.
 *
 * The line the film puts up between the mobile home and the widget store. It was the last
 * of the reference footage between those two scenes, so the sentence was burnt in: an
 * English line in every customer's video and in the Japanese cut.
 *
 * IT IS THE SAME GESTURE AS "Back from time off?" AT 600, AND IT IS NOT THE SAME RIG
 * Both open on the first word alone at several times its final size and settle into a full
 * line, and they read as a pair. But src/BackFromScene.tsx tracks its later words out from
 * behind the lead — each word carries its own translateX — and this one does not. Measured
 * against the reference, every word here sits at its FINAL position relative to "No" from
 * the first frame it is visible: at 2762 "No matter" is the settled "No matter" scaled by
 * 2.03, to within a pixel. Nothing moves relative to anything else.
 *
 * So the whole beat is three things:
 *
 *  - one scale, about the centre of the frame, from 2.46 down to 1.0;
 *  - one horizontal slide, from 974px right of home back to 0;
 *  - five opacities, one per word.
 *
 * The scale's centre is not assumed. Solving for the point the type scales about gives
 * y = 540 at every frame that has two measurable glyphs — the frame's own middle — so the
 * horizontal centre is taken as 960 to match, and everything left over is the slide. That
 * split is what makes the slide monotonic and readable; with any other centre the same
 * measurements come out as two tables that both wander.
 *
 * THE THREE LATE WORDS DO NOT SHARE A FADE
 * "matter" comes up over seven frames on an accelerating ramp, "are" over nine on a
 * near-linear one, and "they" does not fade at all — it is absent on 2783 (its box reads
 * the background exactly, 6/255) and fully white on 2784. That is not a measurement
 * failure and it is not smoothed away here: the tables below are what is on the frames.
 *
 * EVERY NUMBER IS MEASURED, NOT DESIGNED
 * Read off the reference at 1920x1080 by fitting scale and offset to the positions of all
 * twenty glyph runs at once, one fit per frame, with a residual under 0.7px everywhere the
 * line has more than two glyphs on it. Frame numbers are GLOBAL, matching the sequence
 * names in src/WorkvivoCut.tsx.
 */

export const NO_MATTER_FROM = 2760;
/** Exclusive: the widget store's hard cut owns 2823. */
export const NO_MATTER_TO = 2823;
export const NO_MATTER_DURATION = NO_MATTER_TO - NO_MATTER_FROM;

/** The ground the sentence stands on, and the same value the admin beat uses. */
const FIELD = "#010320";

/**
 * The type, calibrated against the reference rather than chosen.
 *
 * The WEIGHT is from stroke width over cap height: 13px of stem under a 74px cap, which is
 * 0.176. The film's "Powered by" at 4876 — already matched to InterX 600 — measures 0.171
 * on the same test, so this is the same face at the same weight, not a heavier one.
 *
 * The SIZE follows from the cap: 80px of that lockup buys 58.5 rows of cap, so a 74-row cap
 * is 101px. TRACKING and WORD_GAP are then fitted to the reference's twenty glyph runs.
 */
const FONT_SIZE = 101;
const FONT_WEIGHT = 600;
const TRACKING = "0.0041em";
/**
 * The word gap, as a multiple of the shared one rather than a value of its own.
 *
 * Fitting size, tracking and gap to the reference's twenty glyph runs at once puts this
 * line's gap at 0.226em where src/customize/uiStrings.tsx hands out 0.20em. A MULTIPLE, not
 * an addend, because the Japanese cut sets that gap to zero on purpose — its fragments are
 * parts of one word and have to touch — and zero times anything is still zero.
 */
const WORD_GAP_SCALE = 1.13;

/**
 * Where the line's box goes so its INK lands where the reference's does: ink from x 349 to
 * 1564 with the cap on rows 495-568. Both are box coordinates, converted from those ink
 * measurements by a render of this scene — a text node is placed by its line box, and the
 * two are a few px apart in x (side bearings) and a lot apart in y (the line box carries
 * ascender and descender room this sentence does not fill symmetrically).
 */
const LINE_CX = 956;
const LINE_TOP = 481;

/** Scale, about the centre of the frame. 2.46 at the cut, settled by 2783. */
const SCALE: [number, number][] = [
  [2760, 2.462], [2761, 2.275], [2762, 2.032], [2763, 1.830], [2764, 1.675],
  [2765, 1.556], [2766, 1.460], [2767, 1.384], [2768, 1.320], [2769, 1.265],
  [2770, 1.220], [2771, 1.181], [2772, 1.147], [2773, 1.120], [2774, 1.095],
  [2775, 1.074], [2776, 1.057], [2777, 1.043], [2778, 1.029], [2779, 1.020],
  [2780, 1.012], [2781, 1.006], [2782, 1.003], [2783, 1.0],
  // The push-in. Once the sentence is whole it keeps growing, a part in ten thousand a
  // frame at first and eight times that by the cut. Small, and it is the only thing moving
  // for the last second and a half, so leaving it out reads as a freeze-frame.
  [2796, 1.0], [2800, 1.001], [2804, 1.003], [2808, 1.007], [2812, 1.013],
  [2816, 1.021], [2819, 1.033], [2822, 1.052],
];

/** The slide home, in px, after the scale. Two eases: a settle, then the run to zero. */
const SLIDE: [number, number][] = [
  [2760, 974], [2761, 900], [2762, 804], [2763, 724], [2764, 663], [2765, 616],
  [2766, 578], [2767, 548], [2768, 523], [2769, 501], [2770, 483], [2771, 468],
  [2772, 455], [2773, 443], [2774, 434], [2775, 425], [2776, 418], [2777, 407],
  [2778, 375], [2779, 298], [2780, 203], [2781, 142], [2782, 101], [2783, 73],
  [2784, 52], [2785, 37], [2786, 25], [2787, 17], [2788, 10], [2789, 5],
  [2790, 2], [2791, 0.5], [2792, 0],
];

/**
 * One opacity table per word, in the order they are written.
 *
 * Read as (observed - background) / (255 - background) over each word's own box, with the
 * box tracked by the fit above so it follows the word as the line moves. The background is
 * flat and dark here — 6/255 — which is why this can be read straight off the luminance
 * rather than out of local contrast the way the beats on the mesh field have to be.
 */
const WORD_O: [number, number][][] = [
  // "No" is up before the cut and never changes.
  [[2760, 1]],
  [[2760, 0.008], [2761, 0.032], [2762, 0.080], [2763, 0.141], [2764, 0.225],
   [2765, 0.361], [2766, 0.570], [2767, 1]],
  [[2779, 0], [2780, 0.006], [2781, 0.016], [2782, 0.064], [2783, 0.314], [2784, 1]],
  [[2783, 0], [2784, 1]],
  [[2784, 0.019], [2785, 0.166], [2786, 0.313], [2787, 0.462], [2788, 0.598],
   [2789, 0.718], [2790, 0.842], [2791, 0.951], [2792, 1]],
];

const at = (table: [number, number][], g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const NoMatterScene: React.FC = () => {
  // Local 0 is global NO_MATTER_FROM. The tables are global, so convert once, here.
  const g = useCurrentFrame() + NO_MATTER_FROM;
  const t = useT();
  const { gapEm: WORD_GAP } = useWordGap();
  const words = FIXED_COPY.noMatterWords;

  const s = at(SCALE, g);
  const slide = at(SLIDE, g);

  return (
    <AbsoluteFill style={{ backgroundColor: FIELD, overflow: "hidden" }}>
      {/* The scale is about the frame's own centre and the slide is applied after it, so
          the slide is in screen pixels and not multiplied by the scale — which is what the
          measurements say: at 2760 the type is 2.46x and the line is 974px right of home,
          not 2397px. */}
      <AbsoluteFill
        style={{
          transform: `translateX(${slide.toFixed(1)}px) scale(${s.toFixed(4)})`,
          transformOrigin: "960px 540px",
        }}>
        <div
          style={{
            position: "absolute",
            left: LINE_CX,
            top: LINE_TOP,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontFamily: "InterX, Inter, sans-serif",
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            letterSpacing: TRACKING,
            lineHeight: "1em",
            color: "#ffffff",
          }}>
          {words.map((w, i) => (
            <span
              key={w}
              style={{
                display: "inline-block",
                // A margin rather than a space, so a translated line can set its own word
                // spacing — the same arrangement src/BackFromScene.tsx uses.
                marginLeft: i === 0 ? 0 : `calc(${WORD_GAP} * ${WORD_GAP_SCALE})`,
                opacity: at(WORD_O[i], g),
              }}>
              {t(w, "nomatter")}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  ADMIN_STRIP,
  ADMIN_STRIP_START,
  CARD_H,
  CARD_W,
  WorkvivoAdminCard,
  slotScale,
  slotX,
  slotY,
} from "./components/workvivo/WorkvivoAdminCategories";
import { useT } from "./customize/uiStrings";
import { ZoomWordmark } from "./components/workvivo/ZoomWordmark";

/**
 * Admin, AI and the sign-off — global 4585 to 4983.
 *
 * Five beats in one stretch of reference footage, rebuilt frame for frame:
 *
 *   4585-4702  the admin category carousel pops in and STEPS past — one card at a time,
 *              four steps with holds between, then the cards fly off
 *   4702-4743  a permission toggle pops in, flips, blooms purple and throws off icons
 *   4743-4841  "Granular Controls" — three glass plates sliding up on the purple
 *   4840-4893  an iris to black, a sparkle, then "Powered by Zoom"
 *   4893-4983  the AI capability pills, pushing in
 *
 * EVERY NUMBER HERE IS MEASURED, NOT CHOSEN
 * The reference is public/img/l2-reference-212s.mp4 and global frame g is its frame g-1:
 *
 *   ffmpeg -i public/img/l2-reference-212s.mp4 -vf "select='between(n,4584,4985)'" \
 *          -vsync 0 -start_number 4585 out/ref/%04d.png
 *
 * The motion tables below are the reference's own per-frame positions — a card's centre,
 * a plate's top border, a knob's left edge — read off those frames by thresholding, and
 * the film lands on the same integer frames, so a table indexed by frame IS the easing,
 * with nothing to fit. Where a motion is plainly one curve reused (the card pop, the
 * carousel step) it is one table reused.
 *
 * Two things are the reference's own pixels rather than drawn: the sixteen-frame burst of
 * glass icons off the toggle (public/img/toggle-burst, see scripts/prep-toggle-burst.py)
 * and the sparkle (public/img/sparkle-light.png). Both are 3D renders; see the script's
 * header for why drawing them was not on.
 */

export const ADMIN_FROM = 4585;
export const ADMIN_TO = 4983;
export const ADMIN_DURATION = ADMIN_TO - ADMIN_FROM;

type Table = [number, number][];
const at = (table: Table, g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/**
 * A per-frame series: `values[k]` is the value k frames after `from`. Held at both ends.
 * Used wherever the reference was read off frame by frame.
 */
const series = (from: number, values: number[], g: number) =>
  values[Math.max(0, Math.min(values.length - 1, g - from))];

const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

/**
 * A radial gradient from a measured profile: rows of [radius, r, g, b], the radius scaled
 * by `s`. Reads off the reference along a line out from the centre, so it reproduces the
 * reference's falloff rather than a guessed one.
 */
/**
 * The measured profile as an SVG gradient, NOT a CSS one.
 *
 * These were `background: radial-gradient(circle at …)`, which is correct in the Player,
 * the Studio and the CLI render and paints NOTHING in the wizard's in-browser export —
 * measured on 4.0.496, and the reason the toggle's bloom, the purple field, the Zoom glow
 * and the pill field were all simply absent from an exported MP4 while a linear gradient in
 * the same probe painted fine (docs/browser-render-best-practices.md §5).
 *
 * An SVG `<radialGradient>` does paint there — the HQ badge's own halo is one and survives
 * the same export — so the profile is handed to that instead. Same stops, same centre, same
 * radii; `spreadMethod` defaults to `pad`, which is what a CSS radial gradient does beyond
 * its last stop, so the frame's corners keep the last colour exactly as before.
 *
 * `id` has to be unique per mounted instance: two of these are on screen together on 4743,
 * and a duplicate id would have the second one paint with the first one's stops.
 */
const RadialWash: React.FC<{
  id: string;
  cx: number;
  cy: number;
  stops: number[][];
  s?: number;
  opacity?: number;
}> = ({ id, cx, cy, stops, s = 1, opacity }) => {
  const max = stops[stops.length - 1][0] * s;
  return (
    <AbsoluteFill style={opacity === undefined ? undefined : { opacity }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ display: "block" }}>
        <defs>
          <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={max}>
            {stops.map((st, i) => (
              <stop key={i} offset={(st[0] * s) / max} stopColor={rgb(st.slice(1))} />
            ))}
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/* ────────────────────────────────────────────────────────────────────────────────────────
   Carousel
   ──────────────────────────────────────────────────────────────────────────────────────── */

/**
 * How a card pops in: its height over the settled height, per frame from the first frame
 * it is drawn. Read off the side cards over 4592-4600 and identical for the centre card
 * from 4585 and the outer pair from 4594 — one curve, three start frames. The frame before
 * the first is a dot: the reference shows one at the neighbours' centres on 4591.
 */
const CARD_POP = [0.05, 0.32, 0.626, 0.777, 0.867, 0.924, 0.96, 0.982, 0.996, 1];
const POP_START = { centre: 4585, side: 4592, outer: 4594 };

/**
 * One carousel step, as the fraction of a slot travelled per frame from the frame the
 * strip starts moving. Read off the People card's centre over 4612-4625: 960 → 949 → 890
 * → 753 → 658 → 602 → 565 → 539 → 521 → 508 → 499 → 493 → 490 → 488. The scale follows
 * the same curve, which is the check that it is one motion.
 */
const STEP = [0, 0.023, 0.148, 0.439, 0.64, 0.758, 0.837, 0.892, 0.93, 0.958, 0.977, 0.989, 0.996, 1];
/** The first moving frame of each step. Holds of eleven, eight, ten and ten frames between. */
const STEP_STARTS = [4613, 4636, 4656, 4676];

/** Slots travelled so far: whole steps done plus the one in flight. */
const stripOffset = (g: number) =>
  STEP_STARTS.reduce((acc, s) => acc + (g >= s ? series(s - 1, STEP, g) : 0), 0);

/**
 * The exit, 4697-4702. The outer cards go first, the neighbours a frame later, both
 * accelerating outward: 0, 35, 249, 399 pixels and gone. The centre card shrinks in place
 * — 1, .982, .957, .906, .81 — and is not on 4702, where the toggle already is.
 */
const FLY = [0, 35, 249, 399, 1200];
const CENTRE_SHRINK = [1, 0.982, 0.957, 0.906, 0.81, 0.55];
const CAROUSEL_LAST = 4701;

/* ────────────────────────────────────────────────────────────────────────────────────────
   Toggle
   ──────────────────────────────────────────────────────────────────────────────────────── */

/** Track geometry, measured settled on 4712, and the point everything scales about. */
const TRACK = { x: 778, y: 424, w: 424, h: 232 };
const TOGGLE_CX = 990;
const TOGGLE_CY = 540;
/** Track width over its settled width, from the frame the toggle appears. Overshoots. */
const TOGGLE_POP = [0.226, 0.72, 0.885, 0.955, 0.998, 1.024, 1.04, 1.038, 1.024, 1.007, 1];
/** Its shrink from 4738; on 4744 it is gone and the purple field has the frame. */
const TOGGLE_SHRINK = [1, 0.99, 0.958, 0.903, 0.826, 0.722];
/** Knob left edge through the flip, from 4712. */
const KNOB_X = [791, 795, 801, 814, 840, 926, 976, 988, 991, 992];
/** The track's colour through the flip, from 4712: grey to lavender to Workvivo purple. */
const TRACK_COLOUR = [
  [229, 231, 235],
  [224, 222, 236],
  [218, 214, 236],
  [210, 200, 234],
  [183, 155, 233],
  [120, 46, 238],
  [99, 10, 237],
  [96, 4, 237],
  [97, 2, 236],
];
/**
 * The bloom behind the toggle once it is on: a radial falloff centred on it, read along
 * the horizontal from 4736 (the vertical agrees to within 3/255, so it is a circle).
 */
const BLOOM = [
  [0, 128, 70, 254], [140, 126, 68, 248], [200, 122, 67, 244], [250, 117, 65, 236],
  [300, 113, 62, 227], [400, 99, 55, 202], [500, 80, 45, 172], [600, 58, 32, 129],
  [700, 36, 22, 96], [800, 21, 14, 68], [900, 10, 8, 47], [1000, 3, 4, 36], [1100, 1, 3, 32],
];
/** How much of the bloom is up, from 4715. Sampled at two radii; they agree. */
const BLOOM_UP = [0, 0.13, 0.6, 0.81, 0.92, 0.97, 1];
/** The reference's own icon burst, cut per frame. See scripts/prep-toggle-burst.py. */
const BURST = { from: 4720, to: 4735, x: 1040, y: 280, w: 370, h: 510 };

/* ────────────────────────────────────────────────────────────────────────────────────────
   Granular Controls
   ──────────────────────────────────────────────────────────────────────────────────────── */

/** The purple field from 4743: flat to 200px out, then falling to the corners. Off 4745. */
const FIELD = [
  [0, 127, 69, 253], [200, 127, 69, 253], [400, 124, 68, 247], [600, 116, 63, 232],
  [800, 100, 55, 204], [950, 90, 50, 187], [1000, 85, 47, 179], [1100, 84, 47, 176],
];

type Plate = {
  label: string;
  icon: string;
  /** Settled plate origin, and the inset of its content panel — not the same on each. */
  x: number;
  y: number;
  inner: [number, number];
  /** Where the glass icon's own bitmap sits and how big, fitted to the icon's extent. */
  iconBox: [number, number, number, number];
  /** Title left edge and cap-top, absolute. */
  text: [number, number];
  /**
   * White over whatever is beneath: alpha at the plate's top edge and its change per
   * 1000px down, for the plate and for its content panel. Fitted by least squares over
   * frame 4798 with the layer order known — RMS 3.3/255 against the reference.
   */
  fill: [number, number];
  innerFill: [number, number];
  /** Top border per frame on the way in and out, from these frames. */
  inFrom: number;
  in: number[];
  outFrom: number;
  out: number[];
};

const OFF = 1100;
const PLATES: Plate[] = [
  {
    label: "Granular Controls",
    icon: "img/hq-gear.png",
    x: 134, y: 129, inner: [124, 267],
    iconBox: [205, 184, 163, 156],
    text: [379, 232],
    fill: [0.241, -0.147], innerFill: [0.236, -0.18],
    inFrom: 4746, in: [OFF, 802, 568, 429, 337, 272, 225, 190, 165, 148, 137, 131, 129],
    outFrom: 4829, out: [129, 131, 137, 148, 165, 190, 225, 272, 337, 429, 568, 802, OFF],
  },
  {
    label: "Permissions",
    icon: "img/hq-layers.png",
    x: 467, y: 336, inner: [98, 281],
    iconBox: [550, 399, 143, 141],
    text: [760, 442],
    fill: [0.263, -0.041], innerFill: [0.254, -0.272],
    inFrom: 4764,
    in: [OFF, 1052, 967, 838, 723, 640, 577, 533, 493, 462, 437, 415, 398, 386, 373, 363, 355, 346, 344, 338, 337, 335, 336],
    outFrom: 4826, out: [336, 337, 340, 350, 367, 389, 415, 460, 521, 614, 772, 997, OFF],
  },
  {
    label: "Governance",
    icon: "img/hq-check.png",
    x: 737, y: 591, inner: [97, 298],
    iconBox: [830, 647, 146, 154],
    text: [1021, 715],
    fill: [0.303, -0.007], innerFill: [0.233, -0.175],
    inFrom: 4782, in: [OFF, 946, 845, 779, 731, 695, 667, 643, 626, 615, 606, 599, 594, 591],
    outFrom: 4820, out: [591, 592, 594, 599, 606, 615, 626, 645, 667, 695, 731, 779, 845, 946, OFF],
  },
];

/**
 * The content panel stops where the next plate begins. Solved from the pixels: under the
 * Permissions plate the frame reads as field + Granular plate + Permissions plate, with
 * no Granular panel in the stack — 170 red where a fourth layer would make it 190. So the
 * panel is cut to the next plate's rectangle, wherever that plate currently is.
 */
const innerClip = (p: Plate, top: number, next: Plate | undefined, nextTop: number) => {
  if (!next || nextTop >= OFF) return undefined;
  // In the panel's own coordinates: its origin is the plate origin plus the inset.
  const ox = p.x + p.inner[0];
  const oy = top + p.inner[1];
  const nx = next.x - ox;
  const ny = nextTop - oy;
  const R = 1900;
  const B = 1100;
  if (ny <= 0) return `polygon(0 0, ${nx}px 0, ${nx}px ${B}px, 0 ${B}px)`;
  return `polygon(0 0, ${R}px 0, ${R}px ${ny}px, ${nx}px ${ny}px, ${nx}px ${B}px, 0 ${B}px)`;
};

/** A white overlay whose alpha runs from `top` down by `slope` per 1000px over `h`. */
const fade = ([top, slope]: [number, number], h: number) =>
  `linear-gradient(to bottom, rgba(255,255,255,${top.toFixed(3)}), rgba(255,255,255,${Math.max(0, top + (slope * h) / 1000).toFixed(3)}))`;

const plateTop = (p: Plate, g: number) => {
  if (g < p.inFrom) return OFF;
  if (g < p.outFrom) return series(p.inFrom, p.in, g);
  return series(p.outFrom, p.out, g);
};

/* ────────────────────────────────────────────────────────────────────────────────────────
   Sparkle and the pills
   ──────────────────────────────────────────────────────────────────────────────────────── */

/**
 * The blue glow behind the sparkle and the pills, centred on the frame. Read up the
 * middle column of 4877 and out the diagonal. It is one profile throughout: from 4850 to
 * 4979 only its radius changes (GLOW_SCALE), checked at four radii.
 */
const GLOW = [
  [0, 8, 77, 217], [30, 7, 76, 216], [60, 7, 75, 210], [90, 7, 72, 206], [120, 6, 69, 194],
  [150, 6, 63, 185], [180, 5, 58, 172], [210, 5, 53, 161], [240, 4, 49, 144], [270, 4, 43, 132],
  [300, 3, 37, 116], [330, 3, 31, 103], [360, 2, 26, 89], [390, 2, 22, 79], [420, 2, 16, 68],
  [450, 1, 15, 59], [480, 1, 11, 53], [510, 1, 9, 46], [560, 1, 6, 40], [620, 1, 4, 35], [700, 1, 3, 32],
];
const GLOW_SCALE: Table = [
  [4842, 0.72], [4850, 0.8], [4858, 0.8], [4864, 0.92], [4871, 1], [4893, 1], [4900, 1.08],
  [4910, 1.42], [4920, 1.64], [4930, 1.85], [4940, 2.0], [4945, 2.05],
];
/** The iris that opens the beat: a dark disc growing from the middle, radius per frame. */
const IRIS = [0, 45, 133, 582, 846, 967, 1049, 1090, 1101, 1200];
const IRIS_FROM = 4839;

/**
 * The sparkle bitmap, sized so its big star is the reference's 169px: 0.575 of the file.
 * Its big star's centre is then 84.5, 91 in from the bitmap's corner.
 */
const SPARK = { w: 183, h: 176, cx: 84.5, cy: 91 };
const SPARK_POP = [0.52, 0.95, 1.048, 1.048, 1.024, 1.012, 1];
/** Its left edge on the slide over to make room for the wordmark, from 4858. */
const SPARK_X = [869, 830, 730, 644, 594, 560, 537, 520, 508, 499, 492, 488, 486, 485];
/** Where the wordmark's P starts as it fades up, from 4865. */
const WORD_X = [749, 736, 727, 721, 717, 715, 714];
/**
 * The lockup's type, measured rather than left at the face's own defaults.
 *
 * Set as it came, `Powered by` was 20px wider than the reference over seven letters — the
 * glyphs are the right size (the P's cap is 58 rows in both) and the gaps between them are
 * not: 6.3px against the reference's 3.5. That is tracking, so it is set as tracking. Left
 * alone it closed the gap before the Zoom wordmark and the two words touched.
 */
const WORD_TRACKING = "-0.035em";
const WORD_BEARING = 7;
/** The whole lockup shrinks into the middle on 4891-4892 and is gone on 4893. */
const LOCKUP_OUT = [1, 0.94, 0.71];

type Pill = {
  label: string;
  row: number;
  /** Border rect at the 4911 scale. Off-frame edges are left to the content. */
  left?: number;
  right?: number;
  /** First frame it is drawn; they arrive in a five-frame flurry. */
  from: number;
};
const PILL_H = 156;
const PILL_ROW_TOP = [-59, 150, 358, 566, 774, 982];
const PILLS: Pill[] = [
  { label: "Localize Content", row: 0, right: 624, from: 4893 },
  { label: "Measure Engagement", row: 0, left: 657, right: 1494, from: 4897 },
  { label: "Build eNPS Surveys", row: 0, left: 1526, from: 4896 },
  { label: "Monitor Performance", row: 1, right: 501, from: 4893 },
  { label: "Catch Me Up", row: 1, left: 533, right: 1122, from: 4895 },
  { label: "Create a Survey", row: 1, left: 1153, right: 1837, from: 4896 },
  { label: "Personalize Your Experience", row: 2, right: 699, from: 4894 },
  { label: "Help Me Write", row: 2, left: 730, right: 1352, from: 4894 },
  { label: "Spot Trends", row: 2, left: 1382, from: 4896 },
  { label: "Create a Form", row: 3, right: 574, from: 4893 },
  { label: "Smart Chapters", row: 3, left: 604, right: 1278, from: 4893 },
  { label: "AI Compose", row: 3, left: 1310, right: 1897, from: 4896 },
  { label: "Gauge Employee Sentiment", row: 4, right: 628, from: 4893 },
  { label: "Summarize with AI", row: 4, left: 659, right: 1397, from: 4896 },
  { label: "Gather Insights", row: 4, left: 1430, from: 4893 },
  { label: "Homepage", row: 5, right: 412, from: 4893 },
  { label: "Book Time Off", row: 5, left: 447, right: 1079, from: 4895 },
  { label: "Plan Future Improvements", row: 5, left: 1112, from: 4895 },
];
/** A pill's size over its settled size, from the frame it is drawn. */
const PILL_POP = [0.5, 0.62, 0.72, 0.8, 0.87, 0.92, 0.955, 0.98, 0.99, 1];
/**
 * The push-in: one part in a thousand a frame, through the whole beat, about a point just
 * up and left of centre — solved from where two pills' text sits on 4911 and 4983.
 */
const PILL_ZOOM = (g: number) => 1 + (g - 4911) * 0.001;
const PILL_ORIGIN = { x: 940, y: 547 };

/** The two-star mark on each pill. */
const PillSpark: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 52 52" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    {/* A four-point star with pinched sides: big one low-left, small one top-right. */}
    <path d="M23 8 Q27.4 25.6 45 30 Q27.4 34.4 23 52 Q18.6 34.4 1 30 Q18.6 25.6 23 8 Z" fill="#ffffff" />
    <path d="M43 0 Q44.8 7.2 52 9 Q44.8 10.8 43 18 Q41.2 10.8 34 9 Q41.2 7.2 43 0 Z" fill="#ffffff" />
  </svg>
);

export const AdminCategoriesScene: React.FC = () => {
  const g = useCurrentFrame() + ADMIN_FROM;
  const t = useT();

  return (
    /* Transparent until 4591 so the Admin Hub, still sliding out beneath, shows through
       while the first card is already popping in over it. */
    <AbsoluteFill style={{ backgroundColor: g >= 4591 ? "#010320" : "transparent", overflow: "hidden" }}>
      {/* ── The carousel ─────────────────────────────────────────────────────── */}
      {g <= CAROUSEL_LAST &&
        ADMIN_STRIP.map((cat, i) => {
          // Track position in slots from the middle; the geometry is a function of it.
          const tt = i - ADMIN_STRIP_START - stripOffset(g);
          const a = Math.abs(tt);
          if (a > 2.6) return null;
          const ring = a < 0.5 ? "centre" : a < 1.5 ? "side" : "outer";
          const pop = series(POP_START[ring] - 1, CARD_POP, g);
          if (g < POP_START[ring] - 1) return null;

          // The exit: outer cards fly on 4697, the neighbours on 4698, the middle shrinks.
          let fly = 0;
          let shrink = 1;
          if (g >= 4697) {
            if (ring === "outer") fly = series(4696, FLY, g);
            else if (ring === "side") fly = series(4698, FLY, g);
            else shrink = series(4697, CENTRE_SHRINK, g);
          }
          const x = slotX(tt) + Math.sign(tt) * fly;
          const s = slotScale(tt) * pop * shrink;
          return (
            <WorkvivoAdminCard
              key={`${cat.title}-${i}`}
              category={cat}
              style={{
                left: x - CARD_W / 2,
                top: slotY(tt) - CARD_H / 2,
                transform: `scale(${s.toFixed(4)})`,
                transformOrigin: "50% 50%",
                opacity: g >= 4701 && ring === "centre" ? at([[4701, 1], [4702, 0]], g) : 1,
              }}
            />
          );
        })}

      {/* ── The toggle, its bloom and its burst ──────────────────────────────── */}
      {g >= 4702 && g <= 4743 && (() => {
        const scale = g < 4738 ? series(4702, TOGGLE_POP, g) : series(4738, TOGGLE_SHRINK, g);
        const knobX = series(4712, KNOB_X, g);
        const k = g - 4712;
        const trackColour =
          k <= 0 ? TRACK_COLOUR[0] : TRACK_COLOUR[Math.min(TRACK_COLOUR.length - 1, k)];
        // The knob is 200 wide while it is off and settles to 190 once it has flipped.
        const knobD = at([[4719, 200], [4728, 190]], g);
        const on = g >= 4717;
        return (
          <>
            {/* The bloom. Sampled across the beat the corner stays (1,3,32) until 4743 —
                this is a glow around the toggle, not a fill behind it. */}
            {g >= 4715 && g < 4743 && (
              <RadialWash id="ac-bloom" cx={TOGGLE_CX} cy={TOGGLE_CY} stops={BLOOM} opacity={series(4715, BLOOM_UP, g)} />
            )}
            {/* The purple field takes the frame on 4743 with the toggle still shrinking on it. */}
            {g === 4743 && <RadialWash id="ac-field-toggle" cx={960} cy={540} stops={FIELD} />}
            <div
              style={{
                position: "absolute",
                left: TRACK.x,
                top: TRACK.y,
                width: TRACK.w,
                height: TRACK.h,
                borderRadius: TRACK.h / 2,
                background: rgb(trackColour),
                transform: `scale(${scale.toFixed(4)})`,
                transformOrigin: `${TOGGLE_CX - TRACK.x}px ${TOGGLE_CY - TRACK.y}px`,
              }}>
              <div
                style={{
                  position: "absolute",
                  left: knobX - TRACK.x,
                  top: TRACK.h / 2 - knobD / 2 + (on ? 0 : -2),
                  width: knobD,
                  height: knobD,
                  borderRadius: knobD / 2,
                  background: "#ffffff",
                  boxShadow: on ? "0 4px 12px rgba(20, 0, 70, 0.4)" : "0 4px 14px rgba(20, 20, 60, 0.28)",
                }}
              />
            </div>
            {g >= BURST.from && g <= BURST.to && (
              <Img
                src={staticFile(`img/toggle-burst/f${g}.png`)}
                style={{ position: "absolute", left: BURST.x, top: BURST.y, width: BURST.w, height: BURST.h }}
              />
            )}
          </>
        );
      })()}

      {/* ── Granular Controls ───────────────────────────────────────────────── */}
      {g >= 4744 && g <= 4847 && (
        <AbsoluteFill>
        <RadialWash id="ac-field" cx={960} cy={540} stops={FIELD} />
          {PLATES.map((p, i) => {
            const top = plateTop(p, g);
            if (top >= OFF) return null;
            const next = PLATES[i + 1];
            return (
              <div
                key={p.label}
                style={{
                  position: "absolute",
                  left: p.x,
                  top,
                  width: 1900,
                  height: 1100,
                  borderRadius: 22,
                  boxSizing: "border-box",
                  border: "2px solid rgba(255,255,255,0.85)",
                  background: fade(p.fill, 1100),
                }}>
                <div
                  style={{
                    position: "absolute",
                    left: p.inner[0] - 2,
                    top: p.inner[1] - 2,
                    width: 1900,
                    height: 1100,
                    borderRadius: 20,
                    background: fade(p.innerFill, 1100),
                    clipPath: innerClip(p, top, next, next ? plateTop(next, g) : OFF),
                  }}
                />
                <Img
                  src={staticFile(p.icon)}
                  style={{
                    position: "absolute",
                    left: p.iconBox[0] - p.x - 2,
                    top: p.iconBox[1] - p.y - 2,
                    width: p.iconBox[2],
                    height: p.iconBox[3],
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: p.text[0] - p.x - 6,
                    /* 73px Inter Semibold: cap height 53 in an 88px line box, caps 16 down. */
                    top: p.text[1] - p.y - 2 - 16,
                    fontSize: 73,
                    lineHeight: "88px",
                    fontWeight: 600,
                    color: "#ffffff",
                    fontFamily: "InterX, Inter, sans-serif",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.005em",
                  }}>
                  {t(p.label)}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* ── The iris, the sparkle, Powered by Zoom, then the pills ──────────── */}
      {g >= 4840 && (() => {
        const r = series(IRIS_FROM, IRIS, g);
        const glowS = at(GLOW_SCALE, g);
        // The glow comes up with the iris: 0.73 of itself on 4842, all of it by 4849.
        const glowUp = at([[4842, 0.73], [4849, 1]], g);
        return (
          <AbsoluteFill
            style={{
              backgroundColor: "#010320",
              clipPath: g < 4848 ? `circle(${r}px at 960px 540px)` : undefined,
            }}>
            <RadialWash id="ac-glow" cx={960} cy={540} stops={GLOW} s={glowS} opacity={glowUp} />

            {/* Sparkle and wordmark */}
            {g >= 4841 && g <= 4892 && (() => {
              const pop = g <= 4847 ? series(4841, SPARK_POP, g) : 1;
              const left = g < 4858 ? 877 : series(4858, SPARK_X, g);
              const top = at([[4858, 446.5], [4871, 445.5]], g);
              const out = g >= 4890 ? series(4890, LOCKUP_OUT, g) : 1;
              return (
                <AbsoluteFill
                  style={{
                    transform: `scale(${out})`,
                    transformOrigin: "960px 540px",
                    opacity: g >= 4892 ? 0.85 : 1,
                  }}>
                  <Img
                    src={staticFile("img/sparkle-light.png")}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width: SPARK.w,
                      height: SPARK.h,
                      transform: `scale(${pop})`,
                      transformOrigin: `${SPARK.cx}px ${SPARK.cy}px`,
                    }}
                  />
                  {g >= 4865 && (
                    <div style={{ opacity: at([[4864, 0], [4868, 1]], g) }}>
                      <div
                        style={{
                          position: "absolute",
                          /* WORD_X is where the P's INK is, and a text node is placed by its
                             box: at 80px this face carries a 7px left side bearing. */
                          left: series(4865, WORD_X, g) - WORD_BEARING,
                          /* 80px Inter: cap height 58, cap-top on row 517 in a 96px line box. */
                          top: 517 - 19,
                          fontSize: 80,
                          lineHeight: "96px",
                          fontWeight: 600,
                          letterSpacing: WORD_TRACKING,
                          color: "#ffffff",
                          fontFamily: "InterX, Inter, sans-serif",
                          whiteSpace: "nowrap",
                        }}>
                        {t("Powered by")}
                      </div>
                      {/* The Zoom wordmark, 444 right of the P: 264 wide, its x-height on
                          rows 519-579. Drawn as inline SVG at a white fill, not as an
                          <Img> of the .svg recoloured by a CSS filter — the wizard's
                          in-browser export can do neither. See ZoomWordmark's header. */}
                      <div
                        style={{
                          position: "absolute",
                          left: series(4865, WORD_X, g) + 444,
                          top: 519,
                        }}>
                        <ZoomWordmark width={264} />
                      </div>
                    </div>
                  )}
                </AbsoluteFill>
              );
            })()}

            {/* The pills */}
            {g >= 4893 && (
              <AbsoluteFill
                style={{
                  transform: `scale(${PILL_ZOOM(g).toFixed(4)})`,
                  transformOrigin: `${PILL_ORIGIN.x}px ${PILL_ORIGIN.y}px`,
                }}>
                {PILLS.map((p) => {
                  if (g < p.from) return null;
                  const pop = series(p.from, PILL_POP, g);
                  const top = PILL_ROW_TOP[p.row];
                  return (
                    <div
                      key={p.label}
                      style={{
                        position: "absolute",
                        top,
                        height: PILL_H,
                        ...(p.left !== undefined ? { left: p.left } : {}),
                        ...(p.right !== undefined ? { right: 1920 - p.right } : {}),
                        ...(p.left !== undefined && p.right !== undefined ? { width: p.right - p.left } : {}),
                        boxSizing: "border-box",
                        borderRadius: PILL_H / 2,
                        border: "2px solid rgba(255,255,255,0.96)",
                        /* No fill: inside a pill the frame reads exactly as the bare glow. */
                        boxShadow: "0 0 10px rgba(255,255,255,0.3), inset 0 0 10px rgba(255,255,255,0.3)",
                        /* Every pill opens 71 in from the border it is anchored to, whichever
                           that is. Measured on the reference at 4915: the spark's ink starts
                           75px inside the left border on all twelve pills that have one, and
                           the label ends 71px inside the right border on all six that are
                           anchored the other way. */
                        paddingLeft: 71,
                        paddingRight: 71,
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                        transform: `scale(${pop})`,
                        transformOrigin: "50% 50%",
                        opacity: at([[p.from, 0.4], [p.from + 1, 1]], g),
                      }}>
                      <div style={{ width: 56, height: 56, flex: "0 0 56px", marginRight: 55, marginTop: -2 }}>
                        <PillSpark size={56} />
                      </div>
                      <div
                        style={{
                          /* 56px: the C of Catch is 42 tall with overshoot, the M 44 wide. */
                          fontSize: 56,
                          lineHeight: "64px",
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                          color: "#ffffff",
                          fontFamily: "InterX, Inter, sans-serif",
                          textShadow: "0 0 8px rgba(255,255,255,0.4)",
                          marginTop: 1,
                        }}>
                        {t(p.label)}
                      </div>
                    </div>
                  );
                })}
              </AbsoluteFill>
            )}
          </AbsoluteFill>
        );
      })()}
    </AbsoluteFill>
  );
};

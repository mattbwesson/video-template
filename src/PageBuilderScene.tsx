import React from "react";
import { AbsoluteFill, getRemotionEnvironment, interpolate, useCurrentFrame } from "remotion";
import { MotionBlur, useIsClientSideRender } from "./components/renderEnv";
import { CursorArrow } from "./components/CursorArrow";
import {
  ADD_PAGE,
  BLOCK_TYPES,
  PROMPT_BAR,
  WorkvivoAddPageButton,
  WorkvivoAiPrompt,
  WorkvivoBlockCard,
  WorkvivoHelpMeWrite,
  WorkvivoPageEditorCard,
} from "./components/workvivo/WorkvivoPageEditor";
import { useT } from "./customize/uiStrings";
import { useCustomization } from "./customize/CustomizationProvider";

/**
 * Workvivo Pages — global 3109 to 3264.
 *
 * Three shots in one beat: an Add Page button is clicked, a page editor rises into frame
 * and offers "Help me write", and the film cuts into a field of block-type cards flying
 * past an AI prompt that types itself out and starts generating. It was reference footage.
 *
 * THE THREE STAGES, MEASURED
 *   3109-3126  the button scales in, 0.60x to 1.0x by 3119, and is clicked
 *   3125-3163  the editor rises 614px into place by 3136; the pill arrives at 3146 and is
 *              clicked around 3156
 *   3164-3263  the card field, with the prompt bar growing from 1066 to 1212 wide as the
 *              whole field drifts toward the camera
 *
 * WHY THE FIELD IS 2D ARITHMETIC AND NOT A 3D TRANSFORM
 * It looks like `perspective` + `translateZ`, and that is the wrong tool here: the exporter
 * is a stricter environment than the Studio and 3D transforms are not something to discover
 * has failed in a render. Each card instead carries a direction from the centre and a
 * depth, and its position and size are that depth divided out — which is what perspective
 * IS, computed rather than delegated. It also makes the field deterministic, so a card
 * cannot drift across the prompt bar on one machine and not another.
 */

export const PAGE_FROM = 3109;
export const PAGE_TO = 3264;
export const PAGE_DURATION = PAGE_TO - PAGE_FROM;

type Table = [number, number][];
const at = (table: Table, g: number) =>
  interpolate(g, table.map((r) => r[0]), table.map((r) => r[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Stage 1. The button is centred on the frame, so it scales about the centre. */
const BUTTON_SCALE: Table = [[3109, 0.599], [3112, 0.85], [3115, 0.973], [3119, 1], [3124, 1]];
const BUTTON_OUT: Table = [[3123, 1], [3126, 0]];

/** Stage 2. The card's top edge, measured: 721 at 3125 down to its resting 107 by 3136. */
const EDITOR_Y: Table = [
  [3124, 760], [3125, 614], [3127, 269], [3129, 113], [3131, 35], [3132, 15], [3136, 0], [3163, 0],
];
const EDITOR_IN: Table = [[3124, 0], [3125, 1], [3162, 1], [3163, 0]];
const HELP_IN: Table = [[3144, 0], [3147, 1], [3162, 1], [3163, 0]];

/**
 * Stage 3, measured frame by frame off the reference (see out/track.py's method in
 * docs/reference): the prompt bar is ONE fixed 1254 x 206 design centred on the frame and
 * scaled — its height over width is 0.164 on every frame from 3163 to 3262 — and the
 * block cards burst out from behind it along fixed rays. The whole beat is three per-frame
 * tables: the bar's scale, how far along its ray each card is, and how big it is.
 */
/**
 * A per-frame table, read at any frame — fractional frames land between entries. The
 * fraction matters: <CameraMotionBlur> samples the subtree at sub-frame times, and a table
 * that only knew whole frames would hand every sample the same position and blur nothing.
 */
const series = (from: number, values: number[], g: number) => {
  const k = Math.max(0, Math.min(values.length - 1, g - from));
  const i = Math.floor(k);
  const f = k - i;
  return f === 0 || i + 1 >= values.length ? values[i] : values[i] + (values[i + 1] - values[i]) * f;
};

/** Bar width over 1254, per frame from 3163. Grows through the beat, then dollies out. */
const BAR_SCALE = [
  0.467, 0.474, 0.482, 0.491, 0.503, 0.518, 0.536, 0.561, 0.600, 0.656, 0.704, 0.736,
  0.759, 0.777, 0.789, 0.799, 0.807, 0.816, 0.823, 0.829, 0.836, 0.841, 0.845, 0.850,
  0.855, 0.858, 0.862, 0.865, 0.868, 0.871, 0.874, 0.876, 0.879, 0.880, 0.882, 0.885,
  0.887, 0.888, 0.890, 0.893, 0.895, 0.896, 0.900, 0.901, 0.903, 0.906, 0.907, 0.909,
  0.912, 0.914, 0.915, 0.919, 0.920, 0.922, 0.925, 0.927, 0.929, 0.931, 0.933, 0.936,
  0.938, 0.940, 0.943, 0.945, 0.947, 0.949, 0.952, 0.954, 0.957, 0.959, 0.961, 0.963,
  0.967, 0.968, 0.971, 0.973, 0.976, 0.978, 0.981, 0.982, 0.986, 0.988, 0.990, 0.994,
  0.995, 0.998, 1.000, 0.998, 0.987, 0.969, 0.943, 0.912, 0.876, 0.838, 0.798, 0.755,
  0.713, 0.671, 0.631, 0.593
];
/**
 * Where a card is along its ray, as a fraction of where it sits on 3249, per frame from
 * 3171. Every card shares it: seven tracked cards agree to 0.01 on every frame. The four
 * frames before 3175 are read by eye — the cards are still behind the bar.
 */
const CARD_OUT = [
  0.100, 0.220, 0.300, 0.380, 0.451, 0.506, 0.553, 0.595, 0.631, 0.664, 0.693, 0.718,
  0.742, 0.763, 0.781, 0.798, 0.813, 0.826, 0.838, 0.848, 0.858, 0.865, 0.872, 0.877,
  0.882, 0.885, 0.888, 0.890, 0.892, 0.894, 0.895, 0.897, 0.900, 0.902, 0.903, 0.905,
  0.908, 0.909, 0.912, 0.914, 0.916, 0.918, 0.920, 0.922, 0.924, 0.926, 0.928, 0.930,
  0.932, 0.934, 0.936, 0.939, 0.941, 0.943, 0.945, 0.947, 0.949, 0.952, 0.954, 0.956,
  0.958, 0.961, 0.962, 0.964, 0.967, 0.970, 0.971, 0.974, 0.976, 0.979, 0.981, 0.983,
  0.986, 0.988, 0.991, 0.993, 0.997, 0.998, 1.000, 1.000, 0.997, 0.990, 0.981, 0.967,
  0.950, 0.927, 0.898, 0.861, 0.815, 0.756, 0.678, 0.570
];
/** A card's size over its 3249 size, per frame from 3171. They arrive at 0.76 and grow. */
const CARD_SIZE = [
  0.200, 0.350, 0.550, 0.700, 0.762, 0.800, 0.811, 0.821, 0.824, 0.833, 0.844, 0.833,
  0.845, 0.853, 0.856, 0.856, 0.857, 0.864, 0.869, 0.869, 0.882, 0.878, 0.882, 0.886,
  0.886, 0.882, 0.889, 0.889, 0.897, 0.897, 0.900, 0.897, 0.905, 0.909, 0.909, 0.909,
  0.911, 0.909, 0.920, 0.917, 0.920, 0.920, 0.922, 0.926, 0.932, 0.929, 0.933, 0.932,
  0.933, 0.940, 0.941, 0.933, 0.944, 0.944, 0.952, 0.952, 0.955, 0.956, 0.955, 0.964,
  0.966, 0.966, 0.966, 0.966, 0.971, 0.967, 0.977, 0.977, 0.978, 0.985, 0.988, 0.985,
  0.985, 0.989, 0.989, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 0.989, 0.989,
  0.988, 0.977, 0.966, 0.956, 0.932, 0.909, 0.878, 0.814
];

/**
 * What is typed into the bar is `copy.article.prompt`, not a constant: the article this
 * beat cuts to at 3264 is customised, and the request that produced it has to name the
 * same subject. The default lives with that article in src/customize/videoCopy.ts.
 *
 * The typing below is a FRACTION of the line rather than a character count, so a longer or
 * shorter request types out over the same frames at the same apparent speed.
 */
/**
 * How much of the prompt is typed. Read off where the text's right edge sits across the
 * bar on each frame, against where it sits once complete; fast to start, done on 3213.
 */
const TYPED: Table = [
  [3163, 0.035], [3166, 0.074], [3169, 0.158], [3172, 0.31], [3175, 0.465], [3180, 0.66],
  [3185, 0.764], [3190, 0.86], [3195, 0.924], [3200, 0.955], [3205, 0.963], [3210, 0.978], [3213, 1],
];
/** Submit is clicked here: the status row appears and the pill reads Stop. */
const SUBMITTED_AT = 3229;

/**
 * The cards. Centre and size on 3249, when they are fully out; the ones cut by the frame
 * edge are sized from the visible dimension at the cards' common 2.82 aspect. Two labels
 * could not be read — those cards are almost entirely off frame — and are given the two
 * block types not otherwise on screen.
 */
const CARDS: [string, number, number, number, number][] = [
  ["Heading 1", 1689.5, 25, 167, 59],
  ["Heading 2", -97, 60, 244, 86],
  ["Heading 1", 854.5, 119, 193, 68],
  ["List", 1412, 243, 236, 84],
  ["Embed", 311.5, 247, 253, 90],
  ["List", -60, 464, 195, 69],
  ["Image", 1950, 540, 209, 74],
  ["Button", 1001.5, 810.5, 167, 59],
  ["Video", 111, 837, 244, 87],
  ["Heading 3", 1631.5, 856, 239, 86],
  ["Document", 617, 973.5, 236, 85],
  ["Table", 1956, 1025, 195, 69],
  ["Callout", 1421, 1103, 252, 89],
  ["Table", 145, 1115, 196, 70],
  // Off frame until the dolly out brings them in from the top and the right.
  ["Heading 2", 566, -47, 126, 45],
  ["Embed", 2068, 170, 145, 53],
];

/**
 * The pointer's tip, per frame from 3211. It comes up from the bottom right onto Submit,
 * sits on it for the click on 3229, and goes on 3233. Workvivo purple, and a little
 * translucent: over the bar's white it reads lighter than over the field.
 */
const CURSOR_TIP: [number, number][] = [
  [1605, 698], [1574, 672], [1546, 650], [1521, 627], [1505, 613], [1496, 603], [1490, 596],
  [1480, 582], [1478, 581], [1478, 582], [1471, 581], [1466, 578], [1468, 580], [1472, 581],
  [1470, 578], [1472, 578], [1479, 582], [1474, 582], [1482, 581], [1476, 579], [1478, 578],
  [1480, 578],
];
const CURSOR_FROM = 3211;

/**
 * The shutter, and the frame the blurred subtree reads. <CameraMotionBlur> takes its
 * samples from the frame AHEAD — over [frame + 1 - shutter, frame + 1] — so a subtree
 * that read the frame as given would render everything two thirds of a frame early,
 * 45px off at the speed the cards leave at. Reading it (1 - shutter/2) frames back puts
 * the samples either side of the frame they belong to. The reference's streaks are about
 * three quarters of a frame's travel, hence 270.
 */
const BLUR_SHUTTER = 270;
/**
 * ...and it is only owed when there IS a blur. The wizard's in-browser export cannot
 * composite `plus-lighter`, so <MotionBlur> passes the subtree straight through there — no
 * sub-frame samples, therefore nothing to centre, and paying the lead anyway would render
 * the whole field two thirds of a frame early in exactly the one output that is sharp.
 */
const BLUR_LEAD = 1 - BLUR_SHUTTER / 720;

/** The block cards bursting out along their rays, and the prompt bar scaling over them. */
const FieldAndPrompt: React.FC = () => {
  const g = useCurrentFrame() + PAGE_FROM - (useIsClientSideRender() ? 0 : BLUR_LEAD);
  const sb = series(3163, BAR_SCALE, g);
  const out = series(3171, CARD_OUT, g);
  const sz = series(3171, CARD_SIZE, g);
  // Translate BEFORE slicing, the same trap CreateYourOwnScene hit. `TYPED` is a fraction
  // of the line rather than a character count, so the typing reads the same at any length —
  // handing t() a half-typed English prefix would just miss the dictionary and stay English.
  const t = useT();
  const { copy } = useCustomization();
  const prompt = t(copy.article.prompt);
  const typed = Math.round(prompt.length * at(TYPED, g));
  return (
    <AbsoluteFill>
      {g >= 3171 &&
        CARDS.map(([label, cx, cy, w, h], i) => {
          const x = 960 + (cx - 960) * out;
          const y = 540 + (cy - 540) * out;
          const cw = w * sz;
          const ch = h * sz;
          if (x + cw / 2 < -20 || x - cw / 2 > 1940 || y + ch / 2 < -20 || y - ch / 2 > 1100) return null;
          return (
            <WorkvivoBlockCard
              key={i}
              block={BLOCK_TYPES.find((b) => b.label === label) ?? BLOCK_TYPES[0]}
              w={cw}
              h={ch}
              style={{ left: x - cw / 2, top: y - ch / 2 }}
            />
          );
        })}
      <WorkvivoAiPrompt
        prompt={prompt.slice(0, typed)}
        generating={g >= SUBMITTED_AT}
        style={{
          left: 960 - PROMPT_BAR.w / 2,
          top: 540 - PROMPT_BAR.h / 2,
          transform: `scale(${sb.toFixed(3)})`,
          transformOrigin: "50% 50%",
        }}
      />
    </AbsoluteFill>
  );
};

export const PageBuilderScene: React.FC = () => {
  const g = useCurrentFrame() + PAGE_FROM;

  return (
    <AbsoluteFill style={{ backgroundColor: "#010320", overflow: "hidden" }}>
      {/* Stage 1 — Add Page */}
      {g < 3127 && (
        <AbsoluteFill
          style={{
            opacity: at(BUTTON_OUT, g),
            transform: `scale(${at(BUTTON_SCALE, g).toFixed(4)})`,
            transformOrigin: `${ADD_PAGE.x + ADD_PAGE.w / 2}px ${ADD_PAGE.y + ADD_PAGE.h / 2}px`,
          }}>
          <WorkvivoAddPageButton />
        </AbsoluteFill>
      )}

      {/* Stage 2 — the editor, rising */}
      {g >= 3124 && g < 3164 && (
        <AbsoluteFill style={{ opacity: at(EDITOR_IN, g) }}>
          <WorkvivoPageEditorCard style={{ transform: `translateY(${at(EDITOR_Y, g).toFixed(1)}px)` }} />
          <WorkvivoHelpMeWrite
            /* Measured against docs/reference/3161-reference.png: its "Help me write" ink
               runs x 1181-1555 and y 894-942, which puts the pill 19px right and 19px
               below where this first had it. */
            style={{ left: 1151, top: 875, opacity: at(HELP_IN, g) }}
          />
        </AbsoluteFill>
      )}

      {/* Stage 3 — the field and the prompt. The reference's cards smear as they burst out
          and again as they rush back in on the dolly out — real motion blur, so real
          sub-frame sampling here. FieldAndPrompt reads the frame ITSELF: a subtree that
          takes its positions from this component's `g` would be identical in every sample
          and blur nothing. Twenty-four copies is fine in a render; the Studio gets three. */}
      {g >= 3163 && (
        <MotionBlur shutterAngle={BLUR_SHUTTER} samples={getRemotionEnvironment().isRendering ? 24 : 3}>
          <FieldAndPrompt />
        </MotionBlur>
      )}
      {g >= CURSOR_FROM && g <= 3233 && (
        <CursorArrow
          fill="#6102ec"
          style={{
            position: "absolute",
            left: series(CURSOR_FROM, CURSOR_TIP.map((c) => c[0]), g),
            top: series(CURSOR_FROM, CURSOR_TIP.map((c) => c[1]), g),
            width: 92,
            opacity: 0.88 * at([[3211, 0], [3213, 1], [3232, 1], [3233, 0]], g),
          }}
        />
      )}

      {/* The pointer: it clicks the button, then the pill. Off before the cut at 3164. */}
      {g >= 3112 && g < 3163 && (
        <CursorArrow
          color="black"
          style={{
            position: "absolute",
            left: at([[3112, 1090], [3119, 1002], [3123, 998], [3130, 1040], [3140, 1300], [3150, 1418], [3156, 1424], [3162, 1424]], g),
            top: at([[3112, 640], [3119, 556], [3123, 552], [3130, 640], [3140, 810], [3150, 900], [3156, 906], [3162, 906]], g),
            width: 62,
            transform: `scale(${[3124, 3157].reduce((s, c) => s * (1 - 0.12 * Math.max(0, 1 - Math.abs(g - c) / 3)), 1).toFixed(3)})`,
            transformOrigin: "0 0",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

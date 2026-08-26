import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * "No matter where they are", on the dark purple field.
 *
 * The line arrives in three beats, each waiting on the one before it. "No matter" scales
 * in big, centred on the frame; then it drops to sentence size, still centred; then the
 * whole line travels LEFT and "where they are" fills the space it opens — the same device
 * the Workvivo Home headline uses at 545, where one progress drives both the thing moving
 * out of the way and the thing arriving.
 *
 * The size change is not decoration: "No matter where they are" at the size the first
 * beat ends on would be some 2,900px on a 1920 frame. It is its own beat rather than part
 * of the travel because a shrink and a slide at once read as one vague drift; separated,
 * you see the words settle and then make room.
 *
 * The two words are present from the first frame at 6% white and light up to full, so the
 * beat reads as the line being spoken rather than as type flying in. That is why the
 * middle of the scale-in shows "No" white against a "matter" still barely off the field.
 *
 * The field is #010026 — the same one the phone shot before it is standing on, so the
 * hard cut at 2760 takes the phone away and leaves the colour, which is what makes this a
 * title card for the run rather than a new place.
 */

/** The Home scene's headline type, which this is a continuation of. */
const LINE_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

/** Where a word sits before it has lit up. White at 6% on this field is the reference's
 *  near-invisible grey; a flat colour would not survive a change of background. */
const DIM = 0.06;

/** The house grow-in, shared with BrandWordScene and AmplifyReachScene. */
const GROW_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const GROW_FROM = 0.88;

/** Optical centring, as BrandWordScene does it — a single line of caps reads low at 50%. */
const LINE_CY = 0.478;

/** "No" sets off on 0, "matter" four frames later; each takes 12 frames. The pair is fully
 *  up on 16, which is what the shift below waits for. */
const WORD_STAGGER = 4;
const WORD_FRAMES = 12;

/** The size drops first, in place, with "No matter" still centred on the frame. */
const SCALE_FROM = 24;
const SCALE_FRAMES = 12;
const SCALE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Only once it is down to sentence size does the line move left. Two frames of air
 *  between the two so they read as one thing then the next, not as an overlap. The tail
 *  trails the move by two more, so it is seen to arrive into the space the move opens
 *  rather than to have been waiting there. */
const SHIFT_FROM = SCALE_FROM + SCALE_FRAMES + 2;
const SHIFT_FRAMES = 14;
const TAIL_DELAY = 2;
const SHIFT_EASE = Easing.bezier(0.82, 0.02, 0.12, 1.0);

/** How much bigger the first beat is than the settled sentence. Measured off the two
 *  references: "No matter" alone spans 57% of the frame, and the same two words inside
 *  the finished line span 26%. */
const BIG_SCALE = 2.25;

export interface NoMatterSceneProps {
  /** The field behind it. */
  background?: string;
  fontSize?: number;
  fontWeight?: number;
}

export const NoMatterScene: React.FC<NoMatterSceneProps> = ({
  background = "#010026",
  fontSize = 113,
  fontWeight = 700,
}) => {
  const frame = useCurrentFrame();

  // The line is laid out whole — tail included, invisible — so the container's centre is
  // the FINISHED line's centre. Centring "No matter" on the frame first is then a matter
  // of pushing the whole line right by half the tail, and the move left is that offset
  // going to zero. Measured rather than hardcoded so the copy can change without the
  // centring quietly going wrong.
  const tailRef = useRef<HTMLSpanElement>(null);
  const [tailWidth, setTailWidth] = useState(0);
  useLayoutEffect(() => {
    // offsetWidth, not getBoundingClientRect: the span sits inside the scaled container,
    // and the shift below is in the container's own units. The rect would come back
    // already multiplied by the scale and the centring would drift as the line settles.
    // React bails out on an unchanged value, so this lands on the first layout rather
    // than looping.
    setTailWidth(tailRef.current?.offsetWidth ?? 0);
  });

  /** One word's 0->1. */
  const wordProgress = (index: number) =>
    interpolate(
      frame,
      [index * WORD_STAGGER, index * WORD_STAGGER + WORD_FRAMES],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: GROW_EASE,
      },
    );

  // Two moves, one after the other, on their own windows: the size comes down while the
  // pair holds the centre of the frame, and only then does the line travel left. Driving
  // both off one progress is what made them happen at once.
  const scale = interpolate(
    frame,
    [SCALE_FROM, SCALE_FROM + SCALE_FRAMES],
    [BIG_SCALE, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SCALE_EASE,
    },
  );

  const shift = interpolate(frame, [SHIFT_FROM, SHIFT_FROM + SHIFT_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SHIFT_EASE,
  });

  const tail = interpolate(
    frame,
    [SHIFT_FROM + TAIL_DELAY, SHIFT_FROM + TAIL_DELAY + SHIFT_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SHIFT_EASE,
    },
  );

  const word = (text: string, index: number): React.CSSProperties => {
    const p = wordProgress(index);
    return {
      display: "inline-block",
      opacity: interpolate(p, [0, 1], [DIM, 1]),
      transform: `scale(${interpolate(p, [0, 1], [GROW_FROM, 1])})`,
      transformOrigin: "center center",
    };
  };

  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      {/* Two nested transforms rather than one: the outer carries the size, about the
          frame's centre, and the inner carries the shift in the line's OWN units. Folding
          them together would mean pre-multiplying the shift by the scale by hand on every
          frame, which is the sort of arithmetic that goes wrong the moment the copy or
          the type size changes. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${LINE_CY * 100}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          color: "#FFFFFF",
          fontFamily: LINE_FONT,
          fontSize,
          fontWeight,
          letterSpacing: -2,
          lineHeight: 1,
          whiteSpace: "pre",
        }}
      >
        {/* The tail is always laid out, so this box's centre is the FINISHED line's
            centre. Pushing it right by half the tail is therefore exactly what centres
            "No matter" on the frame, and letting that offset fall to zero is the move
            left — no measurement of the visible words needed. */}
        <div style={{ transform: `translateX(${(shift * tailWidth) / 2}px)` }}>
          <span style={word("No", 0)}>No</span>
          {" "}
          <span style={word("matter", 1)}>matter</span>
          {/* Only its paint is animated; it holds its space from the first frame. The
              leading space belongs to the tail, or the line would carry a trailing gap
              while "No matter" is alone on the frame. */}
          <span ref={tailRef} style={{ opacity: tail }}>
            {" where they are"}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

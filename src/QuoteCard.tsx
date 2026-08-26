import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";

/**
 * Native rebuild of public/refs/quote-card.html — same geometry, colours and blur radii,
 * read straight off that file's 1920x1080 stage so the settled frame matches it.
 *
 * It is native rather than an <IFrame> because the card has to ANIMATE: it opens
 * downward from a collapsed pill while the quote is revealed by the growing frame.
 * Nothing inside an iframe can be driven off useCurrentFrame(), and the 24 motion-blur
 * samples were mounting 24 iframes per blurred frame — occasionally one failed to load
 * and rendered a broken frame.
 *
 * Every component here reads useCurrentFrame() itself, so CameraMotionBlur's sub-frame
 * samples animate the reveal too instead of freezing it.
 */


const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

// --- stage geometry, copied from quote-card.html ---------------------------
const CARD_LEFT = 489;
const CARD_TOP = 327;
const CARD_WIDTH = 939;
const CARD_HEIGHT_OPEN = 470;
/** Collapsed height. Below 2x the 52px corner radius, so it reads as a pill. */
const CARD_HEIGHT_COLLAPSED = 96;
const CARD_RADIUS = 52;
const CARD_PADDING = 5;

// The cursor sits just inside the card's bottom-right corner in the reference, so it
// rides down with the bottom edge as the card opens rather than hanging in space.
const CURSOR_INSET_RIGHT = 22;
const CURSOR_INSET_BOTTOM = 61;

const SPARKLE_LEFT = 851;
const SPARKLE_TOP = 178;
const SPARKLE_SIZE = 248;

// --- reveal timing, in local frames of VirginWorkvivoDesktopFullscreenScene ---
// The card first exists at local 190 (holdBefore 184 + the 0.3846 cut split of a 15-frame
// transition). Both reveals are held off past that: run inside the spin they were not only
// hidden but DIMMED, because CameraMotionBlur averages its samples with `plus-lighter` at
// opacity(1/samples), so a fast-moving bright element spreads thin and reads dark — then
// snapped to full brightness the frame the blur switched off at 199.

/** Card opens at 195, five frames after it first exists. */
export const CARD_OPEN_START = 195;
export const CARD_OPEN_END = 213;

/** Sparkle starts scaling the frame the card first exists, so it is already shrinking as
 *  the spin settles. */
export const SPARKLE_SCALE_START = 190;
export const SPARKLE_SCALE_END = 205;
/** Screen-filling. The sparkle box is 248px centred at (975, 302), so its half-extent is
 *  124*S; covering x=[0,1920] needs S >= 7.86 (the binding constraint, since the box sits
 *  left of centre) and y=[0,1080] needs S >= 6.27. */
const SPARKLE_START_SCALE = 8;
/** Settles 20% larger than the 248px the reference draws it at, so it reads bigger against
 *  the card's top edge. Scaling is about its centre, so it grows evenly around (975, 302). */
const SPARKLE_END_SCALE = 1.2;

// --- the two rewrites, in the same local frame space ------------------------
// The card opens on the original copy, is rewritten shorter in English, then translated to
// Spanish. Each rewrite is dressed the same way: the text tucks in slightly and its fill runs
// to a gradient, the words change at the tightest point, then it opens back out to white.
//
// Colour cannot be tweened from #FFF to a gradient in one declaration, so the text is drawn
// twice in the same box and cross-faded — a white copy under a gradient-clipped copy. Both
// carry identical type metrics, so they superimpose exactly and the swap has no reflow.

/** Local frame the copy is rewritten in English (global 1113). */
export const QUOTE_REWRITE_AT = 225;
/** Local frame it is translated to Spanish (global 1130). */
export const QUOTE_TRANSLATE_AT = 242;

/** Frames of tuck-in before a swap and open-out after it. The tuck is deliberately twice as
 *  fast as the release: the text snaps in and eases back out. 3.5 + 8 still keeps the two
 *  17-frame-apart windows from touching, so neither rewrite starts before the last settled. */
const REWRITE_IN = 3.5;
const REWRITE_OUT = 8;

/** How far the block tucks in — a 3% dip. A breath, not a zoom; at this depth the snap and
 *  the colour do the work rather than the size change. */
const REWRITE_SCALE = 0.97;

/** Pink through violet to blue, on the block's diagonal, so the heading picks up the pink end
 *  and the closing line the blue — matching the reference. */
const REWRITE_GRADIENT =
  "linear-gradient(160deg, #FF6EC7 0%, #C58CFF 46%, #7FD3FF 100%)";

/** Shared by both copies of the quote so they superimpose exactly. */
const quoteTypeStyle: React.CSSProperties = {
  width: 762,
  margin: 0,
  fontFamily: FONT_STACK,
  fontSize: 33,
  lineHeight: "37.5px",
  letterSpacing: ".1px",
  fontWeight: 400,
  whiteSpace: "pre-line",
  color: "#FFFFFF",
};

const REVEAL_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// --- the settings swap, in the same local frame space -----------------------
// One beat, two objects: the quote card group is pushed off the top while
// workvivo-ai-compose-settings.html rises from below into the space it leaves. Both ride
// this ONE progress curve so they can't drift apart — the card's exit and the panel's
// entrance are the same push. AiComposeSettings imports it rather than re-deriving it.
//
// The halos are deliberately NOT part of the group: the purple glow stays lit through the
// whole swap, so the panel arrives into the same background the card left.

/** Local frame the card starts leaving and the settings panel starts arriving. */
export const SETTINGS_SWAP_START = 286;
export const SETTINGS_SWAP_END = 302;

/** Far enough up to clear the sparkle's top edge (178) and the open card's bottom (797). */
const EXIT_TRAVEL_Y = -900;

const SWAP_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Shared 0→1 for the swap. Callers read `useCurrentFrame()` themselves and pass it in, so
 *  each component still animates under CameraMotionBlur's sub-frame samples. */
export const settingsSwapProgress = (frame: number) =>
  interpolate(frame, [SETTINGS_SWAP_START, SETTINGS_SWAP_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SWAP_EASE,
  });

/** 0 -> 1 -> 0 over `period` frames, matching a 0%/50%/100% ease-in-out CSS keyframe.
 *  Driven off the frame so the halo pulses are deterministic; as CSS keyframes inside
 *  the iframe they did not advance with the timeline at all. */
const pulse = (frame: number, period: number) =>
  (1 - Math.cos((2 * Math.PI * frame) / period)) / 2;

const Halo: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  background: string;
  blur: number;
  baseOpacity: number;
  period: number;
}> = ({ left, top, width, height, background, blur, baseOpacity, period }) => {
  const frame = useCurrentFrame();
  const t = pulse(frame, period);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: "50%",
        background,
        filter: `blur(${blur}px)`,
        opacity: baseOpacity * interpolate(t, [0, 1], [0.8, 0.98]),
        transform: `scale(${interpolate(t, [0, 1], [1, 1.08])}) translate(${interpolate(
          t,
          [0, 1],
          [0, -12],
        )}px, ${interpolate(t, [0, 1], [0, 8])}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

/** The bloom sitting behind the sparkle on the card's top edge. */
const CrestHalo: React.FC<{ driftX?: number; driftY?: number }> = ({
  driftX = 0,
  driftY = 0,
}) => {
  const frame = useCurrentFrame();
  const t = pulse(frame, 100); // 4s at 25fps

  return (
    <div
      style={{
        position: "absolute",
        left: 780,
        top: 120,
        width: 380,
        height: 320,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, rgba(226, 208, 255, 0.9) 0%, rgba(160, 130, 240, 0.6) 40%, rgba(96, 56, 200, 0.2) 70%, rgba(0, 3, 31, 0) 100%)",
        filter: "blur(45px)",
        opacity: interpolate(t, [0, 1], [0.85, 1]),
        transform: `translate(${driftX * 0.7}px, ${driftY * 0.7}px) scale(${interpolate(t, [0, 1], [1, 1.15])})`,
        pointerEvents: "none",
      }}
    />
  );
};

export const QuoteCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { copy } = useCustomization();

  // The card opens downward: the top edge (where the sparkle straddles) is pinned and
  // only the bottom edge travels, so the quote is revealed by the frame growing past it
  // rather than by animating the text itself.
  const cardHeight = interpolate(
    frame,
    [CARD_OPEN_START, CARD_OPEN_END],
    [CARD_HEIGHT_COLLAPSED, CARD_HEIGHT_OPEN],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: REVEAL_EASE,
    },
  );

  const sparkleScale = interpolate(
    frame,
    [SPARKLE_SCALE_START, SPARKLE_SCALE_END],
    [SPARKLE_START_SCALE, SPARKLE_END_SCALE],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: REVEAL_EASE,
    },
  );

  // Ambient organic drift for the sparkle once settled
  const driftProgress = interpolate(
    frame,
    [SPARKLE_SCALE_END, SPARKLE_SCALE_END + 12],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const driftTime = (frame - SPARKLE_SCALE_END) * 0.08;
  const driftX =
    (Math.sin(driftTime * 0.7) * 5 + Math.cos(driftTime * 1.3) * 3) *
    driftProgress;
  const driftY =
    (Math.sin(driftTime) * 6 + Math.sin(driftTime * 0.5) * 3) * driftProgress;
  const driftRot = Math.sin(driftTime * 0.75) * 2 * driftProgress;

  // One 0->1->0 pulse per rewrite; the text is at its smallest exactly when it is most
  // coloured, and that is the frame the words swap. Taking the max means the two never sum.
  const rewritePulse = (at: number) =>
    interpolate(frame, [at - REWRITE_IN, at, at + REWRITE_OUT], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: REVEAL_EASE,
    });
  const translateT = Math.max(
    rewritePulse(QUOTE_REWRITE_AT),
    rewritePulse(QUOTE_TRANSLATE_AT),
  );
  const quoteScale = interpolate(translateT, [0, 1], [1, REWRITE_SCALE]);
  // The three states of the same post: as written, rewritten by AI, then translated.
  const quote =
    frame < QUOTE_REWRITE_AT
      ? copy.quote.original
      : frame < QUOTE_TRANSLATE_AT
        ? copy.quote.rewritten
        : copy.quote.translated;

  // The pointer presses on each rewrite. Min, not max: a press is a dip below 1, so the
  // deeper of the two wins and the value returns to rest between them.
  const cursorPress = Math.min(
    interpolate(frame, [QUOTE_REWRITE_AT - 2, QUOTE_REWRITE_AT, QUOTE_REWRITE_AT + 2], [1, 0.82, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [QUOTE_TRANSLATE_AT - 2, QUOTE_TRANSLATE_AT, QUOTE_TRANSLATE_AT + 2], [1, 0.82, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Card, sparkle and cursor leave as one object; the halos below are not in the group.
  const exitY = interpolate(settingsSwapProgress(frame), [0, 1], [0, EXIT_TRAVEL_Y]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#00031F", overflow: "hidden" }}>
      <Halo
        left={350}
        top={250}
        width={1220}
        height={620}
        background="radial-gradient(ellipse at center, rgba(112, 89, 220, 0.75) 0%, rgba(61, 39, 143, 0.45) 50%, rgba(0, 3, 31, 0) 75%)"
        blur={140}
        baseOpacity={0.85}
        period={125} // 5s at 25fps
      />
      <Halo
        left={420}
        top={280}
        width={1080}
        height={560}
        background="radial-gradient(ellipse at center, rgba(97, 3, 237, 0.65) 0%, rgba(52, 32, 143, 0.35) 60%, rgba(0, 3, 31, 0) 80%)"
        blur={120}
        baseOpacity={0.9}
        period={150} // 6s at 25fps
      />
      <Halo
        left={380}
        top={620}
        width={780}
        height={320}
        background="radial-gradient(ellipse at center, rgba(147, 96, 247, 0.8) 0%, rgba(96, 52, 214, 0.4) 50%, rgba(0, 3, 31, 0) 75%)"
        blur={100}
        baseOpacity={1}
        period={175} // 7s at 25fps
      />
      <CrestHalo driftX={driftX} driftY={driftY} />

      {/* Everything below travels up together at SETTINGS_SWAP_START. Grouped in one
          transformed layer so the card, the sparkle straddling its top edge and the cursor
          riding its bottom edge keep their exact relative positions on the way out. */}
      <AbsoluteFill style={{ transform: `translateY(${exitY}px)` }}>
      {/* the card: dark fill inside a lit rim */}
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_WIDTH,
          height: cardHeight,
          borderRadius: CARD_RADIUS,
          padding: CARD_PADDING,
          background:
            "linear-gradient(120deg, #7059DC 0%, #6A4FCE 30%, #5744B8 62%, #5B44AE 100%)",
          boxShadow: "0 0 60px -6px rgba(90,60,215,.55)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: CARD_PADDING,
            borderRadius: CARD_RADIUS - CARD_PADDING,
            background: "#00041A",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 93 - CARD_PADDING,
              top: 88 - CARD_PADDING,
              width: 762,
              transform: `scale(${quoteScale})`,
              transformOrigin: "center center",
            }}
          >
            <p style={quoteTypeStyle}>{quote}</p>
            <p
              style={{
                ...quoteTypeStyle,
                position: "absolute",
                left: 0,
                top: 0,
                background: REWRITE_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                opacity: translateT,
              }}
            >
              {quote}
            </p>
          </div>
        </div>
      </div>

      {/* cursor.svg carries no paint of its own, so brightness(0) invert(1) forces it white —
          the same trick WorkvivoMobileStyles uses for its own glyphs. It presses on each
          rewrite, scaling about its tip rather than its box so the point stays put. */}
      <Img
        src={staticFile("img/cursor.svg")}
        style={{
          position: "absolute",
          left: CARD_LEFT + CARD_WIDTH - CURSOR_INSET_RIGHT,
          top: CARD_TOP + cardHeight - CURSOR_INSET_BOTTOM,
          width: 80,
          height: 89,
          transform: `scale(${cursorPress})`,
          transformOrigin: "10% 4%",
          filter: "brightness(0) invert(1) drop-shadow(0 4px 10px rgba(0,0,0,.45))",
        }}
      />
      </AbsoluteFill>

      {/* NOT inside the exit group above, deliberately. `mix-blend-mode: plus-lighter` only
          blends against the backdrop in its OWN stacking context, and that group's
          `transform` creates one — inside it the sparkle composited against transparency
          and lost the additive glow entirely. Out here its backdrop is the halos and the
          opaque #00031F fill, which is what quote-card.html blends it against. It still
          carries the same translateY, so it leaves locked to the card as before. */}
      <Img
        src={staticFile("img/quote-card-sparkle.png")}
        style={{
          position: "absolute",
          left: SPARKLE_LEFT,
          top: SPARKLE_TOP,
          width: SPARKLE_SIZE,
          height: SPARKLE_SIZE,
          transform: `translateY(${exitY}px) translate(${driftX}px, ${driftY}px) rotate(${driftRot}deg) scale(${sparkleScale})`,
          transformOrigin: "center center",
          mixBlendMode: "plus-lighter",
        }}
      />
    </AbsoluteFill>
  );
};

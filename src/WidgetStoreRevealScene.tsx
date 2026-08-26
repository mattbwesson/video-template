import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  WorkvivoWidgetStore,
  WIDGET_STORE_CARD_COUNT,
} from "./components/workvivo";

/**
 * The Widget Store arriving, in two beats.
 *
 * First the top row of category cards alone on the brand field, big and centred, each one
 * growing into place a few frames after the last. Then the row settles back into the size
 * and place it occupies inside the modal while the modal itself fades up around it — so
 * the three cards you were shown are the three cards you end up looking at, rather than
 * being replaced by a picture of them.
 *
 * HOW THE HANDOVER IS EXACT
 * There are two copies of WorkvivoWidgetStore here, one over the other. The lower one is
 * the real modal and only its opacity is animated. The upper one is the SAME component
 * with `wws-cards-only`, which paints the first row and nothing else, inside a wrapper
 * that starts at the hero pose and ends at identity. Because it is the same component and
 * the same grid, identity puts its cards exactly on the modal's — no card geometry is
 * measured or restated anywhere, and retuning the grid moves both together.
 *
 * The one thing measured off the render is where that row sits, which the hero pose is
 * expressed relative to. It is a transform origin, not a layout.
 */

/** The first card row's box inside the modal, on the 1920x1080 stage. */
const ROW_CENTRE_X = 1099.5;
const ROW_CENTRE_Y = 615;
const ROW_WIDTH = 974;

/**
 * The hero pose: the row centred on the frame at 1534px across, which is the 79.9% of the
 * frame width the reference for this beat shows. Everything else follows from those.
 */
const HERO_ROW_WIDTH = 1534;
const HERO_CENTRE_X = 960;
const HERO_CENTRE_Y = 540;

/** How many cards are the hero row. The rest are the ones that pop in around it. */
const HERO_COUNT = 3;

/** Each card grows from this, on the house curve shared with the other reveals. */
const GROW_FROM = 0.6;
const GROW_FRAMES = 10;
const GROW_STAGGER = 3;
const GROW_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** How long the settle and the fade take once they start. */
const SETTLE_FRAMES = 18;
const SETTLE_EASE = Easing.bezier(0.32, 0, 0.2, 1);

/**
 * The remaining cards pop rather than fade: from 70% on the same curve the hero row grew
 * on, so the two beats read as the same gesture at different sizes.
 *
 * They set off two frames apart and the LAST one lands on `popTo`, so the duration is
 * whatever is left of the window after the stagger has been spent — state the window and
 * the spacing and the length follows, rather than three numbers that have to be kept
 * agreeing by hand.
 */
const POP_FROM_SCALE = 0.7;
const POP_STAGGER = 2;

export interface WidgetStoreRevealSceneProps {
  /** Per-tenant colour for the field the whole thing stands on. */
  brand?: string;
  /**
   * Local frame the row starts settling and the modal starts fading up. The cut passes
   * global 2840; the three cards are fully grown by local 16, so anything from there on
   * begins from a still row.
   */
  settleFrom?: number;
  /** Local frame the first of the remaining cards sets off. The cut passes global 2857. */
  popFrom?: number;
  /** Local frame the LAST of them lands. The cut passes global 2870. */
  popTo?: number;
}

export const WidgetStoreRevealScene: React.FC<WidgetStoreRevealSceneProps> = ({
  brand,
  settleFrom = 17,
  popFrom = 34,
  popTo = 47,
}) => {
  const frame = useCurrentFrame();

  const settle = interpolate(
    frame,
    [settleFrom, settleFrom + SETTLE_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SETTLE_EASE,
    },
  );

  // 1 at the hero pose, 0 once the row is home. Scaling about the row's own centre is what
  // lets the pose be written as "this much bigger, and over there" rather than as a corner
  // offset that has to be re-derived whenever either number moves.
  const heroScale = HERO_ROW_WIDTH / ROW_WIDTH;
  const scale = interpolate(settle, [0, 1], [heroScale, 1]);
  const x = interpolate(settle, [0, 1], [HERO_CENTRE_X - ROW_CENTRE_X, 0]);
  const y = interpolate(settle, [0, 1], [HERO_CENTRE_Y - ROW_CENTRE_Y, 0]);

  // The modal comes up under the row rather than with it — it is behind the cards for the
  // whole of the settle, so it can afford to arrive a little later than they land.
  const modal = interpolate(settle, [0.15, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const card = (index: number): React.CSSProperties => {
    // Only the first row is painted, so only the first row is worth staggering.
    const from = index * GROW_STAGGER;
    const p = interpolate(frame, [from, from + GROW_FRAMES], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: GROW_EASE,
    });
    return {
      opacity: p,
      transform: `scale(${interpolate(p, [0, 1], [GROW_FROM, 1])})`,
    };
  };

  // The cards the hero row does NOT stand in for. They are held off entirely while the
  // modal fades up — otherwise they would arrive with the chrome and there would be
  // nothing left to pop — and then come in one after another around it.
  const restCount = Math.max(0, WIDGET_STORE_CARD_COUNT - HERO_COUNT);
  const popFrames = popTo - popFrom - (restCount - 1) * POP_STAGGER;

  const modalCard = (index: number): React.CSSProperties => {
    // The hero row's own cards sit under the moving copy and simply come up with the
    // modal, which is what makes the copy's landing on them invisible.
    if (index < HERO_COUNT) return {};

    const from = popFrom + (index - HERO_COUNT) * POP_STAGGER;
    const p = interpolate(frame, [from, from + popFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: GROW_EASE,
    });
    return {
      opacity: p,
      transform: `scale(${interpolate(p, [0, 1], [POP_FROM_SCALE, 1])})`,
    };
  };

  return (
    <AbsoluteFill style={{ background: brand, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: modal }}>
        <WorkvivoWidgetStore brand={brand} cardStyle={modalCard} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          transformOrigin: `${ROW_CENTRE_X}px ${ROW_CENTRE_Y}px`,
        }}>
        <WorkvivoWidgetStore
          brand={brand}
          className="wws-cards-only"
          cardStyle={card}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

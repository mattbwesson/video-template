import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { WorkvivoSvgDefs } from "./components/workvivo/WorkvivoIcons";
import {
  JOURNEY_CARD_H,
  JOURNEY_CARD_W,
  WorkvivoJourneyCard,
} from "./components/workvivo/WorkvivoJourneyCard";
import {
  COLS,
  COL_GAP,
  GRID_H,
  GRID_W,
  JOURNEYS,
  JOURNEY_HERO_INDEX,
  ROW_GAP,
} from "./JourneyCardsScene";
import "./components/workvivo/WorkvivoStyles.css";
import { useCustomization } from "./customize/CustomizationProvider";

export interface JourneyCardRevealSceneProps {
  /** Per-tenant brand colour for the field. */
  brand?: string;
  /** Which journey the match cut lands on. Indexes JOURNEYS. */
  heroIndex?: number;
  /**
   * Local frame the hero card starts arriving on.
   *
   * When this scene is the incoming side of a match cut, the transition holds it at zero
   * opacity until its own hard cut lands — so starting the card's travel at 0 spends most
   * of it behind that gate. Offset it to the cut instead and the card is seen to arrive.
   */
  revealFrom?: number;
  /** Frames the hero card takes to settle. */
  revealDuration?: number;
  /** Peak overshoot scale for hero card arrival. */
  heroOvershoot?: number;
  /** Local frame the rest of the wall arrives on. Omit to stay on the hero alone. */
  wallFrom?: number;
  /** Frames the hero takes to travel from frame-centre into its grid slot. */
  wallTravel?: number;
  /** Frames between one sibling card starting and the next. */
  wallStagger?: number;
  /** Frames a single sibling card takes to arrive. */
  wallDuration?: number;
  /** Local frame when side columns start fading out top-to-bottom. Default 70 (global 1805). */
  sideFadeFrom?: number;
  /** Local frame when side columns finish fading out. Default 77 (global 1812). */
  sideFadeTo?: number;
  /** Local frame when middle column starts moving down off screen. Default 70 (global 1805). */
  middleExitFrom?: number;
  /** Duration in frames for middle column exit. Default 12.5 (500ms at 25 fps). */
  middleExitDuration?: number;
}

/**
 * The journey the match cut lands on, and then the rest of the wall arriving around it.
 *
 * The hero card is centred in frame on its own, which is what the scale-down match cut
 * hands over to. At `wallFrom` the other eight fade up in their grid slots and the hero
 * travels from frame-centre into its own slot — which for the default hero is a straight
 * 302px rise, because the wall's top-middle slot shares an x-centre with the frame. That
 * shared centre is why the hero can hold position through the cut and still end up in a
 * grid: nothing slides sideways, so the wall reads as assembling around a fixed card
 * rather than as a new shot.
 *
 * Geometry is imported from JourneyCardsScene rather than restated, so the wall here and
 * the standalone wall composition cannot drift apart.
 */
export const JourneyCardRevealScene: React.FC<JourneyCardRevealSceneProps> = ({
  brand = "#E10A0A",
  heroIndex = JOURNEY_HERO_INDEX,
  revealFrom = 0,
  revealDuration = 14,
  heroOvershoot = 1.05,
  wallFrom,
  wallTravel = 12,
  wallStagger = 1,
  wallDuration = 10,
  sideFadeFrom = 70,
  sideFadeTo = 77,
  middleExitFrom = 70,
  middleExitDuration = 12.5,
}) => {
  const frame = useCurrentFrame();
  const { copy, image } = useCustomization();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const middleEase = Easing.bezier(0.81, -0.01, 0.83, 0.27);

  // Hero arrival, straight off the match cut.
  const p = interpolate(frame, [revealFrom, revealFrom + revealDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // Hero scale: grows from 0.86, overshoots to heroOvershoot around 70% of duration, settles back to 1.0
  const heroScale = interpolate(
    frame,
    [revealFrom, revealFrom + Math.round(revealDuration * 0.68), revealFrom + revealDuration],
    [0.86, heroOvershoot, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    },
  );

  // Hero travel from frame-centre into its grid slot. 0 until the wall is called for.
  const settle =
    wallFrom == null
      ? 0
      : interpolate(frame, [wallFrom, wallFrom + wallTravel], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });

  const slot = (i: number) => ({
    left: (i % COLS) * (JOURNEY_CARD_W + COL_GAP),
    top: Math.floor(i / COLS) * (JOURNEY_CARD_H + ROW_GAP),
  });

  // Where a lone centred card sits, expressed in the grid's own coordinates.
  const centred = {
    left: GRID_W / 2 - JOURNEY_CARD_W / 2,
    top: GRID_H / 2 - JOURNEY_CARD_H / 2,
  };

  const hero = slot(heroIndex);
  const heroLeft = interpolate(settle, [0, 1], [centred.left, hero.left]);
  const heroTop = interpolate(settle, [0, 1], [centred.top, hero.top]);

  const siblingProgress = (order: number) =>
    wallFrom == null
      ? 0
      : interpolate(
          frame,
          [wallFrom + order * wallStagger, wallFrom + order * wallStagger + wallDuration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
        );

  // Middle column moves down off screen starting at middleExitFrom
  const middleTranslateY =
    middleExitFrom == null
      ? 0
      : interpolate(frame, [middleExitFrom, middleExitFrom + middleExitDuration], [0, 1150], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: middleEase,
        });

  let order = 0;

  return (
    <AbsoluteFill
      style={{
        background: brand,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <WorkvivoSvgDefs />
      <div style={{ position: "relative", width: GRID_W, height: GRID_H }}>
        {JOURNEYS.map((journey, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const isHero = i === heroIndex;
          const at = isHero ? { left: heroLeft, top: heroTop } : slot(i);
          const prog = isHero ? p : siblingProgress(order++);

          // Side columns fade out top-to-bottom across sideFadeFrom..sideFadeTo
          const sideFade =
            sideFadeFrom != null && (col === 0 || col === 2)
              ? interpolate(
                  frame,
                  [sideFadeFrom + row * 1.5, sideFadeFrom + row * 1.5 + 4],
                  [1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear },
                )
              : 1;

          const currentOpacity = prog * sideFade;

          // Middle column translateY
          const translateY = col === 1 ? middleTranslateY : 0;

          // Siblings settle up from 0.9; the hero scales with an overshoot curve
          const scale = isHero
            ? heroScale
            : interpolate(prog, [0, 1], [0.9, 1]);

          return (
            <WorkvivoJourneyCard
              key={journey.slot}
              title={copy.journeys.wall[i]}
              image={image(journey.slot, staticFile(journey.image))}
              slot={journey.slot}
              style={{
                position: "absolute",
                left: at.left,
                top: at.top + translateY,
                opacity: currentOpacity,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                // The hero rides above the wall while it is still mid-travel, but drops back to 0 once settled.
                zIndex: isHero && settle < 1 ? 1 : 0,
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.10)",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

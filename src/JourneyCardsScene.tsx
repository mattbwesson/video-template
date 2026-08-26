import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { WorkvivoSvgDefs } from "./components/workvivo/WorkvivoIcons";
import {
  JOURNEY_CARD_H,
  JOURNEY_CARD_W,
  WorkvivoJourneyCard,
} from "./components/workvivo/WorkvivoJourneyCard";
import "./components/workvivo/WorkvivoStyles.css";
import { useCustomization } from "./customize/CustomizationProvider";
import type { ImageSlotKey } from "./customize/imagery";

/** Virgin red, the full-bleed backdrop the cards sit on. */
const BACKDROP = "#E10A0A";

/** Grid geometry, measured off the reference and centred in the 1920x1080 frame. */
export const COLS = 3;
export const ROWS = 3;
export const COL_GAP = 68;
export const ROW_GAP = 55;

export const GRID_W = COLS * JOURNEY_CARD_W + (COLS - 1) * COL_GAP;
export const GRID_H = ROWS * JOURNEY_CARD_H + (ROWS - 1) * ROW_GAP;

export type Journey = {
  /** Baseline cover under `public/img/journeys/`. */
  image: string;
  /** Where an operator upload lands. The hero's is `journey.hero.0` — see below. */
  slot: ImageSlotKey;
};

/**
 * The nine cards' artwork, in reading order. Their TITLES are `copy.journeys.wall`.
 *
 * The covers are stand-ins built from this repo's own stock photos by
 * `scripts/prep-journey-covers.py`, which trims the screenshot margin off each one
 * and crops it to the card's aspect. Only the AI tile and the Virgin storefront are
 * the same shots as the reference; swap `image` for the real artwork when it lands.
 *
 * The SECOND card is the hero — what the scale-down match cut lands on at global 1750,
 * and the photo the builder's phone preview is already showing before the cut. It takes
 * `journey.hero.0` so that one upload dresses both shots; the other eight share the
 * `journey.card.*` run.
 */
export const JOURNEYS: Journey[] = [
  { image: "img/journeys/it-security.png", slot: "journey.card.0" },
  { image: "img/journeys/new-hire.png", slot: "journey.hero.0" },
  { image: "img/journeys/relocation.png", slot: "journey.card.1" },
  { image: "img/journeys/ai-adoption.png", slot: "journey.card.2" },
  { image: "img/journeys/culture.png", slot: "journey.card.3" },
  { image: "img/journeys/parental-leave.png", slot: "journey.card.4" },
  { image: "img/journeys/leadership.png", slot: "journey.card.5" },
  { image: "img/journeys/continuous-learning.png", slot: "journey.card.6" },
  { image: "img/journeys/sustainability.png", slot: "journey.card.7" },
];

/** Which entry of JOURNEYS the match cut lands on, and the phone previews. */
export const JOURNEY_HERO_INDEX = 1;

export const JourneyCardsScene: React.FC = () => {
  const { copy, image } = useCustomization();

  return (
    <AbsoluteFill style={{ background: BACKDROP }}>
      <WorkvivoSvgDefs />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: GRID_W, height: GRID_H }}>
          {JOURNEYS.map((journey, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return (
              <WorkvivoJourneyCard
                key={journey.slot}
                title={copy.journeys.wall[i]}
                image={image(journey.slot, staticFile(journey.image))}
                slot={journey.slot}
                style={{
                  position: "absolute",
                  left: col * (JOURNEY_CARD_W + COL_GAP),
                  top: row * (JOURNEY_CARD_H + ROW_GAP),
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.10)",
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

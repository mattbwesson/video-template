import React from "react";
import { Icon } from "./WorkvivoIcons";

/**
 * A Workvivo Journeys card — a cover photo with a translucent white action bar
 * floating over its lower third: journey glyph, title, progress track, Start button.
 *
 * Every number below is the Figma spec for this card at 1920x1080, used as given
 * rather than normalised to the 4px grid, so the card measures the same as the
 * design when it sits in the composition. Scale the whole card with `scale`
 * instead of editing these.
 */

/** Design size of one card. Everything inside is positioned against this box. */
export const JOURNEY_CARD_W = 495.64;
export const JOURNEY_CARD_H = 247.11;

/** Workvivo semantic primary — buttons, the glyph, active states. Not the tenant brand slot. */
const PRIMARY_500 = "#6103ED";
/** Primary-50, the tinted fill behind the glyph and under the progress track. */
const PRIMARY_50 = "#F0E6FE";
/** Grey-900 body text, Grey-100 for text sitting on the primary button. */
const TEXT_PRIMARY = "#111827";
const ON_PRIMARY = "#F3F4F6";

const FONT = 'InterX,Inter,"Segoe UI",system-ui,Arial,sans-serif';

export type JourneyCardProps = {
  title: string;
  /** Cover photo, already resolved (e.g. `staticFile("img/workvivo/news_1.png")`). */
  image?: string;
  /**
   * The image position this card's cover fills, written onto the `<img>` so the wizard's
   * swap overlay can find it. Omit outside the customised cut — the card is also used by
   * the gallery, which has no positions.
   */
  slot?: string;
  /** 0–1. The reference shows every track empty, so this defaults to 0. */
  progress?: number;
  /** Overscan on the cover photo, for sources with an edge to hide. */
  imageScale?: number;
  ctaLabel?: string;
  style?: React.CSSProperties;
};

export const WorkvivoJourneyCard: React.FC<JourneyCardProps> = ({
  title,
  image,
  slot,
  progress = 0,
  imageScale = 1.01,
  ctaLabel = "Start",
  style,
}) => (
  <div
    style={{
      position: "relative",
      width: JOURNEY_CARD_W,
      height: JOURNEY_CARD_H,
      borderRadius: 21.18,
      overflow: "hidden",
      background: "#D9D9D9",
      fontFamily: FONT,
      ...style,
    }}
  >
    {image ? (
      <img
        src={image}
        alt=""
        data-vc-slot={slot}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${imageScale})`,
        }}
      />
    ) : null}

    {/* The floating action bar. 21 from the left edge, 150 from the top. */}
    <div
      style={{
        position: "absolute",
        left: 21,
        top: 150,
        width: 454.69,
        height: 72.02,
        padding: "5.65px 11.3px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: 8.83,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16.94 }}>
          {/* Journeys glyph in a Primary-50 disc. */}
          <div
            style={{
              width: 52.97,
              height: 52.97,
              flexShrink: 0,
              borderRadius: "50%",
              background: PRIMARY_50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* The hub-tile Journeys glyph, not the nav-rail one — the design's
                33.89px artboard matches this capture's geometry exactly. */}
            <Icon
              href="#i-ui-journeys-hub"
              className=""
              width={33.89}
              height={33.89}
              style={{ color: PRIMARY_500, display: "block" }}
            />
          </div>

          <div
            style={{
              width: 234.41,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 11.3,
            }}
          >
            <div
              style={{
                color: TEXT_PRIMARY,
                fontSize: 19.77,
                fontWeight: 500,
                lineHeight: "22.59px",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>
            {/* Progress track. The spec's 235.1 overhangs the 234.41 column by
                a fraction; keep the spec value so the track lines up with the title. */}
            <div
              style={{
                width: 235.1,
                height: 11.3,
                background: PRIMARY_50,
                // Half of 11.3 — see the ask bar. A sentinel radius here drew the
                // track as a long tapered lens instead of a bar.
                borderRadius: 5.65,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {progress > 0 ? (
                <div
                  style={{
                    width: `${Math.min(1, progress) * 100}%`,
                    height: "100%",
                    background: PRIMARY_500,
                    borderRadius: 5.65,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "8.83px 14.71px",
            background: PRIMARY_500,
            // Half the button's 41px height. 23.54 overshot it and the export's
            // per-axis clamp turned the pill egg-shaped.
            borderRadius: 20.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: ON_PRIMARY,
              fontSize: 17.66,
              fontWeight: 500,
              lineHeight: "23.54px",
            }}
          >
            {ctaLabel}
          </div>
        </div>
      </div>
    </div>
  </div>
);

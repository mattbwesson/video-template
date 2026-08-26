import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ZoomCallSvgDefs } from "./components/workvivo/ZoomCallIcons";
import { MobileClick } from "./components/workvivo";
import { useCustomization } from "./customize/CustomizationProvider";

/** Same curve the rest of the cut's transitions use. */
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** Symmetric curve for the box itself, so neither axis snaps at its ends. */
const BOX_EASE = Easing.bezier(0.62, 0.02, 0.2, 1);

const FONT = 'InterX, Inter, -apple-system, "Segoe UI", system-ui, sans-serif';

/**
 * Reference geometry, measured off the supplied stills and held as fractions of the frame
 * so it survives any render size.
 */
const PILL_W = 0.4827;
const PILL_H = 0.1133;
const PILL_CY = 0.502;

const CARD_W = 0.3167;
const CARD_H = 0.5481;
const CARD_CY = 0.493;

/**
 * The container is a rounded RECTANGLE, not a stadium — its corner arc is about 0.28 of
 * the PILL's height, where a stadium would be 0.5. Only the chip inside it is fully
 * rounded. This resolves to px once and is only nudged across the morph, never re-derived
 * from the card's much greater height — that would balloon the corners as the box grows,
 * which is the classic tell of a fake morph.
 */
const PILL_RADIUS = 0.28;

/** interpolate() with clamping on both ends, which is what every call here wants. */
const at = (
  v: number,
  input: number[],
  output: number[],
  easing?: (n: number) => number,
) =>
  interpolate(v, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...(easing ? { easing } : {}),
  });

export interface CatchUpRevealSceneProps {
  /** The field behind it. */
  background?: string;
  /** Local frame the container starts arriving on. */
  revealFrom?: number;
  /** Frames it takes to settle. */
  revealDuration?: number;
  /** Distance in pixels the container rises from. Default 0. */
  revealDistance?: number;
  /** Local frame the container starts morphing into the AI Summary card. */
  morphFrom?: number;
  /** Frames the morph takes. */
  morphDuration?: number;
  /** Frame at which the mobile click occurs on the Summarize button (local to scene, default 85 / global 2185). */
  clickFrame?: number | null;
}

/**
 * The catch-up strip, alone on a dark field, morphing into the AI Summary card.
 *
 * This is the hero of the same control the chat screen carries at 34px — the phones shot
 * before it has this strip in the left phone, just above the composer. Blowing it up is
 * what the match cut is FOR, so the shape is deliberately the phone's.
 *
 * THE MORPH — choreographed, not a cross-fade. Five things run on their own windows
 * inside the one `m`, which is what makes it read as a transformation rather than a
 * dissolve between two pictures:
 *
 *   m 0.00-0.26  the label leaves: up, out, and blurring, so it reads as being shed.
 *   m 0.08-0.52  the box CONTRACTS horizontally to the card's width.
 *   m 0.15-0.68  the chip travels. The Summarize button and the AI Summary avatar are the
 *                SAME object — both a fully-round element holding the same sparkle — so
 *                it flies from one slot to the other while its width collapses to a
 *                circle, its white fill turns to the avatar's gradient and its glyph
 *                recolours. This is the beat the whole morph hangs on.
 *   m 0.30-0.90  the box GROWS vertically, with a small overshoot before it settles.
 *   m 0.55-1.00  the card's own content arrives, staggered, the paragraph wiping down.
 *
 * Decoupling the two axes is the important part. Interpolating width and height together
 * just slides the box along a diagonal; contracting first and then blooming gives the
 * shape somewhere to have been, and hides the fact that nothing is actually being
 * re-drawn.
 *
 * Both content layers are absolutely positioned at their OWN natural size and centred, so
 * neither reflows while the box resizes around them. In normal flow the paragraph would
 * re-wrap every frame, which reads as text boiling.
 */
export const CatchUpRevealScene: React.FC<CatchUpRevealSceneProps> = ({
  background = "#04091f",
  revealFrom = 0,
  revealDuration = 14,
  revealDistance = 0,
  morphFrom,
  morphDuration = 18,
  clickFrame,
}) => {
  const frame = useCurrentFrame();
  const { copy } = useCustomization();
  const { width, height } = useVideoConfig();

  const p = at(frame, [revealFrom, revealFrom + revealDuration], [0, 1], SCENE_EASE);
  const m =
    morphFrom == null ? 0 : at(frame, [morphFrom, morphFrom + morphDuration], [0, 1]);

  const riseY = at(p, [0, 1], [revealDistance, 0]);

  // ---- pill metrics. The pill contents are built at these whatever the container is
  // currently doing, so they hold still while it resizes around them.
  const pw = width * PILL_W;
  const ph = height * PILL_H;
  const pad = ph * 0.36;
  const label = ph * 0.3;
  const btnH = ph * 0.67;
  /** Explicit, because the chip's travel has to start from a known centre. */
  const btnW = ph * 2.62;
  const inset = ph * 0.21;

  // ---- card metrics
  const cw = width * CARD_W;
  const ch = height * CARD_H;
  const cpad = cw * 0.042;
  const ctext = ch * 0.0385;
  const avatar = ch * 0.079;

  // ---- the box: axes on separate windows, height overshooting slightly before it rests
  const w = at(m, [0.08, 0.52], [pw, cw], BOX_EASE);
  const h =
    at(m, [0.3, 0.9], [ph, ch], BOX_EASE) + at(m, [0.74, 0.86, 1], [0, ch * 0.016, 0]);
  const cy = at(m, [0.3, 0.9], [PILL_CY, CARD_CY], BOX_EASE);
  const angle = at(m, [0.1, 0.9], [100, 135]);
  const radius = at(m, [0.3, 0.9], [ph * PILL_RADIUS, ph * PILL_RADIUS * 0.88]);

  // ---- the chip: Summarize button -> AI Summary avatar, one continuous object
  const chipT = at(m, [0.15, 0.68], [0, 1], BOX_EASE);
  const chipCx = at(chipT, [0, 1], [pw / 2 - inset - btnW / 2, -w / 2 + cpad + avatar / 2]);
  const chipCy = at(chipT, [0, 1], [0, -h / 2 + cpad + avatar / 2]);
  const chipW = at(chipT, [0, 1], [btnW, avatar]);
  const chipH = at(chipT, [0, 1], [btnH, avatar]);
  /** Fill and glyph swap later than the travel, so the shape lands before it recolours. */
  const chipFill = at(m, [0.34, 0.66], [0, 1]);
  const labelOut = at(m, [0, 0.26], [1, 0]);
  const btnTextOut = at(m, [0.15, 0.33], [1, 0]);

  // ---- card content, staggered
  const headIn = at(m, [0.58, 0.78], [0, 1], SCENE_EASE);
  const subIn = at(m, [0.64, 0.84], [0, 1], SCENE_EASE);
  const bodyIn = at(m, [0.68, 1], [0, 1], SCENE_EASE);

  // ---- the glow peaks mid-transformation, then settles
  const flare = at(m, [0, 0.45, 1], [1, 1.85, 1]);

  return (
    <AbsoluteFill
      style={{
        background,
        backgroundImage:
          background === "transparent"
            ? undefined
            : "radial-gradient(46% 58% at 50% 50%, #0b1636 0%, #06102a 55%, rgba(4,9,31,0) 100%)",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <ZoomCallSvgDefs />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${cy * 100}%`,
          width: w,
          height: h,
          transform: `translate(-50%, -50%) translateY(${riseY}px) scale(${at(p, [0, 1], [0.92, 1])})`,
          transformOrigin: "center center",
          opacity: p,
          borderRadius: radius,
          overflow: "hidden",
          background: `linear-gradient(${angle}deg, #dfe3f5 0%, #e7e4f6 34%, #f4eef9 64%, #fdf6f8 100%)`,
          // Tight, not a bloom — blur alone, no spread term. Spread pushes the falloff
          // outward before it starts fading and reads as fog.
          boxShadow:
            `0 0 ${ph * 0.52 * flare}px rgba(124, 62, 246, ${0.62 * p}), ` +
            `0 0 ${ph * 0.22 * flare}px rgba(233, 226, 255, ${0.34 * p})`,
        }}
      >
        {/* ---- the label, shed early ---- */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: pw,
            height: ph,
            marginLeft: -pw / 2,
            marginTop: -ph / 2,
            paddingLeft: pad,
            display: "flex",
            alignItems: "center",
            opacity: labelOut,
            filter: `blur(${(1 - labelOut) * 3}px)`,
            transform: `translateY(${(1 - labelOut) * -ph * 0.22}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: label,
              lineHeight: 1.2,
              color: "#1b1b2c",
              whiteSpace: "nowrap",
            }}
          >
            Catch up on what you missed
          </span>
        </div>

        {/* ---- card content. The avatar's slot is left empty; the chip flies into it. ---- */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: cw,
            marginLeft: -cw / 2,
            padding: cpad,
            display: "flex",
            flexDirection: "column",
            gap: ch * 0.033,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: cpad * 0.55 }}>
            <span style={{ width: avatar, height: avatar, flex: "none" }} />
            <span
              style={{
                fontFamily: FONT,
                fontSize: ctext,
                fontWeight: 600,
                color: "#14142b",
                opacity: headIn,
                transform: `translateX(${(1 - headIn) * -cpad * 0.7}px)`,
              }}
            >
              AI Summary
            </span>
          </div>

          <div
            style={{
              fontFamily: FONT,
              fontSize: ctext,
              lineHeight: 1.5,
              color: "#14142b",
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * ch * 0.02}px)`,
            }}
          >
            A breakdown of this weeks plans
          </div>

          <div
            style={{
              fontFamily: FONT,
              fontSize: ctext,
              lineHeight: 1.55,
              color: "#2a2a3d",
              opacity: bodyIn,
              // Wipes down rather than fading as a block, so it reads as being written.
              clipPath: `inset(0 0 ${(1 - bodyIn) * 100}% 0)`,
            }}
            // Nothing on this card is a photograph, so the summary is its own text-only
            // editable rather than hanging off a picture in a neighbouring shot.
            data-vc-slot="chat.summary"
          >
            {copy.chat.summary}
          </div>
        </div>

        {/* ---- the chip: the one object that survives the morph ---- */}
        <div
          style={{
            position: "absolute",
            left: `calc(50% + ${chipCx}px)`,
            top: `calc(50% + ${chipCy}px)`,
            width: chipW,
            height: chipH,
            marginLeft: -chipW / 2,
            marginTop: -chipH / 2,
            borderRadius: chipH / 2,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #a3cbfa 0%, #eebcdc 100%)",
            boxShadow: `0 1px 3px rgba(20, 6, 60, ${0.1 * (1 - chipFill)})`,
          }}
        >
          {/* White button fill, wiped away to reveal the avatar's gradient beneath. */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "#ffffff",
              opacity: 1 - chipFill,
            }}
          />
          <span
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: at(m, [0.15, 0.33], [btnH * 0.2, 0]),
            }}
          >
            <span
              style={{
                position: "relative",
                width: at(chipT, [0, 1], [btnH * 0.36, avatar * 0.56]),
                height: at(chipT, [0, 1], [btnH * 0.36, avatar * 0.56]),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 16 16"
                fill="none"
                style={{ position: "absolute", inset: 0, opacity: 1 - chipFill }}
              >
                <defs>
                  <linearGradient id="catchup-sparkle-grad" x1="100%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a3cbfa" />
                    <stop offset="100%" stopColor="#eebcdc" />
                  </linearGradient>
                </defs>
                <path
                  d="M6.92311 2.33302C7.12369 1.7643 7.92691 1.76702 8.12916 2.33204C8.61157 3.68402 9.22832 4.90423 10.1526 5.8711L10.1721 5.89161C11.1093 6.86022 12.4166 7.43846 13.6848 7.87599C14.2597 8.07483 14.2552 8.89235 13.677 9.08399C12.3956 9.50608 11.0622 10.0787 10.0774 11.0449C9.09334 12.0108 8.49752 13.3205 8.07154 14.665C7.88673 15.2477 7.06541 15.2667 6.85865 14.6885C6.39271 13.3812 5.88049 12.0986 4.89674 11.1162C3.9181 10.1393 2.61111 9.52589 1.32057 9.07813C0.752511 8.88059 0.738975 8.07555 1.3108 7.87208C2.57949 7.42314 3.93327 6.8309 4.89674 5.86915C5.86122 4.90611 6.47761 3.60158 6.92311 2.33302Z"
                  fill="url(#catchup-sparkle-grad)"
                />
                <path
                  d="M12.346 1.08985C12.4421 0.819095 12.8237 0.821608 12.9202 1.08985L12.9739 1.23341C13.0324 1.38509 13.0971 1.53294 13.1682 1.67188C13.1846 1.70395 13.2016 1.73687 13.219 1.76856C13.3381 1.98486 13.4777 2.18352 13.6438 2.35743L13.6458 2.35841C13.8048 2.52448 13.9966 2.66111 14.2053 2.77442C14.2424 2.79451 14.2816 2.81424 14.3196 2.83302C14.466 2.90528 14.6196 2.96814 14.7727 3.02442C14.8175 3.04088 14.8632 3.05796 14.9075 3.07325C15.1791 3.16827 15.1817 3.55804 14.9046 3.64942C14.859 3.66439 14.8124 3.68027 14.7669 3.6963C14.6149 3.7498 14.4615 3.81028 14.3147 3.87989C14.2757 3.89839 14.2363 3.91828 14.1975 3.93849C13.984 4.04991 13.7848 4.18434 13.6165 4.34962C13.4424 4.52065 13.3028 4.72017 13.1878 4.93751C13.1674 4.97594 13.1478 5.01472 13.1292 5.05372C13.0599 5.19853 12.9997 5.3503 12.9465 5.50489L12.9006 5.64161C12.8125 5.91841 12.4225 5.92905 12.3235 5.65333C12.3072 5.60756 12.2904 5.56113 12.2737 5.51563C12.2165 5.3601 12.1552 5.20601 12.0862 5.05958C12.0667 5.01834 12.0466 4.97668 12.0256 4.93653C11.918 4.73032 11.7886 4.53962 11.6233 4.37501C11.4496 4.20218 11.2471 4.06058 11.0296 3.94239C10.9964 3.92439 10.9616 3.90653 10.928 3.88966C10.7845 3.81773 10.6347 3.75442 10.4846 3.69825C10.4378 3.68072 10.3897 3.66271 10.343 3.64649C10.0755 3.55225 10.0644 3.16913 10.3391 3.0713C10.3872 3.05429 10.4369 3.03589 10.4856 3.01759C10.633 2.96217 10.7825 2.89992 10.926 2.83009C10.9625 2.81233 10.9993 2.79494 11.0344 2.77638C11.2532 2.66081 11.4556 2.52336 11.6223 2.35645C11.7913 2.18726 11.9318 1.98651 12.0501 1.77052C12.0675 1.73857 12.0845 1.7061 12.1008 1.67384C12.1726 1.53227 12.2365 1.38441 12.2922 1.23731C12.3106 1.18879 12.3291 1.13821 12.346 1.08985Z"
                  fill="url(#catchup-sparkle-grad)"
                />
              </svg>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 16 16"
                fill="none"
                style={{ position: "absolute", inset: 0, opacity: chipFill }}
              >
                <path
                  d="M6.92311 2.33302C7.12369 1.7643 7.92691 1.76702 8.12916 2.33204C8.61157 3.68402 9.22832 4.90423 10.1526 5.8711L10.1721 5.89161C11.1093 6.86022 12.4166 7.43846 13.6848 7.87599C14.2597 8.07483 14.2552 8.89235 13.677 9.08399C12.3956 9.50608 11.0622 10.0787 10.0774 11.0449C9.09334 12.0108 8.49752 13.3205 8.07154 14.665C7.88673 15.2477 7.06541 15.2667 6.85865 14.6885C6.39271 13.3812 5.88049 12.0986 4.89674 11.1162C3.9181 10.1393 2.61111 9.52589 1.32057 9.07813C0.752511 8.88059 0.738975 8.07555 1.3108 7.87208C2.57949 7.42314 3.93327 6.8309 4.89674 5.86915C5.86122 4.90611 6.47761 3.60158 6.92311 2.33302Z"
                  fill="#ffffff"
                />
                <path
                  d="M12.346 1.08985C12.4421 0.819095 12.8237 0.821608 12.9202 1.08985L12.9739 1.23341C13.0324 1.38509 13.0971 1.53294 13.1682 1.67188C13.1846 1.70395 13.2016 1.73687 13.219 1.76856C13.3381 1.98486 13.4777 2.18352 13.6438 2.35743L13.6458 2.35841C13.8048 2.52448 13.9966 2.66111 14.2053 2.77442C14.2424 2.79451 14.2816 2.81424 14.3196 2.83302C14.466 2.90528 14.6196 2.96814 14.7727 3.02442C14.8175 3.04088 14.8632 3.05796 14.9075 3.07325C15.1791 3.16827 15.1817 3.55804 14.9046 3.64942C14.859 3.66439 14.8124 3.68027 14.7669 3.6963C14.6149 3.7498 14.4615 3.81028 14.3147 3.87989C14.2757 3.89839 14.2363 3.91828 14.1975 3.93849C13.984 4.04991 13.7848 4.18434 13.6165 4.34962C13.4424 4.52065 13.3028 4.72017 13.1878 4.93751C13.1674 4.97594 13.1478 5.01472 13.1292 5.05372C13.0599 5.19853 12.9997 5.3503 12.9465 5.50489L12.9006 5.64161C12.8125 5.91841 12.4225 5.92905 12.3235 5.65333C12.3072 5.60756 12.2904 5.56113 12.2737 5.51563C12.2165 5.3601 12.1552 5.20601 12.0862 5.05958C12.0667 5.01834 12.0466 4.97668 12.0256 4.93653C11.918 4.73032 11.7886 4.53962 11.6233 4.37501C11.4496 4.20218 11.2471 4.06058 11.0296 3.94239C10.9964 3.92439 10.9616 3.90653 10.928 3.88966C10.7845 3.81773 10.6347 3.75442 10.4846 3.69825C10.4378 3.68072 10.3897 3.66271 10.343 3.64649C10.0755 3.55225 10.0644 3.16913 10.3391 3.0713C10.3872 3.05429 10.4369 3.03589 10.4856 3.01759C10.633 2.96217 10.7825 2.89992 10.926 2.83009C10.9625 2.81233 10.9993 2.79494 11.0344 2.77638C11.2532 2.66081 11.4556 2.52336 11.6223 2.35645C11.7913 2.18726 11.9318 1.98651 12.0501 1.77052C12.0675 1.73857 12.0845 1.7061 12.1008 1.67384C12.1726 1.53227 12.2365 1.38441 12.2922 1.23731C12.3106 1.18879 12.3291 1.13821 12.346 1.08985Z"
                  fill="#ffffff"
                />
              </svg>
            </span>
            {btnTextOut > 0 && (
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: label,
                  lineHeight: 1.2,
                  fontWeight: 600,
                  color: "#7b3fe8",
                  whiteSpace: "nowrap",
                  opacity: btnTextOut,
                  overflow: "hidden",
                }}
              >
                Summarize
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Mobile click on Summarize button at local frame 85 (global 2185) */}
      {clickFrame !== null && clickFrame !== undefined && clickFrame >= 0 && (
        <MobileClick
          startFrame={clickFrame}
          durationInFrames={10}
          x="64.8%"
          y="50.0%"
          zIndex={50}
        />
      )}
    </AbsoluteFill>
  );
};

import React from "react";
import { InlineSvg } from "../InlineSvg";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CUSTOMER_GRID_ROWS } from "./WorkvivoCustomerLogos";
import "./WorkvivoCustomerGridStyles.css";
import { cleanHex, isHex, rgba, withLightness, toHsl, css } from "../../customize/color";

/** What the wall falls back to when no brand reaches it. Workvivo's own green. */
const DEFAULT_GRID_BRAND = "#44D760";

export interface WorkvivoCustomerGridProps {
  /** The tenant colour the whole wall is lit with. */
  brand?: string;
  /** Animate the cards popping / blooming in. Default true. */
  animateIn?: boolean;
  /** Duration in frames for entrance animation. Default 20. */
  entranceFrames?: number;
}

/**
 * 16:9 full-screen Customer Logo Wall with square tiles in a 7x13 matrix,
 * centered around the iconic Workvivo hero mark on an illuminated red grid background.
 */
export const WorkvivoCustomerGrid: React.FC<WorkvivoCustomerGridProps> = ({
  brand = DEFAULT_GRID_BRAND,
  animateIn = true,
  entranceFrames = 20,
}) => {
  const frame = useCurrentFrame();

  const progress = animateIn
    ? interpolate(frame, [0, entranceFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

  // Camera slowly panning out from close-up (1.35x) to full view (1.0x)
  const zoom = interpolate(frame, [0, 180], [1.35, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  /**
   * The field behind the wall: the brand colour, flat.
   *
   * It has been through two versions before this one. First it sniffed the hex for
   * "00e" / "44d" / "green" and switched between a hand-tuned green gradient and a
   * hand-tuned red one, which gave every tenant whose colour was neither a red wall with
   * their colour only in the centre stop. That was replaced by a radial falloff derived
   * from the brand — correct hue at last, but still a vignette: the colour the customer
   * gave us appeared at exactly one point in the middle of the frame and everything
   * outward of it was a darker approximation.
   *
   * Now it is the hex itself, edge to edge, so the wall is unambiguously their colour.
   * The tiles keep their glow — that is light coming off the cards, and it is what makes
   * the wall read as illuminated rather than printed.
   */
  const hex = isHex(cleanHex(brand)) ? cleanHex(brand) : cleanHex(DEFAULT_GRID_BRAND);
  const { l } = toHsl(hex);

  const bgGradient = css(hex);

  const cardGlow = `0 0 30px ${rgba(hex, 0.7)}, 0 0 14px ${rgba(hex, 0.45)}, 0 4px 14px ${rgba(withLightness(hex, l * 0.2), 0.35)}`;

  const centerCardGlow = `0 0 55px ${rgba(hex, 0.9)}, 0 0 26px rgba(255, 255, 255, 0.9), 0 6px 24px ${rgba(withLightness(hex, l * 0.2), 0.45)}`;

  // The stage's ::before carried a radial wash and a white centre bloom. Both are a
  // gradient over the flat field by another name, so the layer is switched off rather
  // than left to re-introduce the vignette the background just lost.
  const ambientGlow = "none";

  return (
    <div
      className="wcg-stage"
      style={
        {
          background: bgGradient,
          "--wcg-ambient-glow": ambientGlow,
          "--wcg-card-glow": cardGlow,
          "--wcg-center-glow": centerCardGlow,
        } as React.CSSProperties
      }
    >
      <div
        className="wcg-grid"
        style={{
          transform: `scale(${zoom * (0.94 + 0.06 * progress)})`,
          opacity: progress,
        }}
      >
        {CUSTOMER_GRID_ROWS.map((row, rowIndex) =>
          row.map((item, colIndex) => {
            const isCenter = rowIndex === 3 && colIndex === 6;
            // Radial distance from center card (row 3, col 6 in 7x13 matrix)
            const dx = colIndex - 6;
            const dy = rowIndex - 3;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Stagger outwards from center: center pops first, outer edges ripple outward in concentric waves
            const cardDelay = dist * 2.2;
            const animDuration = 18;

            // 1. Elastic spring scale pop with slight overshoot (0.3 -> 1.07 -> 1.0)
            const cardScale = animateIn
              ? interpolate(
                  frame,
                  [cardDelay, cardDelay + animDuration * 0.7, cardDelay + animDuration],
                  [0.3, 1.07, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                  }
                )
              : 1;

            // 2. Smooth opacity fade-in
            const cardOpacity = animateIn
              ? interpolate(frame, [cardDelay, cardDelay + 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;

            // 3. 3D Rise from bottom (translateY: 45px -> 0px)
            const cardY = animateIn
              ? interpolate(frame, [cardDelay, cardDelay + animDuration], [45, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.back(1.4)),
                })
              : 0;

            // 4. 3D Pitch tilt (rotateX: -20deg -> 0deg)
            const cardRotX = animateIn
              ? interpolate(frame, [cardDelay, cardDelay + animDuration], [-20, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })
              : 0;

            // 5. 3D Yaw tilt facing outwards from center (rotateY: dx * 3deg -> 0deg)
            const cardRotY = animateIn
              ? interpolate(frame, [cardDelay, cardDelay + animDuration], [dx * 3, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })
              : 0;

            // 6. Subtle circular radial ripple expanding outward from center starting at local frame 87 (global frame 5070)
            const rippleStart = 87 + dist * 2.5;
            const rippleDuration = 12;

            const rippleScale = interpolate(
              frame,
              [rippleStart, rippleStart + rippleDuration * 0.5, rippleStart + rippleDuration],
              [1.0, 1.05, 1.0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            const rippleY = interpolate(
              frame,
              [rippleStart, rippleStart + rippleDuration * 0.5, rippleStart + rippleDuration],
              [0, -8, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            const rippleRotY = interpolate(
              frame,
              [rippleStart, rippleStart + rippleDuration * 0.5, rippleStart + rippleDuration],
              [0, (dx / (Math.abs(dx) || 1)) * 4, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            const finalY = cardY + rippleY;
            const finalRotY = cardRotY + rippleRotY;
            const finalScale = cardScale * rippleScale;

            return (
              <div
                key={`${rowIndex}-${colIndex}-${item.id}`}
                className={`wcg-card ${isCenter ? "wcg-card-center" : ""}`}
                style={{
                  transform: `translateY(${finalY}px) rotateX(${cardRotX}deg) rotateY(${finalRotY}deg) scale(${finalScale})`,
                  opacity: cardOpacity,
                }}
              >
                {isCenter ? (
                  <InlineSvg
                    className="wcg-logo-tile"
                    src={staticFile("img/workvivo-tile.svg")}
                    alt="Workvivo"
                  />
                ) : item.src ? (
                  <img
                    className="wcg-logo-img"
                    src={staticFile(item.src)}
                    alt={item.name}
                  />
                ) : item.component ? (
                  <div className="wcg-logo-wrap">{item.component}</div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#333333" }}>
                    {item.name}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

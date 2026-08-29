import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

const GROW_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const WORD_DURATION = 10;
const WORD_STAGGER = 4;
const GROW_FROM_SCALE = 0.65;

export interface CreateYourOwnSceneProps {
  text?: string;
  background?: string;
  fontSize?: number;
  fontWeight?: number | string;
  gap?: number;
  icon?: string;
  iconWidth?: number;
}

export const CreateYourOwnScene: React.FC<CreateYourOwnSceneProps> = ({
  text = "Create your own",
  background = "transparent",
  fontSize = 124,
  fontWeight = 500,
  gap = 25,
  icon,
  iconWidth = 544,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  const sparkleStart = (words.length - 1) * WORD_STAGGER + 2;
  const sparkleOpacity = interpolate(
    frame,
    [sparkleStart, sparkleStart + 8],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const sparkleScale = interpolate(
    frame,
    [sparkleStart, sparkleStart + WORD_DURATION],
    [GROW_FROM_SCALE, 1],
    {
      easing: GROW_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Ambient floating / bobbing motion for the sparkle (twice as subtle)
  const bobY = Math.sin(frame * 0.12) * 4;
  const bobRot = Math.sin(frame * 0.08) * 1.0;

  // Shine sweep across just the sparkle
  const shineCycle = 36;

  return (
    <AbsoluteFill
      style={{
        background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap,
        }}
      >
        {words.map((word, index) => {
          const start = index * WORD_STAGGER;
          const opacity = interpolate(frame, [start, start + 7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = interpolate(
            frame,
            [start, start + WORD_DURATION],
            [GROW_FROM_SCALE, 1],
            {
              easing: GROW_EASE,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                opacity,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                color: "#ffffff",
                fontSize,
                fontWeight,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow:
                  "0 0 25px rgba(255, 255, 255, 0.6), 0 0 50px rgba(255, 255, 255, 0.3)",
                willChange: "transform, opacity",
              }}
            >
              {word}
            </span>
          );
        })}

        {icon && (
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: "50%",
              opacity: sparkleOpacity,
              transform: `translate(-180px, calc(-50% + ${bobY - 35}px)) rotate(${bobRot}deg) scale(${sparkleScale})`,
              transformOrigin: "center center",
              pointerEvents: "none",
              willChange: "transform, opacity",
            }}
          >
            <div
              style={{
                position: "relative",
                width: iconWidth,
                height: iconWidth * 0.58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Everything here is baked into the PNG, because every CSS way of doing it
                  is dropped or damaged by the export: `mix-blend-mode` is not composited,
                  `filter: drop-shadow` is not scoped to its own element and bleeds onto
                  later draws, and `radial-gradient` does not paint at all. A blend was the
                  wrong tool regardless — this scene's field is the TENANT's colour, so
                  whatever it produced changed with every customer.

                  hq_sparkle_glow.png is hq-sparkle-NEW.png re-laid onto the frame the
                  previous asset used (art 444px centred in 736px) so the swap changes the
                  picture and not the layout, plus a two-pass white glow — Gaussian sigma 46
                  at 0.30 and sigma 24 at 0.55 — which is the headline's own
                  `0 0 25px / 0 0 50px` white text-shadow converted into this asset's pixel
                  space. Measured on the brand green it lifts the field +19.7 luma at its
                  brightest and +12.5 at p95: a halo you can see without one you can name.

                  The art is clear glass rather than the old dark navy body, so the brand
                  colour reads THROUGH it. That is what makes it work on any tenant — it
                  takes the field's own hue instead of fighting it. */}
              <Img
                src={staticFile(icon)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />

              {/* The shine sweep that lived here — a moving gradient bar clipped by
                  `mask-image: url(sparkle)` — is gone: the export renderer drops masks,
                  which turned the sweep into an unmasked white bar sliding across the
                  frame. A glint that only exists in one renderer is not worth keeping. */}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

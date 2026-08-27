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
              {/* No blend mode. The artwork used to be the dark navy glass sparkle lifted
                  onto the field with `mix-blend-mode: plus-lighter` — which the export does
                  not composite at all, so it fell back to normal and the icon sat on the
                  brand colour as a near-black blob (its opaque body medians 47/255).
                  A blend was the wrong tool here anyway: this scene's field is the TENANT's
                  colour, so whatever it produced changed with every customer.

                  The light variant is baked instead (scripted from the original: gamma 0.55
                  to lift the shadows without moving the speculars, a 0.18 screen to raise
                  the floor, alpha 0.86 so the field reads through it as glass). The tonal
                  SPREAD is what does the work, not the tone: at ~114 levels the icon has
                  parts lighter and parts darker than a light brand field, and sits entirely
                  lighter than a dark one, so it reads on either. A flatter, whiter version
                  measured 1.08:1 against green and gold — effectively invisible. */}
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

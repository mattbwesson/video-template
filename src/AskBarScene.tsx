import React from "react";
import { SymbolSvg } from "./components/workvivo/symbolRegistry";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import { FIXED_COPY } from "./customize/videoCopy";
import { WorkvivoSvgDefs } from "./components/workvivo/WorkvivoIcons";

/**
 * Reference geometry, as fractions of the frame so it holds at any render size.
 * Everything inside the bar is expressed against the bar's own height.
 */
const BAR_W = 0.683;
const BAR_H = 0.237;
const BAR_CX = 0.503;
const BAR_CY = 0.498;

/** Same curve the rest of the cut's cursor movements use. */
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export interface AskBarSceneProps {
  /** The field behind it. The cut passes `theme.brand`. */
  background?: string;
  placeholder?: string;
  /** Local frame the circular mask starts expanding from 0. Default 0 (global 2268). */
  maskFrom?: number;
  /** Local frame the circular mask reaches full screen. Default 2 (global 2270). */
  maskTo?: number;
}

/**
 * The HQ Agent ask bar, alone on the brand field.
 *
 * A stadium — radius is genuinely half its height here, unlike the catch-up container
 * before it, which is a rounded rectangle. The two are easy to conflate.
 *
 * The sparkle is Workvivo's own AskVivo glyph. The library's capture of it is baked
 * `fill="white"` because it was taken off the dark top bar, so it cannot be recoloured
 * through `currentColor` — it is darkened with a filter instead. That is a recolour of a
 * capture artefact rather than of a brand-fixed colour: the live product draws this mark
 * dark on light surfaces, which is exactly what the reference shows.
 */
export const AskBarScene: React.FC<AskBarSceneProps> = ({
  background = "#E10A0A",
  placeholder = "How can I help you?",
  maskFrom = 0,
  maskTo = 2,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { copy } = useCustomization();

  const maxRadius = Math.ceil(Math.hypot(width, height) / 2);

  // Circular mask: expands from 0 to full screen across maskFrom to maskTo
  const maskRadius =
    maskFrom != null && maskTo != null
      ? interpolate(frame, [maskFrom, maskTo], [0, maxRadius], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      : maxRadius;

  // Ask bar scales up with the circular mask from 0 to 1 across maskFrom to maskTo
  const scale =
    maskFrom != null && maskTo != null
      ? interpolate(frame, [maskFrom, maskTo], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      : 1;

  // Everything inside the bar is a ratio of the BAR'S HEIGHT, so it has to be resolved to
  // px here. A percentage font-size would resolve against the inherited font-size rather
  // than the parent box, and a percentage padding resolves against the parent's WIDTH —
  // neither is the axis these ratios were measured on.
  const h = height * BAR_H;
  const w = width * BAR_W;
  const chipL = h * 0.58;
  const chipR = h * 0.58;

  // Click 1 at local frame 20 (global 2288) at Centre X 23.3%, Centre Y 50.0%
  // Click 2 at local frame 48 (global 2316) at Centre X 77.9%, Centre Y 50.0%
  const cursorX =
    frame < 20
      ? interpolate(frame, [5, 20], [width * 0.12, width * 0.233], {
          easing: SCENE_EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : frame < 29
      ? width * 0.233
      : interpolate(frame, [29, 48], [width * 0.233, width * 0.779], {
          easing: SCENE_EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Downward curve during transit between frame 29 and 48
  const travelArc =
    frame >= 29 && frame <= 48
      ? Math.sin(interpolate(frame, [29, 48], [0, Math.PI])) * (height * 0.05)
      : 0;

  const cursorY =
    frame < 20
      ? interpolate(frame, [5, 20], [height * 0.88, height * 0.5], {
          easing: SCENE_EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : height * 0.5 + travelArc;

  const click1Scale = interpolate(frame, [17, 20, 23], [1, 0.84, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const click2Scale = interpolate(frame, [45, 48, 51], [1, 0.84, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorScale = click1Scale * click2Scale;

  const chip1Press = interpolate(frame, [18, 20, 23], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chip2Press = interpolate(frame, [46, 48, 51], [1, 0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typewriter animation: placeholder disappears at frame 19 (global 2287)
  // and 'What is our time off policy?' types in across frames 19 to 31 (completes at global 2299)
  // The same question the search bar is still showing at 2317 — one constant, two shots.
  const TARGET_QUERY = FIXED_COPY.hqQuery;
  const isTyping = frame >= 19;
  const charsTyped = isTyping
    ? Math.min(
        TARGET_QUERY.length,
        Math.floor(
          interpolate(frame, [19, 31], [1, TARGET_QUERY.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        )
      )
    : 0;
  const displayText = isTyping ? TARGET_QUERY.slice(0, charsTyped) : placeholder;
  const showCaret = isTyping && frame <= 48 && Math.floor(frame / 6) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background,
        overflow: "hidden",
        clipPath: maskRadius >= maxRadius ? undefined : `circle(${maskRadius}px at 50% 50%)`,
        WebkitClipPath: maskRadius >= maxRadius ? undefined : `circle(${maskRadius}px at 50% 50%)`,
      }}
    >
      <WorkvivoSvgDefs />

      <div
        style={{
          position: "absolute",
          left: `${BAR_CX * 100}%`,
          top: `${BAR_CY * 100}%`,
          width: w,
          height: h,
          boxSizing: "border-box",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          borderRadius: 9999,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          paddingLeft: h * 0.16,
          paddingRight: h * 0.16,
          gap: h * 0.10,
          boxShadow: "0 8px 34px rgba(80, 0, 0, 0.16)",
        }}
      >
        {/* Leading sparkle chip */}
        <span
          style={{
            width: chipL,
            height: chipL,
            borderRadius: "50%",
            background: "#ece6fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            transform: `scale(${chip1Press})`,
            transformOrigin: "center center",
          }}
        >
          <SymbolSvg
            width={chipL * 0.55}
            height={chipL * 0.55}
            style={{
              filter: "brightness(0) drop-shadow(-0.06em 0.06em 0 #7a1030)",
            }}
           href="#i-ui-askvivo" />
        </span>

        <span
          style={{
            flex: "1 1 0",
            minWidth: 0,
            fontFamily:
              'InterX, Inter, -apple-system, "Segoe UI", system-ui, Arial, sans-serif',
            fontSize: h * 0.24,
            lineHeight: 1.2,
            color: isTyping ? "#111827" : "#6b7280",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>{displayText}</span>
          {showCaret && (
            <span
              style={{
                display: "inline-block",
                width: "2px",
                height: "1.15em",
                background: "#7b3fe8",
                marginLeft: "3px",
                borderRadius: "1px",
              }}
            />
          )}
        </span>

        {/* Send chip — Workvivo's own send glyph, which is the up arrow the reference shows */}
        <span
          style={{
            width: chipR,
            height: chipR,
            borderRadius: "50%",
            background: isTyping ? "#7b3fe8" : "#ece6fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            color: isTyping ? "#ffffff" : "#b9a5e8",
            transform: `scale(${chip2Press})`,
            transformOrigin: "center center",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          <SymbolSvg width={chipR * 0.42} height={chipR * 0.42} href="#i-ui-send" />
        </span>
      </div>

      {/* Animated cursor entering and clicking at 2288 (23.3%, 50.0%) and 2316 (77.9%, 50.0%) */}
      {frame >= 5 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `translate(-12px, -3.75px) scale(${cursorScale})`,
            transformOrigin: "12px 3.75px",
            opacity: interpolate(frame, [5, 9], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <Img
            src={staticFile("img/cursor.svg")}
            style={{
              width: 85.5,
              height: 85.5,
              filter: "brightness(0) drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  WorkvivoPostComposer,
  type PostComposerStage,
} from "./components/workvivo/WorkvivoPostComposer";
import { WorkvivoDesktop } from "./components/workvivo/WorkvivoDesktop";
import { MatchCut } from "./match-cut";
import { QuoteCard } from "./QuoteCard";
import { AiComposeSettings } from "./AiComposeSettings";
import { useCustomization } from "./customize/CustomizationProvider";

export const VirginWorkvivoDesktopFullscreenBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = useCustomization();
  const NATIVE_WIDTH = 1520;
  const BASE_SCALE = width / NATIVE_WIDTH;

  // Hard cut brand colour overlay to 0 (no overlay) at local frame 144 (global 1032)
  const isCut = frame >= 144;
  const brandTintOpacity = isCut ? 0 : 0.65;

  // Position & scale transform after hard cut at local frame 144 (global 1032): Pan X -8.2%, Pan Y -23.9% - 100px, Scale 1.09x
  const finalScale = BASE_SCALE * 1.09;
  const finalTranslateX = width * -0.082;
  const finalTranslateY = height * -0.239 - 100;

  // Slide up slightly into place after the hard cut at local frame 144 (global 1032)
  const slideUpProgress = interpolate(frame, [144, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const currentScale = isCut ? finalScale : BASE_SCALE;
  const translateX = isCut ? finalTranslateX : 0;
  const translateY = isCut
    ? interpolate(slideUpProgress, [0, 1], [finalTranslateY + 60, finalTranslateY])
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#010026", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: width,
          height: height,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${currentScale})`,
            transformOrigin: "top center",
          }}
        >
          {/* Reaction burst at local 149 = global 1037 */}
          <WorkvivoDesktop scrollTop={0} showComposedPost={true} reactionsStart={149} />
        </div>
      </div>
      <AbsoluteFill
        style={{
          backgroundColor: theme.brand,
          opacity: brandTintOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// Natural (unscaled) geometry of the two composer states, and the scale each is shown
// at. Heights are measured off the rendered cards — the seed's white box is 316px tall
// on screen at 2.7x, the settled composer's 510px at 1.25x — so the morph does not have
// to re-derive them from the cards' internal layout. They have to be exact: the morph
// hands back to the plain path at MORPH_END, and being 2px out here offsets the whole
// card by a pixel on the switch frame, which reads as a twitch.
const SEED_W = 492;
const SEED_H = 316 / 2.7;
const SEED_RADIUS = 14;
const MODAL_W = 740;
const MODAL_H = 510 / 1.25;
const MODAL_RADIUS = 12;
const MODAL_SCALE = 1.25;

// The morphing card is only used across the seed -> composer hand-off. By MORPH_END the
// box, the content scale and the shadow all equal what the plain path renders, so the
// switch back is invisible — and everything after it (the Add grid, the tray growth) is
// left on the original, simpler path.
const MORPH_END = 45;

const shadow = (y: number, blur: number, alpha: number, scale: number) =>
  `0 ${y * scale}px ${blur * scale}px rgba(0,0,0,${alpha})`;

export const VirginWorkvivoPostComposerOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // 1. Entrance: Card scales up to 2.7x size at start (frames 0 to 14) with MINIMAL fade in (just scale)
  const entranceProgress = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const entranceScale = interpolate(entranceProgress, [0, 1], [0.35, 2.7]);

  // Minimal fade in: 0 to 1 in 2 frames (virtually instant opacity, pure scale in)
  const cardOpacity = interpolate(frame, [0, 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. Cursor movement:
  // Targets are given as a share of the 1920x1080 stage and converted here, so the source
  // keeps the numbers in the form they were measured in.
  // - Click 1: Enters to 27.1% / 58.5% (520.32, 631.8) ("Give a Shout-Out") at local frame 20
  // - Click 2: Glides to 42.7% / 68.1% (819.84, 735.48) (Plus sign "+") at local frame 58
  // - Click 3: Glides to Image tile in Add grid (635.6px, 375px) at local frame 90
  // - Click 4: Glides to 40.9% / 79.4% (785.28, 857.52) (Value update button) at local frame 115
  // - Click 5: Glides to 65.6% / 27.3% (1259.52, 294.84) at local frame 139 — this is the
  //   CHECKBOX on the Select Value overlay's first row, not the OK button, which sits far
  //   below it at roughly (1211, 866). The comment said OK for a long time and the row was
  //   drawn pre-ticked, so the two together made the pointer look like it was travelling to
  //   a button and pressing nothing. `VALUE_CHECKED_AT` below is what ties the tick to it.
  const cursorX = interpolate(
    frame,
    [4, 20, 42, 58, 68, 90, 100, 115, 125, 139],
    [1400, 520.32, 520.32, 819.84, 819.84, 635.6, 635.6, 785.28, 785.28, 1259.52],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 1, 0.3, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [4, 20, 42, 58, 68, 90, 100, 115, 125, 139],
    [900, 631.8, 631.8, 735.48, 735.48, 375, 375, 857.52, 857.52, 294.84],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 1, 0.3, 1),
    }
  );

  // Click press animations:
  const cursorClick1 = interpolate(frame, [20, 22, 24], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorClick2 = interpolate(frame, [58, 60, 62], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorClick3 = interpolate(frame, [90, 92, 94], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorClick4 = interpolate(frame, [115, 117, 119], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorClick5 = interpolate(frame, [139, 141, 143], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let cursorClick = cursorClick1;
  if (frame >= 125) {
    cursorClick = cursorClick5;
  } else if (frame >= 105) {
    cursorClick = cursorClick4;
  } else if (frame >= 75) {
    cursorClick = cursorClick3;
  } else if (frame >= 50) {
    cursorClick = cursorClick2;
  }

  // Cursor opacity (fades in at frame 4, disappears at local frame 144)
  const cursorOpacity = interpolate(frame, [4, 8, 141, 144], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /**
   * The frame the value's tick appears on: the bottom of click 5's press, not its start.
   *
   * A checkbox that fills as the pointer starts moving down reads as a hover state; one
   * that fills at the bottom of the press reads as the click doing it. 141 is where
   * `cursorClick5` reaches its 0.82 minimum.
   */
  const VALUE_CHECKED_AT = 141;

  // 3. Which view the composer is showing, as a pure function of the frame:
  // - frame < 22: seed card
  // - 22 <= frame < 58: composer
  // - 58 <= frame < 92: Add grid
  // - 92 <= frame < 115: composer with the image tray attached
  // - 115 <= frame < 144: Select Value overlay (stays visible until global 1031 / local 143)
  let composerStage: PostComposerStage = "seed";
  if (frame >= 115) {
    composerStage = "values";
  } else if (frame >= 92) {
    composerStage = "tray";
  } else if (frame >= 58) {
    composerStage = "add";
  } else if (frame >= 22) {
    composerStage = "composer";
  }

  // The composer view's entrance animations are anchored to the frame it (re)appeared, which
  // is how the CSS behaved: display:none -> block restarts a keyframe animation. It appears
  // at 22, and again at 92 when the Add grid hands back to the composer.
  const composerShownAt = frame >= 92 ? 92 : frame >= 22 ? 22 : null;

  // Morph 1: Seed -> Composer (frames 22 to 41)
  const morphProgress1 = interpolate(frame, [22, 41], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Morph 2: Composer -> Image Tray Attached (frames 92 to 110)
  const morphProgress2 = interpolate(frame, [92, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const baseScale = interpolate(morphProgress1, [0, 1], [entranceScale, 1.25]);
  const cardScale = interpolate(morphProgress2, [0, 1], [baseScale, 1.15]);

  const baseHeight = interpolate(morphProgress1, [0, 1], [160, 580]);
  const iframeHeight = interpolate(morphProgress2, [0, 1], [baseHeight, 720]);

  const iframeWidth = interpolate(morphProgress1, [0, 1], [550, 740]);

  // Card shadow expansion during morph
  const cardShadowBlur = interpolate(morphProgress1, [0, 1], [25, 75]);
  const cardShadowAlpha = interpolate(morphProgress1, [0, 1], [0.18, 0.42]);

  // --- Seed -> composer morph -------------------------------------------------------
  // The card itself is the wrapper here, so its box can travel continuously from the
  // seed's to the composer's. The seed scales down with the box (so it is never clipped
  // on the way out); the composer sits at its FINAL scale the whole time and is simply
  // revealed as the box grows, which is what stops it reading as a scale-in.
  const seedBoxW = SEED_W * entranceScale;
  const seedBoxH = SEED_H * entranceScale;
  const morphBoxW = interpolate(morphProgress1, [0, 1], [seedBoxW, MODAL_W * MODAL_SCALE]);
  const morphBoxH = interpolate(morphProgress1, [0, 1], [seedBoxH, MODAL_H * MODAL_SCALE]);
  const morphRadius = interpolate(morphProgress1, [0, 1], [
    SEED_RADIUS * entranceScale,
    MODAL_RADIUS * MODAL_SCALE,
  ]);
  const morphShadow =
    morphProgress1 < 1
      ? shadow(
          interpolate(morphProgress1, [0, 1], [2 * entranceScale, 18 * MODAL_SCALE]),
          interpolate(morphProgress1, [0, 1], [12 * entranceScale, 60 * MODAL_SCALE]),
          interpolate(morphProgress1, [0, 1], [0.1, 0.18]),
          1,
        )
      : shadow(18, 60, 0.18, MODAL_SCALE);

  // Outgoing seed tracks the box width so its "Go Live" button never clips as it narrows.
  const morphSeedScale = entranceScale * (morphBoxW / seedBoxW);
  // Generous overlap — with less, the box is briefly an empty white rectangle mid-swap.
  const morphSeedOpacity = interpolate(frame, [22, 29], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const morphComposerOpacity = interpolate(frame, [23, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hard cut overlay elements out at local frame 144 (global 1032) AFTER all hooks have executed
  if (frame >= 144) {
    return null;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {/* Post Composer Card ON TOP of circular mask */}
      {frame < MORPH_END ? (
        /* The card box itself, morphing from the seed's to the composer's. It clips, so
           the composer is revealed top-down as the box grows rather than scaled into. */
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: morphBoxW,
            height: morphBoxH,
            transform: "translate(-50%, -50%)",
            borderRadius: morphRadius,
            backgroundColor: "#fff",
            boxShadow: morphShadow,
            overflow: "hidden",
            opacity: cardOpacity,
            pointerEvents: "none",
            filter: `drop-shadow(0 ${cardShadowBlur / 2}px ${cardShadowBlur}px rgba(0,0,0,${cardShadowAlpha}))`,
            zIndex: 10,
          }}
        >
          <div
            className="pc-morph"
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: SEED_W,
              transform: `translateX(-50%) scale(${morphSeedScale})`,
              transformOrigin: "top center",
              opacity: morphSeedOpacity,
            }}
          >
            <WorkvivoPostComposer stage="seed" composerShownAt={null} />
          </div>
          <div
            className="pc-morph"
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: MODAL_W,
              transform: `translateX(-50%) scale(${MODAL_SCALE})`,
              transformOrigin: "top center",
              opacity: morphComposerOpacity,
            }}
          >
            <WorkvivoPostComposer stage="composer" composerShownAt={composerShownAt} />
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: iframeWidth,
            height: iframeHeight,
            transform: `translate(-50%, -50%) scale(${cardScale})`,
            opacity: cardOpacity,
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            filter: `drop-shadow(0 ${cardShadowBlur / 2}px ${cardShadowBlur}px rgba(0,0,0,${cardShadowAlpha}))`,
            zIndex: 10,
          }}
        >
          <div style={{ width: iframeWidth, height: iframeHeight, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <WorkvivoPostComposer
              stage={composerStage}
              composerShownAt={composerShownAt}
              valueChecked={frame >= VALUE_CHECKED_AT}
            />
          </div>
        </div>
      )}

      {/* Animated Cursor (shrunk 20%) */}
      {frame >= 4 && frame <= 149 && (
        <div
          style={{
            position: "absolute",
            top: cursorY,
            left: cursorX,
            transform: `scale(${cursorClick})`,
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <CursorArrow color="black"
            style={{
              width: 91.2,
              height: 91.2,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

// The scene closes on a circular mask at local 394 (global 1282), shutting to nothing on
// local 397 (global 1285) — the same 3-frame shape the Spotify intro closes on, and the
// Sequence is 398 long precisely so that final radius-0 frame is the last one it renders.
// What it opens onto is LivestreamScene, mounted BELOW this one in VirginAirline.
const MASK_CLOSE_START = 394;

// Rotational MatchCut transition at local frame 184 (global 1072) to the quote card
export const VirginWorkvivoDesktopFullscreenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const ROTATION_EASE_CURVE = Easing.bezier(0.7, 0.18, 0.14, 0.99);
  const TRANSITION_DURATION = 15;
  const CUT_START = 0.25;
  const CUT_END = 0.6;

  // 1200 covers the 1920x1080 frame's half-diagonal (1102), so the mask is a no-op until it
  // starts closing rather than cropping the corners for the whole scene.
  const maskRadius = interpolate(
    frame,
    [MASK_CLOSE_START, MASK_CLOSE_START + 1, MASK_CLOSE_START + 2, MASK_CLOSE_START + 3],
    [1200, 540, 180, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#00031F",
        overflow: "hidden",
        clipPath: `circle(${maskRadius}px at 50% 50%)`,
        WebkitClipPath: `circle(${maskRadius}px at 50% 50%)`,
      }}
    >
      <MatchCut
        mode="rotational"
        rotational={{
          direction: "cw",
          totalDegrees: 720,
          ease: ROTATION_EASE_CURVE,
          shutterAngle: 180,
          // Heaviest cut in the timeline: each sample duplicates the WorkvivoDesktop tree on the
          // outgoing side AND the whole quote card on the incoming side.
          // 24 of those is a render-only setting — preview runs at 4.
          shutterSamples: 24,
          previewShutterSamples: 4,
        }}
        holdBefore={184}
        transitionDurationInFrames={TRANSITION_DURATION}
        // 199 makes the component's total length 184 + 15 + 199 = 398, matching the
        // Sequence that runs global 888 -> 1285 inclusive and ends on the closing mask.
        holdAfter={199}
        cutStart={CUT_START}
        cutEnd={CUT_END}
        outgoing={
          <AbsoluteFill>
            <VirginWorkvivoDesktopFullscreenBackground />
            <VirginWorkvivoPostComposerOverlay />
          </AbsoluteFill>
        }
        incoming={
          <AbsoluteFill>
            {/* QuoteCard owns the shared swap curve; both halves read it off the same frame.
                Its halos stay put through the swap, so the settings panel rises into the
                same purple glow the card leaves behind. */}
            <QuoteCard />
            <AiComposeSettings />
          </AbsoluteFill>
        }
      />
    </AbsoluteFill>
  );
};

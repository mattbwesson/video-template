import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GradientMesh } from "./GradientMesh";
import { HQLockup } from "./HQLockup";

// Frames 0-300 of the full HQ composition, lifted out as a standalone piece.
// Everything here runs at the source composition's 30fps / 1920x1080, so the
// timings below are the same frame numbers they were in the original.
export const HQ_OPENING_FPS = 30;
// Exactly 10.0s, as asked for. Note this lands one frame short of the last
// match cut: the lockup is still ~43px below centre at frame 299 and only
// settles at frame 303. Use 304 if you want the piece to end on a clean hold.
export const HQ_OPENING_DURATION_IN_FRAMES = 300;

const helvetica = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// Logo art is 730.38 x 187.04 in its own viewBox.
const LOGO_WIDTH = 740;

export interface HQOpeningProps {
  /** Helvetica Neue ships Thin (100) through Bold; 300 = Light. */
  taglineWeight?: number;
  /**
   * The source video's own audio bed, trimmed to these 10 seconds. Set false to
   * run the piece silent.
   */
  withAudio?: boolean;
}

export const HQOpening: React.FC<HQOpeningProps> = ({
  taglineWeight = 300,
  withAudio = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation starting at frame 70 (Workvivo HQ SVG moves up & FNF PNG fades in)
  const animProgress = spring({
    frame: frame - 70,
    fps,
    config: {
      damping: 18,
      stiffness: 90,
      mass: 0.8,
    },
  });

  // SVG starts vertically centered (before FNF appears), then animates up by ~60px
  const logoTranslateY = interpolate(animProgress, [0, 1], [60, 0]);

  // FNF Logo fade-in and slide-in from below / bottom-up
  const fnfOpacity = interpolate(animProgress, [0, 1], [0, 1]);
  const fnfTranslateY = interpolate(animProgress, [0, 1], [15, 0]);

  // --- Helper function for Match Cut Left transition ---
  const getMatchCut = (startFrame: number, durationFrames: number) => {
    const ease = Easing.bezier(0.81, -0.01, 0.35, 1);
    const f = Math.max(0, Math.min(1, (frame - startFrame) / durationFrames));
    const cutStart = 0.5;
    const cutEnd = 0.75;
    const w1 = cutStart;
    const w2 = 1 - cutEnd;
    const fSplit = w1 / (w1 + w2);

    const isBeforeCut = f < fSplit;
    const m = isBeforeCut
      ? (f / fSplit) * cutStart
      : cutEnd + ((f - fSplit) / (1 - fSplit)) * (1 - cutEnd);
    const disp = ease(m);

    return {
      outgoingX: -disp * 1920,
      incomingX: (1 - disp) * 1920,
      splitFrame: startFrame + durationFrames * fSplit,
    };
  };

  // Same curve, but the cut travels vertically.
  const getMatchCutUp = (startFrame: number, durationFrames: number) => {
    const ease = Easing.bezier(0.81, -0.01, 0.35, 1);
    const f = Math.max(0, Math.min(1, (frame - startFrame) / durationFrames));
    const cutStart = 0.5;
    const cutEnd = 0.75;
    const w1 = cutStart;
    const w2 = 1 - cutEnd;
    const fSplit = w1 / (w1 + w2);

    const isBeforeCut = f < fSplit;
    const m = isBeforeCut
      ? (f / fSplit) * cutStart
      : cutEnd + ((f - fSplit) / (1 - fSplit)) * (1 - cutEnd);
    const disp = ease(m);

    return {
      outgoingY: -disp * 1080,
      incomingY: (1 - disp) * 1080,
      splitFrame: startFrame + durationFrames * fSplit,
    };
  };

  const mcDuration = Math.round(0.75 * fps); // Crisp 22-23 frame cut

  // Match Cut 1: Frame 185 (Workvivo HQ -> "Connect")
  const mc185 = getMatchCut(185, mcDuration);
  // Match Cut 2: Frame 215 ("Connect" -> "Engage")
  const mc215 = getMatchCut(215, mcDuration);
  // Match Cut 3: Frame 240 ("Engage" -> "Inform")
  const mc240 = getMatchCut(240, mcDuration);
  // Match Cut 4: Frame 280 ("Inform" match cut UP -> centered Workvivo HQ lockup)
  const mc280 = getMatchCutUp(280, mcDuration);

  // Visibility windows. In the full composition the last scene ran to frame 550;
  // here the composition ends at 300 first.
  const showScene0 = frame < mc185.splitFrame;
  const showConnect = frame >= 185 && frame < mc215.splitFrame;
  const showEngage = frame >= 215 && frame < mc240.splitFrame;
  const showInform = frame >= 240 && frame < mc280.splitFrame;
  const showReturnHQ = frame >= 280;

  // Spring animations for text scale/pop
  const popSpring = (startFrame: number) =>
    spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 16, stiffness: 95, mass: 0.8 },
    });

  const connectScale = interpolate(popSpring(185), [0, 1], [0.92, 1]);
  const engageScale = interpolate(popSpring(215), [0, 1], [0.92, 1]);
  const informScale = interpolate(popSpring(240), [0, 1], [0.92, 1]);

  // Combined horizontal position for each slide
  const connectX = frame < 215 ? mc185.incomingX : mc215.outgoingX;
  const engageX = frame < 240 ? mc215.incomingX : mc240.outgoingX;
  const informX = mc240.incomingX;

  // Word style for Connect, Engage, Inform
  const wordStyle: React.CSSProperties = {
    fontFamily: "'HappyDisplay', -apple-system, sans-serif",
    fontSize: 160,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    background:
      "linear-gradient(100deg, #ffffff 0%, #ffffff 52%, #fce7fa 68%, #ea97f7 84%, #d96be8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter:
      "drop-shadow(0 10px 40px rgba(185, 80, 240, 0.45)) drop-shadow(0 2px 10px rgba(255, 255, 255, 0.35))",
    userSelect: "none",
    display: "inline-block",
  };

  return (
    <AbsoluteFill>
      <style>{`
        @font-face {
          font-family: 'HappyDisplay';
          src: url('${staticFile("HappyDisplay-SemiBold.otf")}') format('opentype');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: 'HappyDisplay';
          src: url('${staticFile("HappyDisplay-Regular.otf")}') format('opentype');
          font-weight: 400;
          font-style: normal;
        }
      `}</style>

      {/* In the full composition a 331s background video sits under everything;
          for these 10 seconds it is fully covered by the gradient, so only its
          audio bed survives here. */}
      {withAudio && <Audio src={staticFile("hq-opening-audio.m4a")} />}

      {/* Background: WebGL mesh gradient */}
      <GradientMesh />

      {/* Scene 0: Workvivo HQ + FNF + Tagline */}
      {showScene0 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 124,
            transform: `translateX(${mc185.outgoingX}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: LOGO_WIDTH,
            }}
          >
            {/* Logo container animating up */}
            <div
              style={{
                position: "relative",
                width: "100%",
                transform: `translateY(${logoTranslateY}px)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <HQLockup width={LOGO_WIDTH} />

              {/* FNF Logo positioned centered underneath the SVG logo */}
              <div
                style={{
                  marginTop: -4,
                  opacity: fnfOpacity,
                  transform: `translateY(${fnfTranslateY}px)`,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Img
                  src={staticFile("refs/fnf.png")}
                  style={{
                    height: 128,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* Tagline */}
            <div
              style={{
                marginTop: 92,
                fontFamily: helvetica,
                fontSize: 61,
                fontWeight: taglineWeight,
                color: "#fff",
                letterSpacing: "0.005em",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              The AI-native{" "}
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  padding: "0 6px",
                  borderRadius: "8px",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: "2px -4px",
                    background: "#7100f1",
                    borderRadius: "8px",
                    transformOrigin: "left center",
                    transform: `scaleX(${interpolate(
                      spring({
                        frame: frame - 120,
                        fps,
                        config: { damping: 14, stiffness: 85, mass: 0.8 },
                      }),
                      [0, 1],
                      [0, 1]
                    )})`,
                    zIndex: 0,
                  }}
                />
                <span style={{ position: "relative", zIndex: 1, color: "#ffffff" }}>
                  employee experience platform
                </span>
              </span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Scene 1: Match Cut Left into "Connect" */}
      {showConnect && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `translateX(${connectX}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${connectScale})`,
            }}
          >
            <span style={wordStyle}>Connect</span>
            <span
              style={{
                ...wordStyle,
                position: "absolute",
                inset: 0,
                background: "none",
                WebkitBackgroundClip: "unset",
                WebkitTextFillColor: "#ffffff",
                color: "#ffffff",
                opacity: interpolate(frame, [195, 214], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Connect
            </span>
          </div>
        </AbsoluteFill>
      )}

      {/* Scene 2: Match Cut Left into "Engage" at frame 215 */}
      {showEngage && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `translateX(${engageX}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${engageScale})`,
            }}
          >
            <span style={wordStyle}>Engage</span>
            <span
              style={{
                ...wordStyle,
                position: "absolute",
                inset: 0,
                background: "none",
                WebkitBackgroundClip: "unset",
                WebkitTextFillColor: "#ffffff",
                color: "#ffffff",
                opacity: interpolate(frame, [222, 239], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Engage
            </span>
          </div>
        </AbsoluteFill>
      )}

      {/* Scene 3: Match Cut Left into "Inform" at frame 240 */}
      {showInform && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `translateX(${informX}px) translateY(${mc280.outgoingY}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${informScale})`,
            }}
          >
            <span style={wordStyle}>Inform</span>
            <span
              style={{
                ...wordStyle,
                position: "absolute",
                inset: 0,
                background: "none",
                WebkitBackgroundClip: "unset",
                WebkitTextFillColor: "#ffffff",
                color: "#ffffff",
                opacity: interpolate(frame, [250, 279], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Inform
            </span>
          </div>
        </AbsoluteFill>
      )}

      {/* Scene 4: Match Cut UP at frame 280 returning to centered Workvivo HQ Logo */}
      {showReturnHQ && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `translateY(${mc280.incomingY}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HQLockup width={Math.round(LOGO_WIDTH * 1.2)} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { MobileClick, WorkvivoCatchMeUp } from './components/workvivo';
import { useCustomization } from './customize/CustomizationProvider';
import { FIXED_COPY } from './customize/videoCopy';

/** Gap between the words. The sizer has to use the same value to measure true. */
const WORD_GAP = '0.20em';

// Tap on the "Catch Me Up" chevron, at local 60 (global 660). It has to be gone by
// local 70, when the story opens and the phone starts scaling away underneath it.
const TAP_FRAME = 60;
const TAP_END = 70;
/** Centre, as a fraction of the canvas. */
const TAP_X = '65.9%';
const TAP_Y = '71.7%';
/** Settled diameter — 108px (50% larger than the original 72px). */
const TAP_SIZE = 108;

export const BackFromScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { theme } = useCustomization();
  // Four separate words because each animates in on its own: `lead` sits centred alone
  // before the rest track out from behind it. Fixed copy, not a slot — see FIXED_COPY.
  const [lead, second, third, fourth] = FIXED_COPY.timeOffWords;

  // Part 1: Scale down - (8 frames at 25fps) on cubic-bezier(0.30, 0.92, 0.70, 0.86)
  // Font starts twice as large (fontSize: 340) and scales down
  const part1Progress = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.30, 0.92, 0.70, 0.86),
  });

  // Move to the side: cubic-bezier(0.53, 0.27, 0.12, 1.00) 900ms (22.5 frames at 25fps)
  // Starts at frame 5 before scale down curve is fully complete (runs frames 5 to 27.5)
  const moveProgress = interpolate(frame, [5, 27.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.53, 0.27, 0.12, 1.0),
  });

  // 'from' comes to full opacity as move begins (frames 5 to 11)
  const fromOpacity = interpolate(frame, [5, 11], [0.5, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tracking / accordion expansion entrance for 'time' and 'off?'
  // Both arrive simultaneously at frame 20.5 on the same curve, with doubled travel distances (720px vs 360px)
  const trackingProgress = interpolate(frame, [5, 20.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.76, 0.08, 0.26, 0.84),
  });

  const timeOpacity = trackingProgress;
  const timeTranslateX = interpolate(trackingProgress, [0, 1], [360, 0]);

  const offOpacity = trackingProgress;
  const offTranslateX = interpolate(trackingProgress, [0, 1], [720, 0]);

  const scale =
    frame < 8
      ? interpolate(part1Progress, [0, 1], [1.0, 0.48])
      : interpolate(frame, [8, 27.5], [0.48, 0.42], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.53, 0.27, 0.12, 1.0),
        });

  // 1 = "Back" alone sits centred (how the line starts), 0 = the whole
  // "Back from time off?" sits centred (where it comes to rest).
  const centerOnBack = interpolate(moveProgress, [0, 1], [1, 0]);

  // At local 32: text animates up (cubic-bezier(0.76, 0.08, 0.26, 0.84) 600ms / 15 frames: 32 to 47)
  const textExitTranslateY = interpolate(frame, [32, 47], [0, -600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.76, 0.08, 0.26, 0.84),
  });
  const textExitOpacity = interpolate(frame, [32, 47], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.76, 0.08, 0.26, 0.84),
  });

  // At local 32: Workvivo Catch Me Up animates up from the bottom with smooth ease-out arrival
  const mobileSlideOffset = interpolate(frame, [32, 48], [1200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // At local 70: scale down 35% and move up a bit on curve cubic-bezier(0.10, 0.95, 0.28, 0.98) 1100ms (27.5 frames: 70 to 97.5)
  const post70Progress = interpolate(frame, [70, 97.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.10, 0.95, 0.28, 0.98),
  });

  const mobileScale = interpolate(post70Progress, [0, 1], [2.25, 2.25 * 0.65]);
  const baseY = interpolate(post70Progress, [0, 1], [650, 200]);
  const totalMobileTranslateY = baseY + mobileSlideOffset;
  const storyOpen = frame >= 70;

  // Social reel / stories progression (advancing at local 87, 102, and 116)
  let activeSlide = 0;
  let slideProgress = 0;

  if (frame >= 116) {
    activeSlide = 3;
    slideProgress = interpolate(frame, [116, 134], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= 102) {
    activeSlide = 2;
    slideProgress = interpolate(frame, [102, 116], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= 87) {
    activeSlide = 1;
    slideProgress = interpolate(frame, [87, 102], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= 70) {
    activeSlide = 0;
    slideProgress = interpolate(frame, [70, 87], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // Gentle highlight pulse on right arrow at local 87, 102, and 116
  let rightArrowOpacity = 0.35;
  let rightArrowScale = 1.0;
  let rightArrowGlow = false;

  if (frame >= 87 && frame < 94) {
    const pulse =
      frame < 89
        ? interpolate(frame, [87, 89], [0, 1], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          })
        : interpolate(frame, [89, 94], [1, 0], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          });
    rightArrowOpacity = interpolate(pulse, [0, 1], [0.35, 0.95]);
    rightArrowScale = interpolate(pulse, [0, 1], [1.0, 1.12]);
    rightArrowGlow = pulse > 0.3;
  } else if (frame >= 102 && frame < 109) {
    const pulse =
      frame < 104
        ? interpolate(frame, [102, 104], [0, 1], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          })
        : interpolate(frame, [104, 109], [1, 0], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          });
    rightArrowOpacity = interpolate(pulse, [0, 1], [0.35, 0.95]);
    rightArrowScale = interpolate(pulse, [0, 1], [1.0, 1.12]);
    rightArrowGlow = pulse > 0.3;
  } else if (frame >= 116 && frame < 123) {
    const pulse =
      frame < 118
        ? interpolate(frame, [116, 118], [0, 1], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          })
        : interpolate(frame, [118, 123], [1, 0], {
            easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          });
    rightArrowOpacity = interpolate(pulse, [0, 1], [0.35, 0.95]);
    rightArrowScale = interpolate(pulse, [0, 1], [1.0, 1.12]);
    rightArrowGlow = pulse > 0.3;
  }

  const rightArrowFadeIn = interpolate(frame, [80, 86], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftArrowFadeIn = interpolate(frame, [87, 91], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });



  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.brand,
        overflow: 'hidden',
      }}
    >
      {/* Text "Back from time off?" */}
      {frame < 48 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateY(${textExitTranslateY}px) scale(${scale})`,
            transformOrigin: 'center center',
            opacity: textExitOpacity,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize: 340,
            fontWeight: 500,
            letterSpacing: '0.025em',
            color: '#ffffff',
            textShadow:
              '0 0 25px rgba(255, 255, 255, 0.4), 0 0 50px rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Sizer — never painted. "from time off?" is absolutely positioned in the
              visible copy below so it carries no layout width, which would leave this
              box (and therefore the centring and the transform origin) sized to "Back"
              alone. This puts the complete line in flow so the box is the whole line. */}
          <span
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              visibility: 'hidden',
            }}
          >
            {lead}
            <span style={{ marginLeft: WORD_GAP }}>{second}</span>
            <span style={{ marginLeft: WORD_GAP }}>{third}</span>
            <span style={{ marginLeft: WORD_GAP }}>{fourth}</span>
          </span>

          {/* Visible copy, laid over the sizer. The two percentage transforms below
              resolve against different widths — the outer against the full line, the
              inner against "Back" — so `centerOnBack` slides between the two centred
              states without either endpoint depending on a measured pixel width. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              transform: `translateX(${centerOnBack * 50}%)`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                position: 'relative',
                whiteSpace: 'nowrap',
                transform: `translateX(${-centerOnBack * 50}%)`,
              }}
            >
              {lead}
              <span
                style={{
                  position: 'absolute',
                  left: '100%',
                  marginLeft: WORD_GAP,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ opacity: fromOpacity, display: 'inline-block' }}>
                  {second}
                </span>
                <span
                  style={{
                    opacity: timeOpacity,
                    transform: `translateX(${timeTranslateX}px)`,
                    marginLeft: WORD_GAP,
                    display: 'inline-block',
                  }}
                >
                  {third}
                </span>
                <span
                  style={{
                    opacity: offOpacity,
                    transform: `translateX(${offTranslateX}px)`,
                    marginLeft: WORD_GAP,
                    display: 'inline-block',
                  }}
                >
                  {fourth}
                </span>
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Tap on the "Catch Me Up" chevron, just before it opens the story */}
      <MobileClick
        startFrame={TAP_FRAME}
        durationInFrames={TAP_END - TAP_FRAME}
        x={TAP_X}
        y={TAP_Y}
        size={TAP_SIZE}
      />

      {/* Workvivo Catch Me Up Component (slides up starting at local frame 32) */}
      {frame >= 32 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${totalMobileTranslateY}px) scale(${mobileScale})`,
            transformOrigin: 'center center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <WorkvivoCatchMeUp
            storyOpen={storyOpen}
            activeSlide={activeSlide}
            slideProgress={slideProgress}
          />
        </div>
      )}

      {/* Side Arrow Navigation Chevrons when Story is open */}
      {frame >= 80 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Left Arrow at Centre X 26.0%, Centre Y 54.2% (only visible from story 2 onwards) */}
          {frame >= 87 && (
            <div
              style={{
                position: 'absolute',
                left: '26.0%',
                top: '54.2%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.35 * leftArrowFadeIn,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="93" height="159" viewBox="0 0 44 76" fill="none">
                <path
                  d="M38 6L8 38L38 70"
                  stroke="white"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {/* Right Arrow at Centre X 72.3%, Centre Y 54.2% (gently highlights when advancing) */}
          <div
            style={{
              position: 'absolute',
              left: '72.3%',
              top: '54.2%',
              transform: `translate(-50%, -50%) scale(${rightArrowScale})`,
              opacity: rightArrowOpacity * rightArrowFadeIn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: rightArrowGlow
                ? 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.85))'
                : 'none',
              transition: 'filter 0.1s ease',
            }}
          >
            <svg width="93" height="159" viewBox="0 0 44 76" fill="none">
              <path
                d="M6 6L36 38L6 70"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
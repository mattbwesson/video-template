import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { WorkvivoDesktop } from './components/workvivo/WorkvivoDesktop';
import { ContentListBackground, ContentListContent } from './ContentListScreen';
import { MatchCut, matchCutTimeline } from './match-cut';

export const VirginWorkvivoDesktopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Desktop component sized and centered cleanly on #010026 background
  const COMPONENT_WIDTH = width * 0.85 * 0.9; // 1468.8px
  const NATIVE_WIDTH = 1520;
  const NATIVE_HEIGHT = 940 * 1.15; // 1081px
  const SCALE_RATIO = COMPONENT_WIDTH / NATIVE_WIDTH; // ~0.9663
  const COMPONENT_HEIGHT = NATIVE_HEIGHT * SCALE_RATIO; // ~1044.6px
  const COMPONENT_TOP = (height - COMPONENT_HEIGHT) / 2; // ~17.7px

  // Animate up from bottom, already 25% of the way in (75% remaining off-screen) at frame 0, resting 100px down
  const RESTING_OFFSET_Y = 100;
  const offscreenDistance = height - COMPONENT_TOP; // ~1062.3px
  const initialTranslateY = offscreenDistance * 0.75 + RESTING_OFFSET_Y; // 25% already visible

  const slideProgress = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const translateY = interpolate(slideProgress, [0, 1], [initialTranslateY, RESTING_OFFSET_Y]);

  // Slow scroll down middle portion from local 8 to local 60
  const scrollTop = interpolate(frame, [8, 60], [0, 280], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  // Circular mask shrinking down to 0 from local frame 150 to 158
  const maskRadius = interpolate(frame, [150, 158], [1400, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const ROTATION_EASE_CURVE = Easing.bezier(0.7, 0.18, 0.14, 0.99);
  const TRANSITION_DURATION = 15; // 600ms at 25 fps
  const CUT_START = 0.25; // Cut out more of the first half
  const CUT_END = 0.6;

  // Match cut timeline calculation: cutting out more of the first half
  const { beforeCut } = matchCutTimeline(
    frame,
    52,
    TRANSITION_DURATION,
    CUT_START,
    CUT_END,
    ROTATION_EASE_CURVE,
  );
  const isSecondHalf = !beforeCut;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#010026',
        overflow: 'hidden',
        clipPath: `circle(${maskRadius}px at 50% 50%)`,
        WebkitClipPath: `circle(${maskRadius}px at 50% 50%)`,
      }}
    >
      {/* Background appears in place in the second half of the match cut without rotating */}
      {isSecondHalf && <ContentListBackground />}

      <MatchCut
        mode="rotational"
        rotational={{
          direction: 'cw',
          totalDegrees: 720,
          ease: ROTATION_EASE_CURVE,
          shutterAngle: 180,
          // 24 samples = 24 copies of the whole WorkvivoDesktop tree (~30 <Img>s) composited per
          // frame. Fine for a render; unplayable in the Studio, so preview drops to 4. Raise
          // previewShutterSamples if playback still has headroom, or null to preview at full quality.
          shutterSamples: 24,
          previewShutterSamples: 4,
        }}
        holdBefore={52}
        transitionDurationInFrames={TRANSITION_DURATION}
        holdAfter={103}
        cutStart={CUT_START}
        cutEnd={CUT_END}
        outgoing={
          <AbsoluteFill
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                transform: `translateY(${translateY}px) scale(${SCALE_RATIO})`,
                transformOrigin: 'center center',
                borderRadius: 14,
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.65)',
              }}
            >
              <WorkvivoDesktop scrollTop={scrollTop} />
            </div>
          </AbsoluteFill>
        }
        incoming={<ContentListContent />}
      />
    </AbsoluteFill>
  );
};
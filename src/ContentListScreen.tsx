import React from 'react';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { SPECK_SRC } from './contentListAssets';

const specksData = [
  { left: '49.7%', top: '74.5%', size: 11, delay: -4.4 },
  { left: '46.9%', top: '76.5%', size: 9, delay: -5.6 },
  { left: '60.5%', top: '80.5%', size: 9, delay: -1.1 },
  { left: '71.0%', top: '40.0%', size: 11, delay: -2.8 },
  { left: '86.0%', top: '26.0%', size: 10, delay: -0.6 },
  { left: '92.5%', top: '66.0%', size: 8, delay: -3.9 },
  { left: '24.0%', top: '88.0%', size: 9, delay: -5.0 },
  { left: '78.5%', top: '84.5%', size: 9, delay: -4.1 },
];

export const ContentListBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle breathing animations for ambient glow fields
  const breathe1 = 1 + Math.sin(frame * 0.04) * 0.03;
  const breatheBand = 1 + Math.sin((frame - 125) * 0.03) * 0.025;
  const breatheBloom = 1 + Math.sin((frame - 175) * 0.033) * 0.03;
  const breatheLeft = 1 + Math.sin((frame - 275) * 0.027) * 0.03;
  const breatheRight = 1 + Math.sin((frame - 100) * 0.023) * 0.03;

  const time = frame / 25; // in seconds

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#01031D',
        width: 1920,
        height: 1080,
        overflow: 'hidden',
      }}
    >
      {/* Glow Wash */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          pointerEvents: 'none',
          width: 2400,
          height: 1450,
          left: '50%',
          top: '112%',
          background:
            'radial-gradient(closest-side, rgba(80,13,217,.95) 0%, rgba(60,2,160,.72) 34%, rgba(40,2,120,.40) 58%, rgba(22,2,78,.16) 80%, rgba(18,2,67,0) 100%)',
          filter: 'blur(64px)',
          transform: `translate(-50%, -50%) scale(${breathe1})`,
          willChange: 'transform',
        }}
      />

      {/* Glow Band */}
      <div
        style={{
          position: 'absolute',
          left: '60%',
          top: '88%',
          width: 1900,
          height: 780,
          borderRadius: '50%',
          pointerEvents: 'none',
          background:
            'radial-gradient(closest-side, rgba(96,24,238,1) 0%, rgba(72,4,186,.78) 38%, rgba(50,2,145,.34) 70%, rgba(30,2,95,0) 100%)',
          filter: 'blur(70px)',
          transform: `translate(-50%, -50%) rotate(-24deg) scale(${breatheBand})`,
          willChange: 'transform',
        }}
      />

      {/* Glow Bloom */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          pointerEvents: 'none',
          width: 1100,
          height: 720,
          left: '40%',
          top: '107%',
          background:
            'radial-gradient(closest-side, rgba(129,94,232,.34) 0%, rgba(80,13,217,.40) 36%, rgba(66,2,170,.26) 68%, rgba(66,2,170,0) 100%)',
          filter: 'blur(58px)',
          transform: `translate(-50%, -50%) scale(${breatheBloom})`,
          willChange: 'transform',
        }}
      />

      {/* Glow Left */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          pointerEvents: 'none',
          width: 900,
          height: 1250,
          left: '-4%',
          top: '46%',
          background:
            'radial-gradient(closest-side, rgba(52,1,150,1) 0%, rgba(39,1,112,.88) 30%, rgba(30,1,90,.44) 60%, rgba(20,1,70,.12) 82%, rgba(20,1,70,0) 100%)',
          filter: 'blur(78px)',
          transform: `translate(-50%, -50%) scale(${breatheLeft})`,
          willChange: 'transform',
        }}
      />

      {/* Glow Right */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          pointerEvents: 'none',
          width: 1150,
          height: 900,
          left: '92%',
          top: '90%',
          background:
            'radial-gradient(closest-side, rgba(66,2,170,.30) 0%, rgba(18,2,67,.12) 48%, rgba(18,2,67,0) 100%)',
          filter: 'blur(80px)',
          transform: `translate(-50%, -50%) scale(${breatheRight})`,
          willChange: 'transform',
        }}
      />

      {/* Star Specks */}
      {specksData.map((s, idx) => {
        const driftPhase = ((time + s.delay) / 26) * Math.PI * 2;
        const dx = Math.sin(driftPhase) * 20;
        const dy = Math.cos(driftPhase) * 16;
        const opacity = 0.75 + Math.sin(driftPhase * 2) * 0.25;

        return (
          <img
            key={idx}
            src={SPECK_SRC}
            alt=""
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              objectFit: 'fill',
                            opacity,
              transform: `translate(${dx}px, ${dy}px)`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const ContentListContent: React.FC = () => {
  const frame = useCurrentFrame();
  const time = frame / 25;

  // Organic floating motion loop (continuous ambient drift)
  const floatY = (t: number) => {
    const phase = ((t % 13) / 13) * Math.PI * 2;
    const dy = Math.sin(phase) * 14;
    const dx = Math.sin(phase * 2) * 7;
    const rot = Math.sin(phase) * 3;
    return { dx, dy, rot };
  };

  const chatFloat = floatY(time);
  const rocketFloat = floatY(time - 4);
  const magFloat = floatY(time - 8);

  // Dynamic Landing Inertia (Landing transition spans frames 52 to ~76)
  const rocketLandRot = interpolate(frame, [52, 66, 75], [35, -5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.3, 0.5, 1),
  });
  const rocketLandX = interpolate(frame, [52, 66, 75], [60, -8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.2, 0.5, 1),
  });
  const rocketLandY = interpolate(frame, [52, 66, 75], [-40, 5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.2, 0.5, 1),
  });

  const chatLandRot = interpolate(frame, [52, 65, 73], [-40, 4, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.35, 0.5, 1),
  });
  const chatLandX = interpolate(frame, [52, 65, 73], [-70, 6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.2, 0.5, 1),
  });
  const chatLandY = interpolate(frame, [52, 65, 73], [-30, 4, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 1.2, 0.5, 1),
  });

  const magLandRot = interpolate(frame, [52, 67, 78], [55, -6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1.4, 0.5, 1),
  });
  const magLandX = interpolate(frame, [52, 67, 78], [45, -6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1.25, 0.5, 1),
  });
  const magLandY = interpolate(frame, [52, 67, 78], [55, -7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1.25, 0.5, 1),
  });

  const chatTransform = `translate(${chatFloat.dx + chatLandX}px, ${chatFloat.dy + chatLandY}px) rotate(${chatFloat.rot + chatLandRot}deg)`;
  const rocketTransform = `translate(${rocketFloat.dx + rocketLandX}px, ${rocketFloat.dy + rocketLandY}px) rotate(${rocketFloat.rot + rocketLandRot}deg)`;
  const magTransform = `translate(${magFloat.dx + magLandX}px, ${magFloat.dy + magLandY}px) rotate(${magFloat.rot + magLandRot}deg)`;

  return (
    <AbsoluteFill
      style={{
        width: 1920,
        height: 1080,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Word Column List (Scrolling upwards) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {(() => {
          const LIST_ITEMS = [
            'Images',
            'Polls',
            'Surveys',
            'News articles',
            'Podcasts',
            'Events',
            'Shout-outs',
            'Value updates',
            'Campaigns',
            'Translations',
            'GIFs',
          ];

          const LINE_HEIGHT = 175;
          const FOCUS_Y = 510;
          // When scrollDistance is 0 at local 69 (global 807), Surveys (idx 2) & News articles (idx 3) are centered
          const baseTop = FOCUS_Y - 2.5 * LINE_HEIGHT;

          // Pure linear smooth constant scroll the entire time it is on screen
          const scrollDistance = interpolate(frame, [69, 158], [0, 5.0 * LINE_HEIGHT], {
            easing: Easing.linear,
          });

          return LIST_ITEMS.map((item, idx) => {
            const itemTop = baseTop + idx * LINE_HEIGHT - scrollDistance;
            const itemCenterY = itemTop + LINE_HEIGHT / 2;
            const dist = Math.abs(itemCenterY - FOCUS_Y);

            // Dynamic lighting / opacity curve: bright in center, fading smoothly toward top and bottom
            let opacity = 0;
            if (dist < 95) {
              opacity = 1.0;
            } else if (dist < 265) {
              opacity = interpolate(dist, [95, 265], [1.0, 0.32]);
            } else if (dist < 440) {
              opacity = interpolate(dist, [265, 440], [0.32, 0.10]);
            } else {
              opacity = interpolate(dist, [440, 580], [0.10, 0.0], {
                extrapolateRight: 'clamp',
              });
            }

            // Subtle scale punch when centered
            const itemScale = interpolate(dist, [0, 150, 400], [1.02, 1.0, 0.98], {
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: itemTop,
                  height: LINE_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 136,
                  lineHeight: `${LINE_HEIGHT}px`,
                  fontWeight: 500,
                  letterSpacing: '-1.5px',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  opacity,
                  transform: `scale(${itemScale})`,
                  willChange: 'transform, opacity',
                }}
              >
                {item}
              </div>
            );
          });
        })()}
      </div>

      {/* Glass icons, tint pre-baked. These carried a mask-image'd gradient wash and
          plus-lighter blends; the in-browser export supports neither — the maskless wash
          painted its whole box as a purple tile over every icon (web/renderProbe.tsx).
          scripts in-repo baked the same wash into public/img/glass/*.png, so one plain
          <img> now draws what three blended layers used to. */}
      {/* Chat Icon (top right) */}
      <div
        style={{
          position: 'absolute',
          left: 1479,
          top: 300,
          width: 262,
          height: 262,
          transform: chatTransform,
          willChange: 'transform',
                  }}
      >
        <img
          src={staticFile("img/glass/chat.png")}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />
      </div>

      {/* Rocket Icon (top left) */}
      <div
        style={{
          position: 'absolute',
          left: 196,
          top: 232,
          width: 284,
          height: 284,
          transform: rocketTransform,
          willChange: 'transform',
                  }}
      >
        <img
          src={staticFile("img/glass/rocket.png")}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />
      </div>

      {/* Mag Icon (mid left) */}
      <div
        style={{
          position: 'absolute',
          left: 258,
          top: 580,
          width: 228,
          height: 228,
          transform: magTransform,
          willChange: 'transform',
                  }}
      >
        <img
          src={staticFile("img/glass/mag.png")}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ContentListScreen: React.FC = () => {
  return (
    <AbsoluteFill>
      <ContentListBackground />
      <ContentListContent />
    </AbsoluteFill>
  );
};

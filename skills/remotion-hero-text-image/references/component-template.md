# Component Template: Hero Text + Image Animation

Full annotated Remotion component implementing the hero text with floating images animation. Matches the "The new presentation tool that creates apple grade slides" sequence: same font for both lines, staggered exit (images in groups, text 1 frame after last image), cubic easing throughout.

## Complete Component

```tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
} from 'remotion';

// ============================================================
// TYPES
// ============================================================

interface ImageConfig {
  src: string;
  /** X position as percentage of composition width (0-100, can be negative) */
  x: number;
  /** Y position as percentage of composition height (0-100, can be negative) */
  y: number;
  rotation?: number;
  scale?: number;
  enterDelay?: number;
  /** Width of the image card in pixels */
  cardWidth?: number;
}

interface HeroTextImageProps {
  line1: string;
  line2: string;
  images: ImageConfig[];
  fontFamily?: string;
  line1FontSize?: number;
  line2FontSize?: number;
  fontWeight?: number;
  textColor?: string;
  backgroundColor?: string;
  enterDurationFrames?: number;
  holdDurationFrames?: number;
  zoomOutDurationFrames?: number;
  maxZoomScale?: number;
  /** Frames before text zoom that the first image group starts */
  zoomLeadFrames?: number;
  /** Frames between each group's zoom start */
  zoomStaggerFrames?: number;
  /** Number of images per group (same group = same zoom start) */
  zoomGroupSize?: number;
}

// ============================================================
// FLOATING IMAGE COMPONENT
// ============================================================

const FloatingImage: React.FC<{
  config: ImageConfig;
  frame: number;
  enterStart: number;
  compositionWidth: number;
  compositionHeight: number;
  zoomProgress: number;
}> = ({ config, frame, enterStart, compositionWidth, compositionHeight }) => {
  const delay = config.enterDelay ?? 0;
  const localFrame = frame - enterStart - delay;
  const scale = config.scale ?? 1;
  const cardWidth = config.cardWidth ?? 280;

  const enterDuration = 20;
  const opacity = interpolate(localFrame, [0, enterDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const translateY = interpolate(localFrame, [0, enterDuration], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const shadowOpacity = interpolate(localFrame, [0, enterDuration], [0, 0.144], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const left = (config.x / 100) * compositionWidth;
  const top = (config.y / 100) * compositionHeight;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: cardWidth,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        borderRadius: 15,
        overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0, 0, 0, ${shadowOpacity})`,
        border: 'none',
        backgroundColor: '#fff',
      }}
    >
      <Img src={config.src} style={{ width: '100%', display: 'block', borderRadius: 15 }} />
    </div>
  );
};

// ============================================================
// WORD-BY-WORD TEXT COMPONENT
// ============================================================

const WordByWord: React.FC<{
  text: string;
  startFrame: number;
  frameDelta: number;
  frame: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
}> = ({ text, startFrame, frameDelta, frame, fontSize, fontFamily, fontWeight, color }) => {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: `0 ${fontSize * 0.3}px` }}>
      {words.map((word, i) => {
        const wordStart = startFrame + i * frameDelta;
        const localFrame = frame - wordStart;
        const revealDuration = 10;
        const opacity = interpolate(localFrame, [0, revealDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
        const translateY = interpolate(localFrame, [0, revealDuration], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
        return (
          <span
            key={i}
            style={{
              fontSize,
              fontFamily,
              fontWeight,
              color,
              opacity,
              transform: `translateY(${translateY}px)`,
              display: 'inline-block',
              whiteSpace: 'pre',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================
// LINE-AS-UNIT TEXT COMPONENT
// ============================================================

const LineReveal: React.FC<{
  text: string;
  startFrame: number;
  frame: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
}> = ({ text, startFrame, frame, fontSize, fontFamily, fontWeight, color }) => {
  const localFrame = frame - startFrame;
  const revealDuration = 15;
  const opacity = interpolate(localFrame, [0, revealDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const translateY = interpolate(localFrame, [0, revealDuration], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div
      style={{
        fontSize,
        fontFamily,
        fontWeight,
        color,
        opacity,
        transform: `translateY(${translateY}px)`,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

// ============================================================
// MAIN COMPOSITION
// ============================================================

export const HeroTextImageComposition: React.FC<HeroTextImageProps> = ({
  line1,
  line2,
  images,
  fontFamily = 'Inter, system-ui, sans-serif',
  line1FontSize = 72,
  line2FontSize = 72,
  fontWeight = 700,
  textColor = '#1a1a1a',
  backgroundColor = '#ffffff',
  enterDurationFrames = 35,
  holdDurationFrames = 30,
  zoomOutDurationFrames = 35,
  maxZoomScale = 8,
  zoomLeadFrames = 12,
  zoomStaggerFrames = 1,
  zoomGroupSize = 2,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const imageEnterStart = 0;
  const textLine1Start = 10;
  const textLine2Start = 20;
  const holdStart = enterDurationFrames;
  const zoomStart = holdStart + holdDurationFrames;

  // Text zoom starts 1 frame after the last image's zoom start; same duration and easing
  const lastGroupIndex = Math.floor((images.length - 1) / zoomGroupSize);
  const lastImageZoomStart = zoomStart - zoomLeadFrames + lastGroupIndex * zoomStaggerFrames;
  const textZoomStart = lastImageZoomStart + 1;
  const textZoomEnd = textZoomStart + zoomOutDurationFrames;

  const zoomProgress = interpolate(frame, [textZoomStart, textZoomEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const zoomScale = interpolate(zoomProgress, [0, 1], [1, maxZoomScale]);
  const zoomOpacity = interpolate(frame, [textZoomEnd - 15, textZoomEnd], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
      {images.map((img, i) => {
        const groupIndex = Math.floor(i / zoomGroupSize);
        const imageZoomStart = zoomStart - zoomLeadFrames + groupIndex * zoomStaggerFrames;
        const imageZoomEnd = imageZoomStart + zoomOutDurationFrames;
        const imageZoomProgress = interpolate(frame, [imageZoomStart, imageZoomEnd], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
        const imageZoomScale = interpolate(imageZoomProgress, [0, 1], [1, maxZoomScale]);
        const imageZoomOpacity = interpolate(frame, [imageZoomEnd - 15, imageZoomEnd], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${imageZoomScale})`,
              transformOrigin: 'center center',
              opacity: imageZoomOpacity,
            }}
          >
            <FloatingImage
              config={img}
              frame={frame}
              enterStart={imageEnterStart}
              compositionWidth={width}
              compositionHeight={height}
              zoomProgress={imageZoomProgress}
            />
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${zoomScale})`,
          transformOrigin: 'center center',
          opacity: zoomOpacity,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <LineReveal
          text={line1}
          startFrame={textLine1Start}
          frame={frame}
          fontSize={line1FontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          color={textColor}
        />
        <WordByWord
          text={line2}
          startFrame={textLine2Start}
          frameDelta={4}
          frame={frame}
          fontSize={line1FontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          color={textColor}
        />
      </div>
    </AbsoluteFill>
  );
};

export default HeroTextImageComposition;
```

## Registering in Root

```tsx
import { Composition, staticFile } from 'remotion';
import { HeroTextImageComposition } from './HeroTextImage';

<Composition
  id="HeroTextImage"
  component={HeroTextImageComposition}
  durationInFrames={240}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{
    line1: 'The new presentation tool that',
    line2: 'creates apple grade slides',
    fontFamily: 'Inter, system-ui, sans-serif',
    line1FontSize: 72,
    line2FontSize: 72,
    fontWeight: 700,
    textColor: '#1a1a1a',
    backgroundColor: '#FFF8E7',
    enterDurationFrames: 35,
    holdDurationFrames: 30,
    zoomOutDurationFrames: 35,
    maxZoomScale: 8,
    zoomLeadFrames: 12,
    zoomStaggerFrames: 1,
    zoomGroupSize: 2,
    images: [
      { src: staticFile('frame 1-1.png'), x: 9.27, y: -6.94, rotation: 6, scale: 1.0, enterDelay: 0, cardWidth: 487 },
      { src: staticFile('frame 1-2.png'), x: -10.73, y: 26.02, rotation: -2, scale: 1.0, enterDelay: 3, cardWidth: 494 },
      { src: staticFile('frame 1-3.png'), x: 77.8, y: 10.8, rotation: -6, scale: 1.0, enterDelay: 6, cardWidth: 537 },
      { src: staticFile('frame 1-4.png'), x: 62.2, y: -6.4, rotation: 5, scale: 1.0, enterDelay: 4, cardWidth: 554 },
      { src: staticFile('frame 1-5 copy.png'), x: 3.4375, y: 76.296, rotation: -7, scale: 1.0, enterDelay: 5, cardWidth: 500 },
      { src: staticFile('frame 1-5.png'), x: 51.56, y: 83.98, rotation: -1, scale: 1.0, enterDelay: 8, cardWidth: 510 },
      { src: staticFile('frame 1-6.png'), x: 85, y: 68, rotation: 3, scale: 1.0, enterDelay: 7, cardWidth: 505 },
    ],
  }}
/>
```

## Summary of current behavior

- **Font**: Both lines use `line1FontSize` and `fontWeight` (same style and size).
- **Cards**: `border-radius: 15`, no border, shadow opacity 0.144; enter uses `Easing.inOut(Easing.cubic)`.
- **Exit**: Images zoom in groups (`zoomGroupSize`), 1 frame between groups (`zoomStaggerFrames`); text zoom starts at `lastImageZoomStart + 1` with same duration and cubic easing. All zoom/fade use `Easing.inOut(Easing.cubic)`.

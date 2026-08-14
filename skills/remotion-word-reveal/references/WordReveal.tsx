/**
 * WordReveal.tsx — Remotion component for centered word-by-word sentence reveal.
 *
 * Uses canvas ctx.measureText() for reliable, synchronous measurement (no DOM layout).
 * Each word springs in at center; existing words shift left so the sentence stays centered.
 *
 * Usage:
 *   <WordReveal text="Average is the new worst." fontSize={80} framesPerWord={18} />
 */

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WordRevealProps {
  /** The sentence to animate. Split on spaces. */
  text: string;

  // Timing
  /** Frame on which the first word appears. Default: 0 */
  startFrame?: number;
  /** Frames between each successive word appearing. Default: 18 */
  framesPerWord?: number;
  /** Spring duration (frames) for each word's entrance pop-in. Default: 14 */
  enterDuration?: number;
  /** Spring duration (frames) for the leftward shift when a new word joins. Default: 10 */
  shiftDuration?: number;

  // Typography
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  letterSpacing?: number;

  // Layout — defaults to comp center
  centerX?: number;
  centerY?: number;
}

// ---------------------------------------------------------------------------
// Canvas measurement — synchronous, no DOM layout (reliable in Remotion)
// ---------------------------------------------------------------------------

function measureWordsWithCanvas(
  words: string[],
  fontSize: number,
  fontWeight: number | string,
  fontFamily: string
): { wordOffsets: number[]; totalWidth: number; spaceWidth: number; wordWidths: number[] } {
  if (words.length === 0) {
    return { wordOffsets: [], totalWidth: 0, spaceWidth: 0, wordWidths: [] };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { wordOffsets: [], totalWidth: 0, spaceWidth: 0, wordWidths: [] };
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const spaceWidth = ctx.measureText(' ').width;
  const wordWidths = words.map((w) => ctx.measureText(w).width);

  const wordOffsets: number[] = [];
  let x = 0;
  for (let i = 0; i < words.length; i++) {
    wordOffsets.push(x);
    x += wordWidths[i] + (i < words.length - 1 ? spaceWidth : 0);
  }
  const totalWidth = wordOffsets[words.length - 1]! + wordWidths[words.length - 1]!;

  return { wordOffsets, totalWidth, spaceWidth, wordWidths };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  startFrame = 0,
  framesPerWord = 18,
  enterDuration = 14,
  shiftDuration = 10,
  fontSize = 80,
  fontWeight = 700,
  fontFamily = 'Inter, system-ui, sans-serif',
  color = '#1a1a1a',
  letterSpacing = 0,
  centerX: centerXProp,
  centerY: centerYProp,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const centerX = centerXProp ?? width / 2;
  const centerY = centerYProp ?? height / 2;

  const words = useMemo(() => text.split(' ').filter(Boolean), [text]);

  const { wordOffsets, totalWidth, spaceWidth, wordWidths } = useMemo(
    () => measureWordsWithCanvas(words, fontSize, fontWeight, fontFamily),
    [words, fontSize, fontWeight, fontFamily]
  );

  const revealFrames = words.map((_, i) => startFrame + i * framesPerWord);
  const numRevealed = revealFrames.filter((rf) => frame >= rf).length;

  const measuredReady = wordOffsets.length === words.length;

  const renderedWords = words.map((word, i) => {
    if (!measuredReady) return null;

    const revealFrame = revealFrames[i];
    const isRevealed = frame >= revealFrame;

    const enterProgress = isRevealed
      ? spring({
          frame: Math.max(0, frame - revealFrame),
          fps,
          config: { damping: 180, stiffness: 700, mass: 1 },
          durationInFrames: enterDuration,
        })
      : 0;

    const finalX = wordOffsets[i] ?? 0;

    const lastVisibleIdx = numRevealed - 1;
    const partialWidth =
      lastVisibleIdx >= 0 && wordWidths[lastVisibleIdx] !== undefined
        ? (wordOffsets[lastVisibleIdx] ?? 0) + (wordWidths[lastVisibleIdx] ?? 0)
        : 0;

    const sentenceLeft = centerX - partialWidth / 2;
    const targetScreenX = sentenceLeft + finalX;

    const latestRevealFrame = numRevealed > 0 ? revealFrames[numRevealed - 1] : startFrame;

    const prevNumRevealed = numRevealed - 1;
    const prevLastIdx = prevNumRevealed - 1;
    const prevPartialWidth =
      prevLastIdx >= 0 && wordWidths[prevLastIdx] !== undefined
        ? (wordOffsets[prevLastIdx] ?? 0) + (wordWidths[prevLastIdx] ?? 0)
        : 0;
    const prevSentenceLeft = centerX - prevPartialWidth / 2;
    const prevScreenX = prevSentenceLeft + finalX;

    const shiftProgress =
      isRevealed && i < numRevealed
        ? spring({
            frame: Math.max(0, frame - latestRevealFrame),
            fps,
            config: { damping: 200, stiffness: 600, mass: 1 },
            durationInFrames: shiftDuration,
          })
        : 0;

    const screenX = isRevealed
      ? prevScreenX + (targetScreenX - prevScreenX) * shiftProgress
      : targetScreenX;

    const scale = 0.7 + 0.3 * enterProgress;
    const opacity = enterProgress;

    return (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: screenX,
          top: '50%',
          transform: `translateY(-50%) scale(${scale})`,
          transformOrigin: 'left center',
          opacity,
          whiteSpace: 'nowrap',
          fontSize,
          fontWeight,
          fontFamily,
          color,
          letterSpacing,
          lineHeight: 1,
        }}
      >
        {word}
      </span>
    );
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {measuredReady ? renderedWords : null}
    </div>
  );
};

export default WordReveal;

import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

export interface MobileClickProps {
  /** X position (e.g. '65.9%', 500, or '50%'). Centered on this point. */
  x?: number | string;
  /** Alias for x. */
  left?: number | string;
  /** Y position (e.g. '71.7%', 300, or '50%'). Centered on this point. */
  y?: number | string;
  /** Alias for y. */
  top?: number | string;
  /** Diameter of the settled circle in pixels. Defaults to 54. */
  size?: number;
  /** Frame at which the tap ripple starts (defaults to 0). */
  startFrame?: number;
  /** Total duration of the tap animation in frames (defaults to 10). */
  durationInFrames?: number;
  /** Explicit frame override (defaults to useCurrentFrame()). */
  frame?: number;
  /** Stroke border width in px. Defaults to 5px (scaled with size). */
  borderWidth?: number;
  /** Custom fill color (defaults to 'rgba(97, 3, 237, 0.35)'). */
  fillColor?: string;
  /** Custom stroke border color (defaults to 'rgba(97, 3, 237, 0.80)'). */
  borderColor?: string;
  /** Additional custom inline styles. */
  style?: React.CSSProperties;
  /** Optional class name. */
  className?: string;
  /** zIndex for overlay positioning (defaults to 5). */
  zIndex?: number;
}

/**
 * MobileClick — Reusable tap/ripple animation circle for mobile screens.
 *
 * Starts wide and invisible, shrinks rapidly as it fades up to full opacity and hits
 * its smallest size, bounces out slightly while releasing opacity, then disappears.
 */
export const MobileClick: React.FC<MobileClickProps> = ({
  x,
  left,
  y,
  top,
  size = 54,
  startFrame = 0,
  durationInFrames = 10,
  frame: propFrame,
  borderWidth,
  fillColor = 'rgba(97, 3, 237, 0.35)',
  borderColor = 'rgba(97, 3, 237, 0.80)',
  style,
  className,
  zIndex = 5,
}) => {
  const currentFrame = useCurrentFrame();
  const frame = propFrame ?? currentFrame;

  const posX = x ?? left ?? '50%';
  const posY = y ?? top ?? '50%';
  const computedBorderWidth = borderWidth ?? Math.round(size * (7 / 72));

  const endFrame = startFrame + durationInFrames;

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  // Animation timeline relative to startFrame
  const relFrame = frame - startFrame;
  const phase1End = durationInFrames * 0.55;
  const phase2End = durationInFrames * 0.8;

  const tapIn = interpolate(relFrame, [0, phase1End], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const tapSettle = interpolate(relFrame, [phase1End, phase2End], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const tapRelease = interpolate(relFrame, [phase2End, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });

  const tapScale =
    interpolate(tapIn, [0, 1], [1.55, 0.9]) +
    interpolate(tapSettle, [0, 1], [0, 0.1]) +
    interpolate(tapRelease, [0, 1], [0, 0.06]);

  const tapOpacity =
    interpolate(tapIn, [0, 1], [0, 1]) +
    interpolate(tapSettle, [0, 1], [0, -0.15]) +
    interpolate(tapRelease, [0, 1], [0, -0.85]);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        width: size,
        height: size,
        boxSizing: 'border-box',
        borderRadius: '50%',
        backgroundColor: fillColor,
        border: `${computedBorderWidth}px solid ${borderColor}`,
        transform: `translate(-50%, -50%) scale(${tapScale})`,
        transformOrigin: 'center center',
        opacity: tapOpacity,
        zIndex,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};

export const WorkvivoMobileClick = MobileClick;

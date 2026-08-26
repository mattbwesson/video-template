import React, { useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";

export interface DataMatrixFieldProps {
  /** Local frame within the scene */
  startFrame?: number; // 98 (global 3486)
  peakFrame?: number; // 120 (global 3508)
  endFrame?: number; // 144 (global 3532)
  width?: number;
  height?: number;
}

// Fast deterministic pseudo-random hash
function hash2D(x: number, y: number): number {
  const sin = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return sin - Math.floor(sin);
}

export const DataMatrixField: React.FC<DataMatrixFieldProps> = ({
  startFrame = 98,
  peakFrame = 120,
  endFrame = 144,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (frame < startFrame || frame > endFrame) return;

    const cx = width / 2;
    const cy = 520;
    const maxRadius = 1200;
    const gridSpacing = 28; // High-density ambient coordinate matrix

    const igniteDuration = peakFrame - startFrame; // ~22 frames
    const decayDuration = endFrame - peakFrame; // ~24 frames

    // Smooth sinusoidal / cubic easing envelope across the whole field [0 -> 1 -> 0]
    const rawProgress =
      frame <= peakFrame
        ? (frame - startFrame) / igniteDuration
        : 1 - (frame - peakFrame) / decayDuration;

    // Smooth cubic ease for organic in-and-out fade
    const globalProgress = Math.max(0, Math.min(1, rawProgress * rawProgress * (3 - 2 * rawProgress)));

    if (globalProgress <= 0.001) return;

    // 1. Ambient Volumetric Atmospheric Glow
    const ambientGlow = ctx.createRadialGradient(cx, cy, 80, cx, cy, 850);
    ambientGlow.addColorStop(0, `rgba(56, 189, 248, ${0.14 * globalProgress})`);
    ambientGlow.addColorStop(0.35, `rgba(99, 102, 241, ${0.09 * globalProgress})`);
    ambientGlow.addColorStop(0.7, `rgba(139, 92, 246, ${0.03 * globalProgress})`);
    ambientGlow.addColorStop(1, "rgba(1, 3, 32, 0)");
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, width, height);

    const cols = Math.ceil(width / gridSpacing) + 2;
    const rows = Math.ceil(height / gridSpacing) + 2;
    const offsetX = (width - (cols - 1) * gridSpacing) / 2;
    const offsetY = (height - (rows - 1) * gridSpacing) / 2;

    const activeNodes: { x: number; y: number; alpha: number; isMajor: boolean; c: number; r: number }[] = [];

    // 2. Render Ambient Matrix Points
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = offsetX + c * gridSpacing;
        const y = offsetY + r * gridSpacing;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const h1 = hash2D(c, r);

        // Smooth continuous data wave ripple across the field (no harsh ring edge)
        const ripple = Math.sin(dist * 0.02 - (frame - startFrame) * 0.25 + h1 * Math.PI * 2) * 0.2;
        const radialVignette = Math.max(0, 1 - Math.pow(dist / maxRadius, 1.7));
        const dotAlpha = (0.42 + h1 * 0.35 + ripple) * radialVignette * globalProgress;

        if (dotAlpha <= 0.02) continue;

        // Major / Secondary data nodes
        const isMajorNode = h1 > 0.94;
        const isSecondaryNode = !isMajorNode && h1 > 0.86;

        if ((isMajorNode || isSecondaryNode) && dotAlpha > 0.28) {
          activeNodes.push({ x, y, alpha: dotAlpha, isMajor: isMajorNode, c, r });
        }

        const baseRadius = isMajorNode ? 2.2 : isSecondaryNode ? 1.6 : 1.1;

        // Halo glow for major data anchors
        if (isMajorNode) {
          ctx.beginPath();
          ctx.arc(x, y, baseRadius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(129, 140, 248, ${dotAlpha * 0.35})`;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        if (isMajorNode) {
          ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(1, dotAlpha * 1.25)})`;
        } else if (isSecondaryNode) {
          ctx.fillStyle = `rgba(167, 139, 250, ${dotAlpha * 0.95})`;
        } else {
          ctx.fillStyle = `rgba(56, 189, 248, ${dotAlpha * 0.75})`;
        }
        ctx.fill();

        // Precision crosshair reticle on major nodes
        if (isMajorNode && dotAlpha > 0.4) {
          const arm = 4;
          ctx.strokeStyle = `rgba(167, 139, 250, ${dotAlpha * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
          ctx.stroke();
        }
      }
    }

    // 3. Grid-Aligned Data Traces & Flowing Light Packets
    const maxLineDist = gridSpacing * 3.2;
    ctx.lineWidth = 0.8;

    for (let i = 0; i < activeNodes.length; i++) {
      const n1 = activeNodes[i];
      for (let j = i + 1; j < activeNodes.length; j++) {
        const n2 = activeNodes[j];
        const dc = Math.abs(n1.c - n2.c);
        const dr = Math.abs(n1.r - n2.r);

        // Grid-aligned connections (horizontal / vertical / diagonal)
        const isGridAligned = (dc === 0 && dr <= 3) || (dr === 0 && dc <= 3) || (dc === dr && dc <= 2);
        if (!isGridAligned) continue;

        const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (d < maxLineDist) {
          const lineAlpha = (1 - d / maxLineDist) * Math.min(n1.alpha, n2.alpha) * 0.32 * globalProgress;
          if (lineAlpha > 0.03) {
            ctx.strokeStyle = `rgba(129, 140, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // High-speed data packet traveling along trace
            const speed = 0.09;
            const tPacket = (frame * speed + hash2D(n1.c, n2.r)) % 1;
            const px = n1.x + (n2.x - n1.x) * tPacket;
            const py = n1.y + (n2.y - n1.y) * tPacket;
            ctx.fillStyle = `rgba(255, 255, 255, ${lineAlpha * 2.4})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }, [frame, startFrame, peakFrame, endFrame, width, height]);

  if (frame < startFrame || frame > endFrame) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

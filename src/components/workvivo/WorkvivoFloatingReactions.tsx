import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * The reaction burst on Brian Niccol's post: emojis launch from the bottom of the image
 * and float up over it, and each one ticks its pill — and the footer total — up by one
 * on the way. Everything is a pure function of the frame; the spawn table below is
 * hand-authored rather than random so renders are deterministic.
 *
 * Frame numbers are in the host Sequence's frame-space. The fullscreen scene starts at
 * global 888, so its local 149 is global 1037.
 */

const RISE_EASE = Easing.bezier(0.25, 0.6, 0.4, 1);
const POP_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);

/** Frames after a spawn before its count ticks — long enough to read as cause and effect. */
const COUNT_DELAY = 7;

/**
 * How far below the image's bottom edge each emoji launches, in component px. The desktop
 * is drawn at ~1.377x and the image bottom lands ~137px above the frame edge, so ~100
 * clears the screen; 130 gives margin, and every `rise` below is measured from there.
 */
const LAUNCH_OFFSET = 130;

/** Emojis are kept inside the post's left third, so x never exceeds this. */
const MAX_X = 0.3;

export type ReactionKind = "heart" | "thumb" | "clap";

export const REACTION_GLYPH: Record<ReactionKind, string> = {
  heart: "❤️",
  thumb: "👍",
  clap: "👏",
};

interface Spawn {
  kind: ReactionKind;
  /** Frames after the burst starts. */
  at: number;
  /** Launch point across the image, 0..MAX_X. */
  x: number;
  size: number;
  /** Sideways sway amplitude, px. */
  drift: number;
  /** Climb height from the launch point, px. Anything over ~380 clears the image top. */
  rise: number;
  /** Frames to complete the climb. */
  life: number;
}

// 5 hearts + 5 thumbs + 4 claps = 14 ticks, taking the footer from 17 to 31. The last
// spawn is at 24 so its count still lands (at +COUNT_DELAY) before the scene cuts to the
// quote card on local 184 — the emojis themselves are meant to still be in flight then.
const SPAWNS: Spawn[] = [
  { kind: "heart", at: 0, x: 0.06, size: 44, drift: 14, rise: 470, life: 40 },
  { kind: "thumb", at: 2, x: 0.22, size: 38, drift: -12, rise: 430, life: 38 },
  { kind: "clap", at: 4, x: 0.13, size: 40, drift: 10, rise: 450, life: 39 },
  { kind: "heart", at: 6, x: 0.28, size: 36, drift: -14, rise: 410, life: 37 },
  { kind: "thumb", at: 8, x: 0.03, size: 42, drift: 12, rise: 460, life: 40 },
  { kind: "clap", at: 10, x: 0.19, size: 34, drift: -10, rise: 400, life: 36 },
  { kind: "heart", at: 11, x: 0.1, size: 46, drift: 16, rise: 480, life: 41 },
  { kind: "thumb", at: 13, x: 0.25, size: 36, drift: -13, rise: 420, life: 37 },
  { kind: "clap", at: 15, x: 0.05, size: 38, drift: 11, rise: 440, life: 38 },
  { kind: "heart", at: 17, x: 0.3, size: 40, drift: -15, rise: 455, life: 39 },
  { kind: "thumb", at: 18, x: 0.16, size: 34, drift: 9, rise: 405, life: 36 },
  { kind: "clap", at: 20, x: 0.24, size: 42, drift: -12, rise: 465, life: 40 },
  { kind: "heart", at: 22, x: 0.08, size: 36, drift: 13, rise: 425, life: 37 },
  { kind: "thumb", at: 24, x: 0.2, size: 44, drift: -14, rise: 475, life: 41 },
];

const BASE: Record<ReactionKind, number> = { heart: 13, thumb: 12, clap: 10 };
const BASE_TOTAL = 17;

export interface ReactionCounts {
  counts: Record<ReactionKind, number>;
  total: number;
  /** Scale bump applied to a pill for a few frames after its count changes. */
  pop: Record<ReactionKind, number>;
}

/**
 * Counts as of `frame`, plus the pill pop. `startFrame` null = the burst never runs, so
 * the post renders at its resting numbers.
 */
export const useReactionCounts = (startFrame: number | null): ReactionCounts => {
  const frame = useCurrentFrame();
  const elapsed = startFrame === null ? -Infinity : frame - startFrame;

  const counts = { ...BASE };
  const lastTick: Record<ReactionKind, number | null> = {
    heart: null,
    thumb: null,
    clap: null,
  };

  for (const s of SPAWNS) {
    const tickAt = s.at + COUNT_DELAY;
    if (elapsed >= tickAt) {
      counts[s.kind] += 1;
      lastTick[s.kind] = tickAt;
    }
  }

  const popOf = (k: ReactionKind) =>
    lastTick[k] === null
      ? 1
      : interpolate(elapsed - (lastTick[k] as number), [0, 3, 8], [1, 1.16, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: POP_EASE,
        });

  return {
    counts,
    total: BASE_TOTAL + (counts.heart - BASE.heart) + (counts.thumb - BASE.thumb) + (counts.clap - BASE.clap),
    pop: { heart: popOf("heart"), thumb: popOf("thumb"), clap: popOf("clap") },
  };
};

/**
 * The floating layer. Absolutely positioned, so it must sit inside the image's
 * position:relative wrapper; it deliberately overflows the image upward.
 */
export const WorkvivoFloatingReactions: React.FC<{ startFrame: number | null }> = ({
  startFrame,
}) => {
  const frame = useCurrentFrame();
  if (startFrame === null) return null;
  const elapsed = frame - startFrame;

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 0,
        height: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {SPAWNS.map((s, i) => {
        const t = (elapsed - s.at) / s.life;
        if (t < 0 || t > 1) return null;

        // Launches off the bottom of the frame and climbs from there.
        const y = LAUNCH_OFFSET - s.rise * RISE_EASE(t);
        // One broad sway plus a faster wobble, so no two read as moving in lockstep.
        const x = s.drift * Math.sin(t * Math.PI) + s.drift * 0.35 * Math.sin(t * Math.PI * 3);
        const rotate = s.drift * 0.2 * Math.sin(t * Math.PI * 2);

        // Fully opaque almost immediately — the ramp happens while it is still below the
        // frame edge, so a slow fade-in would simply be invisible.
        const opacity = interpolate(t, [0, 0.06, 0.7, 1], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Gentle shrink on the way up rather than a pop — the pop would fire off-screen.
        const scale = interpolate(t, [0, 1], [1, 0.86]);

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${Math.min(s.x, MAX_X) * 100}%`,
              bottom: 0,
              fontSize: s.size,
              lineHeight: 1,
              opacity,
              transform: `translate(-50%, ${y}px) translateX(${x}px) scale(${scale}) rotate(${rotate}deg)`,
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.22))",
            }}
          >
            {REACTION_GLYPH[s.kind]}
          </span>
        );
      })}
    </div>
  );
};

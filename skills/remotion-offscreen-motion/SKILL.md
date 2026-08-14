---
name: remotion-offscreen-motion
description: >
  Guides Remotion enter/exit motion: elements entering from fully off-screen with smooth
  cubic ease-in-out, and exiting with continuous acceleration (ease-in cubic) until fully
  off-screen; uses interpolate, composition dimensions for travel distance, and Easing from
  remotion. Use when animating panels or layers on/off screen, matching third-sequence
  transitions, zoom-style UI cards, or when the user asks for polished motion, maximum
  travel, or "accelerate off" / "ease into place" behavior.
---

# Remotion: off-screen enter & exit motion

## Principles

| Direction | Feel | Typical easing | Notes |
|-----------|------|----------------|--------|
| **Enter** (into frame) | Polished, professional | **`Easing.inOut(Easing.cubic)`** | Smooth at start **and** end — avoids a harsh stop. |
| **Exit** (out of frame) | Speeds up as it leaves | **`Easing.in(Easing.cubic)`** | Continuous **acceleration** — do **not** use `inOut` on exit or the motion will slow at the end. |

Avoid **`Easing.inOut`** for **exit** if the brief is “accelerate off” or “lift away.” Use **`in`** so the curve keeps picking up speed.

## Travel distance (maximum movement)

Small offsets (e.g. 10–100px) read as a nudge, not an entrance. **Start and end positions must clear the viewport.**

- **Vertically centered** flex (common): initial `translateY` should be at least  
  **`compositionHeight * 0.5 + elementHeight * 0.5 + padding`**  
  so the whole element sits **below** (or above) the frame before the animation.
- Alternatively **`translateY(compositionHeight)`** or similar full-frame distance guarantees **all the way off screen**.
- Use **`useVideoConfig()`** for `width` / `height`; derive pixel travel from composition size, not magic constants.

## Enter pattern (`useCurrentFrame` + `interpolate`)

```tsx
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { height: compositionHeight } = useVideoConfig();
const durationFrames = Math.round(1.15 * fps); // or your duration

const startY = compositionHeight * 0.5 + elementHeight * 0.5 + Math.round(compositionHeight * 0.04);

const translateY = interpolate(
  frame,
  [enterStartFrame, enterStartFrame + durationFrames],
  [startY, 0],
  {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  },
);

const opacity = interpolate(
  frame,
  [enterStartFrame, enterStartFrame + durationFrames],
  [0, 1],
  {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  },
);
```

- Optional **delay**: keep `enterStartFrame > 0` so the layer holds below the frame, then animate (e.g. start at frame 35).
- **Staggered children** (rows, list items): finish secondary motion when the **parent** motion completes; compute stagger so the last item lands on the same end frame as the container.

## Exit pattern (match third-sequence style)

Align with **`THIRD_TO_LIGHT_ELEMENT_EXIT_SEC`**-style timing if the cut should match an existing scene:

```tsx
const exitFrames = Math.round(1.15 * fps);

const translateY = interpolate(
  frame,
  [exitStartFrame, exitStartFrame + exitFrames],
  [0, -startY], // or negative enough to clear top
  {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic), // accelerate continuously
  },
);
```

Use **negative** `translateY` to move **up** off the top; **positive** to move **down** off the bottom.

## Checklist

- [ ] Enter: **ease-in-out cubic** on position and opacity (or the same curve on both).
- [ ] Enter: start position is **fully** off-screen (distance from `useVideoConfig`, not ~10px).
- [ ] Exit: **ease-in cubic** (accelerate), not ease-in-out.
- [ ] Exit: end position is **fully** off-screen.
- [ ] Child stagger **ends** when the parent motion **ends** if you need a single “hero” timing.

## Anti-patterns

- **Exit with `Easing.inOut(Easing.cubic)`** when the goal is a lift that **never slows** before leaving.
- **Enter with `Easing.in(Easing.cubic)` only** — often feels like it **crashes** into place; prefer **`inOut`** for a soft landing unless art direction says otherwise.
- **Tiny `translateY`** — reads as a bug, not design.

Related: **remotion-import-jsx**, **remotion-composition** (this repo’s Knowledge Base / zoom card wiring).

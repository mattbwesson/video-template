---
name: remotion-word-reveal
description: >
  Generates Remotion React components that animate text word-by-word with a
  centered-sentence reveal effect. Each word animates into the center of the
  screen, then the existing words shift left together so the whole growing
  sentence stays centered. Words appear with a smooth spring-based entrance
  and perfectly maintain typographic spacing throughout. Use this skill
  whenever the user asks for: word-by-word text animation in Remotion, 
  centered sentence reveal, sequential word entrance animations, kinetic 
  typography components, or "Average is the new worst"-style text animations.
  Trigger even if the user just says "animate a sentence word by word" or
  "reveal text one word at a time".
---

# Remotion Word Reveal Animation Skill

## What This Produces

A reusable Remotion React component (`WordReveal`) that animates a sentence
word by word. Each new word "pops" into the center of the frame using a spring
animation, while all previously revealed words shift left in unison so the
entire growing sentence stays horizontally centered at all times. Words are
spaced exactly as they would appear in normal typeset text.

## Core Animation Mechanic (understand this first)

**Measuring:** Use **canvas `ctx.measureText()`** — synchronous and layout-independent.
Do not use DOM measurement (`getBoundingClientRect`): in Remotion, frames can
render before layout is complete, so DOM-measured positions are unreliable and
words can all measure at 0 and stack. Canvas measurement runs inside `useMemo`
so word widths and space width are available on frame 1.

1. **Canvas measurement** — In `useMemo`, create an offscreen canvas, set `ctx.font`
   to match the component's typography, then: measure each word with
   `ctx.measureText(word).width`, and measure space with `ctx.measureText(' ').width`.
   Compute cumulative x offsets and total sentence width from these. No DOM, no
   `useEffect`/`useState` for measuring.
2. **Animated pass** — Same as before: for each frame, which words are revealed;
   interpolate each revealed word from center to its final x; all words shift
   left together as new words join. Position math is unchanged — only the
   inputs (offsets, totalWidth, spaceWidth) now come from canvas.

Space width must be **measured** via `ctx.measureText(' ')`, not approximated
(e.g. not `0.28 * fontSize`), so spacing matches the actual font.

## Component API

```tsx
<WordReveal
  text="Average is the new worst."
  // --- Timing ---
  startFrame={0}           // frame when first word appears
  framesPerWord={18}       // frames between each new word appearing
  enterDuration={12}       // spring duration for each word's entrance (frames)
  shiftDuration={10}       // spring duration for the leftward shift (frames)
  // --- Typography ---
  fontSize={80}            // px
  fontWeight={700}
  fontFamily="Inter, sans-serif"
  color="#1a1a1a"
  // --- Layout ---
  centerX={960}            // horizontal center of frame (default: half of comp width)
  centerY={540}            // vertical center (default: half of comp height)
/>
```

All props except `text` are optional and have sensible defaults.

## Full Implementation

Read the reference implementation at [references/WordReveal.tsx](references/WordReveal.tsx).  
Copy it into the user's Remotion project (e.g. `src/components/WordReveal.tsx`).

Then register and use it:

```tsx
// src/MyComposition.tsx
import { WordReveal } from './components/WordReveal';
import { useVideoConfig } from 'remotion';

export const MyComposition = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: 'white' }}>
      <WordReveal
        text="Average is the new worst."
        centerX={width / 2}
        centerY={height / 2}
        fontSize={80}
        framesPerWord={18}
      />
    </AbsoluteFill>
  );
};
```

## Step-by-Step Instructions for Claude

### Step 1 — Gather requirements
Ask (or infer from context) if not already provided:
- What sentence/text to animate
- Composition dimensions (default: 1920×1080)
- Desired font, size, color
- Timing feel: snappy (framesPerWord ~12), normal (~18), slow/dramatic (~24+)
- Whether they want the component only, or a full working composition

### Step 2 — Deliver the component

Always deliver `WordReveal.tsx` using the reference implementation (canvas
measurement) as the base. Customize only:
- Default prop values (font, color, timing) to match user's brand/request
- JSDoc comments if helpful

Do NOT rewrite the core animation logic unless the user explicitly asks for
a different mechanic. The measuring + spring approach is robust.

### Step 3 — Provide usage snippet

Show a minimal composition that imports and uses the component with the
user's actual text filled in.

### Step 4 — Explain timing controls (briefly)

Help the user understand just these three levers:
- `framesPerWord` — controls the pace (at 30fps: 18 = 0.6s between words)  
- `enterDuration` — how long each word's pop-in spring takes
- `shiftDuration` — how long the leftward slide takes (keep ≤ enterDuration)

## Variants / Extensions (mention if relevant)

| Variant | What to change |
|---------|---------------|
| Fade in instead of spring | Replace spring with `interpolate` for opacity |
| Word slides up from below | Add translateY spring starting below centerY |
| Staggered color | Apply different color per word index |
| Multi-line | Add line-break logic when accumulated width > maxWidth |
| Exit animation | Reverse the shift after all words shown (hold + exit) |

## Common Pitfalls to Avoid

- **Don't use DOM measurement in Remotion** — `getBoundingClientRect()` and
  measuring from rendered DOM are unreliable because frames can render before
  layout is complete; words can all measure at 0 and stack. Use **canvas
  `ctx.measureText()`** in `useMemo` so measurements are synchronous and
  available on frame 1.
- **Don't approximate space width** — use `ctx.measureText(' ').width`, not
  e.g. `0.28 * fontSize`, so spacing matches the actual font.
- **Don't use CSS `display: flex` gap** for the animated words — gaps won't
  animate correctly. Use absolute positioning from measured offsets.
- **Spring config**: Remotion's `spring()` needs `frame` relative to the
  event frame, not the global frame. Always subtract the word's reveal frame.
- **Font loading**: If using a web font, wrap in `<AbsoluteFill>` with a
  loaded font check or use `continueRender` / `delayRender`.

## Dependencies

Requires only packages already present in any Remotion project:
- `remotion` (spring, interpolate, useCurrentFrame, useVideoConfig)
- React (useRef, useState, useEffect, useMemo)

No additional installs needed.

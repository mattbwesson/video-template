---
name: remotion-knowledge-blue-bridge
description: Recreates the full-frame blurred cobalt-to-white gradient bridge and layered light/dark crossfade from KnowledgeBase ThirdKnowledgeSequence (the “blue mesh” transition before Zoom Knowledge Library). Use when matching frame ~1053 at 30fps, third-sequence outro, THIRD_TO_LIGHT timing, bridgeOpacity, or porting the post-swipe gradient from src/KnowledgeBase.tsx.
---

# Knowledge Base — blue bridge transition (≈ frame 1053 @ 30fps)

## What it is

In **`ThirdKnowledgeSequence`** (`Dark blue — post conversation`), a **multi-layer crossfade** runs at **composition time** starting **`THIRD_TO_LIGHT_TRANSITION_AT_SEC` (34s)**. At **30fps** that is **global frame 1020**; **frame 1053** sits **mid-transition** (~48% through the blend), where the **blurred blue “bridge”** layer is near peak strength—this is the gradient users often single out.

The effect is **not** CSS `@keyframes`; it is **`interpolate()` on `globalFrame`** with **`Easing.inOut(Easing.cubic)`** (and separate curves for element motion vs fade).

## Timing constants (canonical)

Defined in [`src/KnowledgeBase.tsx`](../../../src/KnowledgeBase.tsx) near the light-sequence color tokens:

| Constant | Value | Role |
|----------|--------|------|
| `THIRD_TO_LIGHT_TRANSITION_AT_SEC` | `34` | **Start** of transition in **global** composition frames → `round(34 * fps)` |
| `THIRD_TO_LIGHT_TRANSITION_DURATION_SEC` | `2.3` | Full **blend** length (light + bridge + dark fade-out) |
| `THIRD_TO_LIGHT_ELEMENT_EXIT_SEC` | `1.15` | Dark stack **lift** window (first half of total duration at default fps math) |

**Global frame** inside the third `Sequence`: `globalFrame = sequenceStartFrame + useCurrentFrame()`.

**30fps example:** start = **1020**, duration ≈ **69** frames → window **1020–1089**. **1053** ∈ that window.

## Layer stack (bottom → top)

When `globalFrame >= thirdSceneTransitionStartFrame`:

1. **zIndex 0 — Light underlay:** solid `LIGHT_BG`, diagonal wash `linear-gradient(152deg, LIGHT_BG → LIGHT_ACCENT → LIGHT_BG)` at ~0.92 opacity, plus **`AnimatedBlobField`** with `LIGHT_BLOB_SPECS` / `LIGHT_ACCENT`. Opacity driven by **`lightLayerOpacity`** from **`blendT`**.
2. **zIndex 1 — Blue bridge:** oversized **`linear-gradient(155deg, …)`** from near-black through cobalt/violet blues to white, **`filter: blur(100px)`**, **`transform: scale(1.2)`**, **`inset: '-25%'`** on the inner div. Opacity = **`bridgeOpacity`** (bell-shaped on `blendT`).
3. **zIndex 2+ — Dark stack:** meeting UI, iframe, headline, etc. **`translateY`**, **`opacity`**, and **`blur`** from **`elementT`** / **`elementFadeT`** so the stack **rises and dissolves** while the bridge reads as a colour wash underneath.

## Driving curves

- **`blendT`:** `interpolate(globalFrame, [start, start + totalFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) })` — master progress for **light** and **bridge**.
- **`elementT`:** same start, end at **`start + round(1.15 * fps)`**, **`Easing.in(Easing.cubic)`** — **lift** of dark layer.
- **`elementFadeT`:** same window as **`blendT`**, **`Easing.inOut(Easing.cubic)`** — opacity + blur of dark stack.
- **`bridgeOpacity`:** `interpolate(blendT, [0, 0.12, 0.38, 0.65, 1], [0, 0.82, 0.95, 0.72, 0], { clamp })` — peaks mid-blend then tapers.

## Porting checklist

1. Use **`globalFrame`** (not local sequence frame) for all transition interpolations.
2. Mount **three** full-frame layers in order: light (+ blobs) → bridge → existing dark content with higher z-index.
3. Keep blobs on **`frame`** (local) or a consistent time base as in source—bridge uses **`blendT`** only.
4. Do **not** replace with Tailwind animate; keep **`interpolate`** + Remotion frame.

## Additional resources

- Exact gradient stops and snippet: [reference.md](reference.md)
- Bokeh specs for the light underlay: [remotion-zoom-backgrounds](../remotion-zoom-backgrounds/SKILL.md) (`LIGHT_BLOB_SPECS`, `LIGHT_ACCENT`)

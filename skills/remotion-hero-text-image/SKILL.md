---
name: remotion-hero-text-image
description: >
  Creates Remotion compositions with hero text and floating slide/card images:
  images enter with staggered fade+translate, line 1 reveals as a unit, line 2
  word-by-word, then a hold, then staggered zoom toward camera (images first in
  groups, text 1 frame after last image). Use when the user asks for Remotion
  hero section, text reveal with images, slide showcase, floating cards, "toward
  camera" zoom, Gamma-style hero, or presentation showcase animation.
---

# Remotion Hero Text + Image

Centered hero text (two lines) plus distributed slide/card images. Four phases:
image enter → text enter → hold → staggered zoom out toward camera.

## Animation Phases

| Phase | Description |
|-------|-------------|
| **Image Enter** | Images fade in and translate up with staggered delays. Drop shadow (opacity 0.144), no stroke, `border-radius: 15`. Use `Easing.inOut(Easing.cubic)` for all enter motion. |
| **Text Enter** | Line 1 fades/slides in as one unit. Line 2 reveals word-by-word with ~4 frame delays. **Both lines use the same font size and weight** (single `line1FontSize`, `fontWeight` for both). Use opacity + translateY with cubic easing. |
| **Hold** | All elements at rest. |
| **Zoom Out** | **Staggered**: Images zoom in groups (e.g. 2 per group), 1 frame between groups; first group starts `zoomLeadFrames` (e.g. 12) before text. **Text zoom starts 1 frame after the last image’s zoom start**, same duration and speed. All zoom/fade use `Easing.inOut(Easing.cubic)`. Each layer has its own scale wrapper; `transformOrigin: 'center center'`. Opacity fades to 0 in last 15 frames of each layer’s zoom. |

Use `interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })` for all motion. No CSS `transition` or `@keyframes`.

## Headless-Safe Text

Remotion renders headlessly. **Do not** use `getBoundingClientRect`, `offsetWidth`, or `useRef`/`useLayoutEffect` for text measurement — layout may not be ready. Use **canvas measurement** when you need pixel-precise word positions:

```ts
function measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight = 'normal'): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.55;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}
```

Prefer **CSS layout** (flexbox, `text-align: center`, inline-block words) when possible; use canvas only for precise word positioning.

## Architecture

- **Image zoom wrappers** — each image (or group) in its own wrapper with `scale(zoomScale_i)` and opacity; `imageZoomStart = zoomStart - zoomLeadFrames + groupIndex * zoomStaggerFrames`; `groupIndex = Math.floor(i / zoomGroupSize)`.
- **Text zoom wrapper** — single wrapper for both lines; `textZoomStart = lastImageZoomStart + 1`, `textZoomEnd = textZoomStart + zoomOutDurationFrames`; same duration as image zoom.
- **FloatingImages** — each image: absolute position (x, y as % of comp), `enterDelay`, `cardWidth` (px), fade + translateY, `box-shadow` (0.144), `border-radius: 15`, `border: 'none'`. Use Remotion `<Img>` and `staticFile()` for assets.
- **HeroText** — Line 1: single-unit reveal. Line 2: word-by-word with `frameDelta` between words. **Same fontSize and fontWeight for both lines.**

## Props

- `line1`, `line2` (strings)
- `images`: `{ src, x, y, rotation?, scale?, enterDelay?, cardWidth? }[]` — x/y as percentage of frame, cardWidth in pixels
- `fontFamily`, `line1FontSize`, `line2FontSize` (line2 uses line1FontSize when not overridden), `fontWeight`, `textColor`, `backgroundColor`
- `enterDurationFrames`, `holdDurationFrames`, `zoomOutDurationFrames`, `maxZoomScale`
- **Exit stagger**: `zoomLeadFrames` (default 12), `zoomStaggerFrames` (default 1), `zoomGroupSize` (default 2 — images in same group start zoom together)

## Image Layout Preset: “The new presentation tool that creates apple grade slides”

Seven images, positions and sizes (x/y in %, cardWidth in px). Use with 1920×1080; adjust x/y/cardWidth for other resolutions if needed.

```ts
const HERO_IMAGES = [
  { src: staticFile('frame 1-1.png'),     x: 9.27,   y: -6.94,  rotation: 6,  scale: 1.0, enterDelay: 0, cardWidth: 487 },
  { src: staticFile('frame 1-2.png'),   x: -10.73, y: 26.02,  rotation: -2, scale: 1.0, enterDelay: 3, cardWidth: 494 },
  { src: staticFile('frame 1-3.png'),   x: 77.8,   y: 10.8,   rotation: -6, scale: 1.0, enterDelay: 6, cardWidth: 537 },
  { src: staticFile('frame 1-4.png'),   x: 62.2,   y: -6.4,   rotation: 5,  scale: 1.0, enterDelay: 4, cardWidth: 554 },
  { src: staticFile('frame 1-5 copy.png'), x: 3.4375, y: 76.296, rotation: -7, scale: 1.0, enterDelay: 5, cardWidth: 500 },
  { src: staticFile('frame 1-5.png'),   x: 51.56,  y: 83.98,  rotation: -1, scale: 1.0, enterDelay: 8, cardWidth: 510 },
  { src: staticFile('frame 1-6.png'),   x: 85,     y: 68,     rotation: 3,  scale: 1.0, enterDelay: 7, cardWidth: 505 },
];
```

Example composition props for that sequence: `line1FontSize: 72`, `line2FontSize: 72` (both lines same), `fontWeight: 700`, `textColor: '#1a1a1a'`, `zoomLeadFrames: 12`, `zoomStaggerFrames: 1`, `zoomGroupSize: 2`.

## Pitfalls

- **No DOM measurement** for layout — use canvas or CSS.
- **No CSS transition/keyframes** — drive everything from `useCurrentFrame()` and `interpolate`.
- **No `window.innerWidth`** — use `useVideoConfig().width` / `height`.
- **Fonts** — load via Remotion config or `@remotion/google-fonts`; canvas measurement needs the same font.
- **Images** — use `<Img>` from Remotion and `staticFile()` so frames wait for load.
- **Zoom** — set `transformOrigin: 'center center'` on each zoom wrapper. Text zoom start = last image zoom start + 1 frame.

## Reference

Full annotated component (FloatingImage, LineReveal, WordByWord, HeroTextImageComposition, registration): [references/component-template.md](references/component-template.md).

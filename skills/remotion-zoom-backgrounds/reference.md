# Copy-paste reference (from `KnowledgeBase.tsx`)

Values are **1920×1080** design–space centers (`cx`, `cy`). Scale positions if your composition size differs.

## Tokens

```ts
const BG_COLOR = '#030305';
const BLOB_COLOR = '#071641';
const LIGHT_ACCENT = '#d0e9fc';
const LIGHT_BG = '#ffffff';
```

## `BlobSpec` shape

```ts
type BlobSpec = {
  cx: number;
  cy: number;
  size: number;
  blur: number;
  opacity: number;
  ampX: number;
  ampY: number;
  speedX: number;
  speedY: number;
  phase: number;
  brightnessPulse?: {
    boost: number;
    speed: number;
    phase: number;
    sharpness?: number;
  };
};
```

## Dark — `BLOB_SPECS` (sequence 1 bokeh)

```ts
const BLOB_SPECS: BlobSpec[] = [
  {
    cx: 1480,
    cy: 220,
    size: 920,
    blur: 150,
    opacity: 0.72,
    ampX: 140,
    ampY: 100,
    speedX: 0.38,
    speedY: 0.31,
    phase: 0,
    brightnessPulse: {boost: 0.38, speed: 0.33, phase: 0.2, sharpness: 2.5},
  },
  {
    cx: 120,
    cy: 420,
    size: 780,
    blur: 130,
    opacity: 0.5,
    ampX: 110,
    ampY: 130,
    speedX: -0.33,
    speedY: 0.26,
    phase: 1.7,
  },
  {
    cx: 960,
    cy: 640,
    size: 640,
    blur: 120,
    opacity: 0.35,
    ampX: 90,
    ampY: 70,
    speedX: 0.24,
    speedY: -0.36,
    phase: 0.9,
  },
  {
    cx: 1720,
    cy: 780,
    size: 520,
    blur: 100,
    opacity: 0.42,
    ampX: 80,
    ampY: 95,
    speedX: -0.29,
    speedY: 0.22,
    phase: 2.4,
  },
];
```

## Light — `LIGHT_BLOB_SPECS` (sequence 2 bokeh)

```ts
const LIGHT_BLOB_SPECS: BlobSpec[] = [
  {
    cx: 1520,
    cy: 280,
    size: 880,
    blur: 160,
    opacity: 0.55,
    ampX: 120,
    ampY: 95,
    speedX: 0.4,
    speedY: 0.32,
    phase: 0.4,
    brightnessPulse: {boost: 0.42, speed: 0.38, phase: 0.85, sharpness: 2.4},
  },
  {
    cx: 280,
    cy: 480,
    size: 720,
    blur: 140,
    opacity: 0.42,
    ampX: 100,
    ampY: 115,
    speedX: -0.34,
    speedY: 0.27,
    phase: 2.1,
  },
  {
    cx: 960,
    cy: 620,
    size: 900,
    blur: 180,
    opacity: 0.38,
    ampX: 85,
    ampY: 75,
    speedX: 0.26,
    speedY: -0.35,
    phase: 1.1,
  },
  {
    cx: 240,
    cy: 140,
    size: 480,
    blur: 110,
    opacity: 0.32,
    ampX: 70,
    ampY: 85,
    speedX: -0.28,
    speedY: 0.2,
    phase: 2.8,
  },
];
```

## `AnimatedBlobField` (core rendering)

See `AnimatedBlobField` in `KnowledgeBase.tsx` (~lines 2620–2670): maps `specs`, computes `ox/oy` from `sin`/`cos` of `t * speed + phase`, optional `brightnessPulse` on opacity and `filter: blur() brightness()`.

# Blue bridge — copy-paste reference

## Blurred gradient (zIndex 1)

From `ThirdKnowledgeSequence` in `KnowledgeBase.tsx`:

```tsx
<AbsoluteFill
  style={{
    zIndex: 1,
    pointerEvents: 'none',
    opacity: bridgeOpacity,
    overflow: 'hidden',
  }}
>
  <div
    style={{
      position: 'absolute',
      inset: '-25%',
      background: `linear-gradient(
        155deg,
        #060814 0%,
        #0c1d6a 15%,
        #1e3cc0 32%,
        #4a6af0 50%,
        #8aa6ff 66%,
        #bccfff 80%,
        #e8f0ff 92%,
        #ffffff 100%
      )`,
      filter: 'blur(100px)',
      transform: 'scale(1.2)',
    }}
  />
</AbsoluteFill>
```

## `bridgeOpacity` (bell on `blendT`)

```ts
const bridgeOpacity = interpolate(
  blendT,
  [0, 0.12, 0.38, 0.65, 1],
  [0, 0.82, 0.95, 0.72, 0],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
);
```

## Start frame @ 30fps

```ts
const thirdSceneTransitionStartFrame = Math.round(34 * fps); // 1020 when fps === 30
```

Frame **1053** = 33 frames after start (~0.48 through a 69-frame blend at 30fps).

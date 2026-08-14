---
name: remotion-zoom-backgrounds
description: Recreates the Knowledge-Base dark (sequence 1) and light (sequence 2) full-frame backgrounds using layered solid fills, diagonal gradients, and animated Gaussian “bokeh” blob fields driven by Remotion frame time. Use when matching CAIC Zoom-style ambient backgrounds, bokeh blobs, light vs dark knowledge sequences, or porting `KnowledgeBase` atmosphere to another composition.
---

# Remotion Zoom-style bokeh backgrounds (dark + light)

## Map to `KnowledgeBase.tsx`

| Sequence | `Sequence` name | Background stack |
|----------|------------------|------------------|
| **1 — Dark** | `Dark — knowledge + ripple` | `BG_COLOR` + `AnimatedBlobField` with `BLOB_SPECS` + `blobColor={BLOB_COLOR}` (then dot grid, fragments, text on top) |
| **2 — Light** | `Light — home + sidepanel` | `LIGHT_BG` base + rotated **linear-gradient** wash (`LIGHT_BG` → `LIGHT_ACCENT`) + `AnimatedBlobField` with `LIGHT_BLOB_SPECS` + `blobColor={LIGHT_ACCENT}` |

Do **not** use CSS `animation` or Tailwind motion classes for the blobs—motion is **`useCurrentFrame()`**-driven via the `frame` passed into `AnimatedBlobField`.

## Color tokens (canonical)

- **Dark base:** `BG_COLOR = '#030305'`
- **Dark blob paint:** `BLOB_COLOR = '#071641'` (deep blue; reads as bokeh against the near-black base)
- **Light base:** `LIGHT_BG = '#ffffff'`
- **Light accent / blob + gradient:** `LIGHT_ACCENT = '#d0e9fc'` (soft sky blue)

## Blob model (`BlobSpec`)

Each blob is a **full circle** `div`: fixed `cx, cy`, `size`, `blur` (px Gaussian via `filter: blur()`), base `opacity`, sinusoidal drift `ampX, ampY, speedX, speedY, phase`, and optional **`brightnessPulse`** (slow opacity + brightness shimmer using `sin^sharpness`).

Motion time base in `AnimatedBlobField`: `t = (frame / fps) * 2` (doubles angular speed vs wall-clock for livelier drift).

## Light sequence: gradient wash

Above the white base, add a full-screen `AbsoluteFill` with:

- `background: linear-gradient(${angle}deg, ${LIGHT_BG} 0%, ${LIGHT_ACCENT} 48%, ${LIGHT_BG} 100%)`
- `opacity: 0.85`

`angle` is interpolated (e.g. `lightAngle` from ~128° to ~152° over the light sequence) so the wash **slowly rotates**—match `KnowledgeBase` `LightKnowledgeSequence` if pixel-parity matters.

## Implementation checklist

1. Copy **`BlobSpec`**, **`BLOB_SPECS`**, **`LIGHT_BLOB_SPECS`**, and **`AnimatedBlobField`** from [`src/KnowledgeBase.tsx`](../../src/KnowledgeBase.tsx) (or use [reference.md](reference.md) for literals).
2. Set **`background`** on the outer `AbsoluteFill` (`BG_COLOR` dark, `LIGHT_BG` light).
3. For light only: insert the **gradient** layer **under** the blob field, **over** the solid base.
4. Render **`<AnimatedBlobField specs={…} blobColor={…} frame={…} fps={fps} />`** with:
   - Dark: `BLOB_SPECS`, `BLOB_COLOR`, `frame` = timeline frame (or sped-up `frameSpeed` if you mirror the opening speed-up).
   - Light: `LIGHT_BLOB_SPECS`, `LIGHT_ACCENT`, `frame` = local motion frame (in the project, `relSecondForMotion` ties to focus/zoom choreography).
5. Keep blobs **`pointerEvents: 'none'`** so UI above stays clickable in Studio.

## Additional resources

- Full numeric arrays + component snippet: [reference.md](reference.md)

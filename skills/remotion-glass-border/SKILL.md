---
name: remotion-glass-border
description: Applies the project’s frosted “glass” shell around Remotion IFrame embeds—gradient outer ring, inner blur panel, transparent iframe, and correct centering using outer dimensions. Use when wrapping staticFile HTML in IFrame, matching ZvaSequenceD/C Virtual Agents glass, or when the user asks for glass border, frosted panel, or backdrop blur around an embed.
---

# Remotion glass border (ZVA)

## When to use

- New sequence or composition that embeds `IFrame` + `staticFile("*.html")` and should match **closed engagements / transcript / zva-chat** styling.
- User mentions glass, frosted UI, gradient border, or parity with **sequence D** or **Virtual Agents (C)**.

## Canonical references

- Full pattern in **`src/ZvaSequenceD.tsx`** (closed engagements + transcript).
- Centered variant with explicit outer size: **`src/ZvaSequenceE.tsx`** (zva-chat iframe).

## Constants (copy as-is)

These values are tuned to match the Virtual Agents frame; keep them identical unless design explicitly changes.

```ts
const GLASS_BORDER_PX = 18;
const OUTER_RADIUS = 44;
const INNER_RADIUS = OUTER_RADIUS - GLASS_BORDER_PX;
const GLASS_OUTER_BACKGROUND =
  "linear-gradient(145deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 40%, rgba(14,114,237,0.09) 100%)";
const GLASS_OUTER_BOX_SHADOW =
  "0 0 0 1px rgba(255,255,255,0.28) inset, 0 28px 72px rgba(14, 114, 237, 0.07), 0 10px 28px rgba(0,0,0,0.04)";
```

For embed `width` × `height` (e.g. `EMBED_W`, `EMBED_H`):

```ts
const GLASS_OUTER_W = EMBED_W + 2 * GLASS_BORDER_PX;
const GLASS_OUTER_H = EMBED_H + 2 * GLASS_BORDER_PX;
```

Use `GLASS_OUTER_W` / `GLASS_OUTER_H` for **centering** (`marginLeft: -GLASS_OUTER_W / 2`, `marginTop: -GLASS_OUTER_H / 2` + offsets), not the raw iframe size.

## DOM structure (three layers)

1. **Positioning wrapper** (optional): `position`, `left`/`top`/`transform`, `opacity`, `scale` — **no** fixed width/height on this layer if the inner glass is `inline-block` unless you need explicit layout; use outer dimensions only for margins that center the glass.
2. **Outer glass**: `borderRadius: OUTER_RADIUS`, `padding: GLASS_BORDER_PX`, `background: GLASS_OUTER_BACKGROUND`, `boxShadow: GLASS_OUTER_BOX_SHADOW`, `display: "inline-block"`, `flexShrink: 0` if inside flex.
3. **Inner frosted**: fixed `width` / `height` = embed size, `borderRadius: INNER_RADIUS`, `overflow: "hidden"`, `background: "rgba(255,255,255,0.78)"`, `backdropFilter: "blur(28px) saturate(160%)"`, `WebkitBackdropFilter` duplicate, `boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)"`.
4. **IFrame**: `width`/`height` `"100%"`, `border: "none"`, `display: "block"`, **`backgroundColor: "transparent"`** so the frosted layer shows through.

## Do not

- Put `borderRadius` on the iframe; clip with the inner div.
- Center using iframe width alone when the glass padding is present — use `GLASS_OUTER_*` for margin math.
- Duplicate `ZvaSequenceC` pixel art — this skill is **only** the Remotion glass shell around `IFrame`.

## Optional deduplication

If three or more files need the same block, extract the constants + a small `GlassIframeShell` component in `src/` (props: `width`, `height`, `children` or `src`/`title`)—match existing import/style conventions in the repo.

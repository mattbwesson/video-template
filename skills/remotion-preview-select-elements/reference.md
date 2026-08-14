# Persisting Preview CSS Changes — Reference

## CSS change payload shape

When the user pastes “CSS style changes from the browser preview,” the payload usually looks like:

```json
{
  "property": "width",
  "oldValue": "300px",
  "newValue": "510px",
  "changeType": "style",
  "selector": "<FloatingImage> div",
  "elementTagName": "div",
  "reactComponent": {
    "name": "FloatingImage",
    "props": {
      "config": { "src": "/frame%201-5.png", "x": 40, "y": 72, "cardWidth": 300, ... },
      "frame": 29,
      "compositionWidth": 1920,
      "compositionHeight": 1080
    }
  }
}
```

Use `reactComponent.name` and `reactComponent.props` to find the component and the **data** that produced those styles; update that data in source, not arbitrary CSS.

## Where to apply changes

| Rendered style | Source of truth | Action |
|----------------|-----------------|--------|
| `left` | `config.x` (percent) | Set `x = (newLeftPx / compositionWidth) * 100` |
| `top` | `config.y` (percent) | Set `y = (newTopPx / compositionHeight) * 100` |
| `width` | `config.cardWidth` (or similar) | Set `cardWidth` (or that prop) to the new pixel number (no "px") |
| Other layout (e.g. padding, border-radius) | Component’s default or prop | Add/change prop in config or component; or add to the component’s inline style if it’s not yet configurable |

Find the **config array** (e.g. `HERO_IMAGES`) and the **entry** that matches `config.src` or the composition’s image list order; update that entry’s object.

## Example: FloatingImage (HeroTextImage)

Component computes:

- `left = (config.x / 100) * compositionWidth`
- `top = (config.y / 100) * compositionHeight`
- `width: config.cardWidth ?? 280`

So for a payload like:

- `left`: 768px → 189px  
- `top`: 777.6px → -90px  
- `width`: 300px → 510px  

with `compositionWidth: 1920`, `compositionHeight: 1080`:

1. **cardWidth** — set to `510` in the config for that image.
2. **x** — `189 / 1920 * 100 ≈ 9.84` → set `x: 9.84`.
3. **y** — `-90 / 1080 * 100 ≈ -8.33` → set `y: -8.33`.

The config lives in the composition’s source file (e.g. `TextTest.tsx`) in an array like `HERO_IMAGES`. Match by `config.src` (e.g. `"/frame%201-5.png"` or `staticFile("frame 1-5.png")`) and update that object.

## Switching the preview to another composition

In `preview/main.tsx`:

- Change the imported component (e.g. from `TextTest` to `ProductVideo`).
- Set `COMP_ID`, `WIDTH`, `HEIGHT`, `FPS`, `DURATION` to match the composition’s `RemotionRoot` entry so the Player size and duration are correct.

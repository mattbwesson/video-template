---
name: remotion-preview-select-elements
description: >
  Sets up a Remotion preview view that can be opened in the browser for element
  selection and style editing, and persists CSS changes from the preview back to
  source. Use when the user asks for a Remotion preview with selectable elements,
  applying or persisting CSS changes from a browser preview, or generating the
  preview view for visual editing.
---

# Remotion Preview with Element Selection

Run a lightweight preview of a Remotion composition in a browser so elements can be selected (e.g. via DevTools or Cursor’s preview), styles edited live, and changes persisted to the codebase.

## Quick setup

1. **Preview app** — Vite app that mounts Remotion’s `<Player>` for one composition:
   - `preview/index.html` — page shell and hint: “Right-click → Inspect to select elements.”
   - `preview/main.tsx` — imports the composition (e.g. `TextTest`), renders `<Player component={...} compositionWidth={W} compositionHeight={H} fps={FPS} controls />` inside a wrapper (e.g. `preview-player-wrapper`).
   - `vite.config.ts` — `root: "preview"`, `publicDir` pointing at `public`, dev server port (e.g. 3003).

2. **Run** — `npm run preview` (or `vite`) so the preview is served (e.g. http://localhost:3003).

3. **Open in Cursor** — Open that URL in Cursor’s browser/preview. Use the element picker or Inspect to select nodes; edit styles in the applied-styles panel.

4. **Persist changes** — When the user provides “CSS change” payloads from the preview, apply them in source (see [reference.md](reference.md)).

## When to use this skill

- User wants a “preview view” for Remotion that allows selecting elements.
- User wants to “persist” or “apply” CSS/style changes made in the browser preview to the source files.
- User shares a payload with `[CSS_CHANGE]`, `property`, `oldValue`, `newValue`, and `reactComponent`.

## Persisting CSS changes

1. Use **reactComponent.name** and **reactComponent.props** to find the component and the data that drove the rendered styles (e.g. `FloatingImage` with `config: { cardWidth, x, y, ... }`).
2. Prefer **updating the source of truth** (e.g. config arrays like `HERO_IMAGES`) over adding one-off CSS or inline overrides. Map computed style back to config:
   - `left` → `(x/100) * compositionWidth` ⇒ set `x = (newLeft / compositionWidth) * 100`
   - `top` → `(y/100) * compositionHeight` ⇒ set `y = (newTop / compositionHeight) * 100`
   - `width` → often `cardWidth` or similar prop; set that prop to the new pixel value.
3. Locate the right entry (e.g. by `config.src` or array index) and update that object in the source file.
4. Do not add global CSS or new stylesheets for values that are already driven by component props or config.

See [reference.md](reference.md) for payload structure and concrete examples.

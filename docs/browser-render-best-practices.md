# Browser-render best practices (My Notes / builder-2 exports)

How to build video scenes that render **correctly in the in-browser MP4 export** — and how to
catch fidelity bugs *before* a user does. This is the practical companion to the reference list
in [`web-renderer-limitations-vs-zva.md`](./web-renderer-limitations-vs-zva.md).

**Applies to:** any composition exported through `@remotion/web-renderer` — today that's **all
four builders** (ZVA via its render queue; My Notes, Auto Receptionist, and ZoomMate via
[`web/shared/browserRender.ts`](../web/shared/browserRender.ts)). Same engine, same limits,
everywhere.

---

## 1. The one thing to internalize

**The Player, Remotion Studio, and the CLI render use full Chromium. The in-browser export
(`@remotion/web-renderer`) uses an emulated CSS subset drawn to a canvas.** They are *different
renderers*. A scene looking perfect in the Player tells you **nothing** about how it exports.

> If a change affects how a scene *looks*, it is not verified until you've seen it through the
> web-renderer's compositing — not just the Player.

The renderer is experimental and changing, so the official
[limitations list](https://www.remotion.dev/docs/client-side-rendering/limitations) is a
*starting point*, not the truth. **Empirical verification (§4) is the source of truth.**

---

## 2. Why our own code review isn't enough

The washout bug we shipped (Sept 2025) came from `mix-blend-mode: plus-lighter` — which was
**not in our code**. It lives *inside* `@remotion/motion-blur`'s `<CameraMotionBlur>`: it layers
N time-offset samples at `opacity 1/N` and sums them with `plus-lighter`. The web-renderer can't
composite `plus-lighter`, so the samples alpha-composited to ~65% opacity and every wrapped
scene looked semi-transparent.

**Lesson:** grepping *your* scenes for unsupported CSS misses unsupported CSS emitted by the
Remotion (or third-party) components you use. You must verify the *rendered output*, not the
source.

---

## 3. The fix pattern: gate render-fragile effects

`useRemotionEnvironment().isClientSideRendering` is `true` **only** in the web export (`false`
in Player, Studio, and CLI/Chromium render — all of which composite correctly). Use it to keep
the nice effect everywhere it works and degrade gracefully in the export.

Helpers live in [`src/video2/components/renderEnv.tsx`](../src/video2/components/renderEnv.tsx):

| Helper | Use for |
|---|---|
| `<MotionBlur shutterAngle samples>` | Drop-in for `<CameraMotionBlur>`. Real blur in Player/Studio/CLI; sharp full-opacity pass-through in the export (correct additive blur is impossible there). |
| `<BlendModeLayer>` | Wrap decorative grain / color-grade overlays that rely on `mix-blend-mode`. Renders everywhere except the export. |
| `useIsClientSideRender()` | The raw boolean, for cases the two components don't cover (e.g. stripping a blend-mode element out of an injected HTML string — see `SplitMobileScene`). |

**Rule of thumb:** if an effect needs a non-`normal` `mix-blend-mode`, a `backdrop-filter`, an
SVG `filter: url(...)`, or `z-index` to look right, it will probably mis-render in the export —
gate it, or design it so the export degrades acceptably (still readable, no washout/veil).

**Escape hatch — pre-render to MP4.** When an effect can't be made render-safe (heavy blur/bokeh,
a WebGL/shader background, anything canvas-composited), render it once to an MP4 and play it with
`@remotion/media` `Video` — a supported element that decodes identically in every renderer. This
is how `ZoomBokehBackground` works: the drifting `blur(150px)` blob field is now a looping
1920×1080 clip (`public/img/mynotes-blob-{dark,light}.mp4`), cheaper *and* export-faithful.

### Asset fix — SVG icons

An `<Img src={staticFile('…svg')}>` icon can render fine in the Player but **go missing, come out
the wrong shape, or render black** in the export. Two independent requirements, both needed:

1. **Explicit intrinsic size.** The SVG root needs `width` + `height` attributes, not just a
   `viewBox`. The exporter's rasterizer decodes the SVG at its intrinsic size; a `viewBox`-only
   SVG has none (a real browser guesses ~150px, the exporter doesn't) → it drops or garbles.
2. **Inline fills, not `<style>`.** Colors must be on the elements (`fill="#…"` or
   `style="fill:#…"`), not class rules in a `<defs><style>` block — the rasterizer doesn't reliably
   apply the internal stylesheet, so `<style>`-colored icons come out black.

**Spot it fast:** the icons that already work will have `width`/`height` + inline fills; the broken
ones won't. That single diff is the diagnosis (it's how the platform-pill icons were fixed:
`public/img/{phone_,google-meet,teams,in-person}.svg`).

**Fix — add dimensions** (match the viewBox):

```
<svg … viewBox="0 0 800 800">   →   <svg … width="800" height="800" viewBox="0 0 800 800">
```

**Fix — inline `<style>` fills** (`class="cls-N"` → `style="…"`, then drop the `<style>` block):

```js
// node/tsx one-off — run per icon that uses <defs><style>
import fs from 'node:fs';
let svg = fs.readFileSync(file, 'utf8');
const map = {};
const style = svg.match(/<style[^>]*>([\s\S]*?)<\/style>/);
if (style) for (const [, cls, body] of style[1].matchAll(/\.(cls-\d+)\s*\{([^}]*)\}/g))
  map[cls] = body.replace(/\s+/g, ' ').trim().replace(/;$/, '');
svg = svg.replace(/class="(cls-\d+)"/g, (m, c) => map[c] ? `style="${map[c]}"` : m);
svg = svg.replace(/\s*<style[^>]*>[\s\S]*?<\/style>/, '').replace(/<defs>\s*<\/defs>\s*/g, '');
fs.writeFileSync(file, svg);
```

**Verify without a full export** — the Player renders SVGs regardless, so instead check the two
properties directly in a browser console against the dev server (`/img/…svg`):

```js
const img = new Image(); img.src = '/img/teams.svg?' + Date.now();
await new Promise(r => (img.onload = r));
img.naturalWidth;                       // must be the real size (e.g. 800), not 150
const c = new OffscreenCanvas(64, 64), x = c.getContext('2d');
x.drawImage(img, 0, 0, 64, 64);
const d = x.getImageData(0, 0, 64, 64).data;          // count distinct colors →
new Set([...Array(d.length/4)].map((_,i)=>d[i*4]+','+d[i*4+1]+','+d[i*4+2])).size; // >1 = not all-black
```

**Last resort:** rasterize the icon to PNG (ZVA ships its integration icons as `img/*.png` for
exactly this reason) — bulletproof, at the cost of scalability.

### Inline SVG gotchas (JSX `<svg>` elements, not `<img>` assets)

Found while fixing the ZoomMate export (Aug 2026). All three render perfectly in the Player and
break only in the export:

1. **No `<symbol>`/`<use href="#…">` sprites.** The exporter's rasterizer does not resolve a
   `<use>` reference into a `<defs>` block that lives in a *different* `<svg>` root — the icon
   comes out blank (ZoomMate's Sources chip rendered as two empty blue circles). Same failure
   class as `filter: url(#…)` / `clipPath` references. **Fix:** inline the `<path>` data into
   every consuming `<svg>` and delete the sprite sheet. Duplicated path strings are cheap;
   cross-root ID references are not portable to the export.

2. **`display: inline-flex` doesn't shrink-to-fit.** A chip/pill styled `inline-flex` with no
   explicit width stretches to its block parent's full width in the export (the Sources pill
   became a page-wide oval). **Fix:** add `width: "fit-content"` alongside `inline-flex`.

3. **Path data must actually parse.** Chromium *aborts parsing a `d` attribute at the first
   malformed command* and silently drops everything after it — with `fillRule="evenodd"` that
   turns cut-outs into solid blobs (a calendar icon rendered as a black blob because one cubic
   was missing a coordinate pair: `C… 22.2394 6.50391` where the mirrored edge proved it should
   be `12.2394`). The Player logs `Error: <path> attribute d: Expected number…` — **treat that
   console error as a visual bug, never as noise.** When hand-porting vector art, validate every
   `d`: each command must have its exact argument count (and remember SVG arc flags may be
   packed, `0 01-6.364` = flags `0`,`1` — naive validators false-positive on this).

---

## 4. How to verify a scene (do this before shipping visual changes)

You don't need a full multi-minute export to see the export's compositing. Force the flag and
watch the Player — it reproduces the same emulated result instantly.

1. In [`renderEnv.tsx`](../src/video2/components/renderEnv.tsx), temporarily make
   `useIsClientSideRender` return `true`:
   ```ts
   export const useIsClientSideRender = (): boolean =>
     true || useRemotionEnvironment().isClientSideRendering; // TEMP-VERIFY
   ```
   *(This forces every `MotionBlur`/`BlendModeLayer` into export mode — but note it does **not**
   emulate the canvas CSS subset; it only exercises our gates. For CSS-subset issues, do a real
   export, step 4.)*
2. `npx vite --port 5175 --strictPort`, open `/builder-2`, and scrub the Player through the
   scene. Compare against the Player in normal mode — text/UI should stay **fully opaque** and
   readable; no washout, no flat grey/colored veil.
3. **Revert the TEMP-VERIFY line.** (`grep -n "TEMP-VERIFY" src/video2/components/renderEnv.tsx`
   should be empty.)
4. For anything the force-flag can't prove (radial gradients, `filter`, `clip-path`, stacking,
   iframes, SVG filters, sprites), render **one frame through the real export pipeline** with
   `renderStillOnWeb` — export-faithful pixels in seconds instead of a multi-minute encode.
   From the browser console on the dev server (adjust the repo path and frame):

   ```js
   const wr  = await import('/@fs/<abs repo path>/node_modules/.vite/deps/@remotion_web-renderer.js');
   const mod = await import('/@fs/<abs repo path>/src/video4/Claude2.tsx?t=' + Date.now());
   const { blob } = await wr.renderStillOnWeb({
     composition: { id: 'Claude2', component: mod.Claude2, durationInFrames: mod.TOTAL,
                    fps: mod.FPS, width: mod.WIDTH, height: mod.HEIGHT },
     frame: 550, imageFormat: 'png', inputProps: {},
     delayRenderTimeoutInMilliseconds: 60000,
   });
   document.body.appendChild(Object.assign(new Image(), { src: URL.createObjectURL(blob) }));
   ```

   The `?t=` cache-buster picks up your latest edit. This is how the ZoomMate sprite/pill bugs
   were both reproduced *and* proven fixed — the Player showed neither. If the dep chunk 404s,
   click *Render MP4 in browser* once (then cancel) so Vite optimizes it, and re-import.

5. A **full in-browser render** (generate, click *Render MP4 in browser*, eyeball the file)
   remains the only end-to-end check — it also covers audio mixing and encode timing.

---

## 5. Symptom → cause quick reference

| What you see in the export | Likely cause | Fix |
|---|---|---|
| Text/UI uniformly ~65% transparent | `<CameraMotionBlur>` (`plus-lighter`) | Use `<MotionBlur>` |
| Flat grey/colored veil over a scene | grain / tint via `mix-blend-mode: overlay`/`soft-light`/`screen` | Wrap in `<BlendModeLayer>` (or strip from injected HTML) |
| Gradient text shimmer/gleam frozen mid-sweep (stuck tint on random letters) | `background-clip:text` + swept `background-position` — the position doesn't advance | Gate on `useIsClientSideRender()`: settle to solid `color` in the export (see AiCompanion/Meeting/Q3 notes) |
| Film-grain gone *or* a harsh veil | SVG `filter: url(#…)` (`feTurbulence`) — unsupported | Gate it; prefer a supported approach or accept no grain in export |
| Frosted panel lost its blur / looks flat | `backdrop-filter` — unsupported | Redesign with an opaque/translucent solid; don't rely on backdrop blur |
| Soft glow/bokeh background renders as hard shapes or wrong | large `filter: blur(100px+)` — the emulated blur can't match | Pre-render it to an MP4 and play it with `@remotion/media` `Video` (see `ZoomBokehBackground`) |
| Layers stacked in the wrong order | `z-index` — unsupported (DOM order wins) | Order by DOM position, not `zIndex` |
| Missing glow / wrong background | non-`linear-gradient` background (radial, etc.) — officially unsupported* | Verify empirically; fall back to linear or a solid if it drops |
| Hard-edged shape lost its mask | `clip-path` / SVG `clipPath` — unsupported | Avoid, or use a supported mask (linear-gradient mask) |
| Inner highlight on a card gone | `box-shadow: inset …` — unsupported | Use a border/overlay element instead |
| Pill/chip/progress bar comes out as an **oval** (a full ellipse, no straight edges) | a sentinel `border-radius` — `999px`, `9999px`, `141.429px` — on a wide, short box. The exporter clamps an over-large radius **per axis independently** instead of by the CSS spec's single uniform factor, so a 220x40 pill ends up with corners 110 wide and 20 tall — i.e. an ellipse | Set the radius to **exactly half the border-box height** in px (`height: 40px` → `border-radius: 20px`). Identical in Chromium, and the only value the export's clamp leaves alone. Half-height *plus a bit* is not enough — it comes out egg-shaped |
| SVG icon missing / wrong shape / renders black | SVG `<img>` with no intrinsic `width`/`height` (viewBox only), and/or class-based `<style>` fills | Add explicit `width`/`height` matching the viewBox; inline fills (`style="fill:…"`) and drop `<defs><style>`. The web-renderer's rasterizer needs both. Last resort: rasterize to PNG (ZVA's `img/*.png` icons) |
| Inline `<svg>` icon comes out **blank** (empty circle/chip) | `<use href="#…">` referencing a `<symbol>` in another `<svg>` root — the exporter doesn't resolve cross-root sprites | Inline the `<path>` data into each consuming `<svg>`; delete the sprite `<defs>` |
| Pill/chip stretched to full parent width (an "oval") | `display: inline-flex` doesn't shrink-to-fit in the export's layout engine | Add `width: "fit-content"` |
| Icon's cut-outs filled in / solid blob; Player console shows `<path> attribute d: Expected number` | Malformed path data — the parser aborts mid-`d` and drops the rest; `evenodd` fills collapse | Fix the path (every command needs its exact argument count). The console error **is** the bug |
| Embedded HTML UI blank/wrong | `<IFrame>` — not a supported element | Render the UI as real Remotion DOM, or an `<Img>`/HTML string |
| Audio missing / "mount N Html5Audio tags" | wrong audio component / too many overlapping tags | Use `Audio` from `@remotion/media`; raise `numberOfSharedAudioTags` (My Notes uses 16, see [`web/videos.ts`](../web/videos.ts)) |

\* Radial gradients rendered correctly in our current tests despite being on the "unsupported"
list — the renderer moves fast. **Verify, don't assume.**

---

## 6. Pre-ship checklist for a new scene

- [ ] No raw `mixBlendMode` / `mix-blend-mode` outside `<BlendModeLayer>` (grep the scene + any
      injected HTML string).
- [ ] `<CameraMotionBlur>` is never used directly — always `<MotionBlur>`.
- [ ] No `backdrop-filter`; any "glass" is a solid/translucent fill, not a backdrop blur.
- [ ] No `filter: url(#…)` SVG filters in the export path (grain, displacement, etc.).
- [ ] No animated `background-clip:text` gleam/shimmer that isn't gated to settle solid in the export.
- [ ] Every SVG icon has explicit `width`/`height` (not just a `viewBox`) and inline fills (no `<style>` class fills). Verify with a real export — the Player renders SVGs even when the exporter can't.
- [ ] No `<symbol>`/`<use href="#…">` sprites in inline SVG — paths are inlined per consumer.
- [ ] Every `inline-flex` chip/pill that must hug its content also sets `width: "fit-content"`.
- [ ] Zero `<path> attribute d` errors in the Player console (a parse error means dropped geometry).
- [ ] Stacking reads correctly by **DOM order** (don't depend on `z-index`).
- [ ] No sentinel pill radii (`999px` / `9999px` / any value over half the box's height) — every pill,
      chip and progress bar sets `border-radius` to exactly half its own height.
- [ ] Rings around avatars are a painted disc *under* an inset, clipped photo — not a `border` on the
      element that clips (see `AvatarCircle` in `src/HeadquartersScene.tsx`).
- [ ] Audio uses `@remotion/media`; overlapping SFX fit within `numberOfSharedAudioTags`.
- [ ] Ran the §4 force-flag check **and** reverted the TEMP line.
- [ ] For a genuinely new effect (gradient/filter/mask/iframe), did one real in-browser export.

---

## References

- [`web-renderer-limitations-vs-zva.md`](./web-renderer-limitations-vs-zva.md) — full unsupported-feature audit.
- [`studio-quality-render.md`](./studio-quality-render.md) — headless-Chromium export for pixel parity.
- [`src/video2/components/renderEnv.tsx`](../src/video2/components/renderEnv.tsx) — the gate helpers.
- Remotion: [client-side rendering limitations](https://www.remotion.dev/docs/client-side-rendering/limitations) · [`@remotion/media` support](https://www.remotion.dev/docs/media/support)

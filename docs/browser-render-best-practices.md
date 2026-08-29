# Browser-render best practices (My Notes / builder-2 exports)

How to build video scenes that render **correctly in the in-browser MP4 export** — and how to
catch fidelity bugs *before* a user does. This is the practical companion to the reference list
in [`web-renderer-limitations-vs-zva.md`](./web-renderer-limitations-vs-zva.md).

**Applies to:** any composition exported through `@remotion/web-renderer` — today that's **all
four builders** (ZVA via its render queue; My Notes, Auto Receptionist, and ZoomMate via
[`web/shared/browserRender.ts`](../web/shared/browserRender.ts)) plus the **Workvivo film
wizard** (this repo, via [`web/browserRender.ts`](../web/browserRender.ts)). Same engine, same
limits, everywhere.

> **Measurement stamp.** Everything marked *(measured 4.0.496)* below was verified on
> `remotion` / `@remotion/web-renderer` **4.0.496** in Aug 2026, by rendering probe frames
> through `renderStillOnWeb` (§4). Where those measurements **contradict** older guidance in
> this doc, the older text has been corrected in place and the superseded claim noted — the
> renderer moves fast in both directions, so re-measure rather than trusting either.

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

> ⚠️ **Superseded on 4.0.496 — don't start here.** The two fixes below (intrinsic size + inline
> fills) were **measured to be insufficient** in Aug 2026: an SVG delivered through an image
> element came out corner-cropped *with* `width`/`height` on the root, and in **still** mode the
> load never settled at all, hanging the render until it timed out. A probe rendered both the
> as-shipped icon and a `width`/`height`-added copy side by side; **both failed identically**
> (`web/renderProbe.tsx` cells 1–4, measured 4.0.496).
>
> **Do this instead: don't put an SVG behind an `<img>`.** Render it as inline `<svg>` markup —
> see [Rendering SVG files as inline markup](#rendering-svg-files-as-inline-markup) below. The
> Workvivo film converted **all 44** such sites and the symptom went away everywhere.
>
> Keep reading this section only for context, or if you are on a renderer version where the
> image path works (**verify it before relying on it**).

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

### Rendering SVG files as inline markup

*(measured 4.0.496 — the replacement for the superseded image-element advice above.)*

The export rasterizes inline `<svg>` markup correctly and image-delivered SVGs not at all, so
the job is to get the file's contents **into the DOM as elements** before the first paint.
Reference implementations in this repo: [`src/components/InlineSvg.tsx`](../src/components/InlineSvg.tsx)
(any file) and [`src/components/CursorArrow.tsx`](../src/components/CursorArrow.tsx) (a
single-path icon hardcoded, no fetch at all — the simplest case, prefer it for one-offs).

Four things all had to be true. Each was found by a probe cell going from blank to correct:

1. **Load synchronously.** *This was the real blocker, and it is the least obvious.* The export
   captures a component's **first committed render** and never sees state that lands after
   mount — even with `delayRender`/`continueRender` held correctly across the fetch. The proof
   is unambiguous: the async version exported an **empty box on a cold cache and the correct
   icon on a warm one** (second run in the same page, when the module-level cache made the
   first render synchronous). Moving the read to a blocking same-origin `XMLHttpRequest` fixed
   the cold case. ~1 ms per file, once per file per page.

   > **Generalise this.** Any `useEffect` + `setState` that changes what a frame *looks like* is
   > suspect in the export, not just asset loading. If it must be async, hold `delayRender` **and**
   > verify a cold-cache export still shows it.

2. **Strip `<style>` blocks; put paint on the elements.** Illustrator/Figma exports carry fills
   as `.cls-1 { fill: … }` inside `<defs><style>`, and the rasterizer ignores that stylesheet —
   the shape draws unpainted. Inline each rule onto the elements that wear it as
   **presentation attributes** (`fill="#25cc69"`), which is the form the icons that already
   worked were using.

3. **Let React create the `<svg>` root**, and inject only its children via
   `dangerouslySetInnerHTML` — the same shape as the sprite fix in §"Inline SVG gotchas" below.
   *Honest caveat:* this was adopted to match the already-proven pattern; it was **not**
   independently isolated as necessary, because the async problem (1) was masking everything.

4. **Size the box on the wrapper, `width`/`height="100%"` on the root**, keeping the file's own
   `viewBox`. SVG's default `preserveAspectRatio` then behaves like `object-fit: contain`, which
   is what the `<Img>` it replaced was doing.

**Two migration hazards**, the mirror image of the `<div>` → `<img>` ones above:

- **`InlineSvg` wraps its `<svg>` in a `<span>`, so `.parent span { … }` now matches the icon.**
  A rule written to size a weather glyph — `.wbb-weather span, .wbb-weather svg { width: 18px;
  height: 18px }` — also hit the two `<span>`s holding the location and the temperature, and
  squashed both to 18px so they printed on top of each other. Give the icon its own class and
  scope to that. *(Worse than it looks: the renderer injects its own `<span>`s around every
  word, so a bare `span` selector also corrupts text measurement — see
  [the injected-span section](#the-renderer-injects-spans-into-your-dom-and-your-own-css-styles-them).)*
- **A size forwarded out of the SVG file is a string, and React drops it silently.** The file's
  own attributes are `width="18"` — and React appends `px` only to **numbers**, passing strings
  through verbatim, so `style={{ width: "18" }}` sets an invalid CSS value that the browser
  discards without a warning. The declaration vanishes, the element falls back to its intrinsic
  or inherited size, and the failure is spectacular rather than subtle: an 18px dot grid
  rendered at **300px**. Coerce anything sourced from markup before it reaches a style object —
  `InlineSvg` now maps a bare-number string to `${v}px`. This is a React trap, not a renderer
  one, so it bites the Player too.
- **Bare silhouettes need paint, and a `filter` is the wrong way to give it to them.** Many icon
  files (weather, podcast marks) ship as black paths with no `fill` at all, and the usual trick
  is a CSS `filter` to recolour them. Filters bleed onto later draws (§5) — put the colour in the
  markup instead. `InlineSvg`'s `fill` prop stamps it onto every shape that has none;
  `SymbolSvg`'s `paint` / `paintFrom` substitute a colour the symbol bakes in. Both put the paint
  on the **shape**, never on the root, because a `fill` that reaches paths by inheritance is
  exactly what the rasterizer can't be trusted to resolve.

### Asset fix — CSS `background-image` never paints

*(measured 4.0.496.)* A photo set as `background-image` — with **any** `background-size`,
`cover` and `auto 175%` both tested — does not appear in the export at all. A real `<img>` does.

**Fix:** use `<img>`/`<Img>` everywhere a photograph appears. Two migration hazards, both of
which bit this repo:

- **Replaced elements don't stretch from `inset: 0`.** A `<div>` with `position:absolute;
  inset:0` fills its parent; an `<img>` with the same CSS renders at its *intrinsic* size and
  spills. Every converted rule needs explicit `width:100%; height:100%; object-fit:cover`.
- **Element-type CSS selectors silently stop matching.** `.wm-avstack span { … }` styled an
  avatar until the `<span>` became an `<img>`, at which point the 44px circle rules applied to
  nothing and the photo rendered full-size and unmasked. Prefer `.parent > *` when converting,
  and grep the stylesheet for `span`/`div` type selectors over anything you change.

### Masks and blends are dropped — bake, don't gate

*(measured 4.0.496.)* Three separate failures, one conclusion:

| Construction | What the export does |
|---|---|
| `mask-image` / `-webkit-mask-image` | **Ignored.** The masked element paints its **whole box** — a gradient wash masked to an icon exported as a solid rectangle over it |
| `mask-composite: exclude` (ring pseudo-elements) | **Ignored**, same way — the pseudo paints its full box and reads as a veil |
| `mix-blend-mode` | Not composited (consistent with the `plus-lighter` washout in §2) |

Gating (§3) keeps the export *acceptable*; it does not make it *match*. When the effect is part
of the artwork rather than a flourish, **bake it into the asset offline** instead: this repo
pre-composited the purple wash into `public/img/glass/*.png`, so one plain `<img>` replaced
three masked/blended layers and now renders identically in both renderers.

And when an effect only exists because of a mask, **delete it** rather than let it export
unmasked — a shine-sweep clipped by `mask-image` exported as a white bar sliding across the
whole frame.

### Hiding something: `opacity: 0` works, the other two ways don't

*(measured 4.0.496, and confirmed in the renderer's own source.)* Three constructions that
hide an element in Chromium. **Only one of them hides it in the export**, and the two that
fail are the two most people reach for first.

The dispatch that decides this is worth reading, because it explains all three at once:

```js
if (opacity === 0) {
  return { type: "skip-children" };                    // ← subtree never walked
}
if (computedStyle.backfaceVisibility === "hidden" && totalMatrix.m33 < 0) {
  return { type: "skip-children" };
}
if (dimensions.width <= 0 || dimensions.height <= 0) {
  return { type: "continue", cleanupAfterChildren: null };   // ← children STILL drawn
}
```

| How you hid it | What the export does |
|---|---|
| `opacity: 0` | **Correct.** Returns `skip-children` — nothing in the subtree is drawn |
| `visibility: hidden` | **Painted in full.** There is no `visibility` check anywhere in the paint path — the string does not appear in the renderer's bundle except on its own internal scaffolding |
| A box collapsed to `width: 0` / `height: 0` with `overflow: hidden` | **Children painted, unclipped.** The element bails out *before* its overflow clip is installed, then the walker descends into it anyway |

Each one cost a real bug here:

- **`visibility: hidden`** — two scenes centre a line by laying a visible copy over a hidden
  "sizer" that carries the whole string in flow. The sizer painted, so the line exported
  **twice, at two different trackings**. Measured either way on the same frame: 66,613 white
  pixels with `visibility: hidden`, 43,776 with `opacity: 0` — a third of the ink was the
  duplicate.
- **The collapsed box** — a comments sidebar animates `width: PANEL * progress` with
  `overflow: hidden`, wrapping an absolutely-positioned full-width panel. At `progress === 0`
  the panel drew at full width, so the sidebar was on screen from the scene's first frame,
  long before the cursor opens it. The same shape sat in a circular iris transition whose
  `radius` interpolates **from 0** — on the frame the iris should be fully shut, the entire
  scene behind it paints.

**Fix pattern.** Don't render it. `{progress > 0 && <Panel/>}` is deterministic and needs
nothing from the renderer. Once the reveal starts the box has real width and the clip behaves,
so the gate only has to cover exactly zero. `opacity: 0` is the other safe option, and it is
worth knowing that a *combination* is safe by accident: one collapsing block here survives only
because its height and its opacity both reach 0 on the same frame.

> **The general rule:** in this renderer, *hidden* means `opacity: 0` or not in the DOM.
> Anything that hides by geometry — zero size, clipped away, moved out of an overflow —
> deserves a probe before you trust it.

### Pseudo-elements are never rendered

*(measured 4.0.496 — confirmed by absence in the renderer's source.)* The exporter walks the
**real DOM** with a `TreeWalker` and calls `getComputedStyle(el)` with **no second argument**,
anywhere. `::before` and `::after` are not DOM nodes, so they do not exist in the export at all.
Searching the renderer's whole bundle for `::before` / `::after` / `pseudo` returns **zero
matches**.

This is quiet and widespread, because pseudo-elements are the idiomatic way to draw exactly the
small parts nobody re-checks: a toggle knob, a radio dot, a tab underline, a bullet, a scrim, a
CSS triangle. Here a settings panel's toggles exported as **plain filled pills** — the knob was
`.acs-tog:after`, so it simply never existed.

**Fix:** make it a real element (`<span class="tog"><i /></span>`) and move the rule from
`:after` to the child. **Audit:** `grep -rE '::?(before|after)' src` — this film had 27 rules
across 14 files, every one of them invisible in the export.

**Three things the conversion itself gets wrong**, all found doing it at scale here:

- **A pseudo-element carries an implicit paint order that a real child does not.** `::before`
  paints under the host's children and `::after` over them, whichever `z-index` says. Once it is
  a real element, only DOM order decides — so it has to be inserted at the position its old
  `z-index` put it, not simply appended. A mobile header's readability scrim (`z-index: 4`, under
  the `z-index: 5` controls) was appended as the last child and painted **over the tab labels**;
  it belongs immediately before the first control instead.
- **Only emit it in the state that styled it.** `.tab.on::after` existed on the active tab alone.
  Rendering `<span class="underline">` on all fifteen tabs and leaving the rule scoped to
  `.tab.on > .underline` is correct but leaves fourteen inert inline boxes in the layout —
  render it conditionally instead.
- **Check what the rule actually paints before rewriting the markup around it.** If the
  pseudo-element's fill is a `radial-gradient`, the export drops it whatever kind of element
  carries it, so the conversion buys nothing — leave it for the Player and say why in a comment.
  Four of this film's remaining rules are that, and five more are dead CSS no markup references.
  (A fifth shapes itself with `clip-path: polygon()`, which was **assumed** dropped and left
  unconverted — `circle()` is measured working per §5, so that one is unverified either way and
  is worth a probe before it is either fixed or written off.)

**`outline` is a tempting shortcut, and only sometimes.** A ring drawn outside the box costs no
layout, and the renderer does draw outlines (`drawOutline` runs right after `drawBorder`), so
`outline` + `outline-offset` can replace a ring pseudo-element with a one-line CSS change and no
markup churn. But an outline is a **solid colour** — it cannot carry the gradient that makes a
glass bezel read as glass rather than as painted plastic. Where the band is a gradient, a real
element is the only option; where it is a flat colour, the outline is the cheaper fix.

### The layout engine is not Chromium's

*(measured 4.0.496.)* The export does its own layout, and it diverges in ways that only show up
as wrapped, overlapping or stretched text. All three below rendered perfectly in the Player.

1. **Inline elements are not blockified when they become flex items.** CSS blockifies a flex
   item; the export doesn't. An inline `<span>` with `flex: 1` therefore shrinks to
   min-content — its text wraps, and `display: block` children inside it stack at the same
   `y` and **overlap each other**. A "Catch Me Up" card exported with its two lines wrapped
   and printed on top of one another. **Fix:** spell out `display: block` (and usually
   `min-width: 0`) on any inline element used as a flex item. It costs nothing in Chromium,
   where it is already implied.
   *(This is the same family as the existing `inline-flex` shrink-to-fit row in §5, but a
   distinct trigger — that one is about the element's own `display`, this one about what
   being a flex item is supposed to do to it.)*

2. **Text measures differently, so a box that "just fits" is not safe.** A composer
   placeholder in a fixed `width: 225px` box fitted on one line in the Player and **wrapped**
   in the export with the same string. Any fixed-width box holding text whose length varies
   with data — a person's name, a researched company — is one measurement difference from
   wrapping. **Fix:** `white-space: nowrap` and let the box size to its content; don't tune
   the pixel width until it fits.

3. **CSS-border triangles export as solid squares.** The zero-size box with one thick border
   and two transparent ones is a triangle only because the browser *mitres* the corners. The
   export strokes each border side independently and never mitres them, so the whole border
   box fills in. A play button exported as a white square. **Fix:** draw it as an inline
   `<svg>` `<polygon>`. (Transparent borders themselves are harmless — the renderer strokes
   them with `rgba(0,0,0,0)` and nothing lands.)

4. **`zoom` corrupts every glyph under it.** The renderer contains **zero** handling for
   `zoom` — the string does not appear in its bundle once — so it reads the two numbers it
   needs from two sources that disagree about it. Measured in Chromium on the same element:

   | | `getBoundingClientRect().width` | `getComputedStyle().fontSize` |
   |---|---|---|
   | plain | 42.16 | 18.5px |
   | `zoom: 1.2222` | **51.53** (scaled) | **18.5px** (not scaled) |
   | `transform: scale(1.2222)` | 51.53 | 18.5px |

   Word *positions* come from the rect and therefore include the zoom; the canvas font size
   comes from the computed style and therefore doesn't. Every glyph draws `1/zoom` too small
   at correctly-spaced positions — a visible gap after every word. 18.5px type exported at
   15.14px, exactly the predicted 18.5 / 1.2222.

   **Fix:** `transform: scale()` + `transform-origin`, which the renderer reads properly
   through its own matrix (bottom row above: same rect, no font mismatch). One caveat when
   converting — `zoom` grows the element's layout box and `transform` does not, so the
   ancestor that used to be sized by the zoomed content needs its scaled dimensions written
   out explicitly or it will clip. See `.wsf-shell` / `.wsf-body` in
   [`WorkvivoSpaceFeedStyles.css`](../src/components/workvivo/WorkvivoSpaceFeedStyles.css).

### The renderer injects `<span>`s into your DOM, and your own CSS styles them

*(read from the 4.0.496 source, then confirmed on a frame — this one is essentially unfindable
by looking at your own code.)* To draw text the exporter **mutates the live DOM**, at two
granularities:

```js
// handle-text-node.ts — every text node is wrapped in a real element
const span = document.createElement("span");
parent.insertBefore(span, node);
span.appendChild(node);

// find-line-breaks.text.ts — then each word inside it is wrapped and measured
const interstitialNode = document.createElement("span");
interstitialNode.textContent = segment;
span.appendChild(interstitialNode);
const rect = interstitialNode.getBoundingClientRect();   // ← the geometry it draws from
```

Both are ordinary unstyled `<span>`s, inline and harmless — **until one of your own rules
matches them**, at which point that rule is changing the exact rectangle the renderer is about
to draw from. Note the wrapper is inserted *as a child of the text's parent*, so `.foo > span`
is no safer than `.foo span`: both match it.

The declarations that hurt are the ones that change a box — `display`, `width`, `height`,
`flex`, `position`, `padding`, `margin`. A rule meant for a real `<span>` sibling
(`.wbb-weather span { width: 18px; height: 18px }`) squeezes every wrapped **word** to 18px,
and `display: block` on one puts every word on its own line.

**The tell is unmistakable once you capture the draw calls** (§4): every word at an identical
`x`, with `y` marching down a line at a time. That is a paragraph of text being laid out one
word per line, and it is what this bug looks like every time.

**Audit:** `grep -rnE '\bspan\b' src --include='*.css'`, then narrow to the rules that set a
layout property — those are the only dangerous ones, and whether they actually fire depends on
whether the matched parent can hold a **text node**. A `.wsf-carousel-dots > span { width: 6px }`
is safe forever because that element only ever holds dots; the same rule over a label is a bug
waiting for someone to add a word. This repo has 38 bare-`span` rules, 24 of them setting layout,
of which 19 were scoping bugs that had to be fixed. Note that a *descendant* selector is much
broader than a child one: `.foo span` matches an injected wrapper at any depth, including one
nested inside a real `<span>` of yours.

**The same trap catches your own wrappers:** `InlineSvg` renders its `<svg>` inside a `<span>`,
so `.parent span {…}` hits icons *and* every word the renderer is measuring nearby.

### Stacking: DOM order wins, and that includes siblings

*(measured 4.0.496 — this confirms the existing §5 row, with a worked example.)* The mobile
screens ordered their DOM `status → hero → scroll` and relied on `z-index: 5 / 4 / —` to layer
them. In the export the status bar was **buried under the header photo** and scrolling content
rode **over** the header.

**Fix:** reorder the DOM to match the intended paint order (`scroll → hero → status`). The
Player is unaffected because the `z-index` ladder still resolves to the same result — so this is
a safe change, not a trade. Where a scene depends on stacking, make DOM order agree with the
ladder even when `z-index` alone would work.

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

   > ⚠️ **Three corrections for 4.0.496** *(measured)* — the snippet above fails as written:
   >
   > - **`?t=` on the composition import loads a second copy of React** and the render dies with
   >   *Invalid hook call* before it can tell you anything about CSS. **Put the render call in a
   >   module inside the app's own graph** and import *that* (this repo:
   >   [`renderStill()` in `web/browserRender.ts`](../web/browserRender.ts), called as
   >   `(await import('/browserRender.ts')).renderStill(541)`). Vite's HMR already picks up
   >   edits, so the cache-buster buys nothing and costs the run.
   > - **There is no `imageFormat` option, and the result isn't `{blob}`.** It resolves to
   >   `{canvas, blob(options), url()}` — call `await still.blob({ format: 'png' })`.
   > - **`canRenderMediaOnWeb` requires `width`/`height`** if you gate on readiness first.

### Build a probe composition, not a full-frame render

*(This is what made the 4.0.496 findings above tractable.)* Rendering one still of a real scene
took **~3 minutes** here, because a full-length reference `<Video>` is mounted on every frame
and gets decoded before anything draws. Nine constructions × several candidate fixes each was
not going to happen at that price.

Instead, keep a scratch composition of **isolated cells** — one construction each, plain-text
labels beside them — and render *that* through `renderStillOnWeb`: **~1 second**, and the output
reads as a checklist because the labels render even when the thing beside them doesn't.
See [`web/renderProbe.tsx`](../web/renderProbe.tsx).

Two things that made it much more useful:

- **Pair every cell with its candidate fix** (current construction / proposed replacement, side
  by side). You are comparing, not just looking.
- **Make it bisectable.** A cell that *hangs* the renderer takes the whole probe with it, and
  that is exactly what unsupported constructions do here. A `window.__cells = [10, 11]` filter
  turns "the probe times out" into "cell 3 is the one that hangs" — which was itself the finding
  that identified SVG-through-`<img>`.
- **Watch for load races.** A plain `<img>` doesn't delay the render, so a probe can report a
  false negative for something that actually works. Use Remotion's `<Img>` as the control — that
  mistake cost a wrong conclusion here before it was caught.

**Two ways `renderStillOnWeb` hangs that are not your scene's fault**, both of which read as
"the probe is broken" and cost hours here:

- **A tab that isn't compositing never finishes.** The renderer drives frames off
  `requestAnimationFrame`, which a hidden tab throttles to nothing — the promise simply never
  settles, with no error and no console output. `document.visibilityState === "hidden"` is the
  tell; check it before blaming the composition. Two things that did **not** recover it here:
  shimming `requestAnimationFrame` to `setTimeout`, and asking the host to front the tab
  (`visibilityState` stayed `hidden`). What did was tearing the preview down and starting a
  fresh one. The harness also degraded over a long session — renders that worked early stopped
  settling later, and `ERR_CONNECTION_RESET` in the console was the sign to restart rather than
  to keep debugging.
- **Scenes full of Remotion `<Img>` stall on a cold cache.** `<Img>` holds `delayRender` until
  the file decodes, and a scene with a dozen photographs frequently never gets there in the
  still harness even though the same scene renders in a full export. **Practical consequence:**
  photo-heavy scenes are often *not* probeable. Probe the **construction** in isolation instead
  — a cell with the same CSS declaration and no photographs — and accept that as the evidence.
  Several findings above were established that way rather than on the real frame.

**For "does any rule still do X?", audit the source — not the mounted DOM.** Measuring live
layout is the right tool for *this element is wrong*, and the wrong one for *nothing is wrong any
more*. Walking `document.querySelectorAll('*')` and comparing each box against its computed
radius only ever sees the components the page mounts, in the states it mounts them in — so a
sweep that reported itself complete here still shipped three ovals: two in components the gallery
never mounts, and one that is square at a single-digit badge count (exactly how it was measured)
and a rounded rectangle at two digits. Re-running the same question against the **stylesheets**
found all three immediately, because a CSS file has no states.

Two corollaries worth keeping: prefer the source scan whenever the property you care about is
declared rather than computed, and when a rule's geometry depends on content — `min-width`,
padding, a variable-length label — measure it by **rebuilding the box** from its own declarations
in a throwaway element rather than reasoning about the padding. A padded button whose real height
was 36px is where the "half of *what*" question actually gets answered.

**For anything about text, capture the draw calls instead of the pixels.** Patch `fillText`
before rendering and you get the renderer's own intentions — every word, where it put it, and
what font it used — which beats inferring any of that from a bitmap. Both text findings above
were cracked this way within minutes of giving up on screenshots:

```js
const calls = [];
for (const P of [CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D]) {
  const orig = P.prototype.fillText;
  P.prototype.fillText = function (t, x, y, ...r) {
    calls.push({ t, x: Math.round(x), y: Math.round(y), font: this.font });
    return orig.call(this, t, x, y, ...r);
  };
}
// …render the still…
console.table(calls);
```

Read it for two things. **An identical `x` on every row with `y` advancing** is the injected-span
bug — the text is being laid out one word per line. **A `font` that isn't the size you wrote** is
a scaling bug, and the ratio names the culprit: `15.143px` against a declared `18.5px` is exactly
`1.2222`, which was the `zoom` factor on an ancestor. Neither is legible in a screenshot, and the
second is invisible even in `getImageData`.

**Measure the pixels, don't just look.** Once a still is in a canvas, `getImageData` answers
questions eyeballing can't, and it works even when the pane can't render a screenshot:

- *Is this pill or an ellipse?* Sample the shape's horizontal extent at several heights. A true
  pill is constant through the middle and matches `r − √(r² − dy²)` at the caps; an ellipse
  narrows continuously. This is how the ask bar was confirmed fixed (1178 / 1261 / 1300 / 1312
  measured against 1178 / 1261 / 1300 / 1312 predicted).
- *Did that duplicate go away?* Count pixels of the text colour — the doubled-line bug was a
  clean 66,613 → 43,776.
- *Did the fill actually land?* Tally the most common colours and look for the exact hex you
  expect. A masked block versus a real glyph is obvious by area alone (9,002 px for a mic
  silhouette where a filled square would have been ~29,000).

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
| **Text or elements *near* a filtered icon come out the wrong colour** (a `hue-rotate`d glyph turned the heading and body beside it purple) | **CSS `filter` is not scoped to the element that sets it** — the canvas filter stays active and bleeds onto everything drawn *after* it *(measured 4.0.496)* | Don't recolour with `filter`. Substitute the colour into the markup instead (`SymbolSvg`'s `paint` prop swaps `currentColor` in the symbol's own paths). Note this makes filters worse than merely "unsupported" — they damage **other** elements, so a filter far from the visible bug is a prime suspect |
| Frosted panel lost its blur / looks flat | `backdrop-filter` — unsupported | Redesign with an opaque/translucent solid; don't rely on backdrop blur |
| Soft glow/bokeh background renders as hard shapes or wrong | large `filter: blur(100px+)` — the emulated blur can't match | Pre-render it to an MP4 and play it with `@remotion/media` `Video` (see `ZoomBokehBackground`) |
| Layers stacked in the wrong order | `z-index` — unsupported (DOM order wins) | Order by DOM position, not `zIndex` |
| **Header photo shows with no brand tint; glow missing; background just absent** | **`radial-gradient` — does not paint at all** *(measured 4.0.496; `linear-gradient` in the same probe painted correctly)* | Rewrite as `linear-gradient(…)`. Three header washes here became `linear-gradient(120deg, …)` and matched the Player exactly |
| Hard-edged shape lost its mask | `clip-path` / SVG `clipPath` — on the official unsupported list, **but `clip-path: circle()` painted correctly** *(measured 4.0.496)* | Verify before redesigning — circular reveals/irises may be fine. `mask-image`, by contrast, is genuinely dropped (see below) |
| **Icon/artwork covered by a solid rectangle of its own tint** | `mask-image` — ignored, so the masked layer paints its **whole box** *(measured 4.0.496)* | Bake the masked result into the asset offline, or delete the effect. Gating only makes it *acceptable*, not *matching* |
| **Photo missing entirely (layout otherwise correct)** | CSS `background-image` — never painted *(measured 4.0.496, both `cover` and `auto …%`)* | Use a real `<img>`; add explicit `width/height/object-fit` (replaced elements don't stretch from `inset: 0`) |
| **Photo is framed correctly in the Player and centred in the export** — a headshot biased high, a banner panned to one side | **`object-position` is not implemented.** `object-fit` is (`calculateCover`/`Contain`/`None`/`ScaleDown`), but those functions take only a fit mode, a container size and an intrinsic size — there is no position input anywhere in the paint path, so every fitted image is centred *(read from the 4.0.496 source; `background-position` is moot since `background-image` never paints at all)* | **Bake the crop into the pixels.** Draw the window you want to a canvas and hand the composition an ordinary photo — see [`web/framing.ts`](../web/framing.ts), and `BASELINE_ASSETS.personAvatar`, which is a pre-cropped headshot for exactly this reason. ⚠️ **Known live instance:** `avatarFitFor()` in `CustomizationProvider.tsx` sets `objectPosition: "50% 30%"` on every *uploaded* headshot to bias the face high. That bias is present in the Player and **absent from every exported MP4** — uploaded avatars export centred. Not yet fixed |
| **SVG icon corner-cropped, or the still render hangs until timeout** | SVG delivered through `<img>`/`<Img>` — **adding `width`/`height` does not fix this** *(measured 4.0.496)* | Render the file as inline `<svg>` markup, loaded **synchronously** — see §3 |
| **Element blank in export, correct in Player, and correct on a second export in the same page** | Content arrived via `useEffect` + `setState`; the export captures the **first committed render** only | Make it synchronous. A warm cache masking the bug is the tell |
| Status bar / header buried under content that should be behind it | Sibling `z-index` ignored — DOM order wins | Reorder the DOM to match the ladder (Player is unaffected, so it's a safe change) |
| **A line of text renders twice, offset, at two different trackings** | A `visibility: hidden` sizer element — **`visibility` is not honoured**, so the "hidden" copy paints in full *(measured 4.0.496; no `visibility` check exists in the paint path)* | Use `opacity: 0` — it returns `skip-children` and is the only reliable way to hide a subtree short of not rendering it |
| **Something appears long before its reveal animation** (a panel, an iris, a wipe) | A box collapsed to `width: 0`/`height: 0` with `overflow: hidden` — the renderer bails out of a zero-size element **before** installing its clip, then walks into the children anyway *(source: `{type:"continue"}`, vs `"skip-children"` for `opacity === 0`)* | Don't render the subtree at all while the size is zero (`{progress > 0 && …}`). The clip works fine as soon as the box has real width |
| **A toggle knob / radio dot / tab underline / bullet / scrim is simply absent** | It was a `::before` / `::after`. **Pseudo-elements are never rendered** — the exporter walks real DOM nodes only *(measured 4.0.496; zero pseudo-element handling in the renderer)* | Make it a real child element and move the rule onto it. Audit with `grep -rE '::?(before|after)' src` |
| **Two lines of text inside one box overlap, or text wraps that shouldn't** | An inline `<span>` used as a flex item — CSS blockifies flex items, the export doesn't, so it shrinks to min-content and its block children stack at the same `y` *(measured 4.0.496)* | Spell out `display: block` + `min-width: 0` on the flex item. Free in Chromium, where it is already implied |
| **Text wraps in the export but fits in the Player, same string** | Text metrics differ, so a fixed-width box that "just fits" isn't safe — especially one holding a name or other researched copy | `white-space: nowrap`, and let the box size to its content instead of tuning a pixel width |
| **A paragraph exports one word per line, or its words are squashed/overlapping** — and nothing in your markup explains it | A CSS rule of yours matching `span`. **The renderer wraps every text node, and every word inside it, in a real injected `<span>`** to measure them, so `.foo span { width: … }` / `{ display: block }` resizes the thing it is about to draw *(source: `handleTextNode` + `findWords`, 4.0.496)* | Scope the rule to a class; never select a bare `span`. `.foo > span` does **not** help — the wrapper is a direct child. Audit: `grep -rnE '\bspan\b' src --include='*.css'`. Confirm by patching `fillText` (§4): identical `x`, advancing `y` |
| **Every glyph is uniformly too small, with a gap after each word, at otherwise correct positions** | A `zoom` on an ancestor. **The renderer has no `zoom` handling at all**, and reads positions from `getBoundingClientRect()` (which *includes* zoom) but the canvas font from `getComputedStyle().fontSize` (which does *not*) — so glyphs draw at `1/zoom` scale in correctly-spaced slots *(measured 4.0.496)* | `transform: scale()` + `transform-origin` instead; the renderer composes transforms correctly. Write out the ancestor's scaled `width`/`height` explicitly — `transform` doesn't grow the layout box the way `zoom` did, so it will otherwise clip |
| **An element sized from an SVG file's own attributes renders enormous** (an 18px icon at 300px) | `style={{ width: "18" }}` — React appends `px` to **numbers** only and passes strings through, so the value is invalid CSS and is dropped silently | Coerce bare-number strings to `${v}px` before they reach a style object. A React trap, not a renderer one — it misbehaves in the Player too |
| **A CSS-border triangle (play button, caret, tooltip arrow) comes out as a solid square** | The zero-size-box-plus-borders trick relies on the browser **mitring** the corners; the export strokes each side independently and fills the whole border box *(measured 4.0.496)* | Draw it as an inline `<svg>` `<polygon>` |
| Inner highlight on a card gone | `box-shadow: inset …` — unsupported | Use a border/overlay element instead |
| Pill/chip/progress bar comes out as an **oval** (a full ellipse, no straight edges) | a sentinel `border-radius` — `999px`, `9999px`, `141.429px` — on a wide, short box. The exporter clamps an over-large radius **per axis independently** instead of by the CSS spec's single uniform factor, so a 220x40 pill ends up with corners 110 wide and 20 tall — i.e. an ellipse | Set the radius to **exactly half the border-box height** in px (`height: 40px` → `border-radius: 20px`). Identical in Chromium, and the only value the export's clamp leaves alone. Half-height *plus a bit* is not enough — it comes out egg-shaped. **A square box is the exception**: the same per-axis clamp lands on half the width *and* half the height, which is a correct circle — so `border-radius: 9999px` on a 36x36 avatar is fine and must not be "fixed" |
| SVG icon missing / wrong shape / renders black | SVG delivered through `<img>`, and/or class-based `<style>` fills. ⚠️ **The old advice on this row — "add `width`/`height` matching the viewBox" — was measured insufficient on 4.0.496**; it is kept only as the historical diagnosis | Render it as inline `<svg>` markup loaded synchronously (§3), and inline the `<style>` fills onto the elements as presentation attributes. Last resort: rasterize to PNG (ZVA's `img/*.png` icons) |
| Inline `<svg>` icon comes out **blank** (empty circle/chip) | `<use href="#…">` referencing a `<symbol>` in another `<svg>` root — the exporter doesn't resolve cross-root sprites | Inline the `<path>` data into each consuming `<svg>`; delete the sprite `<defs>` |
| Pill/chip stretched to full parent width (an "oval") | `display: inline-flex` doesn't shrink-to-fit in the export's layout engine | Add `width: "fit-content"` |
| Icon's cut-outs filled in / solid blob; Player console shows `<path> attribute d: Expected number` | Malformed path data — the parser aborts mid-`d` and drops the rest; `evenodd` fills collapse | Fix the path (every command needs its exact argument count). The console error **is** the bug |
| Embedded HTML UI blank/wrong | `<IFrame>` — not a supported element | Render the UI as real Remotion DOM, or an `<Img>`/HTML string |
| Audio missing / "mount N Html5Audio tags" | wrong audio component / too many overlapping tags | Use `Audio` from `@remotion/media`; raise `numberOfSharedAudioTags` (My Notes uses 16, see [`web/videos.ts`](../web/videos.ts)) |

> **Correction (measured 4.0.496).** This table previously carried a footnote saying *"radial
> gradients rendered correctly in our current tests despite being on the unsupported list."*
> That is **no longer true** — on 4.0.496 a radial gradient painted **nothing at all**, while a
> linear gradient with the same stops in the same probe painted correctly (`web/renderProbe.tsx`
> cells 12–15). The symptom in production was a header photo exporting with no brand tint over
> it. The doc's own advice stands and cuts both ways: **verify, don't assume — including this
> line.**

---

## 6. Pre-ship checklist for a new scene

- [ ] No raw `mixBlendMode` / `mix-blend-mode` outside `<BlendModeLayer>` (grep the scene + any
      injected HTML string).
- [ ] `<CameraMotionBlur>` is never used directly — always `<MotionBlur>`.
- [ ] No `backdrop-filter`; any "glass" is a solid/translucent fill, not a backdrop blur.
- [ ] No `filter: url(#…)` SVG filters in the export path (grain, displacement, etc.).
- [ ] **No CSS `filter` used to recolour anything** (`hue-rotate`, `brightness(0) invert(1)`) — it bleeds onto later draws. Colour comes from `fill`/`color`, or is substituted into the markup.
- [ ] No animated `background-clip:text` gleam/shimmer that isn't gated to settle solid in the export.
- [ ] **No SVG behind an `<img>`/`<Img>` at all** — every `.svg` is rendered as inline `<svg>` markup, loaded synchronously (§3). *(Adding `width`/`height` to the file is not sufficient on 4.0.496.)*
- [ ] No `<style>` blocks inside inline SVG — fills are presentation attributes on the elements.
- [ ] **No `useEffect` + `setState` deciding what a frame looks like.** If unavoidable, hold `delayRender` **and** prove it with a *cold-cache* export.
- [ ] No `mask-image` / `mask-composite` in the export path — masked artwork is baked into the asset, or the effect is removed.
- [ ] No `radial-gradient` — every gradient that must appear is `linear-gradient`.
- [ ] No CSS `background-image` photographs — real `<img>` with explicit `width`/`height`/`object-fit`.
- [ ] After any `<span>`/`<div>` → `<img>` conversion, grep the stylesheet for element-type selectors (`.foo span`) that just stopped matching.
- [ ] **Nothing is hidden by `visibility: hidden` or by a zero-size `overflow: hidden` box** — both
      paint in the export. Hide with `opacity: 0`, or don't render it (`{progress > 0 && …}`).
- [ ] **No `::before` / `::after`** anywhere the export has to draw (`grep -rE '::?(before|after)' src`)
      — pseudo-elements are not DOM nodes and are never rendered. When converting one, insert the
      real element at the position its old `z-index` implied, and render it only in the state that
      styled it.
- [ ] **Every inline element used as a flex item spells out `display: block` + `min-width: 0`** —
      the export doesn't blockify flex items, so its children overlap.
- [ ] **No fixed-width box holding variable-length text** (a person's name, researched copy) — set
      `white-space: nowrap` and let it size to its content; export text metrics differ from Chromium's.
- [ ] **No bare-`span` selector sets a layout property on an element that can hold text** (`display`,
      `width`, `height`, `flex`, `padding`, `position`). The renderer injects a real `<span>` around
      every text node *and* every word, so such a rule resizes the text it is about to measure. Scope
      to a class. `>` doesn't save you — the wrapper is a direct child. *(24 of this repo's 38
      bare-`span` rules set layout; they're safe only because those parents hold icons, not raw text —
      which is exactly what to re-check when markup changes.)*
- [ ] **No `zoom` anywhere** — the renderer doesn't implement it, and it desynchronises word positions
      from glyph size. Use `transform: scale()`, and write the parent's scaled size out explicitly.
- [ ] **No bare-number strings in style objects** (`width: "18"` forwarded out of an SVG file) — React
      only adds `px` to numbers, so the declaration is dropped and the element renders unsized.
- [ ] **No CSS-border triangles** (zero-size box + one thick border) — inline `<svg>` `<polygon>` instead.
- [ ] No `<symbol>`/`<use href="#…">` sprites in inline SVG — paths are inlined per consumer.
- [ ] Every `inline-flex` chip/pill that must hug its content also sets `width: "fit-content"`.
- [ ] Zero `<path> attribute d` errors in the Player console (a parse error means dropped geometry).
- [ ] Stacking reads correctly by **DOM order** (don't depend on `z-index`).
- [ ] No sentinel pill radii (`999px` / `9999px` / any value over half the box's height) on a
      **non-square** box — every pill, chip and progress bar sets `border-radius` to exactly half its
      own height. Square boxes may keep a sentinel; it clamps to a correct circle. Audit the
      stylesheets, not the mounted DOM — a live scan misses unmounted components and content-dependent
      shapes.
- [ ] Rings around avatars are a painted disc *under* an inset, clipped photo — not a `border` on the
      element that clips (see `AvatarCircle` in `src/HeadquartersScene.tsx`).
- [ ] Audio uses `@remotion/media`; overlapping SFX fit within `numberOfSharedAudioTags`.
- [ ] Ran the §4 force-flag check **and** reverted the TEMP line.
- [ ] For a genuinely new effect (gradient/filter/mask/iframe), did one real in-browser export.

---

## 7. The Chromium path: verification, and the escape hatch you may not want

The Remotion CLI drives real headless Chromium — the same engine as the Player — so none of §5
applies to it. Two different uses, worth separating.

**As a verification baseline (always useful).** A CLI still is ground truth for "what should
this look like": render the same frame both ways and the diff *is* the export bug. This repo
keeps `npm run still <frames…>` ([`scripts/still.mjs`](../scripts/still.mjs)) for exactly that,
and every finding in §3 was confirmed by having the CLI still to compare against.

**As a delivery mechanism (think first).** It is tempting to sidestep the canvas renderer
entirely by shipping CLI renders. `remotion render` even accepts a **serve URL** in place of a
project directory, so a bundle the app publishes is renderable from any machine with Node and
nothing else — no checkout:

```bash
npx -p @remotion/cli remotion render https://<host>/bundle MyComposition out.mp4 \
  --props=./project.json --image-format=png --crf=15 --x264-preset=slow
```

That works (it was built and verified here). **The Workvivo film then removed it anyway** — the
in-browser render is the only way out of the wizard now. Worth knowing why before rebuilding it:
two export paths mean two fidelity stories, two sets of instructions, and a standing temptation
to fix bugs by routing around them instead of making the film export correctly. Fixing the
renderer-facing bugs in §3 was the better trade for a tool non-technical operators drive.

If you *do* build it, two implementation notes that cost real time:

- **`--public-path` must match the mount point at build time.** Webpack writes the path into
  `index.html` and every chunk URL, so a bundle built for `/` serves the *host app's* HTML where
  the renderer expects JavaScript, and the render dies on `Unexpected token '<'`. It cannot be
  fixed at serve time.
- **Build the bundle inside the Docker build**, so the image's own `.dockerignore` prunes
  `public/` for you. Building locally and copying it in shipped a 310 MB master video by
  accident; built in place it was ~100 MB.

**Two findings about Chromium renders themselves** — these are *not* web-renderer issues, they
affect any CLI/Studio render (including your verification stills), and the defaults are wrong
for UI-heavy film. Both are set in [`remotion.config.ts`](../remotion.config.ts):

- **Screenshot in PNG, not JPEG.** The renderer screenshots each frame before encoding, and with
  the default JPEG the quantization noise lands differently every frame — on flat colour and
  crisp text that reads as a faint **wavy shimmer**. Measured on a static hold, frame-to-frame
  luma difference was **1.55 (JPEG) vs 1.15 (PNG)**, at no measurable render-time cost (the
  render is decode-bound). `Config.setVideoImageFormat("png")`.
- **The default encode smears slow pans over fine UI.** Against a lossless frame dump of the
  worst window, SSIM was **0.9885** at the default `crf 18 / medium` and **0.9917** at
  `crf 15 / slow` — ~28% of the encode error gone for ~40% more file. `crf 13` cost another 29%
  size for a third of that gain, so 15 is the knee.

  *Honest limit:* this **reduces** the artifact rather than removing it. Slow sub-pixel panning
  over sharp UI is hard for H.264 at any sane bitrate; the remaining lever is the animation
  (snap drifts to whole pixels), not the encoder.

---

## 8. The quality knobs on the web renderer, and what they actually do

Measured against 4.0.496 while building a supersampled export mode — which was then
**built, tried and deleted**. Short version: **there is one real lever, it is expensive, and
it was not worth it.** Kept in full so the next person does not rediscover it from scratch.

**`videoBitrate` tops out as a string.** `"very-high"` is `Quality(4)` against mediabunny's
3 Mbps 1080p AVC reference — exactly 12 Mbps, and the highest name on the scale. Numbers are
accepted and are not capped, so past 12 Mbps you pass bits per second directly. Note the
string forms scale with resolution: `"very-high"` at 2880×1620 resolves to ~26 Mbps, so
pairing a string with `scale` changes two things at once.

**`hardwareAcceleration` did nothing here.** 60 frames through a bare `VideoEncoder`:

| | `prefer-hardware` | `prefer-software` |
|---|---|---|
| 1920×1080 | 165 fps | 166 fps |
| 2880×1620 | 86 fps | 81 fps |

Identical within noise — the browser is free to ignore the hint, and evidently does. The
hoped-for x264-like quality-per-bit win is not available this way.

**`scale` is the only lever that adds real detail**, because it changes rasterization rather
than compression: the DOM lays out at 1920×1080 CSS pixels but rasterizes at `width * scale`
device pixels, so edges and text are sampled properly instead of being snapped to a 1080p
grid the encoder can never un-snap. It costs accordingly — **~6× the render time at 1.5×**
(25–30 min against 4–5 on the 5300-frame cut), and the encoder is not why. At 86 fps the
whole cut encodes in about a minute; the time is DOM rasterization, which scales with pixel
count. *§7 calls this render decode-bound — that holds at scale 1, not above it.*

**`scale` cannot be undone in one pass.** `renderMediaOnWeb` has no downscale, and `onFrame`
— which hands you every `VideoFrame` before the encoder — validates what you return against
`Math.round(resolved.width * scale)` and throws if it differs. Supersampling to a 1080p
deliverable is therefore render-then-transcode, two encodes.

**Three things that bit in the second pass**, all found on a 25-frame fixture rather than at
the end of a real render — and worth keeping, because they apply to any transcode done in the
browser with mediabunny, not just this one:

- **mediabunny's `Conversion` cannot use `fastStart: 'reserve'`** — it throws "All tracks
  must specify maximumPacketCount", because reserving the moov box needs a packet count and
  `Conversion` adds the output tracks itself with no hook to supply one. The web renderer
  gets away with `'reserve'` only because it knows its own frame count. Use the default
  (moov at the end) unless you can afford `'in-memory'`.
- **An OPFS `FileSystemWritableFileStream` must be closed or the file is empty.**
  `execute()` resolving means the muxer handed over every byte, not that the target wrote
  them. Without the `close()` the pass completes, reports 100%, and returns a **0-byte MP4** —
  no error anywhere.
- **Audio survives for free.** Leave `audio` unset and `Conversion` copies the encoded AAC
  samples rather than re-encoding, so only the picture is ever second-generation.

**The verdict: no visible difference.** The mode shipped behind a toggle, was compared against
a direct render of the same cut, and nobody could see the improvement the theory predicted. It
was removed — a 30-minute option that looks the same as the 5-minute one is worse than not
having it, whatever the pixel maths says. `web/downscale.ts` and the mediabunny dependency went
with it.

The lesson generalises past this one experiment: rasterizing at 1.5x demonstrably samples more
detail, and the encoder demonstrably preserved it, and it still did not matter — because H.264
at 12 Mbps over this footage is not where the visible quality is being lost. Measure the
artifact you are actually chasing before building the fix for it. The artifact §7 names — slow
sub-pixel pans over sharp UI — is an *animation* problem, and supersampling was never going to
touch it.

---

## References

- [`web-renderer-limitations-vs-zva.md`](./web-renderer-limitations-vs-zva.md) — full unsupported-feature audit.
- [`studio-quality-render.md`](./studio-quality-render.md) — headless-Chromium export for pixel parity.
- [`src/video2/components/renderEnv.tsx`](../src/video2/components/renderEnv.tsx) — the gate helpers.

**Workvivo repo, 4.0.496 measurements (§3, §4, §7):**

- [`web/renderProbe.tsx`](../web/renderProbe.tsx) — the bisectable probe every measurement came from.
- [`src/components/InlineSvg.tsx`](../src/components/InlineSvg.tsx) · [`CursorArrow.tsx`](../src/components/CursorArrow.tsx) — export-safe SVG, and the `fill` prop for unpainted silhouettes.
- [`src/components/workvivo/WorkvivoLivestream.tsx`](../src/components/workvivo/WorkvivoLivestream.tsx) · [`WorkvivoCut.tsx`](../src/WorkvivoCut.tsx) (`MobileIrisOpen`) — the two `{progress > 0 && …}` gates, and why a collapsed box is not a clip.
- [`src/components/workvivo/symbolRegistry.tsx`](../src/components/workvivo/symbolRegistry.tsx) — sprite `<use>` → inlined paths, at ~110 symbols / ~104 call sites.
- [`src/components/workvivo/WorkvivoSpaceFeedStyles.css`](../src/components/workvivo/WorkvivoSpaceFeedStyles.css) — the `zoom` → `transform: scale()` conversion, with the shell's scaled height written out because `transform` no longer grows the box.
- [`scripts/still.mjs`](../scripts/still.mjs) — `npm run still <frames…>`, the Chromium baseline to diff exports against.
- [`remotion.config.ts`](../remotion.config.ts) — the PNG / `crf 15` / `slow` settings from §7.
- [`web/browserRender.ts`](../web/browserRender.ts) — the export path, and the §8 findings recorded where the next person will change the bitrate.
- [`web/framing.ts`](../web/framing.ts) — the crop-baking the missing `object-position` forced, and the maths behind it.
- Remotion: [client-side rendering limitations](https://www.remotion.dev/docs/client-side-rendering/limitations) · [`@remotion/media` support](https://www.remotion.dev/docs/media/support)

# Porting HTML refs to React components

Every UI screen in this project starts life as a standalone HTML file in `public/refs/`.
That is the right way to design them — it's the fastest loop for getting a static screen
looking correct, with no build step and no Remotion in the way.

This document covers the second half: turning that file into a native React component under
`src/components/workvivo/`.

**As of the conversion, no ref is loaded as a live `<IFrame>` anymore.** Ports exist for every
screen. New refs should be ported too — see [Why port at all](#why-port-at-all) for the
reasoning, and skip to [The recipe](#the-recipe) if you just want the steps.

---

## Why port at all

An iframe is a separate document. That single fact causes all of the following, every one of
which cost real debugging time in this project:

**Nothing inside it can read `useCurrentFrame()`.** Any element that needs to move must be
native. `QuoteCard.tsx` was `quote-card.html` in an iframe until the card had to open from a
collapsed pill.

**CSS `@keyframes` do not advance with the timeline.** They run on wall-clock time. In a
render each frame is captured independently, so a keyframe animation is either frozen at its
start or at an arbitrary point — not deterministic either way. `QuoteCard`'s halo pulses had
this exact bug: they were CSS keyframes and simply sat there. They are now a `pulse()` helper
driven off the frame.

**They multiply under `<CameraMotionBlur>`.** The blur renders its subtree once per sample.
At `shutterSamples: 24` that was 24 live iframe documents per frame, and one would
occasionally fail to load and produce a broken frame.

**Backgrounds are baked in.** Three refs had an opaque page fill (`#0A0E22`, `#E30613`) that
covered whatever was behind them. Each needed a `?transparent=1` query-param hook retrofitted
into its `<head>`.

**Nothing links the ref to the code.** Refs were edited on disk mid-session more than once —
`workvivo-live-replay.html` gained real photography, `workvivo-ai-compose-settings.html` had
its background changed — and nothing caught it. Ported components typecheck.

**State needs a message channel.** The post composer was driven by `postMessage` from a React
effect. Dispatched state means scrubbing backwards can land on the wrong view, because what
you see depends on the sequence of messages sent rather than on the current frame.

**They rasterise.** A scaled iframe is a scaled bitmap of a document. A scaled component is
scaled vectors and text.

The ref stays the design source. The port is what ships.

---

## The recipe

### 1. Split the file in two

The `<style>` block becomes `WorkvivoXStyles.css`. The `<body>` markup becomes
`WorkvivoX.tsx`. Copy the CSS values **verbatim** — resist the urge to tidy while porting, or
you will not be able to tell a port bug from a redesign.

### 2. Prefix every class

This is not optional. `WorkvivoStyles.css` already owns bare names like `.video`, `.kebab`,
`.caret`, `.chip`, `.close`. Two screens on one composition will collide and the failure looks
like a styling mystery, not a name clash.

Prefixes in use: `lv-` livestream, `lr-` live replay, `acs-` AI compose settings, `pc-` post
composer, `wm-` mobile home, `sp-` spaces directory, `wsp-` space page, `nl-` newsletters.

Prefix the SVG `<symbol id>`s too — `WorkvivoIcons.tsx` registers the unprefixed ids globally,
and duplicate ids mean whichever mounted first wins.

### 3. Re-scope the global resets

`*{box-sizing:border-box;margin:0;padding:0}` at the top of a ref applies to the whole
document. Scope it to your root:

```css
.lv-frame{ /* ...and set font-family here, which body used to do */ }
.lv-frame *{box-sizing:border-box;margin:0;padding:0}
```

Watch for `font-family` and `-webkit-font-smoothing`, which were on `body` and are easy to
lose. Buttons and inputs also need `font-family: inherit` — they don't inherit it by default.

### 4. Leave the `<body>` layout to the caller

Refs typically have:

```css
body{display:flex;justify-content:center;padding:40px 24px}
```

That is *stage* positioning, not component styling. Export the bare frame and let the scene
place it — a scene should be able to put the screen where it wants without fighting a baked-in
stage.

Where the old geometry has to be preserved exactly, reproduce those `body` rules on the
wrapper. **Two traps, both of which bit during the conversion:**

- **`AbsoluteFill` defaults to `flex-direction: column`.** A ref's `body` was the CSS default
  `row`. Copy `justify-content:center` onto an `AbsoluteFill` without stating the direction
  and it centres on the wrong axis — the screen pins to the left padding instead. State
  `flexDirection: "row"` explicitly.
- **`align-items` defaults to `stretch`.** A ref's `body` was content-height so there was
  nothing to stretch against; an `AbsoluteFill` is a full 1080. Use `alignItems: "flex-start"`
  unless you want the frame stretched.

### 5. Convert `@keyframes` to frame-driven values

Anything animated must move to `useCurrentFrame()`. Keep the same durations, delays and
curves — you are re-expressing the animation, not redesigning it.

`animation: slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both` becomes:

```tsx
const t = interpolate(
  frame - shownAt,
  [0.15 * fps, (0.15 + 0.5) * fps],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ENTER_EASE },
);
// style={{ opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}
```

`animation-fill-mode: both` is exactly `extrapolate: "clamp"` at each end.

**Multi-stop keyframes need care.** CSS eases each *segment* independently, so a three-stop
`0% / 60% / 100%` pop is two eased interpolations, not one:

```tsx
const scale = t < 0.6
  ? 0.8 + (1.12 - 0.8) * POP_EASE(t / 0.6)
  : 1.12 + (1 - 1.12) * POP_EASE((t - 0.6) / 0.4);
```

Easing the whole span once gives visibly different motion.

**Anchor entrances to when the element appeared, not to frame 0.** CSS restarts an animation
when an element goes `display:none → block`. `WorkvivoPostComposer` takes `composerShownAt`
for this — the composer animates at frame 22 and again at 92 when the Add grid hands back.
Pass `null` to render settled.

### 6. Convert interaction state to props

Refs use click handlers and class toggling. A video has no clicks — it has a timeline.
Replace the whole mechanism with one prop that is a **pure function of the frame**:

```tsx
export type PostComposerStage = "seed" | "composer" | "add" | "tray" | "values";
```

```tsx
let composerStage: PostComposerStage = "seed";
if (frame >= 145) composerStage = "tray";
else if (frame >= 115) composerStage = "values";
// ...
```

Derived, not dispatched: scrubbing backwards lands on the right view.

Note the modelling choice — the ref had a `CLOSE_VALUES` message, but "closed" is not a state,
it's a transition. Closing the values modal lands back on `tray`, so that's what the caller
passes. Enumerate what's on screen, not what happened.

### 7. Fix `position: fixed`

Inside an iframe, `fixed` means the iframe viewport. In the composition it escapes to the
whole frame. The post composer's scrim was `position:fixed;inset:0`; it is now `absolute`
inside the component root.

### 8. Port the geometry, not just the look

This is where the expensive bugs live, because they are invisible in the settled state.

The billboard swap used a hardcoded `531.43` where the correct value was one column pitch,
`452.857`. It overshot by 78px in both directions — a 174px hole between two cards and a third
driven 61px under its neighbour. It survived a long time because at `shiftProgress: 1` both
offsets are zero, so the settled row always looked right.

When a number comes from the layout, derive it in a comment:

```
.shell 1760 − .rail 235.714      = 1524.286 of .main
− .content padding 91.429 × 2    = 1341.428 of track
− 2 gaps of 17.143               = 1307.142 across three cards
=> card 435.714, pitch = 452.857
```

Also check `box-sizing`. Refs set `border-box` globally, so `.phone{width:393px;padding:7px}`
is **393 wide, not 407** — the padding is inside. Getting this wrong shifts every measurement
downstream of it.

### 9. Assets

`background: url('../img/...')` becomes `` `url('${staticFile("img/...")}')` ``. Relative
paths that worked from `public/refs/` will not resolve from a component.

### 10. Verify by render, not by eye

Render a still at the frame the screen is settled and compare against a pre-port render. Then
render a mid-transition frame — that's where axis and geometry mistakes show up, and where
the settled frame will happily lie to you.

```bash
npx remotion still L2VirginAirline out/check.png --frame=1295
```

---

## Checklist

- [ ] CSS in `WorkvivoXStyles.css`, markup in `WorkvivoX.tsx`, values copied verbatim
- [ ] Every class prefixed; every SVG `symbol id` prefixed
- [ ] `*` reset re-scoped to the component root
- [ ] `font-family` moved off `body`; `font-family: inherit` on buttons
- [ ] `<body>` layout left to the caller (or reproduced with explicit `flexDirection`)
- [ ] `@keyframes` re-expressed off `useCurrentFrame()`, same curves and delays
- [ ] Multi-stop keyframes eased per segment
- [ ] Entrances anchored to when the element appeared
- [ ] Interaction state replaced by a frame-derived prop
- [ ] `position: fixed` → `absolute`
- [ ] Layout constants derived in a comment, `box-sizing` checked
- [ ] Asset URLs through `staticFile()`
- [ ] Settled frame **and** a mid-transition frame rendered and compared

---

## Ported components

| Ref | Component | Prefix |
| --- | --- | --- |
| `workvivo-desktop.html` | `WorkvivoDesktop.tsx` | — |
| `workvivo-home.html` | `WorkvivoHomeContainer.tsx` + column parts | — |
| `workvivo-mobile-home.html` | `WorkvivoMobileHome.tsx` | `wm-` |
| `workvivo-catch-me-up.html` | `WorkvivoCatchMeUp.tsx` | — |
| `workvivo-livestream.html` | `WorkvivoLivestream.tsx` | `lv-` |
| `workvivo-live-replay.html` | `WorkvivoLiveReplay.tsx` | `lr-` |
| `workvivo-ai-compose-settings.html` | `WorkvivoAiComposeSettings.tsx` | `acs-` |
| `workvivo-post-composer.html` | `WorkvivoPostComposer.tsx` | `pc-` |
| `quote-card.html` | `QuoteCard.tsx` (in `src/`) | — |
| `content-list.html` | `ContentListScreen.tsx` (in `src/`) | — |

The `?transparent=1` hooks left in three refs are now unused by the app. They are harmless and
still useful for previewing a ref over a colour in a browser, but nothing in `src/` reads them.

## Keeping refs and ports in sync

Nothing enforces this — it is the one real cost of the split. The convention:

1. Change the ref first. It stays the design source.
2. Mirror into the port and its CSS.
3. Re-render the settled frame to confirm.

If a ref changes and its port doesn't, the video silently keeps the old design. That has
already happened in this project.

# Workvivo component gallery

A live catalogue of everything in `src/components/workvivo/` — 23 components, each
rendered from the real source (not a screenshot), grouped, searchable, and with its
props driveable from the detail panel.

```bash
npm run gallery
```

Opens on <http://localhost:5274>. `npm run gallery:build` writes a static bundle to
`build/gallery/`.

A rendered snapshot of the whole page lives at
[`docs/workvivo-component-library.png`](../docs/workvivo-component-library.png).

## How it works

Every component here is a Remotion component: they call `useCurrentFrame()` and would
throw if mounted in a plain React tree. So each one is rendered through `<Thumbnail>`
from `@remotion/player`, which supplies the Remotion context and does the scale-to-fit.
That is why each registry entry declares a composition `width`/`height`.

Nine of them also read `useCustomization()`, which throws outside a provider — so every
stage is wrapped in `<CustomizationProvider input={DEFAULT_INPUT_PROPS}>`. That is why
the gallery shows the approved Spotify baseline rather than a blank shell.

## Adding a component

Add an entry to `registry.tsx`:

```tsx
{
  id: "my-thing",
  name: "WorkvivoMyThing",
  file: "src/components/workvivo/WorkvivoMyThing.tsx",
  group: "Cards & panels",
  summary: "One or two sentences on what it is and what its props mean.",
  width: 600,
  height: 400,
  durationInFrames: 60,
  poster: 0,
  controls: [{ key: "open", label: "Open", kind: "toggle", init: true }],
  Stage: ({ open }) => (
    <Provided>
      <WorkvivoMyThing open={Boolean(open)} />
    </Provided>
  ),
}
```

`controls` become live inputs in the detail panel and are passed straight through as
`inputProps`, so the keys must match the component's prop names.

## Two things that bite

**Class-name collisions.** `WorkvivoStyles.css` is imported globally so the components
render exactly as they do in the cut — and it already owns `.card`, `.main`, `.content`
and `.grid`. Every gallery class is therefore `g-`-prefixed. Do not add an unprefixed
one; it will silently restyle the components the gallery exists to show.

**Regions need their parent's chain.** A component that is a slice of a bigger screen
lays out against its ancestors' classes. `HomeShell` rebuilds `.device > .app > .scaler`
(and `.shell` on request) for those. Give it only as much of the chain as the region
needs: `.shell` sets `height:975.714px; overflow:hidden`, which is right for a whole
screen and wrong for a 2457px feed column shown on its own.

## Sprite ids

The two icon sheets list their symbol ids by hand, because each sprite ships as one
opaque string that cannot be enumerated at runtime. After capturing new icons, refresh
the lists:

```bash
grep -o 'symbol id="[^"]*"' src/components/workvivo/WorkvivoIcons.tsx
```

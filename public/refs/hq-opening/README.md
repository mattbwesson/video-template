# HQ opening — first 10 seconds

Frames 0–300 of the `HQ` composition, extracted as a self-contained Remotion
project you can either run as-is or drop into another project.

Verified: stills rendered from this package at frames 100, 190, 250 and 290 are
**byte-identical** to the same frames rendered from the original `HQ`
composition. A reference render sits at `out/hq-opening.mp4`.

## Run it standalone

```bash
npm install
npm start
```

`npm run render` writes `out/hq-opening.mp4`.

## Drop it into another Remotion project

1. Copy `src/HQOpening.tsx`, `src/HQLockup.tsx`, `src/GradientMesh.tsx` and
   `src/gradientMeshGrid.ts` into your `src/`.
2. Copy the whole of `public/` into your `public/` (fonts at the root, artwork
   under `refs/`, audio at the root — `staticFile()` paths are relative to
   `public/`).
3. Register the composition. **It must be 30fps** — every timing below is a
   frame number at 30fps, so running it at 24 or 60 will reflow the whole piece.

   ```tsx
   import { HQOpening, HQ_OPENING_DURATION_IN_FRAMES, HQ_OPENING_FPS } from "./HQOpening";

   <Composition
     id="HQOpening"
     component={HQOpening}
     durationInFrames={HQ_OPENING_DURATION_IN_FRAMES}
     fps={HQ_OPENING_FPS}
     width={1920}
     height={1080}
   />
   ```

4. Add the ANGLE line to your `remotion.config.ts` — see *Rendering* below.

No npm dependencies beyond `remotion` and `react`. The original `HQ.tsx` imports
`MatchCut` from `zm-motion`, but never uses it, so nothing here needs that
package.

## What's in the 10 seconds

| Frame | Time | Beat |
|---|---|---|
| 0 | 0.00s | Mesh gradient up; `workvivo HQ` lockup centred, gradient stroke on the square turning once every 6s |
| 70 | 2.33s | Lockup springs up 60px; Fidelity National Financial mark fades and slides in beneath it |
| 120 | 4.00s | Purple highlight wipes left→right behind "employee experience platform" |
| 185 | 6.17s | Match cut **left** → "Connect" |
| 215 | 7.17s | Match cut **left** → "Engage" |
| 240 | 8.00s | Match cut **left** → "Inform" |
| 280 | 9.33s | Match cut **up** → lockup returns, 1.2× larger |
| 300 | 10.00s | End |

The match cut is a shared easing trick, not a Remotion transition: an
`Easing.bezier(0.81, -0.01, 0.35, 1)` ramp is remapped so both layers cover the
0.5→0.75 stretch of screen travel in zero time. That's the "cut". Each cut runs
`Math.round(0.75 * fps)` = 23 frames.

The Connect/Engage/Inform words are drawn twice: a gradient-filled copy, and a
flat white copy fading in over it, so the word warms to solid white before it
leaves.

**One rough edge:** 300 frames is exactly 10.0s but it cuts the last transition
one frame early — the lockup is still ~43px below centre at frame 299 and
settles at frame 303. Set `HQ_OPENING_DURATION_IN_FRAMES` to `304` if you want
the piece to end on a clean hold instead. Left at 300 because that's the ten
seconds you asked for.

## Assets

| Path | Used by |
|---|---|
| `public/HappyDisplay-SemiBold.otf` | Connect / Engage / Inform (weight 600) |
| `public/HappyDisplay-Regular.otf` | declared as weight 400; not hit in these 10s, kept so the `@font-face` block matches the original |
| `public/refs/workvivo-hq-nosquare.svg` | the wordmark inside `HQLockup` |
| `public/refs/workvivo-hq.svg` | reference only — `HQLockup` draws the rounded square in code, this is the artwork those numbers came from |
| `public/refs/fnf.png` | the Fidelity National Financial mark |
| `public/hq-opening-audio.m4a` | audio bed, see below |

The tagline uses `"Helvetica Neue", Helvetica, Arial, sans-serif` at weight 300
(Light) — a system font on macOS. On Linux or Lambda it will fall back to Arial
and the tagline will set slightly wider.

## What was dropped

The full composition layers a 331-second, 204MB background video
(`public/video/fnf-workvivo.mp4`) beneath everything. For these first 10 seconds
the mesh gradient covers it completely, so **nothing visual was lost** — but its
audio was audible. Rather than ship 204MB, the first 10.05s of that audio track
is included as `public/hq-opening-audio.m4a` (160KB) and played via `<Audio>`.

Pass `withAudio={false}` to run it silent. To go back to the real video layer,
put the mp4 in `public/video/`, drop the `<Audio>` element, and put this above
`<GradientMesh />`:

```tsx
<AbsoluteFill>
  <OffthreadVideo
    src={staticFile("video/fnf-workvivo.mp4")}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</AbsoluteFill>
```

Also dropped, because none of it is reachable before frame 300: the CTA pills
scene (550), the numbered-circles sidebar (950–1700), the Nike orbit scene
(2890), the Maybank typewriter scene (4455), all three whip-pans, and the
replacement voiceover at 1022.

## Rendering

`GradientMesh` is a WebGL fragment shader. Chromium's default headless renderer
draws **nothing**, so `remotion.config.ts` sets:

```ts
Config.setChromiumOpenGlRenderer("angle");
```

Keep that. Use `"swangle"` instead on Linux or Lambda. If you render and get a
flat CSS-gradient background instead of the shader, this is why — the component
falls back to `MESH_FALLBACK_BACKGROUND` when WebGL is unavailable.

The shader is driven off the frame number rather than `requestAnimationFrame`,
so renders are deterministic. `preserveDrawingBuffer: true` on the context is
load-bearing: Remotion screenshots the canvas after React paints.

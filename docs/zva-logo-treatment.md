# ZVA logo treatment — acceptance, cleanup, and fallback

How the Zoom Virtual Agent builder (builder 1, `/zva`) handles a customer logo, end to
end: what we accept, how we clean it up, where it appears in the video, and what happens
when there is no usable logo at all.

**Scope note:** in the ZVA composition the logo appears in **exactly one place** — the
sequence-0 opening title card (`src/ZvaIntroSequence.tsx`). The other brand-themed
scenes consume only the accent color. Everything below exists to make that one moment
look intentional for any logo a sales rep can find.

The other builders share the *validation* code but not the treatment: My Notes puts the
logo in its platform orbit, ZoomMate only uses it for the export filename, and both
skip the pixel cleanup entirely. This doc is ZVA-only.

---

## 1. Acceptance — three width tiers, one escape hatch

All rules live in [`web/shared/wizardImageValidation.ts`](../web/shared/wizardImageValidation.ts)
and run in `applyLogoFile` (`web/App.tsx:991`).

| Check | Rule | Outcome |
|---|---|---|
| Type | must be an image; SVG detected by mime **or** `.svg` name (`isSvgImageFile`, `:60`) | else reject |
| Size | ≤ 5 MB (`MAX_WIZARD_IMAGE_BYTES`, `:7`) | else reject |
| Width ≤ 399 px | `MIN_HARD_REJECT_WIDTH_PX` (`:16`) | **hard reject** — never accepted |
| 400–700 px | between hard-reject and `MIN_WIZARD_IMAGE_WIDTH_EXCLUSIVE_PX` (`:17`) | **warn** — usable only after the operator acknowledges a low-quality modal |
| > 700 px | | accept silently |

ZVA uses the tiered policy (`ZVA_LOGO_WIDTH_POLICY`, `:29`); **SVGs skip the width check
entirely** — vector art has no resolution to be too low (`validateWizardImageUpload`,
`:157`).

Why width matters here and not elsewhere: the title card renders the logo up to **42.5%
of composition width** (see §3). A 300px raster stretched to ~800px is visibly soft on
the single most brand-forward frame of the video.

**Rejection UX.** A refused file opens `LogoRejectedModal`
(`web/shared/LowQualityImageModal.tsx`), *not* inline rail text — because the next thing
that operator needs is the escape hatch, and the modal carries it:

- **"I can't find a high quality logo"** (`noHighQualityLogo`, `web/App.tsx:638`) is the
  only other way to satisfy required item 2 (`logoDone`, `:1791`). Ticking it switches
  the opening to the typographic generic title card (§4).
- Uploading a new file while the hatch is ticked unticks it — the file the user just
  chose wins.

---

## 2. Cleanup pipeline — canvas in, PNG object URL out

Every accepted logo is reprocessed whenever the file or an option toggles
(effect at `web/App.tsx:1160`, guarded by a request counter so a stale async pass can't
clobber a newer one). The chain, `logoFileToObjectUrl` → `processLogoRaster`
(`web/App.tsx:509/437`):

### 2.1 Rasterize onto a canvas (`drawImageFileToCanvas`, `:328`)

- **Rasters** decode via `createImageBitmap` at natural size.
- **SVGs** are rasterized at a size derived from their own `width`/`height`/`viewBox`
  (`svgRasterSizeFromText`, `:271`), scaled so the longest side is
  `SVG_LOGO_RASTER_MAX_DIMENSION_PX = 1200` (`:98`). Percentage lengths are ignored;
  a malformed SVG falls through and fails at image load with a clear error. SVGs are
  *always* rasterized — the composition and both export paths then deal only in PNG.

### 2.2 Remove white matte — **on by default** (`removeLogoWhiteBackground`, default `true`)

Most logos sales reps find are JPEG/PNG on a white box; the title card sits on a dark
animated background, so the box must go. `removeWhiteMatteFromLogoPixel`
(`web/App.tsx:385`) runs per pixel:

1. Pixels that are near-white **and** near-gray (`min(r,g,b) ≥ 246`, chroma ≤ 28) →
   fully transparent.
2. Pixels that *look like matte* (high luma with low distance-from-white, or very high
   luma with low chroma) get **un-premultiplied**: alpha becomes proportional to
   distance-from-white, and RGB is recovered as if the color had been composited over
   white — so anti-aliased edges keep their true color instead of a white fringe.
3. Everything else is untouched — a logo that legitimately *contains* white interior
   detail keeps it, because the heuristics require low chroma.

### 2.3 Force white — off by default (`makeLogoWhite`)

For dark logos that vanish on the dark card: every pixel with alpha ≥ 8 becomes pure
white, alpha preserved (`web/App.tsx:467`). Shape survives, color goes.

### 2.4 Crop to content (`web/App.tsx:477`)

The alpha bounding box (threshold 8) is computed and the canvas cropped to it — so a
logo shipped inside a huge transparent artboard still fills the card. If cropping fails
(no opaque pixels) the unmodified image is kept.

### 2.5 Output

Canvas → PNG blob → `URL.createObjectURL`. Failures degrade deliberately: a raster that
can't be processed falls back to the **raw file** as an object URL; a failed SVG is a
surfaced error (there is no usable raw fallback for an SVG — see §5).

The processed URL participates in the Remotion `<Player key>` (`web/App.tsx:1269`), so a
new logo or toggled option remounts the player rather than showing a stale frame.

---

## 3. On-screen treatment — the glass card (`src/ZvaIntroSequence.tsx`)

The intro reads the logo from the brand theme context (`BrandThemeProvider`,
`src/brandTheme.tsx:84`; wired at `src/CustomZVA.tsx:472`). With a logo present:

- Fallback chain first: an empty/whitespace `brandLogoSrc` falls back to the **bundled
  default logo** `staticFile("img/logo.png")` (`src/ZvaIntroSequence.tsx:2293`) — the
  Player never renders an empty card during the wizard phase.
- The logo sits in a semi-transparent "glass" panel (`.zva-opening-logo-glass`,
  `src/index.css:16`) — deliberately **no `backdrop-filter`** (unreliable across render
  paths); depth comes from borders + shadows, plus an animated sheen band
  (`.zva-opening-logo-sheen`). The in-browser export relaxes the sheen's
  `mix-blend-mode`/blur via the `.zva-csr` overrides (`src/zvaClientSideRender.css:23`).
- **Sizing is aspect-preserving contain**, never a fixed box: `width/height: auto` with
  `maxWidth = 42.5%` of composition width and `maxHeight = 26%` of height
  (`INTRO_LOGO_MAX_WIDTH_FRAC` / `INTRO_LOGO_MAX_HEIGHT_FRAC`,
  `src/ZvaIntroSequence.tsx:28`). Wordmarks bind on width, square marks on height;
  nothing is ever stretched or letterboxed. Glass padding is also fractional
  (`:30-31`), so the card scales with any composition size.
- The card rides the intro's eased vertical motion (`introLogoYOffset`) and exits with
  the sequence-0 blur+dissolve outro.

---

## 4. The no-logo path — `GenericIntroTitleCard`

When `useGenericTitleCard` is true the intro branches **before** the glass card
(`src/ZvaIntroSequence.tsx:2377`) into a typographic card (`:2192`):

- Renders **"At {Company}…"** in HappyDisplay 600 — styled as a deliberate typographic
  moment, not a missing-asset placeholder.
- If the company name is still the catalog baseline sentinel
  (`ZVA_CATALOG_BASELINE_COMPANY`), it says **"At your company…"** so the seed demo
  brand never leaks on screen.
- Font size is fitted to one line for short/medium names
  (`fitFontPxToWidth` with `averageGlyphWidthEm: 0.72`, floor 32px), with a 2-line
  clamp as the guard for very long names.
- It tracks the same `translateY` animation as the logo card, so the opening
  choreography is identical either way.

**Wiring nuance worth knowing:** the wizard still passes `brandLogoSrc: brandLogoUrl`
in `inputProps` even when the hatch is ticked (`web/App.tsx:2006/2011`) — suppression
happens via the `useGenericTitleCard` flag in the composition, not by nulling the
source. (The rail preview does null it: `web/App.tsx:1840`.)

---

## 5. Render-path handling

The processed logo is a `blob:` object URL, which only the creating page can read, so
both export paths materialize it:

- **In-browser export:** `prepareInputPropsForCloudRender`
  (`web/prepareInputPropsForRender.ts:117`) converts `blob:` → data URL for
  `brandLogoSrc` (and the other uploaded assets) before the job snapshot is queued.
- **Node render:** `normalizeInputPropsForNodeRender`
  (`server/normalizeInputPropsForRender.ts:68`) resolves `/public/...` and localhost
  URLs to filesystem data URLs, since the Remotion bundle's origin isn't the Vite dev
  server.

Because §2 always outputs **PNG**, the export never sees an SVG logo — which sidesteps
the web-renderer's SVG-in-`<img>` limitations documented in
[`browser-render-best-practices.md`](./browser-render-best-practices.md) ("Asset fix —
SVG icons") entirely. This is a load-bearing property: if you ever bypass the raster
step, that doc's intrinsic-size and `<style>`-fill rules start applying to customer
uploads you don't control.

---

## 6. Behaviors to know before changing anything

- **White-matte removal defaults ON.** A logo with a legitimate white/very-light field
  can lose it; the checkbox exists for exactly that case. Don't "fix" the default —
  white-boxed JPEGs are the overwhelmingly common upload.
- **Crop changes the aspect ratio** relative to the uploaded file (by design — §2.4).
  Any future layout that assumes the file's original dimensions will be wrong.
- **The width tiers are ZVA-specific.** Builders 2/3 use a simple >400px cutoff;
  ZoomMate accepts anything (its logo is never composited). Changing the shared
  validator's defaults changes ZVA only if you touch `ZVA_LOGO_WIDTH_POLICY`.
- **SVG failures are terminal, raster failures are not.** A raster that fails
  processing ships raw; a broken SVG surfaces an error because shipping raw SVG would
  re-open the export limitations above.
- **The bundled `img/logo.png` fallback** means "no logo yet" and "generic card" are
  different states: pre-upload the demo logo shows; only the explicit escape hatch
  produces the typographic card.

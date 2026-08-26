# Workvivo component library

Everything Workvivo-shaped lives here. Import through the barrel, not the individual
files:

```tsx
import { WorkvivoPhonesScene, WorkvivoSpacePage } from "./components/workvivo";
```

## Conventions

**Prefix every class.** Each component owns a namespace and never reaches outside it:
`wvd-` desktop, `wm-` mobile, `wsp-` space page, `wbb-` billboard screen, `wp-` phones,
`lv-` livestream. Only `WorkvivoStyles.css` declares anything global (`*`, `body`), and
nearly every scene already depends on it — which is what makes the barrel safe despite
each module importing its stylesheet as a side effect.

**Never author SVG path data.** Glyphs come from the bundled icon libraries via
`<use href="#id">`. See _Icon provenance_ below.

**4px grid, and mind the platform split.** Desktop is Inter at ~1.43× line-height;
mobile is SF Pro at ~1.5×. Don't flatten one onto the other.

**Two purples, not interchangeable.** `#6103ED` is Workvivo's semantic primary — buttons,
links, active tabs, primary icons. `#7F39F3` is the _per-tenant customer brand slot_ —
banners, avatar fills, tiles. It varies per customer and must never be used for a button.

## Standalone scenes

These take plain props and need no `CustomizationProvider`. Each is registered as a
Remotion composition in `src/Root.tsx`.

| Component | Size | What it is |
|---|---|---|
| `WorkvivoSpacePage` | 1440×1480 | Space page — collapsed nav rail, tenant banner, space header with tabs, and the 270 / 568 / 269 three-column body |
| `WorkvivoBillboardScreen` | 1320×742 | Billboards digital-signage display — large story, article and event cards, anniversary and QR panels |
| `WorkvivoPhonesScene` | 1920×1080 | Two phones on a purple field — Chat on the left, a video call on the right |
| `WorkvivoNewsletterBuilder` | 1920×1080 | Newsletter builder — component palette, email canvas and save bar on the tenant brand field |
| `WorkvivoWidgetStore` | 1920×1080 | Widget Store — category rail, Discover pane with search and promo hero, and the tinted category grid |
| `WorkvivoIntegrationsMarketplace` | 1920×1080 | Integrations Marketplace — single centered card (no rail) with a help notice, promo hero using `marketplace-header.jpg`, search, and the tinted category grid |
| `WorkvivoIntegrationsList` | 1920×1080 | Integrations List — connector cards full-bleed on the brand field, using the real app-tile logos in `public/img/integrations/` |
| `WorkvivoSeerInsights` | 1920×1080 | Seer Insights — survey-analysis screen with sentiment topic cards and comment list |
| `WorkvivoSeerManagerInsights` | 1920×1080 | Seer Manager Insights — overview, score donuts, timeline and direct reports |
| `WorkvivoSeerSurveyMobile` | 1920×1080 | The Seer survey on mobile — fits to height, being a phone |
| `WorkvivoCustomerGrid` | 1920×1080 | Customer Logo Wall — 5×11 grid of white client cards on glowing brand red mesh with center Workvivo mark |

Each exposes its images and brand colour as props so a customer run can swap them
without touching the layout — e.g. `WorkvivoBillboardScreen` takes `brand`, `logoSrc`,
`heroSrc`, `qrSrc`; `WorkvivoPhonesScene` takes `bubble`, `callerSrc`, `selfSrc`.

`WorkvivoPhonesScene` reuses the mobile library rather than re-deriving it: `.wm-phone`
(393×852 shell, 16.5px bezel, 35.5px screen radius), `.wm-status` / `.wm-time` /
`.wm-sysico`, the `#i-signal` / `#i-wifi` / `#i-battery` symbols out of
`WorkvivoMobileSvgDefs`, and `.wv-glass-phone` for the bezel.

## Provider-backed components

`WorkvivoDesktop`, `WorkvivoBillboards`, `WorkvivoSidebar`, `WorkvivoTopbar`,
`WorkvivoMobileHome`, `WorkvivoLeftColumn` and `WorkvivoRightColumn` read
`useCustomization()` and must be rendered inside a `CustomizationProvider`.

## Icon provenance

Three sources, deliberately kept separate — mixing them is how a build starts looking
subtly wrong.

- **`i-ui-*` — `WorkvivoIcons.tsx`.** Workvivo's own glyphs, captured from live DOM and
  Figma exports. The default; reach here first.
- **`i-zm-*` — `ZoomCallIcons.tsx`.** Six glyphs borrowed from the *Zoom* library
  (phone, back, ellipsis, ai-companion, mic, and the Team Chat set). The Workvivo library
  is nav-rail and feed focused and has no meeting chrome at all, so a call surface has to
  borrow. The prefix keeps that visible at every call site. Never merge these two sprites.
- **Drawn from primitives.** A number of glyphs exist in neither library: the video
  camera, switch-camera, the muted-mic slash, the composer plus and paper-plane send
  (`WorkvivoPhonesScene`); the chevrons (`WorkvivoSpacePage`); and the whole layout
  palette plus the four toolbar controls (`WorkvivoNewsletterBuilder`); and the close X
  and link arrow (`WorkvivoWidgetStore`). They are built
  from `rect` / `ellipse` / `circle` / `line` / `polygon` / `polyline` only, so they read
  as generic chrome rather than as fake brand art, and they keep the icon checker clean.

  For the builder's layout glyphs this is the *correct* answer rather than a fallback —
  a "2 Columns" icon is literally two rectangles, and there is nothing brand-specific to
  get wrong. Two rules that came out of drawing them: a curved arrow sampled as a
  `polyline` beats a `circle` with `stroke-dasharray`, which reads as a plain circle at
  17px and gives you no reliable endpoint to hang an arrowhead on; and an eye is an
  `ellipse` plus a `circle`, not a path.

To verify a component authored no path data:

```bash
python3 ~/.claude/skills/workvivo-ui/scripts/icon_lookup.py --check src/components/workvivo/WorkvivoPhonesScene.tsx
```

## Derived assets

Several files in `public/img/workvivo/` are captured Workvivo cards, not plain
photography — they carry baked-in chrome (headers, date badges, "View More" links,
category pills) that shows up when used as content imagery. These cleaned derivatives
exist for that reason:

| File | Derived from | Why |
|---|---|---|
| `event_kickoff_art.png` | `events_banner_art.png` | Date badge cloned out; it collided with the Event tag |
| `offsite_smile.png` | `space_3.png` | "Corporate" pill and star cropped off |
| `call_caller.png` | frame from `webinar.mp4` | The repo has no portrait suitable for a full-bleed video feed |
| `call_self.png` | `pages_2.png` | A second, different face for the self view |

Check any `img/workvivo/*.png` for baked-in chrome before using it as a photo.

⚠️ Every `avatar-*.jpeg` / `vatar-2.jpeg` in `public/img/` is the same stock photo of one
recognisable actor. Fine at 20px in a feed; not fine anywhere a face is the subject.

## Seer components — extracted, not authored

Most `WorkvivoSeer*` were lifted out of the Seer pitch deck (`seer-pitch-deck.html`)
rather than rebuilt, so they match that deck exactly. Things to know before editing them:

- **The markup and CSS are the deck's**, kept under the deck's own prefixes (`sid-`,
  `mid-`, `mis-`) so a re-extract from an updated deck diffs cleanly. Don't rename them.
- **The inline SVGs are the deck's icons**, a generic open-source line set — *not*
  Workvivo library glyphs. The workvivo-ui icon checker will flag them, correctly.
- **Each bundler asset became its own `--wsi-*` custom property** filled by
  `staticFile()`, because CSS `url()` can't resolve a Remotion static path. Keep them
  separate: collapsing them onto one property paints the seer wordmark into every avatar.
- **The deck's `:root` variables are scoped to a `.wsi-*` root class**, so importing a
  Seer stylesheet can't repaint the rest of the library.
- **Interactive state is not captured.** The deck drives some content from its own
  JavaScript (`data-mis-prev` / `data-mis-next` and friends), so slots it fills at
  runtime — the survey's question text and rating scale, for instance — come out empty in
  a static extract. Fill them in by hand if you need them populated.

Assets live in `public/img/seer/`, named by their bundler UUID prefix.

Two are **not** deck extracts and none of the above applies to them. `WorkvivoSeerRater`
and `WorkvivoSeerInsights` are built from product screenshots against Workvivo's own
chrome — `WorkvivoTopbar` plus `WorkvivoSeerRail` — under the normal `wsr-` / `wsi-`
prefixes, with library icons. `WorkvivoSeerInsights` was a deck extract until the
Comments-tab screenshot landed showing it inside Workvivo's chrome rather than the deck's
own navy nav; the `sid-*` markup and the deck's `.seer-radar` / `.seer-phone-comp` /
`.seer-frame` rules went with that change.

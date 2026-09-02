# How a video becomes customizable — implementation guide

This doc walks through how the four builders implement LLM-driven customization: how a
piece of on-screen content gets **marked** as customizable, how the set of slots is
**passed to the model** efficiently, and how **colors and images** — things a language
model can't generate — are handled. It ends with what we'd do differently starting from
scratch.

**Audience:** an LLM (or engineer) adding customization to a new video, or maintaining an
existing one. Read this before touching `server/llm/*` or any `*CopyData.ts`.

**Related docs (reference, don't re-read here):**
- [`llm-copy-pipeline.md`](./llm-copy-pipeline.md) — one-picture Mermaid flow of the ZVA pipeline.
- [`Appendix-B-Copy-Catalog.md`](./Appendix-B-Copy-Catalog.md) — every ZVA slot's field guide + examples.
- [`TECHNICAL-OVERVIEW.md`](./TECHNICAL-OVERVIEW.md) — where things run (dev/prod, API surface).
- [`browser-render-best-practices.md`](./browser-render-best-practices.md) — why several caps are pixel-motivated.

---

## 1. Marking what gets customized — two generations of slot shape

There are two patterns in the repo. Know which one you're in before editing anything.

### Generation 1: ZVA (builder 1) — flat catalog of self-describing rows

The video's entire script is a JSON array on disk (`public/zva-video-copy-llm.json`,
38 rows). Each row is a `ZvaCopyEntry` (`src/copyCatalog.ts:19`):

```ts
export type ZvaCopyEntry = {
  id: string;                    // "seq2.hero_greeting_en" — sequence-scoped, stable
  text: string;                  // current wording (baseline until the LLM rewrites it)
  max_character_count: number;   // per-row cap
  description: string;           // the field guide — this IS the prompt for the row
  highlight_phrase_1?: string;   // teal highlights; must be exact substrings of `text`
  highlight_phrase_2?: string;
  highlight_phrase_extra?: ZvaHighlightExtraInput[];
};
```

Key properties of this shape:

- **The slot is the row.** A sequence component asks for text by id
  (`getCopy` / `getCopyLive`, `src/copyCatalog.ts:650/661`) — anything not in the
  catalog is not customizable, full stop.
- **Metadata rides with the data.** The `description` doubles as the model-facing field
  guide, `max_character_count` as the enforcement cap. Row 0 additionally carries a
  `_narrative_context` preamble (extracted at `server/llm/zvaCopy.ts:40`) that gives the
  model the story thread all rows must share.
- **The baseline is a real approved demo.** The shipped catalog names a real brand; the
  wizard find-and-replaces that name (`substituteBrandInCatalog`, `web/App.tsx:136`)
  the moment the operator types a company, so the preview reads correctly *before* any
  LLM call. `ZVA_CATALOG_BASELINE_COMPANY` is parsed out of the hero line at startup
  (`src/zvaWizardDefaults.ts:38`), so swapping the baseline demo never needs a code change.
- **Highlights are constrained substrings**, capped at 60 chars
  (`MAX_HIGHLIGHT_PHRASE_CHARS`, `src/copyCatalog.ts:40`), with
  `stripHighlightMetadataFromText` (`:46`) cleaning model leakage like a literal
  "Highlighted terms:" suffix out of body text.

### Generation 2: builders 2–4 — one typed object per video

My Notes, Auto Receptionist, and ZoomMate abandoned ids entirely. The whole script is a
single TypeScript object; the type *is* the slot map:

| Video | Type | Defaults | Limits table | Merge |
|---|---|---|---|---|
| My Notes | `MyNotesCopy` (`src/video2/myNotesCopyData.ts:15`) | `:45` | `MY_NOTES_COPY_LIMITS` `:107` | `mergeMyNotesCopy` `:199` |
| Auto Receptionist | `AutoReceptionistCopy` (`src/video3/autoReceptionistCopyData.ts:19`) | — | `:102` | `mergeAutoReceptionistCopy` `:143` |
| ZoomMate | `Claude2Copy` (`src/video4/claude2CopyData.ts:79`) | — | `CLAUDE2_COPY_LIMITS` `:364` | `mergeClaude2Copy` `:576` |

The ZoomMate shape is the most refined and is the template for new videos:

- **Tuple types lock slot counts**: `meetings: [M, M, M]`,
  `responseBlocks: [B, B, B, B, B]` — the model *cannot* return four meetings, and the
  merge can't produce a hole.
- **Sub-types encode presentation constraints**, not just text: `Claude2ResponseBlock`
  carries `stream: "chunk" | "typewriter"` (which reveal animation plays), `Claude2Card`
  is `{n, t, d, s?}` (number, title, description, sub).
- **Non-customizable things are simply not in the type.** Fixed transcript speakers
  (`MY_NOTES_TRANSCRIPT_SPEAKERS`, `src/video2/myNotesCopyData.ts:94`) live outside the
  copy object, so no prompt engineering is needed to protect them.
- **Merging partials over defaults** with array lengths locked to the default's length
  means a missing or malformed slot degrades to approved baseline copy, never a blank.

### Length governance (both generations)

Caps exist because text lives in pixel-budgeted UI (several `CLAUDE2_COPY_LIMITS`
entries carry the geometry rationale in comments — e.g. `prompt: 100` because of the
card's two-line layout). Enforcement is layered, gentlest first:

1. **Rewrite, don't cut** — ZoomMate's `repairOverlongClaude2Fields`
   (`server/llm/claude2Copy.ts:168`) makes one small no-search follow-up call asking the
   model to rewrite the offending fields under their caps; the log line
   `rewrite applied {allFit:true}` is this pass succeeding.
2. **Word-aware truncation** — the `cap()` chain in `src/video4/claude2CopyData.ts:427-508`:
   `truncateAtWord` prefers a sentence boundary past half the budget,
   `finishTruncatedClause` strips dangling connectives and re-closes the sentence.
3. **Caps apply exactly once, server-side.** Every composition re-merges with
   `capLengths: false` (`src/video4/Claude2.tsx:82` and equivalents) so an operator's
   inline edit is never re-truncated behind their back.

---

## 2. Passing slots to the model efficiently

All four builders use the OpenAI **Responses API** through one config module,
`server/llm/client.ts` — model `gpt-5.6-luna` by default (override with `OPENAI_MODEL`),
`reasoning.effort` `low` for the research call and `none` for the ten writing calls
(`OPENAI_REASONING_EFFORT` / `OPENAI_WRITE_REASONING_EFFORT`), hosted web search on with
`search_context_size: "low"`, `max_output_tokens` 5–6k. Cheap, fast, and researched — the
search step is what makes the copy company-specific rather than mad-libs.

The two effort settings are separate and must stay that way: the lowest levels are
rejected or quietly degraded when `web_search` is attached, which `searchSafeEffort`
exists to catch. See [research-pass-performance.md §9](./research-pass-performance.md)
for what happens when a model does not accept the value it is given — it does not look
like an error, and [llm-model-migration.md](./llm-model-migration.md) for the migration
itself, written to be reusable on other projects.

Two prompting strategies:

### ZVA: one JSON line per row + strict structured outputs

`buildPrompt` (`server/llm/zvaCopy.ts:46`) emits, per active row:

```json
{"id": "...", "description": "...", "max_character_count": 90, "baseline_text": "..."}
```

— nothing else. The model returns the same rows rewritten, constrained by a **strict
`json_schema`** (`server/llm/client.ts:255`), so parsing can't fail structurally.
Follow-up repair passes are surgical and cheap (JSON repair, Sequence-0 violation
repair driven by `collectSeq0Violations`, a single-line convo-start patch), each
optionally on a cheaper per-task model (`MODEL_JSON_REPAIR` etc., `:163`).

**Why this is the efficient shape:** the prompt carries only *mutable* content plus the
minimum guide per row; static story context is one shared preamble; the response is
schema-locked so there is no retry-on-parse loop in the common case.

### Builders 2–4: paste the default object as the template

`JSON.stringify(DEFAULT_*_COPY, null, 2)` goes into the user message as "fill this
exact shape"; caps are enumerated in the instructions; the reply is free-form JSON
parsed with fence-stripping + `jsonrepair` fallback (`server/llm/claude2Copy.ts:45`).
Merging happens server-side in the route (`server/previewApiRoutes.ts:781` for
ZoomMate) with `capLengths: true`.

This is simpler to author but weaker: the shape is only *suggested*, so each video needs
a corrective validator — `validateClaude2Copy` (`server/llm/claude2Copy.ts:83`) drops
out-of-enum connectors, checks summary bullets mirror section titles, and strips
deck-request sentences out of the prompt line. Corrections are logged as `issues`,
never fatal.

---

## 3. Colors — one accent hex, clamped once, inlined everywhere

The operator picks exactly **one color**: `brandAccentHex`. The whole theming story:

1. **Clamp at the picker.** `clampBrandAccentHex` (`web/brandAccentHex.ts:56`)
   iteratively darkens (×0.88) until WCAG relative luminance ≤ 0.78 — so white text on
   the accent always reads. The OS color picker guarantees `#rrggbb`, so no parsing.
2. **Travel as a plain string** in `inputProps` — serializable, render-safe.
3. **Normalize + distribute via React context**, not CSS variables:
   `BrandThemeProvider` (`src/brandTheme.tsx:44`) for ZVA;
   `autoReceptionistBrandContext.tsx:17` for builder 3, whose `buildPalette`/`shade`
   helpers derive a 4-swatch palette (fills, gradients, rgba stops) from the single hex.
4. **Consume as per-element inline styles** (`backgroundColor`, SVG `stroke`/`fill`).
   No stylesheet indirection — the web renderer rasterizes inline styles most reliably,
   and Remotion re-renders per frame anyway.

The LLM never sees or produces colors. Color is operator-supplied, deterministic, and
validated by construction.

> **Known gap:** ZoomMate collects `brandAccentHex` in the wizard and passes it to the
> composition, but nothing is themed yet (`src/video4/Claude2.tsx:66` — "accepted so
> the builder can pass it; nothing is themed yet").

---

## 4. Images — the model picks from a menu, never a file

Two distinct problems: operator-supplied images (logo, photos) and model-influenced
imagery (which product icon appears in a scene).

### Operator images: data URLs at the edge

Builders 2–4 read uploads with `FileReader.readAsDataURL` immediately
(`web/SecondBuilderPage.tsx:208`, rationale in the comment: data URLs render in the
Player **and** the in-browser export, with no blob lifetime to manage). ZVA is the
legacy outlier: it uses `URL.createObjectURL` blob URLs (`web/App.tsx:521`) plus canvas
preprocessing (SVG rasterization, white-matte removal, force-white), which drags a
revoke lifecycle through the whole page and requires a conversion step at render time:

- Browser render path: `prepareInputPropsForCloudRender`
  (`web/prepareInputPropsForRender.ts:117`) converts `blob:` → data URL for the logo,
  attachment, glass photos, and audio — but deliberately leaves HTTP audio URLs alone
  (Remotion `<Audio>` rejects `data:` audio, comment at `:124`).
- Node render path: `normalizeInputPropsForNodeRender`
  (`server/normalizeInputPropsForRender.ts:68`) resolves `/public/...` and localhost
  URLs to filesystem data URLs, because the Remotion bundle's origin isn't Vite.

### Model-influenced imagery: closed enums → asset lookup

The ZoomMate connector chip is the pattern. The model can't generate an image, so it
never emits a path — it emits a **name from a closed set**, used as a lookup key:

1. `ZOOMMATE_CONNECTORS` — 21 real integrations (`src/video4/claude2Scenarios.ts:25`)
   with a type guard (`isZoommateConnector`, `:51`).
2. The prompt injects the enum **with capability descriptions**
   (`CONNECTOR_DESCRIPTION`, `:110`, rendered at `server/llm/claude2Copy.ts:295`), so
   the pick is semantic ("this company would attach dispatch data → Google Drive"), not
   name-vibes.
3. `CONNECTOR_ICON_PATH` (`:81`) maps every member to real artwork under
   `public/claude2/img/connectors/` — an exhaustive `Record`, so there's no invented
   fallback tile. Paths are plain strings (server-importable); the composition applies
   `staticFile` at the call site (`src/video4/ZoommateStepsJumbo.tsx:329`).
4. Belt and braces: the validator nulls unknown connectors
   (`server/llm/claude2Copy.ts:87`) and `server/testStaticMedia.ts` asserts every
   mapped file exists on disk.

Use this pattern for **anything** visual the model should influence: backgrounds,
scene variants, icon sets. Enum in, lookup out, validator in between.

---

## 5. If we were starting from scratch

What we'd keep, and what we'd change. Roughly ordered by value.

1. **One slot shape for every video: the typed object.** ZVA's id-catalog was the right
   idea in 2024 (it's field-guide-rich and prompt-efficient), but two conventions means
   every server/route/wizard feature is written twice. Migrate toward
   `Claude2Copy`-style: tuple-locked types, defaults, one limits table, one merge
   helper. The catalog's best idea — per-slot `description` — should come along
   (see #2).

2. **Colocate the metadata with the slot.** Today a slot's cap lives in a limits table,
   its field guide lives in a prompt string, and its type lives in a third place —
   ZoomMate even splits caps across two tables (`CLAUDE2_COPY_LIMITS` +
   `TYPED_FIELD_LIMITS`). Define each slot once:

   ```ts
   const slots = defineCopy({
     prompt: slot({ max: 100, guide: "The user's ask; must contain three questions…" }),
     ...
   });
   ```

   and *derive* the default object, the limits table, the prompt's field guides, and
   the JSON schema from it. One source of truth; adding a slot is one edit.

3. **Structured outputs everywhere.** Only ZVA uses a strict `json_schema`; builders
   2–4 paste-a-template and hope, then need `jsonrepair` + corrective validators. With
   a Zod schema per video (derivable from #2), you get strict decoding **and** the
   validator for free, and the `jsonrepair` path becomes dead code.

4. **Keep the deterministic substitution layer.** ZVA's
   find-and-replace-the-baseline-brand trick is underrated: the preview personalizes
   instantly, offline, reversibly — before any model call. Generalize it: every video's
   defaults should name one canonical baseline company that a pure function can swap.

5. **Keep — and generalize — rewrite-before-truncate.** The overlong-field repair pass
   (`repairOverlongClaude2Fields`) produces visibly better copy than truncation for one
   tiny extra call. It should be shared infrastructure driven by the slot table, not
   re-implemented per video.

6. **One brand-theme context.** Three accent implementations exist (ZVA's
   `BrandThemeProvider`, video 3's context + palette derivation, video 4's accepted-but-
   ignored prop). A single shared `BrandTheme` with `accentHex` + derived palette
   (`shade`, `rgba`, contrast-safe text color) ends the drift — and would have prevented
   the ZoomMate gap where the wizard collects a color the video ignores.

7. **Data URLs at the wizard edge, everywhere.** The blob-URL lifecycle in `web/App.tsx`
   (revoke-on-replace, revoke-on-unmount, convert-at-render) is the single largest
   source of incidental complexity in that file. Builders 2–4 proved data URLs are
   fine. Preprocessing (matte removal, rasterization) can still run on a canvas first —
   just export to a data URL at the end.

8. **Closed enums for every model-visual decision** (#4's pattern), including future
   ones: scene variants, background choices, voice selection. If the model's output
   feeds anything but a text node, it should be an enum with a validator and an
   exhaustive lookup.

9. **Keep the cheap-model + low-effort + low-search-context defaults.** The latency
   wins in `docs/LLM FIXES.md` are real and already partially implemented
   (`server/llm/client.ts`). A new build should start there, not at
   full-effort/full-context.

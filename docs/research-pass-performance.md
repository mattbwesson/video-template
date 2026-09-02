# The research and copywriting pass

What happens when the wizard turns a company name into a film's worth of copy, why it used
to take 87 seconds, and what it takes now.

Written for someone who has never opened this code. If you only want the numbers, skip to
[§4](#4-before-and-after).

---

## 1. What the pass is for

The film is a three-and-a-half-minute tour of Workvivo with roughly **133 pieces of writing
in it** — headlines, feed posts, space names, chat messages, article bodies, a shout-out.
The approved demo fills all of them with copy about a fictional company.

When an operator types a real customer's name into the wizard, every one of those 133 pieces
has to be rewritten to be *true of that company* and to *sound like them*. That is what this
pass does. It is the slowest thing the wizard does by a wide margin, and it is the only part
that talks to an LLM.

**Where it lives:** [`server/llm/researchCompany.ts`](../server/llm/researchCompany.ts) is
the pipeline, [`server/llm/client.ts`](../server/llm/client.ts) is the only place that talks
to OpenAI, and [`server/researchRoute.ts`](../server/researchRoute.ts) is the HTTP wrapper
(`POST /api/research`).

### The one thing to understand before anything else

Two ideas govern the whole design:

1. **The copy table is the source of truth.** [`src/customize/videoCopy.ts`](../src/customize/videoCopy.ts)
   defines every writable slot: its dotted path (`feed.spaces.0.name`), a guide explaining
   what it is for, a character cap, and the demo's own text as a worked example. The prompt
   is *built from* that table, so adding a slot teaches this module about it automatically.
   Nobody maintains a prompt and a schema in parallel.

2. **A character cap is a hard physical limit.** The copy sits in pixel-budgeted UI. A line
   over its cap is *clipped mid-word on screen*, not wrapped. So the pass has a whole
   enforcement ladder just for length, described in [§2, stage 5](#stage-5--the-cap-repair-8s).

---

## 2. The stages, in order

### Stage 0 — the pass starts long before anyone waits for it

The operator types a company name in step 1 of 4 and hits Continue. That immediately fires
the request ([`web/App.tsx`](../web/App.tsx) `startResearch`), and the operator then spends
the next minute or two on steps 2–4: uploading a headshot, a logo, a dozen photos.

**This is the single most important fact about the pass's latency.** It does not sit behind
a spinner — it runs while the operator is doing other work. It only becomes visible if it
takes longer than the remaining wizard steps do, which is exactly what had started happening.
"Build the video" is blocked while the pass is in flight, because building early would show
the operator the *demo's* words and read as though the research did nothing.

### Stage 1 — the brief (~16s, one call, web search on)

One unconstrained, plain-text call to the model with the hosted web-search tool attached. It
is told to search first, then write a short factual brief: what the company does, roughly how
big it is, **two or three phrases quoted exactly from their own careers or about page**, their
published values quoted exactly, anything their staff currently have on their minds, and what
their frontline work looks like. It is told to write "not found" rather than guess.

Typical result: ~3,500 characters of brief and 2–5 citation URLs.

> **Why this is a separate call from the writing.** Asking for a strict JSON schema *and*
> offering a tool in the same request reliably produced replies with no search in them at
> all — the model skipped straight to filling the schema from memory. Unconstrained output is
> what actually makes it search. So: this call gathers, the next ones write.

If this call fails, the pass does **not** abort. It records an issue ("wrote from general
knowledge instead") and carries on. That is deliberate, and it is also a trap — see [§6](#6-the-trap-that-nearly-shipped).

### Stage 2 — round one (~9s, six calls in parallel)

Now the writing. Rather than one enormous call for all 133 fields, the copy table is split
into **batches**, each a coherent stretch of the film, and each batch is its own call with a
**strict JSON schema** narrowed to just its fields.

Each field arrives at the model as one compact line:

```json
{"field":"feed.spaces.0.name","guide":"…what this slot is for…","max_characters":40,"aim_for":34,"current_text":"Design Guild"}
```

Every batch gets: the company name, the person the film is addressed to, the operator's own
notes, and the whole brief from stage 1.

> **Why batches at all.** One call for the whole script stopped fitting once the film grew:
> the reply ran past `OPENAI_MAX_OUTPUT_TOKENS` and came back truncated, which a strict schema
> turns into a hard failure rather than a partial answer. Splitting also writes *better* copy,
> because forty fields get more attention than four hundred.

A batch that fails is logged and skipped, not thrown — `Promise.allSettled`. The slots it
covers keep approved baseline copy. A worse video than a full pass; a much better one than no
video.

### Stage 3 — round two (~9s, three calls in parallel)

Some guides say "this must match something written elsewhere". The Spaces run quotes
`feed.spaces`; the billboard quotes `composed.values`. A batch can only honour that if it can
*see* the thing it must match — so those batches run second and are shown what round one
wrote.

**The entire dependency graph is four edges**, extracted from the guides themselves:

```
spaces    -> composed
spotlight -> feed, spaces
signage   -> feed, composed
voice     -> feed
```

That is the whole reason round two exists. Everything else depends on nothing but the brief.

Two guards run on every request and shout if this drifts:

- `unbatchedCopyKeys()` — a copy group no batch writes would silently ship the demo's words.
- `danglingCrossReferences()` — a guide told to agree with a group its batch never sees will
  answer *plausibly* rather than failing, which is the worst kind of wrong.

### Stage 4 — merge and the deterministic repairs (instant, no model calls)

The batch results are merged, then:

1. **Shape-lock against the defaults**, caps off. A missing or wrongly-typed field falls back
   to approved baseline copy; list lengths cannot change.
2. **The company name is stamped back in** from the operator's own input — never the model's.
   A search result must not be able to rename the customer.
3. **The shout-out is repaired** so the main character cannot thank themselves.
4. **The tagged value is snapped** to one of the four values the viewer just watched being
   picked. The composer scene shows a four-row picker and the published post reads "Value: X"
   nine seconds later; if X is not on that list, two frames contradict each other on screen.

### Stage 5 — the cap repair (~8s)

Every text field is measured against its cap. Anything over goes back to the model in one
small call: *"rewrite these to fit; keep the meaning and the voice; do not just cut the end
off."*

Whatever is still over after that gets **word-aware truncation** as the floor — a real cut,
and the outcome to avoid.

This is an enforcement ladder, cheapest-good-outcome first: *ask nicely → ask again with the
numbers → cut by machine*. Typically 19–27 fields arrive over cap and 7–11 end up truncated.

### What comes back

`{ copy, brief, issues, citations, usage }`. The brief and citations are shown to the operator
so the copy is auditable, and `issues` is every non-fatal correction — surfaced, not hidden.

---

## 3. How to see any of this yourself

Every model call and phase now logs a line. Run the wizard and watch the server output, or
drive the pass directly without clicking through four wizard steps:

```bash
npx tsx scripts/bench-research.mjs "Northwind Logistics" --runs=3
```

`--effort=` and `--model=` override `.env` for that run only. It makes real, billed API calls.

---

## 4. Before and after

### Headline

| | before | after |
|---|---|---|
| **Wall clock** | **87.3s** *(n=1)* | **37.7s** *(n=2: 35.9 / 39.5)* |
| Fields over cap | 18 | 8–13 |
| Fields machine-truncated | 3 | 2–6 |
| Model calls | 7 | 11 |
| Input tokens | 36.3k | ~43k |
| Output tokens | 9.2k | ~5.6k |

Two things got faster in sequence. The pipeline changes ([§5](#5-what-actually-made-it-faster))
took it to ~44.8s; the guide audit ([§7](#7-the-guides-were-fighting-the-caps)) took it to
~37.7s, because copy that fits its cap gives the repair pass almost nothing to do — that
stage fell from 19.0s to 2.5–3.5s.

⚠️ **Read the `n` values.** The "before" figure is **a single run**, captured before the
config changed. Run-to-run variance on this pass is large — over-cap counts alone swing 19–34
between identical runs — so treat 87.3 → 44.8 as "roughly halved", not as a precise 42.5s
saving. A separate route-level run of the new code measured 45.9s, consistent with the bench.

### By stage

| Stage | before *(n=1)* | after | what changed |
|---|---|---|---|
| Brief (search) | 17.9s | ~17s | nothing — this is real work |
| Round one | 20.8s | ~10s | effort + more, smaller parallel batches |
| Round two | **29.6s** | **~7s** | six groups moved out of it entirely |
| Cap repair | 19.0s | **~3s** | effort, *and* far less to repair |

Round two was the worst offender and is now the cheapest stage in the list. The brief is now
the single largest cost, and it is the one doing irreducible work.

### Batch layout

**Before** — 5 batches, grouped by where they appear in the film:

| Round | Batch | Fields |
|---|---|---|
| 1 | quote, person, livestream | 11 |
| 1 | feed, stories, catchup, composed | 35 |
| 2 | spaces, spotlight, journeys | 26 |
| 2 | signage, newsletters, chat, hq | 31 |
| 2 | article, seer, voice | 29 |

**After** — 9 batches, grouped by *what actually depends on what*:

| Round | Batch | Fields |
|---|---|---|
| 1 | feed, stories, catchup | 31 |
| 1 | composed | 4 |
| 1 | quote, person, livestream | 11 |
| 1 | article, seer | 16 |
| 1 | chat, hq | 13 |
| 1 | journeys, newsletters | 7 |
| 2 | spaces, spotlight | 22 |
| 2 | signage | 15 |
| 2 | voice | 13 |

---

## 5. What actually made it faster

### a. Reasoning effort was wrong for the job (most of the win)

Everything ran at `reasoning.effort: low`. But the two jobs are not alike:

- **Researching** is open-ended: search, read, judge what is true. It needs to think.
- **Writing** is a transformation: the brief is already in the prompt, the schema fixes the
  shape, the guide says what the slot is for, and the cap says how long. There is very little
  to reason *about*.

Split into two settings — `OPENAI_REASONING_EFFORT` (research, default `low`) and
`OPENAI_WRITE_REASONING_EFFORT` (writing and repair, default `minimal`).

### b. Round two was mostly waiting for nothing

Batches had been grouped by **when they appear in the film**. But the only reason to wait is a
cross-reference, and there are only four. Chat, the HQ Agent, Journeys, Newsletters, the
article and Employee Insights were sitting in round two purely because they happen late — with
no dependency at all. They now run in round one.

### c. More, smaller parallel calls

Nine batches instead of five. The pass costs the wall time of the *slowest call in each round*,
so making the biggest batch smaller shortens the round. The extra input tokens (each call
repeats the instructions and the brief) are cheap next to the latency saved.

---

## 6. The trap that nearly shipped

The obvious move — set `OPENAI_REASONING_EFFORT=minimal` globally — **silently destroys the
research**, and it looks like a win:

```
[research] brief   1445ms  0 chars, 0 citations
[research] TOTAL    34.9s   ← "twice as fast!"
```

The API rejects the hosted search tool at minimal effort:

> The following tools cannot be used with reasoning.effort 'minimal': web_search.

Stage 1 catches its own failures and carries on writing from general knowledge (see
[stage 1](#stage-1--the-brief-16s-one-call-web-search-on)), so the run returns `200 OK` with
plausible copy, no citations, and one line buried in `issues`. Fast, and unsourced.

There is now a `searchSafeEffort` guard in `client.ts` that raises the effort and warns
whenever the search tool is attached, so this configuration cannot happen by accident.

**The general lesson:** a pass with graceful degradation needs its degradation to be *loud*.
This one was a fallback that made a quality cliff look like a speed win.

---

## 7. The guides were fighting the caps

Moving the writing calls to `minimal` effort made cap discipline visibly worse — 19–34 fields
over cap per run against 18 in the baseline, and 7–11 machine-truncated against 3. The obvious
reading was "minimal effort counts characters less well". That was wrong, or at least
secondary.

**Every slot carries two instructions that can disagree**: a prose guide saying what to write,
and a number saying how much room there is. The model weights the prose. Lower effort just
stopped papering over the contradiction.

The clearest case: `quote.original` was told it should be

> "written **at length** and slightly rambling"

against a **420-character cap**. It came back at 538–715 characters in *every* measured run.
That is not the model failing to count — it is the model doing exactly as instructed, and the
repair pass then amputating the leader's post on the one card the scene is built around.

Worse, it cascaded. `quote.rewritten` was defined as "about **half the length** of `original`"
— half of a 700-character post is still over its own 260 cap — and `quote.translated` is a
translation of *that*. One over-long guide produced three reliably-broken fields.

### What the audit checks

[`scripts/audit-guides.mjs`](../scripts/audit-guides.mjs) reads every slot and flags four
kinds of mismatch:

| Check | Why |
|---|---|
| Guide names a length (`"two sentences"`, `"a paragraph"`) that the cap cannot hold | The direct contradiction |
| Guide asks for **verbosity itself** (`"at length"`, `"rambling"`) | Fights any cap, at any size |
| Guide defines its length **relative to another field** | Inherits that field's overrun; its own cap cannot protect it |
| The **demo's own text** already fills ≥92% of the cap | The worked example teaches filling the box exactly, so any variance overruns |

Sentence-length ranges are calibrated to **what the model writes** (~90–180 characters per
sentence), not to the demo's tighter prose. That distinction matters: charged at the demo's
own 55–95, the audit called `journeys.phone.blurb` clean — and it then came back at 170–182
against a 140 cap in consecutive runs.

### The fix that worked

State budgets in **words, not characters**. A model cannot see characters; it hits a word
count far more reliably. "One short paragraph, about forty words" is followed; "max 280" is
approximated.

Results: over-cap fields fell from 19–34 to **8–13**, truncations from 7–11 to **2–6**, and
the pass got ~7s faster because the repair stage had far less to do.

### Still open

`chat.summary` — the **demo's own copy is 494 characters against its own 470 cap**. The cap is
measured and documented ("about 470 characters before the body runs past its bottom edge"), so
either the approved film overflows that card by a line or the estimate is slightly
conservative. Not a guide defect, and not safe to fix by guessing: it needs someone to look at
the rendered frame.

---

## 8. Still on the table

- **The brief is now the biggest single cost** (~17s, ~45% of the pass) and nothing else can
  start until it lands.

  Partially investigated, then parked. What was measured, all on `Greggs`, all n=1 and
  therefore **not conclusive**:

  | Variant | Time | Notes |
  |---|---|---|
  | Current, 6 asks, one call | 14.8s / 31.2s | *same prompt, two runs* — the variance is the headline finding |
  | Split into 2 parallel half-briefs | 13.7s | barely faster, and doubles input tokens (each call repeats the search) |
  | One ask only, search on | 8.3s | |
  | 6 asks, search **off** | 9.7s | generation only, 0 citations — so a large part of the cost is not search |

  Two things this hints at, neither established: the wall clock is dominated by variance
  rather than by how much is asked for, and splitting the brief does not pay because each
  half still pays the full search round-trip. Anyone picking this up should run 3+ per
  config before believing any of it — single runs on this pass have misled twice already.

  Worth noting that all six asks feed real slots (values become `composed.values`, which
  appear on screen; the self-description phrases set the voice), so "trim the brief" is not
  free — it trades latency for grounding.
- **`chat.summary`** — the demo's own copy exceeds its own cap. See [§7](#still-open).
- **The remaining over-cap fields are small and scattered** (`feed.billboards[].blurb` at
  77/62, `composed.values.0` at 84/30). Each is a candidate for the same word-budget
  treatment, with diminishing returns.
- **The baseline was never re-measured.** The 87.3s "before" is a single run and the
  variance on this pass is wide. Everything here is directionally solid and none of the
  precise deltas should be quoted to two significant figures.
- **Model choice** — ~~nothing has been measured against anything else~~. Measured, and
  moved: see [§9](#9-the-move-to-gpt-56-luna).

---

## 9. The move to gpt-5.6-luna

`gpt-5-mini-2025-08-07` shuts down **2026-12-11**. That deadline is the reason for this
change; the saving is real but small at this volume, roughly a cent a video.

OpenAI's deprecation table names **`gpt-5.6-terra`** as mini's replacement. Terra is $2.00
input / $12.00 output — about 5x what this pipeline costs on luna. Luna is the cheaper
nano tier, so choosing it is a departure from the documented path, and it was measured
rather than argued.

### ⚠️ Everything above this section is a fictional company

The benchmarks in §4–§7 were run on **"Northwind Logistics"**, which does not exist. The
search finds nothing, so the brief is short and fast. Every real customer is a real
company, and the difference is not small — same code, same day:

| | Northwind (§4) | Aegean Airlines |
|---|---|---|
| Wall clock | 37.7s | **56.8s** |
| Brief | ~17s | **25.1s** (44% of the run) |

So the "after" numbers in §4 understate production by roughly half. Anything benched from
here on should use a real company. The numbers below all do.

### The blocker: `minimal` does not exist on gpt-5.6

`OPENAI_WRITE_REASONING_EFFORT` was `minimal`, which 5.6 rejects:

```
400 Unsupported value: 'minimal' is not supported with the 'gpt-5.6-luna' model.
    Supported values are: 'none', 'low', 'medium', 'high', 'xhigh', and 'max'.
```

**This is the §6 trap again, ten times bigger, and worth studying.** The writing calls pass
`search: false` so they never touch `searchSafeEffort`; `runBatch` sits inside a
`Promise.allSettled`, so each 400 became a pushed issue rather than a throw. The run exited
**0** and posted the best figures ever recorded on this pipeline:

| | mini baseline | luna, still on `minimal` |
|---|---|---|
| Wall clock | 56.8s | **18.5s** |
| Round one | 12.9s | **405ms** |
| Fields over cap | 18.3 | **1** |

Three times faster and seventeen times better on cap discipline, because all ten writing
calls failed in parallel and the video kept the demo's copy. The single over-cap field is
`chat.summary`, the demo's own known-bad field from §8. **On this pass, a large sudden
improvement in the timings is a symptom, not a result.**

### The comparison, once it actually ran

`gpt-5-mini` vs `gpt-5.6-luna` at `--write-effort=none`, n=3 each, Aegean Airlines:

| | mini | luna | |
|---|---:|---:|---:|
| **Wall clock** | 56.8s | **31.9s** | −44% |
| ⤷ brief (search) | 25.1s | 14.5s | −42% |
| ⤷ round one | 12.9s | 7.9s | −39% |
| ⤷ round two | 10.1s | 5.9s | −42% |
| ⤷ repair | 8.7s | 3.6s | −59% |
| Fields over cap | 18.3 | 16.7 | −9% |
| **Machine-truncated** | 5.0 | **0.3** | **−93%** |
| Citations | 6.7 | 5.7 | −15% |
| Input tokens | 45.9k | 49.9k | +9% |
| ⤷ cached | 4.3k | 10.6k | +149% |
| Output tokens | 6.3k | 4.6k | −27% |
| **Cost per run** | $0.0330 | **$0.0235** | **−29%** |

The row that justified the cheaper tier is **machine-truncated**, not wall clock.
Truncation is the quality floor — `truncateAtWord` cutting a sentence mid-thought because
the repair pass could not get a field under its cap. Baseline hit it 4–6 times a run; luna
hit it zero, zero, once. Two of three runs reported `Rewrote N over-long field(s) to fit.`
with no trailing "still needed trimming", meaning the repair pass now completes.

Cost fell more than list price predicts (−29% against a −21% estimate) because output
tokens fell 27% — 5.6 is genuinely more concise — and cache hits more than doubled. It does
not fall further because **$0.010 of every run is the hosted search call**, billed per
invocation and identical on every model. That is now the largest single line in a run, and
no model choice can move it.

### What this does not establish

- **Whether the copy is good.** Every number here is speed, money, or whether text fits a
  box. A model could win all of them and write bland or subtly wrong copy.
- **Citations, 6.7 → 5.7.** Inside the noise at n=3 against a 5–9 baseline spread, but it
  is the only number pointing the wrong way and it is the closest thing to a
  research-quality proxy.

### Analytics had to change first

`costOf` priced every run from one global table, ignoring the `model` each record already
stored. Setting luna's prices would therefore have re-priced all the historical mini runs
at luna's rates and erased the −29% at the moment it became real. Prices are now per model:
the configured one from the environment, retired ones from a frozen table in
[`server/env.ts`](../server/env.ts).

---

## References

- [`server/llm/researchCompany.ts`](../server/llm/researchCompany.ts) — the pipeline, the batch table, the enforcement ladder.
- [`server/llm/client.ts`](../server/llm/client.ts) — the single OpenAI seam, and `searchSafeEffort`.
- [`server/llm/timing.ts`](../server/llm/timing.ts) — the per-call and per-phase logging all these numbers come from.
- [`scripts/bench-research.mjs`](../scripts/bench-research.mjs) — reproduce any of the timings.
- [`scripts/audit-guides.mjs`](../scripts/audit-guides.mjs) — re-run the guide/cap audit after touching the copy table.
- [`src/customize/videoCopy.ts`](../src/customize/videoCopy.ts) — the copy table the prompt is built from.
- [`docs/video-customization-guide.md`](./video-customization-guide.md) — the rules this pipeline is an application of.

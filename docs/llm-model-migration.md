# Migrating gpt-5-mini → gpt-5.6-luna

A portable write-up of a migration done on this repo in September 2026. The API facts and
the traps generalise; the numbers are one pipeline's and are labelled as such.

**The one-line version:** on any pipeline that degrades gracefully instead of throwing, a
model migration's failure mode is *a result that looks better than the baseline*. Plan the
verification around that, not around whether it errors.

---

## 1. Why, and to what

`gpt-5-mini-2025-08-07` shuts down **2026-12-11**. OpenAI's deprecations table names
**`gpt-5.6-terra`** as its replacement.

| per 1M tokens | input | cached | output |
|---|---:|---:|---:|
| `gpt-5-mini` (retiring) | $0.25 | $0.025 | $2.00 |
| `gpt-5.6-luna` | **$0.20** | **$0.02** | **$1.20** |
| `gpt-5.6-terra` (recommended) | $2.00 | $0.20 | $12.00 |

Terra is 8x mini on input and 6x on output. If your workload is cheap-model-shaped — short
transformations, structured output, a schema doing the heavy lifting — **luna is the like-for-like
tier and terra is an upgrade you did not ask for**. Take luna, but treat it as a departure from
the documented path and measure rather than assume.

Both 5.6 models: 1.05M context, 128k max output, knowledge cutoff 2026-02-16.

### Do not assume the price ratio is the saving

Headline prices said −21% for us. We measured −29%, for two reasons that will differ for you:

- 5.6 is **more concise by default**. Our output tokens fell 27% with no prompt change.
- **Per-call tool costs do not move.** The hosted web search tool is $10.00 per 1,000 calls
  on every model. It was 43% of our run cost, so the model swap could only touch the
  other 57%.

Work out what fraction of your bill is token-priced before promising anyone a number.

---

## 2. The breaking change: `minimal` does not exist on 5.6

| family | accepted `reasoning.effort` |
|---|---|
| `gpt-5*` | `minimal`, `low`, `medium`, `high` |
| `gpt-5.6*` | `none`, `low`, `medium`, `high`, `xhigh`, `max` |

`none` is 5.6's replacement for `minimal`. Both errors, verbatim from the API:

```
400 Unsupported value: 'minimal' is not supported with the 'gpt-5.6-luna' model.
    Supported values are: 'none', 'low', 'medium', 'high', 'xhigh', and 'max'.

400 Unsupported value: 'none' is not supported with the 'gpt-5-mini-2025-08-07' model.
    Supported values are: 'minimal', 'low', 'medium', and 'high'.
```

Note the second one. **Rollback breaks too**, and so does deploying the code before the
config or the config before the code.

### Why this is worse than a 400 usually is

If your pipeline wraps model calls in `Promise.allSettled`, a `try/catch` per stage, or any
"carry on with defaults" path — and cheap-model pipelines usually do, because that is how you
stop one flaky call ruining a job — then a rejected effort value does not surface as an error.
It surfaces as **every metric improving at once**.

Ours, with the effort value left wrong:

| | baseline | wrong effort value |
|---|---:|---:|
| Wall clock | 56.8s | **18.5s** |
| Parallel write stage | 12.9s | **405ms** |
| Output-quality metric | 18.3 defects | **1** |
| Exit code | 0 | **0** |

Three times faster, seventeen times better, exits clean. Ten calls had 400'd in parallel and
the job fell back to its template.

**So: on this kind of pipeline, a large sudden improvement is a symptom.** Verify on the
per-call failure list, never on aggregate timings or quality counts.

---

## 3. Traps, in the order we hit them

### 3.1 Two settings that must agree are two separate secrets

`OPENAI_MODEL` and whatever holds your reasoning effort are coupled — the legal values of one
depend on the other — but they are independent config, and a deploy changes them one at a
time. Every ordering has a broken window.

**Fix: stop trusting them to agree.** Translate the effort to something the configured model
accepts, at the one place you build the request:

```ts
const EFFORT_RANK = { none: 0, minimal: 0, low: 1, medium: 2, high: 3, xhigh: 4, max: 5 };
const LADDERS = [
  // 5.6 before 5, or the second pattern swallows it
  { match: /^gpt-5\.6/, levels: ["none", "low", "medium", "high", "xhigh", "max"] },
  { match: /^gpt-5/,    levels: ["minimal", "low", "medium", "high", "high", "high"] },
];

const modelSafeEffort = (model: string, effort: string): string => {
  const ladder = LADDERS.find((l) => l.match.test(model))?.levels;
  const rank = EFFORT_RANK[effort];
  if (!ladder || rank === undefined) return effort;   // unknown model: do not guess
  return ladder[Math.min(rank, ladder.length - 1)];   // clamp to the family ceiling
};
```

This makes the deploy order irrelevant and rollback safe on its own. Warn when it remaps, so
a permanently-wrong setting is visible rather than silently corrected forever.

### 3.2 A pinned env var beats your new code default

If `.env` or a deployment secret pins `OPENAI_MODEL`, changing the default in code does
**nothing** — and the result is not an error, it is your app working correctly on the old
model. We lost a full evaluation run to this, and only noticed from an error message naming
the model we thought we had stopped using.

Add a per-invocation override to whatever launches the app and whatever benchmarks it, so a
branch can be tested without editing the pinned config.

### 3.3 A global price table rewrites history

If you compute cost from stored token counts at read time — a good design — then a single
price table means **switching model reprices every historical run at the new model's rates**.
The saving you migrated for disappears from your dashboard at the moment it becomes real.

Fix: key prices by the model each record already stores. The configured model's prices stay
in config (list prices move); a retired model's go in a frozen table (they never will again).

### 3.4 Your benchmark subject may not resemble production

Our existing benchmarks used a fictional company name. Web search finds nothing for one, so
the research step is short and fast. On a real company the same code took **51% longer**, and
every customer is a real company.

Check what your baseline is actually exercising before trusting it as a baseline.

### 3.5 Transient failures look identical to this bug

Mid-migration, a corporate TLS proxy ate five calls in one run. Same signature: exit 0,
plausible timings, template output on five screens, nothing surfaced to the user.

Worth fixing independently of any migration — if partial degradation is invisible, you cannot
tell a bad model from a bad network.

---

## 4. The process

**1. Baseline first, and on a realistic subject.** n≥3. Record wall clock, cost, tokens, your
own quality metric, and **the per-call failure list**. Single runs mislead; ours swung 48.9–65.6s
on identical inputs.

**2. Probe the effort value with one call** before benchmarking anything. It settles in seconds
what docs leave ambiguous — the model page listed 5.6's levels but the general reasoning guide
still listed `minimal` as valid "depending on model".

**3. Make the new model reachable from your benchmark harness.** Ours could override the model
but not the write-stage effort, which was the parameter at risk — so a naive run would have
silently kept the old value and looked like a triumph. Check your harness can vary *every*
setting the migration touches.

**4. Bench, same subject, same n.** Compare on the failure list first, then quality, then cost,
then speed. In that order, because that is the order in which a wrong result is deceptive.

**5. Read the actual output.** Every metric above counts things. None of them tell you whether
the text is any good. Ours was well-targeted and idiomatic — and stated a specific figure its
own cited source contradicted, which no counter would ever catch.

**6. Fix analytics before touching prices** (§3.3), or you lose the comparison.

**7. Deploy code, then config.** New code tolerates the old config; old code does not tolerate
the new config.

**8. Verify from outside.** Surface the model in whatever dashboard you have. "Is the new model
actually running?" should not require an SSH session, and a deploy that silently kept the old
one is otherwise undetectable.

---

## 5. What we measured

One pipeline — 11 calls per job, 1 hosted web search, strict structured outputs, ~50k input /
~5k output tokens. n=3 each, same real subject. **Your numbers will differ; the shape may not.**

| | `gpt-5-mini` | `gpt-5.6-luna` | |
|---|---:|---:|---:|
| Wall clock | 56.8s | 31.9s | −44% |
| Cost per job | $0.0330 | $0.0235 | −29% |
| Output tokens | 6.3k | 4.6k | −27% |
| Cached input | 4.3k | 10.6k | +149% |
| Fields over length cap | 18.3 | 16.7 | −9% |
| **Fields machine-truncated** | **5.0** | **0.3** | **−93%** |
| Citations returned | 6.7 | 5.7 | −15% |

The row that decided it was **machine-truncated** — our quality floor, where a hard trim cuts
a sentence mid-thought. Speed and cost are nice; that one is the product.

**Not established:** whether the copy is better (see §4.5), and the citations dip, which is
inside the noise at n=3 but is the only number pointing the wrong way. We separately confirmed
it is *not* caused by the search tool version.

---

## 6. Other 5.6 notes

- **Use the Responses API.** Chat Completions rejects function tools combined with
  `reasoning_effort` on 5.6 and tells you to move.
- **`reasoning.mode`** is new: `standard` (default) or `pro`. Independent of `effort`.
- **Hosted web search** — both `web_search` and the legacy `web_search_preview*` types work on
  5.6, and `search_context_size` (`low`/`medium`/`high`) is still valid. `web_search` adds
  `return_token_budget` and domain filters. We benched the swap: identical citations, 28%
  slower research call, so we stayed on the legacy type. No shutdown date is announced for it.
- **Strict `json_schema`** structured outputs work unchanged.
- **`minimal`/`none` with hosted tools** — `minimal` is rejected outright with `web_search`
  attached; `none` is documented as lower-quality rather than rejected, which is worse. If your
  lowest tier feeds a search call, lift it deliberately.

---

## Worked example in this repo

- [`server/llm/client.ts`](../server/llm/client.ts) — `modelSafeEffort`, `searchSafeEffort`
- [`server/env.ts`](../server/env.ts) — per-model price table, the two effort settings
- [`server/analytics.ts`](../server/analytics.ts) — `costOf` pricing from the recorded model
- [`scripts/bench-research.mjs`](../scripts/bench-research.mjs) — the harness and its overrides
- [`docs/research-pass-performance.md` §9](./research-pass-performance.md) — the full measurement

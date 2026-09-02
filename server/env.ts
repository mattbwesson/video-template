/**
 * Server-side configuration, read from `.env` once at startup.
 *
 * Nothing here is ever sent to the browser. The wizard calls our own route and this
 * process holds the key — the alternative, putting the key in `import.meta.env` so the
 * browser can call OpenAI directly, would ship it to anyone who opens devtools.
 */

import fs from "node:fs";
import path from "node:path";

let loaded = false;

/**
 * `process.loadEnvFile` (Node 20.12+) rather than dotenv: one fewer dependency, and it
 * has the same precedence rule — a variable already in the real environment wins over
 * the file, so a deployment can override without editing anything.
 */
const load = (): void => {
  if (loaded) return;
  loaded = true;
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch {
    // A malformed .env should not take the dev server down; the missing-key error
    // below is a much clearer thing to hit.
  }
};

const str = (key: string, fallback: string): string => {
  load();
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
};

const num = (key: string, fallback: number): number => {
  const v = Number(str(key, ""));
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const bool = (key: string, fallback: boolean): boolean => {
  const v = str(key, "").toLowerCase();
  if (!v) return fallback;
  return v === "1" || v === "true" || v === "yes" || v === "on";
};

export type LlmConfig = {
  apiKey: string;
  model: string;
  /** Cheap and fast by default — the guide's §5.9 "start here, not at full effort". */
  reasoningEffort: string;
  /**
   * Effort for the calls that WRITE copy, as opposed to the one that researches.
   *
   * Split because the two jobs are not alike and the API will not let them be. Writing is a
   * transformation: the brief is already in the prompt, the schema fixes the shape, and the
   * model is rewriting known text to a known length. Measured on the real pipeline, moving
   * just these calls from `low` to `minimal` took round one 20.8s -> 15.3s, round two
   * 29.6s -> 13.0s and the repair pass 19.0s -> 5.0s.
   *
   * The research call cannot follow it there: the lowest efforts are rejected or degraded
   * when `web_search` is attached, which is why `searchSafeEffort` exists rather than one
   * shared setting.
   *
   * The value is `none` on gpt-5.6, not `minimal`. `minimal` is a gpt-5 level and 5.6
   * rejects it outright — see the default below for why that mattered so much.
   */
  writeReasoningEffort: string;
  maxOutputTokens: number;
  webSearch: boolean;
  webSearchToolType: string;
  webSearchContextSize: string;
};

export const llmConfig = (): LlmConfig => ({
  apiKey: str("OPENAI_API_KEY", ""),
  /**
   * gpt-5.6-luna since 2026-09-02. The predecessor, gpt-5-mini-2025-08-07, shuts down on
   * 2026-12-11 — the deadline is what forced this, not the saving.
   *
   * OpenAI's deprecation table names **gpt-5.6-terra** as mini's replacement, not luna.
   * Terra is $2.00 input / $12.00 output, which on this pipeline's token profile is about
   * 5x what luna costs and 4x what mini cost. Luna is the cheaper nano tier, so taking it
   * is a departure from the documented path and was measured rather than assumed —
   * gpt-5-mini vs gpt-5.6-luna, three runs each, same real company (Aegean Airlines):
   *
   *   wall clock        56.8s -> 31.9s
   *   cost per run    $0.0330 -> $0.0235
   *   output tokens     6.3k  -> 4.6k
   *   fields truncated    5.0 -> 0.3
   *
   * That last row is why the cheaper tier was comfortable. Machine truncation is the
   * quality FLOOR — `truncateAtWord` cutting a sentence mid-thought because the repair
   * pass could not get a field under its cap — and it went from happening 4-6 times a run
   * to not happening. Everything else is speed and money; that one is the video.
   *
   * What the bench does not measure is whether the copy is any GOOD. It counts characters,
   * not sentences. See docs/research-pass-performance.md §9 for what was read.
   */
  model: str("OPENAI_MODEL", "gpt-5.6-luna"),
  reasoningEffort: str("OPENAI_REASONING_EFFORT", "low"),
  /**
   * `none`, because gpt-5.6 does not have `minimal`:
   *
   *   400 Unsupported value: 'minimal' is not supported with the 'gpt-5.6-luna' model.
   *   Supported values are: 'none', 'low', 'medium', 'high', 'xhigh', and 'max'.
   *
   * Worth stating how badly that fails, because it does not look like a failure. The
   * writing calls pass `search: false`, so they skip `searchSafeEffort` and the raw value
   * reaches the API; `runBatch` is inside a `Promise.allSettled`, so each 400 becomes a
   * pushed issue rather than a throw. A real run of the migration with this left at
   * `minimal` returned exit code 0, reported ten issues nobody reads, and looked like the
   * best result ever measured:
   *
   *   wall clock 18.5s (best ever), round one 405ms, fields over cap 1 (from 18)
   *
   * Every number improved because all ten writing calls 400'd in parallel and the video
   * kept the demo's copy. If this ever needs to change, change it with a bench run and
   * read the ISSUE LIST, not the timings.
   */
  writeReasoningEffort: str("OPENAI_WRITE_REASONING_EFFORT", "none"),
  maxOutputTokens: num("OPENAI_MAX_OUTPUT_TOKENS", 6000),
  webSearch: bool("OPENAI_WEB_SEARCH", true),
  // The hosted search tool has been renamed across API versions
  // (`web_search_preview` -> `web_search`), so which one to send is configuration
  // rather than something to hardcode and rediscover when a call starts 400ing.
  webSearchToolType: str("OPENAI_WEB_SEARCH_TOOL_VERSION", "web_search"),
  webSearchContextSize: str("OPENAI_WEB_SEARCH_CONTEXT_SIZE", "low"),
});

/**
 * The shared passcode the wizard sends with each request. Empty means the route is open.
 *
 * `PASSCODE` and nothing else. It briefly fell back to `API_KEY`, which was a mistake:
 * in this project `API_KEY` means the OpenAI key, so the fallback would have quietly made
 * a paid credential the thing the gate compares typed input against. Wrong on its face,
 * and the sort of wrong that only shows up the day someone unsets the other variable.
 */
export const passcodeGuard = (): string => str("PASSCODE", "");

/**
 * Where the analytics log lives, and what a token costs.
 *
 * The prices are CONFIGURATION, not constants, and they default to zero on purpose. A
 * wrong number here is worse than no number: it produces a plausible cost per video that
 * is silently wrong, and every figure downstream inherits it. Zero reports as "priced: no"
 * instead, which is a question rather than a lie. Token counts are recorded either way, so
 * setting the prices later re-prices the whole history.
 *
 * Per MILLION tokens, matching how the vendors publish them. As of 2026-09-02 the list
 * price for gpt-5.6-luna is $0.20 input, $0.02 cached input, $1.20 output, and the hosted
 * web search tool is $10.00 per 1,000 calls.
 *
 * These are the price of the CONFIGURED model. A model this deployment no longer runs is
 * priced from `RETIRED_TOKEN_PRICES` instead — see `tokenPricesFor`.
 *
 * `OPENAI_PRICE_SEARCH_CALL` is per call, not per token: the hosted search tool is billed
 * by invocation, and the brief is the only call that uses it. Leaving it out understates
 * every run by the same amount, which is the kind of error that hides. The content the
 * search pulls into the prompt is billed at the input rate on top, and needs no line of
 * its own — it arrives inside `input_tokens` and is already counted there.
 */
/**
 * `/data` on Fly, where the volume mounts. A local folder anywhere else.
 *
 * Chosen by looking rather than by guessing at an environment variable: the check is
 * whether the mount point is actually there and writable. Defaulting to `/data`
 * unconditionally made every local run print a permission warning per record, which is
 * how a real warning gets ignored.
 */
const defaultAnalyticsDir = (): string => {
  try {
    fs.accessSync("/data", fs.constants.W_OK);
    return "/data";
  } catch {
    return path.resolve(process.cwd(), ".analytics");
  }
};

export type AnalyticsConfig = {
  dir: string;
  priceInPerM: number;
  /**
   * A tenth of the input rate.
   *
   * This used to say "and a large share of this pipeline's input", which the log does not
   * support: measured over six benched runs the cached share is 9-27% of input and the
   * line is worth about $0.0002 a run. It also does not warm the way the comment implied —
   * the first run for a company gets nothing and the ones after it get the same brief
   * back, so caching is a repeat-run effect, not a within-run one.
   */
  priceCachedPerM: number;
  priceOutPerM: number;
  /**
   * Per CALL, and model-independent: the hosted search tool is $10.00 per 1,000
   * invocations whichever model invokes it. That is why it is not in the per-model table
   * below — and why it is now the single largest line in a run, at $0.010 of $0.0235.
   * A model swap cannot touch it.
   */
  priceSearchCall: number;
};

/** Token prices, per million, for one model. The search call is priced separately. */
export type TokenPrices = { inPerM: number; cachedPerM: number; outPerM: number };

/**
 * What a model charged while this deployment was running it.
 *
 * Cost is computed at read time from token counts, so the whole history reprices whenever
 * the price table changes. That is deliberate and it was right while there was one model.
 * With two in the log it silently rewrites the past: setting luna's rates would re-price
 * every gpt-5-mini run at luna's, and the saving the migration was measured on would
 * vanish from `/analytics` at the moment it started being real.
 *
 * So the CONFIGURED model is priced from the environment, where it belongs — list prices
 * move, and a redeploy should be able to correct them. A model that is no longer
 * configured never will again, so its rates are a literal here. Keyed by prefix because
 * the log stores the dated snapshot (`gpt-5-mini-2025-08-07`), not the alias.
 */
const RETIRED_TOKEN_PRICES: Record<string, TokenPrices> = {
  // List price as of 2026-08-28, the rate every logged gpt-5-mini run was billed at.
  // Shut down 2026-12-11.
  "gpt-5-mini": { inPerM: 0.25, cachedPerM: 0.025, outPerM: 2.0 },
};

/**
 * The token prices that apply to a run, given the model that produced it.
 *
 * An unrecognised model falls back to the environment. That is a guess, but it is the
 * conservative one: the alternative is dropping the run from every total silently, and a
 * model gets here only by being benched and never configured.
 */
export const tokenPricesFor = (model?: string): TokenPrices => {
  const cfg = analyticsConfig();
  const fromEnv: TokenPrices = {
    inPerM: cfg.priceInPerM,
    cachedPerM: cfg.priceCachedPerM,
    outPerM: cfg.priceOutPerM,
  };
  if (!model || model === llmConfig().model) return fromEnv;
  for (const [prefix, prices] of Object.entries(RETIRED_TOKEN_PRICES)) {
    if (model.startsWith(prefix)) return prices;
  }
  return fromEnv;
};

export const analyticsConfig = (): AnalyticsConfig => ({
  dir: str("ANALYTICS_DIR", "") || defaultAnalyticsDir(),
  priceInPerM: num("OPENAI_PRICE_IN_PER_M", 0),
  priceCachedPerM: num("OPENAI_PRICE_CACHED_PER_M", 0),
  priceOutPerM: num("OPENAI_PRICE_OUT_PER_M", 0),
  priceSearchCall: num("OPENAI_PRICE_SEARCH_CALL", 0),
});

/**
 * Enforce `API_KEY` even for a request that arrives on the loopback interface.
 *
 * The research route exempts loopback, on the reasoning that a connection from this
 * machine is a property the browser cannot forge. That is true on a laptop and false
 * behind a reverse proxy running on the same host, where every request would look local
 * and the guard would silently open. Deployments set this to 1 and stop depending on
 * what their network topology happens to be today.
 */
export const requireApiKey = (): boolean => bool("REQUIRE_API_KEY", false);

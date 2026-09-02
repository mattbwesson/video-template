/**
 * One place that talks to OpenAI.
 *
 * Plain `fetch` against the Responses API rather than the SDK: this is a single POST
 * with a JSON body, and a dependency that has to be version-matched to a rapidly moving
 * API is more maintenance than the twenty lines it saves.
 *
 * Two things the guide is emphatic about (§2, §5.9) are baked in here rather than left
 * to call sites: a cheap model on low reasoning effort with a small search context, and
 * **strict structured outputs**, so a response either parses into the requested shape or
 * fails loudly. There is no "parse and hope, then repair" path, because that path is
 * where the other builders accumulated their corrective validators.
 */

import { llmConfig, type LlmConfig } from "../env";
import { logCall } from "./timing";

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export type StructuredRequest = {
  /** System-level framing. Stable across calls, so it caches well. */
  instructions: string;
  /** The task and its data. */
  input: string;
  /** JSON Schema the reply must satisfy. Must be `additionalProperties: false` throughout. */
  schema: Record<string, unknown>;
  /** Schema name, surfaced in errors. */
  schemaName: string;
  /** Let the model search the web first. Off for cheap follow-up repair calls. */
  search?: boolean;
  /** Override the configured model — repair passes can run somewhere cheaper. */
  model?: string;
  /** Override the configured reasoning effort for this call alone. */
  effort?: string;
  /** What to call this call in the timing log. */
  label?: string;
};

export type StructuredResult<T> = {
  value: T;
  /** URLs the model actually consulted, for showing the operator its sources. */
  citations: string[];
  usage?: { input?: number; output?: number; reasoning?: number; incomplete?: boolean };
};

const RESPONSES_URL = "https://api.openai.com/v1/responses";

/**
 * The lowest effort a call may use once the hosted search tool is attached.
 *
 * `minimal` and `web_search` are mutually exclusive — the API rejects the pair with
 * "The following tools cannot be used with reasoning.effort 'minimal': web_search", a 400
 * on the whole request. That matters because the research step catches its own failures and
 * carries on writing from general knowledge, so setting `OPENAI_REASONING_EFFORT=minimal`
 * globally would not look like a crash: it would look like a fast run that quietly stopped
 * doing any research, and the copy would go out unsourced.
 *
 * Measured 2026-08: brief failed in 1.4s with 0 citations, and the pass still returned
 * "successfully" with an issue buried in the list.
 */
const searchSafeEffort = (effort: string): string =>
  effort === "minimal" ? "low" : effort;

/**
 * Turn a bare `TypeError: fetch failed` into something actionable.
 *
 * The one worth naming is TLS interception. On a corporate network the proxy re-signs
 * every certificate with its own CA; `curl` trusts it because it reads the system store,
 * but Node ships its OWN root list and does not, so the same machine that browses
 * openai.com fine gets `SELF_SIGNED_CERT_IN_CHAIN` here. That looks like a bug in this
 * code and is not one, which is exactly why it deserves its own message.
 */
const describeFetchFailure = (err: unknown): string => {
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  if (
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT"
  ) {
    return "Could not verify OpenAI's TLS certificate — a network proxy is re-signing it and Node does not trust the proxy's CA. Run `npm run trust-proxy-ca`, then restart the dev server.";
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "Could not reach api.openai.com — check the network connection.";
  }
  const detail = err instanceof Error ? err.message : String(err);
  return `Could not reach OpenAI: ${detail}${code ? ` (${code})` : ""}`;
};

/**
 * The Responses API returns a list of output items — reasoning summaries, tool calls,
 * and finally the message. The JSON lives in the message's `output_text` content parts,
 * so this walks the tree rather than assuming index 0, which is only the message when
 * neither reasoning nor a tool call happened.
 */
const extractText = (body: any): string => {
  if (typeof body?.output_text === "string" && body.output_text) return body.output_text;
  const parts: string[] = [];
  for (const item of body?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (typeof c?.text === "string") parts.push(c.text);
    }
  }
  return parts.join("");
};

/**
 * Token counts, including the reasoning tokens that are billed and generated but never
 * appear in the reply — the number that tells you whether a slow call was thinking or
 * writing, and the one `OPENAI_REASONING_EFFORT` moves.
 */
const tokensOf = (
  body: any,
): { inputTokens: number; outputTokens: number; reasoningTokens: number } => ({
  inputTokens: body?.usage?.input_tokens ?? 0,
  outputTokens: body?.usage?.output_tokens ?? 0,
  reasoningTokens: body?.usage?.output_tokens_details?.reasoning_tokens ?? 0,
});

/** Every URL the hosted search tool surfaced, deduped, in the order first cited. */
const extractCitations = (body: any): string[] => {
  const seen = new Set<string>();
  for (const item of body?.output ?? []) {
    for (const c of item?.content ?? []) {
      for (const a of c?.annotations ?? []) {
        if (typeof a?.url === "string") seen.add(a.url);
      }
    }
  }
  return [...seen];
};

/**
 * A plain-text call with the hosted search tool on.
 *
 * Kept separate from `callStructured` on purpose. Asking for a strict `json_schema` AND
 * offering a tool in the same request reliably produced a reply with no `web_search_call`
 * in it at all — the model went straight to filling the schema from what it already knew.
 * Unconstrained output is what actually makes it search, so research and writing are two
 * calls: this one gathers, the structured one writes.
 */
export const callText = async (
  req: { instructions: string; input: string; label?: string; effort?: string },
  cfg: LlmConfig = llmConfig(),
): Promise<{
  text: string;
  citations: string[];
  usage?: { input?: number; output?: number; reasoning?: number; incomplete?: boolean };
}> => {
  if (!cfg.apiKey) throw new LlmError("OPENAI_API_KEY is not set.");

  const requested = req.effort ?? cfg.reasoningEffort;
  const effort = cfg.webSearch ? searchSafeEffort(requested) : requested;
  if (effort !== requested) {
    // eslint-disable-next-line no-console
    console.warn(
      `[llm] raising reasoning effort '${requested}' -> '${effort}' for the search call; web_search cannot run at 'minimal'`,
    );
  }
  const body: Record<string, unknown> = {
    model: cfg.model,
    instructions: req.instructions,
    input: req.input,
    max_output_tokens: cfg.maxOutputTokens,
    reasoning: { effort },
  };
  if (cfg.webSearch) {
    body.tools = [
      { type: cfg.webSearchToolType, search_context_size: cfg.webSearchContextSize },
    ];
  }

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LlmError(describeFetchFailure(err));
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (json as any)?.error?.message ?? res.statusText;
    throw new LlmError(`OpenAI ${res.status}: ${msg}`, res.status, json);
  }

  logCall({
    label: req.label ?? "text",
    durationMs: Date.now() - t0,
    model: cfg.model,
    effort,
    search: cfg.webSearch,
    ...tokensOf(json),
    incomplete:
      (json as any)?.status === "incomplete"
        ? ((json as any)?.incomplete_details?.reason ?? "unknown")
        : undefined,
  });

  return {
    text: extractText(json),
    citations: extractCitations(json),
    usage: {
      input: (json as any)?.usage?.input_tokens,
      output: (json as any)?.usage?.output_tokens,
      // Already inside `output`. Carried separately so a run's analytics can show what
      // share of the bill was thinking nobody reads — never added to the total.
      reasoning: (json as any)?.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      incomplete: (json as any)?.status === "incomplete",
    },
  };
};

export const callStructured = async <T>(
  req: StructuredRequest,
  cfg: LlmConfig = llmConfig(),
): Promise<StructuredResult<T>> => {
  if (!cfg.apiKey) {
    throw new LlmError(
      "OPENAI_API_KEY is not set. Add it to .env and restart the dev server.",
    );
  }

  const model = req.model ?? cfg.model;
  const search = req.search ?? cfg.webSearch;
  // Same guard as `callText`: attaching the search tool forbids `minimal`.
  const effort = search
    ? searchSafeEffort(req.effort ?? cfg.reasoningEffort)
    : (req.effort ?? cfg.reasoningEffort);

  const body: Record<string, unknown> = {
    model,
    instructions: req.instructions,
    input: req.input,
    max_output_tokens: cfg.maxOutputTokens,
    reasoning: { effort },
    text: {
      format: {
        type: "json_schema",
        name: req.schemaName,
        schema: req.schema,
        strict: true,
      },
    },
  };

  if (search) {
    body.tools = [
      {
        type: cfg.webSearchToolType,
        search_context_size: cfg.webSearchContextSize,
      },
    ];
  }

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LlmError(describeFetchFailure(err));
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (json as any)?.error?.message ?? res.statusText;
    throw new LlmError(`OpenAI ${res.status}: ${msg}`, res.status, json);
  }

  // Logged before the incomplete check, so a call that stopped early still reports what it
  // cost and how long it took — that is exactly the run worth looking at.
  logCall({
    label: req.label ?? req.schemaName,
    durationMs: Date.now() - t0,
    model,
    effort,
    search,
    ...tokensOf(json),
    incomplete:
      (json as any)?.status === "incomplete"
        ? ((json as any)?.incomplete_details?.reason ?? "unknown")
        : undefined,
  });

  // A truncated reply is still `200 OK`, and its JSON is half-written. Saying so beats
  // a downstream "Unexpected end of JSON input".
  if ((json as any)?.status === "incomplete") {
    const reason = (json as any)?.incomplete_details?.reason ?? "unknown";
    throw new LlmError(
      `The model stopped early (${reason}). Raise OPENAI_MAX_OUTPUT_TOKENS.`,
      undefined,
      json,
    );
  }

  const text = extractText(json);
  if (!text.trim()) {
    throw new LlmError("The model returned no text.", undefined, json);
  }

  let value: T;
  try {
    value = JSON.parse(text) as T;
  } catch {
    // Strict json_schema is supposed to make this unreachable. If it ever fires, the
    // schema was rejected rather than enforced, and that is worth knowing about.
    throw new LlmError(
      "Structured output did not parse as JSON — check that the schema was accepted.",
      undefined,
      text.slice(0, 800),
    );
  }

  return {
    value,
    citations: extractCitations(json),
    usage: {
      input: (json as any)?.usage?.input_tokens,
      output: (json as any)?.usage?.output_tokens,
      // Already inside `output`. Carried separately so a run's analytics can show what
      // share of the bill was thinking nobody reads — never added to the total.
      reasoning: (json as any)?.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      incomplete: (json as any)?.status === "incomplete",
    },
  };
};

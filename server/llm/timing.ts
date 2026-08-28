/**
 * Where the time went, per model call and per phase.
 *
 * The research pass is the slowest thing the wizard does by a wide margin, and until now
 * it reported nothing at all — a run either finished or it didn't, and "it feels slower
 * than it used to" was unfalsifiable. These lines exist so that question has an answer in
 * the server log, on a laptop and in production alike.
 *
 * Deliberately not behind a debug flag. It is at most a dozen lines per research run, the
 * pass takes the better part of a minute, and a latency regression that only shows up
 * under a flag nobody has turned on is a latency regression nobody finds. The one thing
 * never logged is the copy itself: this is timing and token counts, not content.
 */

/** Milliseconds, rendered the way a human compares them. */
export const ms = (n: number): string =>
  n >= 10_000 ? `${(n / 1000).toFixed(1)}s` : `${Math.round(n)}ms`;

export type CallTiming = {
  label: string;
  durationMs: number;
  model: string;
  effort: string;
  search: boolean;
  inputTokens: number;
  outputTokens: number;
  /**
   * Reasoning tokens, which are billed and generated as output but never appear in the
   * reply. Broken out because they are the lever `OPENAI_REASONING_EFFORT` moves, and
   * without them a slow call looks identical to a verbose one.
   */
  reasoningTokens: number;
  /** Set when the model stopped early — the shape of failure that still returns 200. */
  incomplete?: string;
};

/**
 * One line per model call.
 *
 * Padded so a run's calls line up in the terminal and the slow one is findable by eye
 * rather than by reading every number.
 */
export const logCall = (t: CallTiming): void => {
  const bits = [
    `[llm] ${t.label.padEnd(22)} ${ms(t.durationMs).padStart(7)}`,
    `model=${t.model}`,
    `effort=${t.effort}`,
    t.search ? "search=on" : "search=off",
    `in=${t.inputTokens}`,
    `out=${t.outputTokens}`,
    t.reasoningTokens ? `reasoning=${t.reasoningTokens}` : "",
    t.incomplete ? `INCOMPLETE=${t.incomplete}` : "",
  ].filter(Boolean);
  // eslint-disable-next-line no-console
  console.log(bits.join("  "));
};

/** A phase boundary — the thing to read when deciding what to parallelise next. */
export const logPhase = (name: string, durationMs: number, note = ""): void => {
  // eslint-disable-next-line no-console
  console.log(
    `[research] ${name.padEnd(22)} ${ms(durationMs).padStart(7)}${note ? `  ${note}` : ""}`,
  );
};

/** Wall-clock a promise without changing what it resolves to or how it rejects. */
export const timed = async <T>(fn: () => Promise<T>): Promise<[T, number]> => {
  const t0 = Date.now();
  const value = await fn();
  return [value, Date.now() - t0];
};

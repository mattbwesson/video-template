/**
 * What the wizard cost and what came out of it, appended to a file on a Fly volume.
 *
 * A log, not a database. Every record is one JSON object on one line, appended and never
 * edited, which is what makes this safe without a lock: `O_APPEND` writes of this size are
 * atomic on POSIX, so two requests finishing together interleave as two whole lines rather
 * than corrupting each other. A read-modify-write of a JSON array — the obvious first
 * design — has no such property and loses a record the first time two runs overlap.
 *
 * Cost is NOT stored. Token counts are, and the price table turns them into money at read
 * time. That way the prices can be filled in after the fact and the whole history reprices
 * itself, which matters because they default to zero: a wrong price is worse than no
 * price, since it yields a plausible number that is silently wrong. The trade is that a
 * historical run is priced at today's rate rather than the rate on the day — acceptable
 * here, where the question is "what does a video cost", not "what did we bill".
 *
 * Nothing generated is written down: token counts, timings and outcomes only. Same rule
 * as server/llm/timing.ts, for the same reason.
 */

import fs from "node:fs";
import path from "node:path";
import { analyticsConfig } from "./env";

const FILE = "analytics.jsonl";

/** The company name is the id. This is what makes two spellings of it the same row. */
export const companyKey = (company: string): string =>
  company.trim().toLowerCase().replace(/\s+/g, " ") || "(unnamed)";

export type RunRecord = {
  kind: "run";
  at: string;
  company: string;
  key: string;
  /**
   * The route returned copy. NOT "the research worked" — `researchCompany` degrades
   * rather than throwing, so a run whose every model call failed still comes back 200
   * with the baseline demo's words. `calls` and `issues` are what tell those apart: a
   * genuine run makes ten calls, a fully degraded one makes zero and reports an issue.
   */
  ok: boolean;
  /** Problems the run reported to the operator — a degraded run has at least one. */
  issues: number;
  ms: number;
  model: string;
  calls: number;
  searchCalls: number;
  inputTokens: number;
  outputTokens: number;
  /** Inside `outputTokens`, never added to it — the API bills them as output. */
  reasoningTokens: number;
  /** Inside `inputTokens`, and billed at a tenth of the rate. Same subset rule. */
  cachedTokens: number;
  incompleteCalls: number;
  warnings: { unbatched: number; dangling: number; brokenEditables: number };
  error?: string;
};

export type RenderRecord = {
  kind: "render";
  at: string;
  company: string;
  key: string;
  outcome: "done" | "failed" | "aborted" | "unsupported";
  ms?: number;
  bytes?: number;
  reason?: string;
  /**
   * Where and on what it died — frame reached, composition size, and the machine doing
   * the encoding. The MP4 is made in the operator's browser, so most of what explains a
   * failure is a fact about their laptop and is unknowable here otherwise.
   */
  detail?: Record<string, unknown>;
};

export type Record_ = RunRecord | RenderRecord;

const filePath = (): string => path.join(analyticsConfig().dir, FILE);

/**
 * Append one record.
 *
 * Never throws at the caller. Analytics failing is not a reason for a research run the
 * operator waited a minute for to come back as an error, so a missing volume or a full
 * disk degrades to a log line and nothing else.
 */
export const record = (rec: Record_): void => {
  try {
    const dir = analyticsConfig().dir;
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(filePath(), `${JSON.stringify(rec)}\n`, "utf8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[analytics] could not write: ${(err as Error).message}`);
  }
};

export const readAll = (): Record_[] => {
  try {
    const raw = fs.readFileSync(filePath(), "utf8");
    return raw
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l) as Record_;
        } catch {
          return null;
        }
      })
      .filter((r): r is Record_ => r !== null);
  } catch {
    return [];
  }
};

/**
 * Tokens -> money, or null when the price table has not been filled in.
 *
 * Cached tokens are subtracted from the input total before it is priced, not added to it:
 * the API reports them as a subset of `input_tokens`, so charging both would bill the same
 * tokens twice. Reasoning tokens sit inside `outputTokens` the same way and are therefore
 * never mentioned here at all.
 */
export const costOf = (r: RunRecord): number | null => {
  const { priceInPerM, priceCachedPerM, priceOutPerM, priceSearchCall } = analyticsConfig();
  if (!priceInPerM && !priceOutPerM && !priceSearchCall) return null;
  const cached = Math.min(r.cachedTokens ?? 0, r.inputTokens);
  return (
    ((r.inputTokens - cached) / 1e6) * priceInPerM +
    (cached / 1e6) * priceCachedPerM +
    (r.outputTokens / 1e6) * priceOutPerM +
    r.searchCalls * priceSearchCall
  );
};

export type Summary = {
  priced: boolean;
  totals: {
    runs: number;
    runsFailed: number;
    renders: number;
    rendersFailed: number;
    costUsd: number | null;
    /** Per video that actually rendered — the number an abandoned run makes worse. */
    costPerRenderUsd: number | null;
    inputTokens: number;
    outputTokens: number;
  };
  companies: {
    company: string;
    key: string;
    runs: number;
    renders: number;
    costUsd: number | null;
    firstAt: string;
    lastAt: string;
  }[];
  /** Renders over time, by UTC day, oldest first. */
  byDay: { day: string; runs: number; renders: number; costUsd: number | null }[];
  /**
   * Every render that did not produce a file, newest first — with why.
   *
   * Cancellations are in here too, marked as such rather than dropped: "the operator gave
   * up after nine minutes" is a finding about the render being too slow, not noise.
   */
  failures: {
    at: string;
    company: string;
    outcome: RenderRecord["outcome"];
    ms?: number;
    reason?: string;
    detail?: Record<string, unknown>;
  }[];
};

export const summarise = (records = readAll()): Summary => {
  const priced = costOf({ inputTokens: 1, outputTokens: 1, searchCalls: 1 } as RunRecord) !== null;

  const companies = new Map<string, Summary["companies"][number]>();
  const days = new Map<string, { runs: number; renders: number; cost: number }>();
  const t = {
    runs: 0,
    runsFailed: 0,
    renders: 0,
    rendersFailed: 0,
    cost: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  for (const r of records) {
    const day = r.at.slice(0, 10);
    const d = days.get(day) ?? { runs: 0, renders: 0, cost: 0 };
    const c =
      companies.get(r.key) ??
      ({
        company: r.company,
        key: r.key,
        runs: 0,
        renders: 0,
        costUsd: priced ? 0 : null,
        firstAt: r.at,
        lastAt: r.at,
      } satisfies Summary["companies"][number]);
    if (r.at < c.firstAt) c.firstAt = r.at;
    if (r.at > c.lastAt) c.lastAt = r.at;

    if (r.kind === "run") {
      t.runs++;
      if (!r.ok) t.runsFailed++;
      t.inputTokens += r.inputTokens;
      t.outputTokens += r.outputTokens;
      c.runs++;
      d.runs++;
      const money = costOf(r);
      if (money !== null) {
        t.cost += money;
        c.costUsd = (c.costUsd ?? 0) + money;
        d.cost += money;
      }
    } else {
      // Only a finished render counts as a video; the rest are recorded so the failure
      // rate is visible rather than inferred from a gap.
      if (r.outcome === "done") {
        t.renders++;
        c.renders++;
        d.renders++;
      } else if (r.outcome !== "aborted") {
        t.rendersFailed++;
      }
    }
    companies.set(r.key, c);
    days.set(day, d);
  }

  const failures = records
    .filter((r): r is RenderRecord => r.kind === "render" && r.outcome !== "done")
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50)
    .map(({ at, company, outcome, ms, reason, detail }) => ({
      at,
      company,
      outcome,
      ...(ms !== undefined ? { ms } : {}),
      ...(reason ? { reason } : {}),
      ...(detail ? { detail } : {}),
    }));

  return {
    priced,
    failures,
    totals: {
      runs: t.runs,
      runsFailed: t.runsFailed,
      renders: t.renders,
      rendersFailed: t.rendersFailed,
      costUsd: priced ? +t.cost.toFixed(4) : null,
      costPerRenderUsd: priced && t.renders ? +(t.cost / t.renders).toFixed(4) : null,
      inputTokens: t.inputTokens,
      outputTokens: t.outputTokens,
    },
    companies: [...companies.values()]
      .map((c) => ({ ...c, costUsd: c.costUsd === null ? null : +c.costUsd.toFixed(4) }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
    byDay: [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        day,
        runs: v.runs,
        renders: v.renders,
        costUsd: priced ? +v.cost.toFixed(4) : null,
      })),
  };
};

/**
 * Research a company, then rewrite the video's copy for it.
 *
 * The prompt is built FROM the slot table rather than written alongside it: every field
 * guide, cap and baseline value comes out of `COPY.guides` and `COPY.defaults`, and the
 * reply is decoded against `COPY.schema`. Adding a slot to `src/customize/videoCopy.ts`
 * therefore teaches this module about it automatically — which is the whole point of
 * defining a slot once (guide §5.2, §5.3).
 */

import { llmConfig } from "../env";
import { COPY, type WorkvivoCopy } from "../../src/customize/videoCopy";
import { repairSelfShoutOut } from "../../src/customize/shoutOut";
import { truncateAtWord } from "../../src/customize/slots";
import { callStructured, callText, LlmError } from "./client";
import { logPhase, ms, timed } from "./timing";

export type ResearchInput = {
  company: string;
  /** The operator's free-text notes about the audience and the deal. May be empty. */
  context?: string;
  person?: { name?: string; title?: string };
};

export type ResearchResult = {
  copy: WorkvivoCopy;
  /** What the research step found. Shown to the operator so the copy is auditable. */
  brief: string;
  /** Non-fatal corrections, surfaced to the operator rather than hidden. */
  issues: string[];
  citations: string[];
  usage?: { input?: number; output?: number };
};

/**
 * Keywords OpenAI's strict `json_schema` mode rejects.
 *
 * Structured outputs support a subset of JSON Schema; string length bounds and array
 * item counts are not in it, and sending them fails the whole request rather than being
 * ignored. They stay in the copy table because they are still the source of truth — they
 * are just enforced by us (in the prompt, then the repair pass, then `truncateAtWord`)
 * instead of by the decoder.
 */
const UNSUPPORTED = new Set(["maxLength", "minLength", "minItems", "maxItems", "pattern"]);

const toStrictSchema = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(toStrictSchema);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (UNSUPPORTED.has(k)) continue;
    out[k] = toStrictSchema(v);
  }
  return out;
};

const BRIEF_INSTRUCTIONS = `You are a researcher briefing a copywriter.

Search the web before you answer — always, even if you think you know the company. Then write a short factual brief. No preamble, no marketing language, no recommendations: just what is true and where it came from.

Cover, in this order and no more than a couple of sentences each:
- What the company actually does, and who its customers are.
- Roughly how big it is and where it operates, if you can find it.
- The words the company uses about itself — pull two or three real phrases from its own careers page, newsroom or about page, quoted exactly.
- Its stated values, principles or behaviours, if it publishes any — list them as a plain bulleted list, quoted EXACTLY as the company writes them, including capitalisation and any punctuation. These are usually on a careers, culture, "about us" or "our values" page, and are often three to six short phrases. Say "not found" rather than paraphrasing something value-ish out of marketing copy: a paraphrased value is worse than none, because staff will not recognise it.
- Anything its employees would currently have on their minds: a recent launch, opening, milestone, seasonal peak, or reorganisation.
- What kind of work its frontline staff do day to day.

If you cannot find something, write "not found" for that line rather than guessing. A short honest brief is worth more than a long invented one.`;

const buildBriefInput = (req: ResearchInput): string =>
  [
    `Company: ${req.company}`,
    req.context?.trim() ? `Extra context from the person requesting this: ${req.context.trim()}` : "",
    req.person?.name
      ? `The film is aimed at ${req.person.name}${req.person.title ? `, ${req.person.title}` : ""}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

const INSTRUCTIONS = `You write the on-screen copy for a three-and-a-half-minute product film. The film shows Workvivo — an employee-experience platform — as it would look inside ONE specific customer company. Your job is to research that company and rewrite the film's copy so it reads as if it were made for them.

Rules, in order of importance:

1. Every claim must be true of the real company. Search before you write. If research turns up nothing about a detail, write something generic rather than inventing a specific — no invented revenue, headcount, product names, executives, offices or awards.
2. Write in the company's own register. A logistics firm and a fashion label do not sound alike. Match the vocabulary their own careers page and newsroom use.
3. Respect every character cap. The copy sits in pixel-budgeted UI and a long line is clipped on screen, not wrapped. Each field gives you two numbers: write to \`aim_for\`, and treat \`max_characters\` as a hard ceiling you must never cross. Count the characters. A line that overruns is clipped mid-word on screen, so shorter is always safer than longer — and a field returned over its ceiling has to be cut by machine, which reads worse than anything you would have written.
4. Never mention Workvivo's competitors, and never write anything that reads as a sales pitch. This is internal-comms copy that the company's own staff would plausibly have written.
5. You are writing text only. Never output colours, hex codes, image paths or file names in any field. The only exceptions are the two fields whose own guide explicitly asks for a link or a file name — write those as the guide describes and nowhere else.
6. Rewrite EVERY field. The current text is there to show you the shape, length, rhythm and register expected — it is a worked example about a different company, not something to hand back. Returning it unchanged is a failed response.

The film's thread: every employee deserves one place that feels like a headquarters, it adapts to the person reading it, it catches you up after time away, and it helps a leader write and share better. Every line you write should belong to that thread.`;

/**
 * The copy table, split into batches that are written in separate calls.
 *
 * One call for the whole script stopped fitting when the film grew past its first
 * fifty-four seconds: there are now several hundred text slots, and a single reply that
 * had to carry all of them ran past `OPENAI_MAX_OUTPUT_TOKENS` and came back truncated —
 * which a strict schema turns into a hard failure rather than a partial answer. Splitting
 * also writes better copy, because forty fields get more attention than four hundred.
 *
 * The split is by SCENE RUN, not by size, so every batch is one coherent stretch of the
 * film and a batch's fields can refer to each other. Batches whose guides point at
 * another batch's fields — the Spaces run quotes `feed.spaces`, the billboard quotes
 * `composed.values` — are in the SECOND round and are shown what the first round wrote.
 *
 * `companyName` is in no batch: it is the operator's own input and is stamped over the
 * result afterwards, so asking for it would only invite a search result to rename their
 * customer.
 */
type Batch = { name: string; keys: string[] };

/**
 * WHICH ROUND A GROUP BELONGS IN IS DECIDED BY THE CROSS-REFERENCE GRAPH, NOT BY SCENE ORDER.
 *
 * Round two exists solely to let a few guides say "must match something written earlier".
 * Extracted from the guides themselves, the entire graph is four edges:
 *
 *     spaces    -> composed
 *     spotlight -> feed, spaces
 *     signage   -> feed, composed
 *     voice     -> feed
 *
 * So only `spaces`, `spotlight`, `signage` and `voice` have any reason to wait, and only
 * `feed` and `composed` have any reason to go first. Everything else — the opening, Chat,
 * the HQ Agent, Journeys, Newsletters, the article, Employee Insights — depends on nothing
 * but the brief and was sitting in round two purely because it happens late in the film.
 * Moving it to round one shrinks the round that everything else waits behind.
 *
 * `spotlight` must stay in the same batch as `spaces`: it references `spaces`, and a batch
 * can always see its own keys. Splitting them would need a third round, which costs a whole
 * round-trip to save nothing.
 *
 * `danglingCrossReferences()` is the guard on all of this — it fails loudly if a guide is
 * told to agree with a group its batch never sees. Run it after any change here.
 */
const ROUND_ONE: Batch[] = [
  {
    name: "the feed and the catch-up stories",
    keys: ["feed", "stories", "catchup"],
  },
  {
    // Alone, and deliberately: `spaces` and `signage` both wait on it, it is four fields,
    // and it therefore finishes long before anything else in this round.
    name: "the shout-out",
    keys: ["composed"],
  },
  {
    name: "the opening and the leader's post",
    // No "headquarters" and no "home": the opening headline, its four-word reply and the
    // "Personalized Homepage Experiences" card are fixed beats of the film, held in
    // FIXED_COPY rather than as slots. Those groups have no fields left to ask for.
    keys: ["quote", "person", "livestream"],
  },
  {
    name: "the article page and Employee Insights",
    keys: ["article", "seer"],
  },
  {
    name: "Chat and the HQ Agent",
    keys: ["chat", "hq"],
  },
  {
    name: "Journeys and Newsletters",
    keys: ["journeys", "newsletters"],
  },
];

const ROUND_TWO: Batch[] = [
  {
    name: "Spaces and the Spotlight tab",
    keys: ["spaces", "spotlight"],
  },
  {
    name: "Billboards",
    keys: ["signage"],
  },
  {
    name: "the feedback article",
    keys: ["voice"],
  },
];

const BATCHES = [...ROUND_ONE, ...ROUND_TWO];

/** Every top-level key that some batch claims, for the completeness check below. */
const BATCHED_KEYS = new Set(BATCHES.flatMap((b) => b.keys));

/**
 * A slot table key that no batch writes is a slot that silently keeps the baseline demo's
 * words — the failure mode this whole module exists to prevent, and an invisible one.
 * Adding a group to `videoCopy.ts` without adding it to a batch above should be loud.
 */
export const unbatchedCopyKeys = (): string[] =>
  Object.keys(COPY.shape).filter(
    (k) => k !== "companyName" && !BATCHED_KEYS.has(k),
  );

/**
 * A guide that says "match `feed.spaces`" is only honourable if the call writing it can
 * see `feed`. It can if its own batch writes that group, or if it is a round-two batch
 * being shown the group by `referencedGroups`.
 *
 * Worth checking because the two ways this breaks are both silent. Moving a group between
 * rounds, or adding a cross-reference pointing at a group written LATER, leaves the model
 * told to agree with something it was never given — and it will write something plausible
 * instead of complaining. Reordering the batches is the likely trigger, and nothing about
 * the batch list itself looks wrong afterwards.
 */
export const danglingCrossReferences = (): string[] => {
  const groups = Object.keys(COPY.shape);
  const roundOneKeys = ROUND_ONE.flatMap((b) => b.keys);
  const problems: string[] = [];

  BATCHES.forEach((batch, i) => {
    const shown =
      i >= ROUND_ONE.length ? referencedGroups(batch, roundOneKeys) : [];
    const visible = new Set([...batch.keys, ...shown]);
    for (const g of COPY.guides) {
      if (!batch.keys.includes(g.path.split(/[.[]/)[0])) continue;
      for (const key of groups) {
        if (visible.has(key)) continue;
        if (new RegExp("`" + key + "(?=[.\\[`])").test(g.guide)) {
          problems.push(
            `${g.path} is told to agree with \`${key}\`, which "${batch.name}" never sees`,
          );
        }
      }
    }
  });
  return problems;
};

/**
 * The length to ask for, given the length the slot can actually hold.
 *
 * Shared by the writing prompt and the repair prompt so the two cannot drift apart and
 * start pulling in different directions. Never returns less than 12: on the shortest slots
 * the headroom would otherwise be most of the field.
 */
const headroomTarget = (max: number): number =>
  Math.max(12, max - Math.min(40, Math.max(6, Math.ceil(max * 0.08))));

/**
 * One compact line per slot: the path, what it is for, its cap and what it says today.
 *
 * Enum slots are included as well as text ones, with their `options` in place of a
 * character cap. They were text-only for a while and the enums silently never reached the
 * model — it cannot choose a value it was never shown, so those slots kept the baseline
 * for every company while looking, from the outside, exactly like every other slot.
 */
const buildFieldLines = (keys: string[]): string =>
  COPY.guides
    .filter(
      (g) =>
        (g.kind === "text" || g.kind === "enum") &&
        keys.includes(g.path.split(/[.[]/)[0]),
    )
    .map((g) => {
      const current = readPath(COPY.defaults as unknown, g.path);
      return JSON.stringify({
        field: g.path,
        guide: g.guide,
        // `aim_for` alongside the true cap, rather than a quietly reduced cap.
        //
        // Both numbers are given because they mean different things: `max_characters` is
        // what the UI can physically show and what the repair pass measures against;
        // `aim_for` is the target that leaves room to be slightly wrong.
        //
        // The size of the gap is measured, not guessed. Logged over-cap fields have a
        // MEDIAN overshoot of +6 characters — a consistent small miss rather than a few
        // wild ones — so a purely proportional headroom is the wrong shape: 8% of a
        // 40-character headline is 3, which does not cover +6, while 8% of a 420-character
        // quote is 34, which is more than it needs. Hence a floor of 6 and a ceiling of 40.
        ...(g.kind === "enum"
          ? { one_of: g.options }
          : {
              max_characters: g.max,
              aim_for: headroomTarget(g.max ?? 40),
            }),
        current_text: current,
      });
    })
    .join("\n");

/** The strict schema narrowed to one batch's top-level keys. */
const batchSchema = (keys: string[]): Record<string, unknown> => {
  const full = toStrictSchema(COPY.schema) as {
    properties?: Record<string, unknown>;
  };
  const properties: Record<string, unknown> = {};
  for (const key of keys) {
    if (full.properties?.[key]) properties[key] = full.properties[key];
  }
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
};

/** Resolve `"quote.original"` / `"livestream.chapters[]"` against the defaults object. */
const readPath = (root: unknown, path: string): unknown => {
  let node: unknown = root;
  for (const seg of path.split(".")) {
    if (node == null) return undefined;
    if (seg.endsWith("[]")) {
      const key = seg.slice(0, -2);
      node = (node as Record<string, unknown>)[key];
      // Show the first entry as the exemplar; the whole list shares one guide and cap.
      node = Array.isArray(node) ? node[0] : undefined;
    } else {
      node = (node as Record<string, unknown>)[seg];
    }
  }
  return node;
};

/**
 * Which earlier-round groups THIS batch actually needs to be shown.
 *
 * Round two used to receive round one's entire output — all eight groups, to each of the
 * three calls. Only two of them are ever referred to, so the rest was ~2,400 tokens of
 * input paid for three times over and read by nobody.
 *
 * Detection is on the backticked form the guides use for a cross-reference (`feed.spaces`,
 * `composed.values`), which is exact: the same groups matched as bare words pick up every
 * guide that happens to contain the English words "home", "stories" or "person". Derived
 * from the guides rather than listed here, so it cannot drift out of date when a guide
 * gains or loses a reference — the cost of a wrong answer is a field silently told to
 * match something it was never shown.
 */
const referencedGroups = (
  batch: Batch,
  available: string[],
): string[] => {
  const guides = COPY.guides.filter((g) =>
    batch.keys.includes(g.path.split(/[.[]/)[0]),
  );
  return available.filter((key) =>
    guides.some((g) => new RegExp("`" + key + "(?=[.\\[`])").test(g.guide)),
  );
};

const buildInput = (
  req: ResearchInput & { brief?: string },
  batch: Batch,
  /** What earlier batches already wrote, so this one can agree with it. */
  written?: Partial<WorkvivoCopy>,
): string => {
  const lines = [
    `Company: ${req.company}`,
    req.person?.name
      ? `The film is addressed to ${req.person.name}${req.person.title ? `, ${req.person.title}` : ""}. Write as if they are the person reading these screens — and, in the composer scene, as if they are the person TYPING. The shout-out under \`composed\` is written BY ${req.person.name}, so \`composed.recipient\` must be a different colleague and ${req.person.name}'s own name must not appear in \`composed.body\`.`
      : "",
    req.context?.trim()
      ? `What the operator told us about this deal, in their words: ${req.context.trim()}`
      : "",
    "",
    "Research brief on this company:",
    req.brief?.trim() || "(no brief available — write carefully and stay general)",
    "",
    written && Object.keys(written).length
      ? [
          "Copy already written for this company, in earlier parts of the same film. Several fields below are told to agree with something in here — match those exactly, and keep the same voice throughout:",
          JSON.stringify(written),
          "",
        ].join("\n")
      : "",
    `You are writing ONE part of the film: ${batch.name}. Rewrite every field below for this company, using the brief. Return the same object shape, with your text in place of the current text.`,
    "",
    "Fields:",
    buildFieldLines(batch.keys),
  ];
  return lines.filter(Boolean).join("\n");
};

// --- cap enforcement -----------------------------------------------------------------

type Overlong = { path: string; max: number; text: string };

/**
 * Expand a limits path into every concrete path it names, with its current value.
 *
 * A path can contain `[]` at any depth — `livestream.chapters[]` is a list of strings,
 * `feed.billboards[].title` a field inside a list of objects — so this walks segment by
 * segment and forks at each list rather than special-casing a trailing `[]`. Getting
 * that wrong is silent: over-long feed copy simply never gets repaired, and the first
 * anyone knows is a headline clipped mid-word in the render.
 */
const expandPath = (
  root: unknown,
  path: string,
): { path: string; value: unknown }[] => {
  let frontier: { path: string; node: unknown }[] = [{ path: "", node: root }];

  for (const seg of path.split(".")) {
    const isList = seg.endsWith("[]");
    const key = isList ? seg.slice(0, -2) : seg;
    const next: { path: string; node: unknown }[] = [];

    for (const { path: p, node } of frontier) {
      if (node == null || typeof node !== "object") continue;
      const child = (node as Record<string, unknown>)[key];
      const here = p ? `${p}.${key}` : key;
      if (isList) {
        if (!Array.isArray(child)) continue;
        child.forEach((item, i) => next.push({ path: `${here}.${i}`, node: item }));
      } else {
        next.push({ path: here, node: child });
      }
    }
    frontier = next;
  }

  return frontier.map(({ path: p, node }) => ({ path: p, value: node }));
};

/** Walk the merged copy and collect every text field that came back over its cap. */
const findOverlong = (copy: WorkvivoCopy): Overlong[] => {
  const out: Overlong[] = [];
  for (const [path, max] of Object.entries(COPY.limits)) {
    for (const { path: concrete, value } of expandPath(copy, path)) {
      if (typeof value === "string" && value.length > max) {
        out.push({ path: concrete, max, text: value });
      }
    }
  }
  return out;
};

/**
 * Ask the model to rewrite just the offending fields, shorter.
 *
 * This is the rung above truncation on the enforcement ladder (guide §1): one small
 * no-search follow-up produces visibly better copy than cutting a sentence in half. If
 * it fails or is still long, the caller falls through to word-aware truncation.
 */
const repairOverlong = async (
  overlong: Overlong[],
): Promise<Record<string, string>> => {
  const schema = {
    type: "object",
    properties: {
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            text: { type: "string" },
          },
          required: ["field", "text"],
          additionalProperties: false,
        },
      },
    },
    required: ["fields"],
    additionalProperties: false,
  };

  const input = [
    "Each field below is too long for the space it appears in. Rewrite each one to fit its limit.",
    "Keep the meaning and the voice. Do not just cut the end off — rewrite the line so it still reads as a finished sentence.",
    "max_characters is a hard ceiling, not a target. Aim comfortably under it. A reply still over the limit is a failed reply.",
    "",
    ...overlong.map((o) =>
      // Asked for the same headroom the writing prompt uses, and still checked against the
      // REAL cap afterwards. Handing over the exact number means a line that misses by the
      // usual few characters comes back still over, and gets machine-truncated.
      JSON.stringify({
        field: o.path,
        max_characters: headroomTarget(o.max),
        text: o.text,
      }),
    ),
  ].join("\n");

  const { value } = await callStructured<{ fields: { field: string; text: string }[] }>({
    instructions:
      "You shorten copy to fit fixed-width UI. You return the same fields you are given, rewritten shorter.",
    input,
    schema,
    schemaName: "shortened_fields",
    search: false,
    // Kept at the writing effort. `low` was tried here and was not better — 20 fields
    // still needed trimming, for 3 more seconds — because the problem was never this
    // call's reasoning, it was how much over-cap copy reached it. `aim_for` fixed that
    // upstream instead.
    effort: llmConfig().writeReasoningEffort,
    label: "repair:shorten",
  });

  const out: Record<string, string> = {};
  for (const f of value.fields ?? []) {
    if (typeof f?.field === "string" && typeof f?.text === "string") out[f.field] = f.text;
  }
  return out;
};

/**
 * Set a concrete path such as `"quote.original"`, `"timeOff.words.2"` or
 * `"feed.billboards.0.title"` on a copy object, in place.
 *
 * The paths here come from `expandPath`, so array indices are plain numeric segments and
 * bracket syntax never reaches this function.
 */
const writePath = (root: unknown, path: string, value: string): void => {
  const segs = path.split(".");
  let node: any = root;
  for (const seg of segs.slice(0, -1)) {
    if (node == null) return;
    node = node[seg];
  }
  if (node != null) node[segs[segs.length - 1]] = value;
};

/** Read back a concrete path, for the truncation fallback. */
const readConcrete = (root: unknown, path: string): unknown => {
  let node: any = root;
  for (const seg of path.split(".")) {
    if (node == null) return undefined;
    node = node[seg];
  }
  return node;
};


/**
 * The main character cannot thank themselves — see src/customize/shoutOut.ts.
 *
 * A no-op on most runs now: the copywriting pass starts when the company is submitted,
 * which is BEFORE the operator has typed the main character's name, so `req.person` is
 * usually empty here. The wizard runs the same repair in `toInputProps`, where both
 * halves are finally known. This call is kept for the case where a caller does supply a
 * person — a retry from a later step, or the route being used directly.
 */
const applySelfShoutOutRepair = (
  copy: WorkvivoCopy,
  author: string | undefined,
  issues: string[],
): WorkvivoCopy => {
  const { copy: fixed, swappedFrom } = repairSelfShoutOut(copy, author);
  if (swappedFrom) {
    issues.push(
      `The shout-out thanked ${author?.trim()}, who is the person writing it — swapped the recipient to "${fixed.composed.recipient}".`,
    );
  }
  return fixed;
};


/**
 * The tagged value has to be one the viewer just watched being picked.
 *
 * The composer shows a four-row Select Value list and the published post then reads
 * "Value: X". If X is not one of those four rows the shot before it contradicts the shot
 * after it — a small inconsistency that is very visible, because the two frames are nine
 * seconds apart and show the same word. The model is told the field must match exactly;
 * this is the deterministic backstop.
 *
 * Matched case- and punctuation-insensitively before falling back, because "care deeply"
 * and "Care Deeply" are the same pick and snapping to the list's own spelling is the
 * whole point.
 */
const normalizeValue = (v: string): string =>
  v.toLowerCase().replace(/[^a-z0-9]/g, "");

const repairTaggedValue = (copy: WorkvivoCopy, issues: string[]): WorkvivoCopy => {
  const { values, value } = copy.composed;
  const match = values.find((v) => normalizeValue(v) === normalizeValue(value));
  if (match) {
    // Already one of the four; adopt the list's exact spelling and stop.
    return match === value
      ? copy
      : { ...copy, composed: { ...copy.composed, value: match } };
  }

  // Not in the list at all. The first row is what the baseline demo tags, so it is the
  // pick that needs no further justification.
  issues.push(
    `The post was tagged "${value}", which is not one of the four values on the picker — retagged it "${values[0]}".`,
  );
  return { ...copy, composed: { ...copy.composed, value: values[0] } };
};

export const researchCompany = async (
  req: ResearchInput,
): Promise<ResearchResult> => {
  if (!req.company?.trim()) {
    throw new LlmError("A company name is required.");
  }

  const issues: string[] = [];
  const startedAt = Date.now();
  const phases: string[] = [];
  // Declared up here so the brief's tokens land in it too. They were being dropped: the
  // counter started after the search call, so the reported cost of a run excluded the one
  // call that pays for web search.
  const usage = { input: 0, output: 0 };

  // Step 1: research, unconstrained, with search on. See `callText` for why this is not
  // folded into the structured call.
  let brief = "";
  let citations: string[] = [];
  const briefStart = Date.now();
  try {
    const research = await callText({
      instructions: BRIEF_INSTRUCTIONS,
      input: buildBriefInput(req),
      label: "brief (search)",
    });
    brief = research.text;
    citations = research.citations;
    usage.input += research.usage?.input ?? 0;
    usage.output += research.usage?.output ?? 0;
  } catch (err) {
    // A failed search should not lose the whole run: the copy step can still write
    // something reasonable and generic, and the operator is told it did.
    issues.push(
      `Research step failed (${err instanceof Error ? err.message : "unknown error"}); wrote from general knowledge instead.`,
    );
  }

  const briefMs = Date.now() - briefStart;
  phases.push(`brief ${ms(briefMs)}`);
  logPhase("brief", briefMs, `${brief.length} chars, ${citations.length} citations`);

  if (!citations.length && brief) {
    issues.push("The research step cited no sources — treat specifics with suspicion.");
  }

  // Step 2: write, strict schema, no search — one call per batch (see BATCHES).
  //
  // Round one is the opening run and the feed; round two is everything after it, and is
  // shown round one's answer because several of its guides say "must match X" about a
  // field round one wrote. Within a round the calls are independent and run together, so
  // this is two round-trips deep rather than five.
  //
  // A batch that fails is logged and skipped rather than thrown: the slots it covers keep
  // approved baseline copy, which is a worse video than a full pass and a much better one
  // than no video. `Promise.allSettled` is what makes that per-batch rather than all-or-
  // nothing.
  const runBatch = async (
    batch: Batch,
    written?: Partial<WorkvivoCopy>,
  ): Promise<Partial<WorkvivoCopy>> => {
    // Show this batch only the earlier groups its own guides name. See referencedGroups.
    const needed = written
      ? referencedGroups(batch, Object.keys(written))
      : [];
    const context = needed.length
      ? (Object.fromEntries(
          needed.map((k) => [k, (written as Record<string, unknown>)[k]]),
        ) as Partial<WorkvivoCopy>)
      : undefined;

    const res = await callStructured<Partial<WorkvivoCopy>>({
      instructions: INSTRUCTIONS,
      input: buildInput({ ...req, brief }, batch, context),
      schema: batchSchema(batch.keys),
      schemaName: `workvivo_video_copy_${batch.keys[0]}`,
      search: false,
      // Writing, not researching: the brief is already in the prompt and the schema fixes
      // the shape. See `writeReasoningEffort` for the measurements behind this.
      effort: llmConfig().writeReasoningEffort,
      label: `batch:${batch.keys[0]}`,
    });
    usage.input += res.usage?.input ?? 0;
    usage.output += res.usage?.output ?? 0;
    return res.value;
  };

  const collect = async (
    batches: Batch[],
    written?: Partial<WorkvivoCopy>,
  ): Promise<Partial<WorkvivoCopy>> => {
    const settled = await Promise.allSettled(
      batches.map((b) => runBatch(b, written)),
    );
    const merged: Record<string, unknown> = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") {
        Object.assign(merged, r.value);
      } else {
        issues.push(
          `Could not write ${batches[i].name} (${r.reason instanceof Error ? r.reason.message : "unknown error"}); those screens keep the demo's copy.`,
        );
      }
    });
    return merged as Partial<WorkvivoCopy>;
  };

  const [first, firstMs] = await timed(() => collect(ROUND_ONE));
  phases.push(`round1 ${ms(firstMs)}`);
  logPhase("round one", firstMs, `${ROUND_ONE.length} calls in parallel`);

  const [second, secondMs] = await timed(() => collect(ROUND_TWO, first));
  phases.push(`round2 ${ms(secondMs)}`);
  logPhase("round two", secondMs, `${ROUND_TWO.length} calls in parallel`);

  const value: Partial<WorkvivoCopy> = { ...first, ...second };

  // Shape-lock against the defaults FIRST, with caps off: a missing or wrongly-typed
  // field falls back to approved baseline copy, and list lengths cannot change.
  let copy = COPY.merge(value, { capLengths: false });

  // The company name is the operator's to set, not the model's — it types it into the
  // wizard. Overwriting it here would let a search result rename their customer.
  copy = { ...copy, companyName: req.company.trim() };

  // Before the length pass: the swap can change a field's length, and this way the
  // repaired body is measured rather than the one that got thrown away.
  copy = applySelfShoutOutRepair(copy, req.person?.name, issues);
  copy = repairTaggedValue(copy, issues);

  const overlong = findOverlong(copy);
  if (overlong.length) {
    // How far over, not just how many. A tail of +2s is a prompt problem worth solving with
    // a target length; a field at three times its cap means the guide is asking for more
    // than the slot can hold, and no amount of "aim shorter" will fix that one.
    const byExcess = [...overlong].sort(
      (a, b) => b.text.length - b.max - (a.text.length - a.max),
    );
    const excesses = byExcess.map((o) => o.text.length - o.max);
    const median = excesses[Math.floor(excesses.length / 2)] ?? 0;
    // eslint-disable-next-line no-console
    console.log(
      `[research] over cap: ${overlong.length} field(s), median +${median}, worst ${byExcess
        .slice(0, 3)
        .map((o) => `${o.path} ${o.text.length}/${o.max}`)
        .join(", ")}`,
    );
    const repairStart = Date.now();
    try {
      const rewritten = await repairOverlong(overlong);
      for (const o of overlong) {
        const fixed = rewritten[o.path];
        if (typeof fixed === "string" && fixed.trim()) writePath(copy, o.path, fixed.trim());
      }
      const stillLong = findOverlong(copy);
      issues.push(
        stillLong.length
          ? `Rewrote ${overlong.length} over-long field(s); ${stillLong.length} still needed trimming.`
          : `Rewrote ${overlong.length} over-long field(s) to fit.`,
      );
      // Whatever the rewrite did not fix gets word-aware truncation as the floor.
      for (const o of stillLong) {
        writePath(copy, o.path, truncateAtWord(readConcrete(copy, o.path) as string, o.max));
      }
    } catch (err) {
      issues.push(
        `Could not rewrite ${overlong.length} over-long field(s) (${err instanceof Error ? err.message : "unknown error"}); trimmed them instead.`,
      );
      for (const o of overlong) {
        writePath(copy, o.path, truncateAtWord(readConcrete(copy, o.path) as string, o.max));
      }
    }
    const repairMs = Date.now() - repairStart;
    phases.push(`repair ${ms(repairMs)}`);
    logPhase("repair", repairMs, `${overlong.length} field(s) over cap`);
  } else {
    // Worth a line even when it does nothing. This is a whole extra round-trip on the
    // critical path, and knowing how often it fires is what decides whether tightening
    // the caps in the prompt is worth doing.
    logPhase("repair", 0, "skipped — nothing over cap");
  }

  const totalMs = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(
    `[research] TOTAL ${ms(totalMs).padStart(17)}  ${req.company.trim()}  (${phases.join(", ")})  in=${usage.input} out=${usage.output}`,
  );

  return { copy, brief, issues, citations, usage };
};

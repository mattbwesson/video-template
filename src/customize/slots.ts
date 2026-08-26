/**
 * One definition per slot; everything else is derived.
 *
 * The customisation guide's first two recommendations (§5.1, §5.2) are that a video
 * should have exactly one slot shape and that a slot's cap, field guide, default and
 * type should live in the same place rather than in four tables that drift apart. This
 * module is that place. Declare a slot once:
 *
 *   const COPY = defineCopy({
 *     headline: text({ default: "Every employee deserves a headquarters.",
 *                      max: 46,
 *                      guide: "The opening claim, said about this company." }),
 *   });
 *
 * and read the default object, the limits table, the model-facing field guides and a
 * strict JSON schema off `COPY.defaults` / `.limits` / `.guides` / `.schema`.
 *
 * `server/llm/researchCompany.ts` is the consumer: it builds its prompt from `.guides`,
 * decodes the reply against `.schema`, and enforces `.limits`. Adding a slot to the copy
 * table therefore teaches the copywriting pass about it with no prompt edit at all.
 */

export type SlotKind = "text" | "enum" | "asset" | "number";

export type TextSlot = {
  kind: "text";
  default: string;
  /** Hard cap in characters. Exists because the text lands in pixel-budgeted UI. */
  max: number;
  /** The model-facing field guide. This string IS the prompt for the slot. */
  guide: string;
  /** Multi-line slots keep their newlines; capping counts them like any other char. */
  multiline?: boolean;
};

export type EnumSlot<T extends string = string> = {
  kind: "enum";
  default: T;
  /** Closed set. Anything outside it is replaced by `default` at validation time. */
  options: readonly T[];
  guide: string;
};

/**
 * A slot whose value is a URL or a `staticFile()` path. The model never writes one of
 * these — either the operator uploads it, or a closed enum picks a key that an
 * exhaustive lookup turns into a path (guide §4).
 */
export type AssetSlot = {
  kind: "asset";
  default: string;
  guide: string;
  /** Set when the operator supplies this rather than the copy pipeline. */
  operatorSupplied?: boolean;
};

export type NumberSlot = {
  kind: "number";
  default: number;
  min?: number;
  max?: number;
  guide: string;
};

export type AnySlot = TextSlot | EnumSlot | AssetSlot | NumberSlot;

export const text = (cfg: Omit<TextSlot, "kind">): TextSlot => ({
  kind: "text",
  ...cfg,
});

export const enumSlot = <T extends string>(
  cfg: Omit<EnumSlot<T>, "kind">,
): EnumSlot<T> => ({ kind: "enum", ...cfg });

export const asset = (cfg: Omit<AssetSlot, "kind">): AssetSlot => ({
  kind: "asset",
  ...cfg,
});

export const number = (cfg: Omit<NumberSlot, "kind">): NumberSlot => ({
  kind: "number",
  ...cfg,
});

/** A group is a nested slot table; a list is a fixed-length tuple of one slot repeated. */
export type SlotShape = { [key: string]: AnySlot | SlotShape | ListSlot };

// `of` is generic so `ValueOf` can see through it. Without the parameter every list
// would widen to `ValueOf<AnySlot | SlotShape>[]` and the copy type would collapse to a
// union of every slot kind in the table.
export type ListSlot<T extends AnySlot | SlotShape = AnySlot | SlotShape> = {
  kind: "list";
  /** Tuple length is fixed, so a merge can never produce a hole (guide §1, gen 2). */
  length: number;
  of: T;
  /**
   * Per-index baselines. Every entry shares one cap and one field guide (that is what
   * makes it a list rather than four slots), but the approved copy differs per position
   * — "Now / they / have / one." is four different words. Shorter than `length` falls
   * back to `of.default` for the tail.
   */
  defaults?: readonly unknown[];
  guide: string;
};

export const list = <T extends AnySlot | SlotShape>(
  cfg: Omit<ListSlot<T>, "kind">,
): ListSlot<T> => ({ kind: "list", ...cfg });

const isSlot = (v: unknown): v is AnySlot | ListSlot =>
  typeof v === "object" &&
  v !== null &&
  "kind" in (v as Record<string, unknown>) &&
  typeof (v as { kind: unknown }).kind === "string";

// --- derived: default value -------------------------------------------------------

export type ValueOf<S> = S extends TextSlot
  ? string
  : S extends EnumSlot<infer T>
    ? T
    : S extends AssetSlot
      ? string
      : S extends NumberSlot
        ? number
        : S extends ListSlot
          ? ValueOf<S["of"]>[]
          : S extends SlotShape
            ? { [K in keyof S]: ValueOf<S[K]> }
            : never;

const defaultsOf = (shape: SlotShape | AnySlot | ListSlot): unknown => {
  if (isSlot(shape)) {
    if (shape.kind === "list") {
      return Array.from({ length: shape.length }, (_, i) =>
        shape.defaults?.[i] !== undefined ? shape.defaults[i] : defaultsOf(shape.of),
      );
    }
    return shape.default;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(shape)) out[k] = defaultsOf(v);
  return out;
};

// --- derived: limits table --------------------------------------------------------

/** Flat `"path.to.slot" -> max chars`, for logging and for the repair prompt. */
const limitsOf = (
  shape: SlotShape | AnySlot | ListSlot,
  prefix = "",
  out: Record<string, number> = {},
): Record<string, number> => {
  if (isSlot(shape)) {
    if (shape.kind === "list") return limitsOf(shape.of, `${prefix}[]`, out);
    if (shape.kind === "text") out[prefix] = shape.max;
    return out;
  }
  for (const [k, v] of Object.entries(shape)) {
    limitsOf(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
};

// --- derived: field guides --------------------------------------------------------

export type FieldGuide = {
  path: string;
  kind: SlotKind | "list";
  guide: string;
  max?: number;
  options?: readonly string[];
};

const guidesOf = (
  shape: SlotShape | AnySlot | ListSlot,
  prefix = "",
  out: FieldGuide[] = [],
): FieldGuide[] => {
  if (isSlot(shape)) {
    if (shape.kind === "list") {
      out.push({ path: prefix, kind: "list", guide: shape.guide });
      return guidesOf(shape.of, `${prefix}[]`, out);
    }
    out.push({
      path: prefix,
      kind: shape.kind,
      guide: shape.guide,
      ...(shape.kind === "text" ? { max: shape.max } : {}),
      ...(shape.kind === "enum" ? { options: shape.options } : {}),
    });
    return out;
  }
  for (const [k, v] of Object.entries(shape)) {
    guidesOf(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
};

// --- derived: JSON schema ---------------------------------------------------------

type JsonSchema = Record<string, unknown>;

/**
 * A strict `json_schema` for the Responses API — `additionalProperties: false` and every
 * key required, which is what makes structured decoding non-optional rather than
 * best-effort (guide §5.3). Asset slots are omitted: the model must never emit a path.
 */
const schemaOf = (shape: SlotShape | AnySlot | ListSlot): JsonSchema | null => {
  if (isSlot(shape)) {
    switch (shape.kind) {
      case "text":
        return { type: "string", description: shape.guide, maxLength: shape.max };
      case "enum":
        return { type: "string", enum: [...shape.options], description: shape.guide };
      case "number":
        return { type: "number", description: shape.guide };
      case "asset":
        return null;
      case "list": {
        const items = schemaOf(shape.of);
        if (!items) return null;
        return {
          type: "array",
          description: shape.guide,
          items,
          minItems: shape.length,
          maxItems: shape.length,
        };
      }
    }
  }
  const properties: Record<string, JsonSchema> = {};
  for (const [k, v] of Object.entries(shape)) {
    const s = schemaOf(v);
    if (s) properties[k] = s;
  }
  if (!Object.keys(properties).length) return null;
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
};

// --- capping ----------------------------------------------------------------------

/**
 * Prefer a sentence boundary past half the budget, then a word boundary, and only cut
 * mid-word as a last resort. Truncation is the FLOOR of the enforcement ladder, not the
 * first move — a model rewrite pass belongs above it (guide §1, "rewrite, don't cut").
 */
export const truncateAtWord = (input: string, max: number): string => {
  const s = input.trim();
  if (s.length <= max) return s;
  const window = s.slice(0, max);
  const sentence = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! "),
  );
  if (sentence > max / 2) return window.slice(0, sentence + 1).trim();
  const word = window.lastIndexOf(" ");
  if (word > max / 2) return finishClause(window.slice(0, word));
  return finishClause(window);
};

/** Strip a dangling connective left behind by the cut, so the line still reads. */
const finishClause = (input: string): string => {
  let s = input.trim().replace(/[,;:—-]+$/, "").trim();
  const dangling =
    /\s+(and|or|but|so|the|a|an|to|of|for|with|that|which|in|on|at|by|from)$/i;
  while (dangling.test(s)) s = s.replace(dangling, "").trim();
  return s;
};

// --- the public handle ------------------------------------------------------------

export type CopyTable<S extends SlotShape> = {
  shape: S;
  defaults: ValueOf<S>;
  limits: Record<string, number>;
  guides: FieldGuide[];
  schema: JsonSchema;
  /**
   * Deep-merge a partial over a base, locking list lengths and applying caps.
   *
   * `base` defaults to the approved baseline copy. Passing an already-merged object
   * instead is how a second layer is applied — the researched copy over the baseline,
   * then the operator's own fields over that — without the outer layer having to repeat
   * every field of the inner one to avoid clobbering it.
   */
  merge: (
    patch: unknown,
    opts?: { capLengths?: boolean; base?: ValueOf<S> },
  ) => ValueOf<S>;
};

export const defineCopy = <S extends SlotShape>(shape: S): CopyTable<S> => {
  const defaults = defaultsOf(shape) as ValueOf<S>;
  return {
    shape,
    defaults,
    limits: limitsOf(shape),
    guides: guidesOf(shape),
    schema: schemaOf(shape) ?? {},
    merge: (patch, opts) =>
      mergeInto(shape, opts?.base ?? defaults, patch, opts?.capLengths ?? false) as ValueOf<S>,
  };
};

/**
 * Missing, wrongly-typed or over-long values degrade to approved baseline copy rather
 * than to a blank — the property that makes a bad model response cosmetic instead of
 * fatal. `capLengths` is off by default so an operator's own inline edit is never
 * re-truncated behind their back; caps are meant to apply exactly once, upstream.
 */
const mergeInto = (
  shape: SlotShape | AnySlot | ListSlot,
  base: unknown,
  patch: unknown,
  cap: boolean,
): unknown => {
  if (patch === undefined || patch === null) return base;

  if (isSlot(shape)) {
    switch (shape.kind) {
      case "text": {
        if (typeof patch !== "string" || !patch.trim()) return base;
        return cap ? truncateAtWord(patch, shape.max) : patch;
      }
      case "enum":
        return typeof patch === "string" &&
          (shape.options as readonly string[]).includes(patch)
          ? patch
          : base;
      case "asset":
        return typeof patch === "string" && patch ? patch : base;
      case "number": {
        if (typeof patch !== "number" || Number.isNaN(patch)) return base;
        const lo = shape.min ?? -Infinity;
        const hi = shape.max ?? Infinity;
        return Math.min(hi, Math.max(lo, patch));
      }
      case "list": {
        const arr = Array.isArray(base) ? base : [];
        if (!Array.isArray(patch)) return arr;
        // Length is the default's length, always: a short reply keeps the tail of the
        // baseline and a long one is ignored past the end.
        return arr.map((b, i) => mergeInto(shape.of, b, patch[i], cap));
      }
    }
  }

  if (typeof patch !== "object") return base;
  const out: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [k, sub] of Object.entries(shape as SlotShape)) {
    out[k] = mergeInto(
      sub,
      (base as Record<string, unknown>)[k],
      (patch as Record<string, unknown>)[k],
      cap,
    );
  }
  return out;
};

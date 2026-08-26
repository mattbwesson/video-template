/**
 * Swap the baseline demo's company name for the operator's, everywhere in the copy.
 *
 * This runs the instant the operator finishes typing, before any model is involved, and
 * it is the reason the preview reads correctly from the first keystroke. The guide calls
 * this trick underrated and asks for it to be generalised (§5.4): it is pure, instant,
 * offline and reversible — re-running it on the original defaults with a different name
 * gives a different result with no drift, because it never edits in place.
 *
 * It is deliberately conservative. It matches the baseline name on word boundaries only,
 * so a company called "Spot" is not mangled by a substring hit, and it leaves possessive
 * apostrophes alone by matching the bare name and letting the "'s" ride along.
 */

import { BASELINE_COMPANY, type WorkvivoCopy } from "./videoCopy";

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const substituteCompany = (
  input: string,
  company: string,
  baseline: string = BASELINE_COMPANY,
): string => {
  const to = company.trim();
  if (!to || to === baseline) return input;
  return input.replace(new RegExp(`\\b${escapeRegExp(baseline)}\\b`, "g"), to);
};

/** Deep-walk the copy object, substituting in every string. Shape is preserved exactly. */
const walk = (value: unknown, company: string, baseline: string): unknown => {
  if (typeof value === "string") return substituteCompany(value, company, baseline);
  if (Array.isArray(value)) return value.map((v) => walk(v, company, baseline));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, company, baseline);
    return out;
  }
  return value;
};

/**
 * `copy.companyName` is the source of truth, so it is read off the object rather than
 * passed in — one argument that can be out of step with the object is one too many.
 */
export const substituteBrandInCopy = (
  copy: WorkvivoCopy,
  baseline: string = BASELINE_COMPANY,
): WorkvivoCopy => walk(copy, copy.companyName, baseline) as WorkvivoCopy;

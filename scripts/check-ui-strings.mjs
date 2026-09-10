/**
 * Put every string the film actually renders through the Japanese dictionary, and report
 * anything that comes out still looking English.
 *
 *     node scripts/check-ui-strings.mjs
 *
 * WHY THIS EXISTS
 *
 * Two ways a string stays English, and neither fails anything on its own:
 *
 *   1. It has no entry, so `useT` returns it unchanged — that is the deliberate fallback,
 *      and it means a missing translation looks like working software.
 *   2. It matches a PATTERN whose replacement copies English through a capture group.
 *      `[/^(\d+) (Jan|Feb|Mar) 2026$/, "2026年$2$1日"]` rendered 2026年Jan15日 on the
 *      manager-insights axis for as long as that rule existed. A sibling rule hardcoded
 *      April, which is why the one date anybody spot-checked looked right.
 *
 * Both are invisible outside a render of the exact frame, in a language most of the team
 * does not read. So this walks the real call sites (scripts/ui-string-sites.mjs), resolves
 * each through the real dictionary, and flags Latin that survived.
 *
 * Exits non-zero on anything not in ALLOWED below.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUNDLE = "/tmp/japanese-ui-check.mjs";

/**
 * Latin that is SUPPOSED to survive: product and company names, units, and initialisms that
 * Japanese uses in Latin script. A word here is not evidence of a missing translation.
 */
const ALLOWED = [
  "Workvivo", "Zoom", "Spotify", "HQ", "AI", "eNPS", "NPS", "CSV", "PDF", "GIF", "JWT",
  "API", "URL", "SSO", "HR", "IT", "OK", "fps", "Seer", "In Focus", "Q1", "Q2", "Q3", "Q4",
  "px", "ID", "UI", "AM", "PM", "Webhook", "Slack", "Teams", "Google", "Microsoft",
  "KB", "MB", "GB", "Workday", "Drive", "ServiceNow", "Seer", "Salesforce", "Jira",
];

execFileSync("npx", ["esbuild", "src/japanese/japaneseUi.ts", "--bundle", "--format=esm",
  `--outfile=${BUNDLE}`, "--log-level=error"], { cwd: ROOT });
const { JAPANESE_UI: UI } = await import(BUNDLE);
const sites = JSON.parse(execFileSync("node", ["scripts/ui-string-sites.mjs"], { cwd: ROOT, encoding: "utf8" }));

/** The same lookup order as useT in src/customize/uiStrings.tsx. */
const translate = (s, ctx) => {
  const core = s.trim().replace(/\s+/g, " ");
  if (ctx && UI.exact[`${ctx}/${core}`] !== undefined) return UI.exact[`${ctx}/${core}`];
  if (UI.exact[core] !== undefined) return UI.exact[core];
  for (const [re, out] of UI.patterns ?? []) {
    if (re.test(core)) return typeof out === "string" ? core.replace(re, out) : core.replace(re, out);
  }
  return null; // no entry at all
};

const strip = (s) => {
  let out = s;
  for (const a of ALLOWED) out = out.split(a).join("");
  return out;
};

const missing = [];
const leaked = [];
for (const { file, key, ctx } of sites) {
  if (!/[A-Za-z]/.test(key)) continue; // a number or a symbol needs no translation
  // <style> children. The codemod wraps every string-typed JSX child, and an inline
  // stylesheet is one; it is not text anybody reads.
  if (/[{};]/.test(key) && /\bfill\b|:\s*#|\bcls-/.test(key)) continue;
  // A key that is nothing but product names needs no entry — "Workday" is "Workday" in
  // Japanese. Absence is only a finding when there was something to translate.
  if (!/[A-Za-z]{2,}/.test(strip(key))) continue;
  const ja = translate(key, ctx);
  if (ja === null) {
    missing.push({ file, key });
  } else if (/[A-Za-z]{2,}/.test(strip(ja))) {
    // Letters survived that are not on the allowlist. Either the entry is still English or
    // a pattern copied a capture group through without translating it.
    leaked.push({ file, key, ja });
  }
}

const show = (title, rows, fmt) => {
  if (!rows.length) return;
  console.log(`\n${title} (${rows.length}):`);
  for (const r of rows.slice(0, 40)) console.log(`  ${fmt(r)}`);
  if (rows.length > 40) console.log(`  … and ${rows.length - 40} more`);
};

show("Rendered with no Japanese entry", missing, (r) => `${r.file}: ${JSON.stringify(r.key)}`);
show("Translated but Latin survived", leaked, (r) => `${r.file}: ${JSON.stringify(r.key)} -> ${r.ja}`);

console.log(
  `\n${sites.length} call sites checked; ${missing.length} untranslated, ${leaked.length} with leftover Latin.`,
);
if (missing.length || leaked.length) process.exit(1);
console.log("every string the film renders resolves to Japanese.");

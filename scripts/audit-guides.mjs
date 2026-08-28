#!/usr/bin/env node
/**
 * Does each slot's GUIDE ask for something its CAP can hold?
 *
 *   node scripts/audit-guides.mjs          # findings only
 *   node scripts/audit-guides.mjs --all    # every slot, including the clean ones
 *
 * Why this exists. Every writable slot carries two instructions that can disagree: a prose
 * guide saying what to write, and a `max` saying how much room there is on screen. The model
 * weights the prose. `quote.original` was told to be "written at length and slightly
 * rambling" against a 420-character cap and came back at 538-715 characters in EVERY
 * measured run — not an overshoot, a correctly followed instruction that the cap then had to
 * amputate.
 *
 * A mismatch here is invisible from either side on its own. The guide reads fine. The cap
 * reads fine. Only together are they a contradiction, and the symptom shows up two systems
 * away, as copy the repair pass truncates mid-thought.
 *
 * This is heuristic and deliberately noisy — it reports SUSPICIONS for a human to judge, not
 * errors. It cannot know that "a paragraph" means something shorter in your head than in
 * mine. Read the findings, do not batch-apply them.
 *
 * See docs/research-pass-performance.md §7.
 */

const showAll = process.argv.includes("--all");

const { COPY } = await import("../src/customize/videoCopy.ts");

/**
 * How many characters a phrase like "two sentences" actually asks for.
 *
 * Calibrated to what the MODEL writes, not to what the demo's copy does — which is the
 * whole point, and a correction to how this table was first built. Charging "one sentence"
 * at the demo's own 55-95 characters made the audit under-flag: `journeys.phone.blurb` says
 * "one sentence", caps at 140, looked clean, and came back at 170-182 in consecutive runs.
 * The model's sentences run roughly 90-180 characters, and the ranges below follow from
 * that.
 *
 * `lo` is what a disciplined writer would produce, `hi` what the instruction permits. A cap
 * below `lo` is a straight contradiction; a cap between the two is a warning, because a
 * perfectly obedient answer can still overrun.
 */
const LENGTH_PHRASES = [
  { re: /\bone or two sentences\b/i, label: "one or two sentences", lo: 90, hi: 340 },
  { re: /\btwo or three sentences\b/i, label: "two or three sentences", lo: 180, hi: 500 },
  { re: /\bone sentence\b|\ba single sentence\b/i, label: "one sentence", lo: 70, hi: 180 },
  { re: /\btwo sentences\b/i, label: "two sentences", lo: 150, hi: 340 },
  { re: /\bthree sentences\b/i, label: "three sentences", lo: 230, hi: 500 },
  { re: /\bfour sentences\b/i, label: "four sentences", lo: 310, hi: 660 },
  { re: /\btwo paragraphs\b/i, label: "two paragraphs", lo: 500, hi: 1000 },
  { re: /\bone paragraph\b|\ba paragraph\b/i, label: "a paragraph", lo: 250, hi: 550 },
  { re: /\ba few words\b/i, label: "a few words", lo: 12, hi: 45 },
  { re: /\ba word or two\b/i, label: "a word or two", lo: 5, hi: 25 },
];

/**
 * Phrases that ask for LENGTH itself. These fight a cap no matter what it is.
 *
 * Bare "long" is deliberately NOT here. It matched `feed.appPost.anniversary.body`, whose
 * guide says "how long, then a thank-you" — "how long they have worked here", an instruction
 * about content, not size. A heuristic that cries wolf on the first run is one nobody reads
 * by the third, so the ambiguous stems are left out and only the unambiguous ones kept.
 */
const VERBOSITY_PHRASES = [
  { re: /\bat length\b/i, label: '"at length"' },
  { re: /\brambl/i, label: '"rambling"' },
  { re: /\bwaffl/i, label: '"waffle"' },
  { re: /\bverbose\b/i, label: '"verbose"' },
  { re: /\bdiscursive\b/i, label: '"discursive"' },
  { re: /\blengthy\b/i, label: '"lengthy"' },
  { re: /\bas long as\b|\blong-form\b/i, label: '"long-form"' },
];

/**
 * A guide whose length is defined by ANOTHER field's length inherits that field's problem.
 * `quote.rewritten` is "about half the length" of `quote.original`; when the original came
 * back at 700 characters, half of it was still over `rewritten`'s own 260 cap.
 */
const RELATIVE_PHRASES = [
  { re: /\bhalf the length\b|\bhalf as long\b/i, label: "defined as a fraction of another field" },
  { re: /\btranslation of\b|\btranslate[sd]? /i, label: "a translation of another field" },
  { re: /\bsame (message|text|words|copy) as\b/i, label: "restates another field" },
  { re: /\bthe same as\b/i, label: "restates another field" },
];

/** Read `"quote.original"` / `"livestream.pills[]"` out of the defaults. */
const readPath = (root, path) => {
  let node = root;
  for (const seg of path.split(".")) {
    if (node == null) return undefined;
    if (seg.endsWith("[]")) {
      node = node[seg.slice(0, -2)];
      node = Array.isArray(node) ? node[0] : undefined;
    } else node = node[seg];
  }
  return node;
};

/** Every comma- or semicolon-separated demand in a guide, as a rough component count. */
const componentCount = (guide) => {
  const listy = guide.match(/[^.!?]*\b(?:an?|one|two|three)\b[^.!?]*[,;][^.!?]*/g) ?? [];
  if (!listy.length) return 0;
  return Math.max(...listy.map((s) => s.split(/[,;]/).length));
};

const findings = [];
const clean = [];

for (const g of COPY.guides) {
  if (g.kind !== "text") continue;
  const cap = g.max;
  if (!cap) continue;
  const guide = g.guide ?? "";
  const current = readPath(COPY.defaults, g.path);
  const baselineLen = typeof current === "string" ? current.length : null;
  const reasons = [];

  for (const p of LENGTH_PHRASES) {
    if (!p.re.test(guide)) continue;
    if (cap < p.lo) {
      reasons.push({
        severity: 2,
        text: `guide asks for ${p.label} (~${p.lo}-${p.hi} chars) but the cap is ${cap} — the cap cannot hold what the guide asks for`,
      });
    } else if (cap < p.hi) {
      reasons.push({
        severity: 1,
        text: `guide asks for ${p.label} (~${p.lo}-${p.hi} chars); cap ${cap} sits inside that range, so a normal answer can overrun`,
      });
    }
    break;
  }

  for (const p of VERBOSITY_PHRASES) {
    if (p.re.test(guide)) {
      reasons.push({
        severity: 2,
        text: `guide asks for length itself — ${p.label} — while the cap is ${cap}. The model follows the adjective, not the number`,
      });
      break;
    }
  }

  for (const p of RELATIVE_PHRASES) {
    if (p.re.test(guide)) {
      reasons.push({
        severity: 1,
        text: `${p.label}: it inherits that field's overrun, so its own cap cannot protect it`,
      });
      break;
    }
  }

  if (baselineLen !== null) {
    const pct = Math.round((baselineLen / cap) * 100);
    if (baselineLen > cap) {
      reasons.push({
        severity: 2,
        text: `the demo's OWN text is ${baselineLen}/${cap} (${pct}%) — over its own cap, so the worked example teaches overrunning`,
      });
    } else if (pct >= 92) {
      reasons.push({
        severity: 1,
        text: `the demo's own text fills ${pct}% of the cap (${baselineLen}/${cap}) — the example leaves the model no headroom`,
      });
    }
  }

  // Only on slots big enough for "components" to be a meaningful idea. Below ~60 characters
  // the comma-counting fires on ordinary prose — it flagged `feed.weather.temperature`, a
  // THREE-character field holding a number, because its guide explains the scale in a
  // sentence with commas in it. That is a description, not three deliverables.
  const comps = cap >= 60 ? componentCount(guide) : 0;
  if (comps >= 3 && cap < comps * 45) {
    reasons.push({
      severity: 1,
      text: `guide lists ~${comps} required components in ${cap} chars (~${Math.floor(cap / comps)} each)`,
    });
  }

  if (reasons.length) findings.push({ path: g.path, cap, guide, baselineLen, reasons });
  else clean.push({ path: g.path, cap, baselineLen });
}

findings.sort(
  (a, b) =>
    Math.max(...b.reasons.map((r) => r.severity)) -
      Math.max(...a.reasons.map((r) => r.severity)) ||
    a.path.localeCompare(b.path),
);

const hard = findings.filter((f) => f.reasons.some((r) => r.severity === 2));
const soft = findings.filter((f) => !f.reasons.some((r) => r.severity === 2));

console.log(
  `\nGuide/cap audit — ${COPY.guides.filter((g) => g.kind === "text").length} text slots, ` +
    `${hard.length} contradiction(s), ${soft.length} worth a look, ${clean.length} clean\n`,
);

const show = (list, title) => {
  if (!list.length) return;
  console.log(`\n${"=".repeat(78)}\n${title}\n${"=".repeat(78)}`);
  for (const f of list) {
    console.log(`\n${f.path}  cap=${f.cap}${f.baselineLen !== null ? `  baseline=${f.baselineLen}` : ""}`);
    for (const r of f.reasons) console.log(`   ${r.severity === 2 ? "!!" : " ~"} ${r.text}`);
    console.log(`   guide: ${f.guide.replace(/\s+/g, " ").slice(0, 200)}${f.guide.length > 200 ? "…" : ""}`);
  }
};

show(hard, "CONTRADICTIONS — the guide asks for more than the cap can hold");
show(soft, "WORTH A LOOK — the guide and the cap are in tension");

if (showAll) {
  console.log(`\n${"=".repeat(78)}\nCLEAN\n${"=".repeat(78)}`);
  for (const c of clean)
    console.log(`  ${c.path.padEnd(38)} cap=${String(c.cap).padStart(4)}  baseline=${c.baselineLen ?? "-"}`);
}

console.log("");
process.exit(hard.length ? 1 : 0);

/**
 * Check the re-timed Japanese read against the film, by listening to it rather than by
 * trusting the plan that produced it.
 *
 * Everything upstream of this is intent. scripts/build-japanese-vo.mjs decides where each
 * sentence should go and writes an ffmpeg graph it believes will put it there; nothing in
 * that pipeline confirms that atrim cut where it meant to, that atempo produced the length
 * it was asked for, or that adelay landed on the right millisecond. A single off-by-one in
 * the chunk indexing gives a file that plays perfectly well and narrates the wrong screens
 * for three and a half minutes, which is not a failure anyone notices by looking at a log.
 *
 * So the built file is transcribed again, and this compares where the sentences ACTUALLY
 * start against where the English sentences they translate start.
 *
 *     node scripts/transcribe-vo.mjs japanese-paced   # re-transcribe after a rebuild
 *     node scripts/verify-japanese-vo.mjs
 *
 * Exits non-zero if any sentence has drifted further than the tolerance below.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DIR = path.join(process.cwd(), "docs/audio");
const read = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n), "utf8"));

/**
 * How far a line may sit from the English line it replaces before it counts as a failure.
 * The plan's own worst case is 0.88s and it is deliberate — a crowded line is allowed to
 * drift rather than be rushed. 1.5s leaves room for that plus Whisper's own timestamp
 * resolution, and is still well inside the shortest scene the narration is cut to.
 */
const TOLERANCE = 1.5;

const plan = read("vo-pacing.json");
const source = read("japanese-voiceover.json");
const paced = read("japanese-paced.json");

const a = source.words.map((w) => w.word);
const b = paced.words.map((w) => w.word);
console.log(`${a.length} tokens in the source read, ${b.length} in the paced file`);

/**
 * Longest common subsequence, to map every source token onto the same token in the rebuilt
 * file. Re-transcribing does not return an identical stream — the two differ by three
 * tokens — so pairing by position would slide out of step and report drift that is an
 * artefact of the comparison rather than of the audio.
 */
const n = a.length;
const m = b.length;
const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--) {
  for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
}
const map = new Map();
for (let i = 0, j = 0; i < n && j < m; ) {
  if (a[i] === b[j]) map.set(i++, j++);
  else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
  else j++;
}
console.log(`  ${map.size} tokens matched between the two (${((map.size / n) * 100).toFixed(1)}%)`);

// Which source token each sentence begins on. The pacing plan records the sentence's source
// TIME, so the token is the first one at or after it.
const tokenAt = (t) => source.words.findIndex((w) => w.start >= t - 1e-6);

const rows = [];
for (const s of plan.sentences) {
  const srcTok = tokenAt(s.sourceStart);
  // The first few tokens of a sentence can be the ones Whisper dropped; walk forward to the
  // first that exists in both, and correct for how far into the sentence that lands.
  let tok = srcTok;
  while (tok < n && !map.has(tok) && tok < srcTok + 6) tok++;
  if (!map.has(tok)) continue;
  const intoSentence = (source.words[tok].start - s.sourceStart) / s.tempo;
  const actual = paced.words[map.get(tok)].start - intoSentence;
  rows.push({ ...s, actual, drift: actual - s.anchor, vsPlan: actual - s.start });
}

console.log(`\n idx  anchor  planned   actual   vs anchor   vs plan  tempo`);
for (const r of rows) {
  const flag = Math.abs(r.drift) > TOLERANCE ? "  <-- out of tolerance" : "";
  console.log(
    `  ${String(r.sentence).padStart(2)} ${r.anchor.toFixed(2).padStart(7)} ${r.start.toFixed(2).padStart(8)} ` +
      `${r.actual.toFixed(2).padStart(8)} ${((r.drift >= 0 ? "+" : "") + r.drift.toFixed(2)).padStart(10)} ` +
      `${((r.vsPlan >= 0 ? "+" : "") + r.vsPlan.toFixed(2)).padStart(9)}  ${r.tempo.toFixed(3)}${flag}`,
  );
}

const drift = rows.map((r) => Math.abs(r.drift)).sort((x, y) => x - y);
const plans = rows.map((r) => Math.abs(r.vsPlan)).sort((x, y) => x - y);
console.log(
  `\n  against the English anchors: median ${drift[drift.length >> 1].toFixed(2)}s, worst ${drift.at(-1).toFixed(2)}s`,
);
console.log(
  `  against the plan:           median ${plans[plans.length >> 1].toFixed(2)}s, worst ${plans.at(-1).toFixed(2)}s` +
    `  (this is the build's own error, and should be near zero)`,
);

const bad = rows.filter((r) => Math.abs(r.drift) > TOLERANCE);
if (bad.length) {
  console.error(`\n  ${bad.length} sentence(s) outside the ${TOLERANCE}s tolerance.`);
  process.exit(1);
}
console.log(`\n  all ${rows.length} sentences land within ${TOLERANCE}s of the line they translate.`);

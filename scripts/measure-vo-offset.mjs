/**
 * Measure where the English VO stem sits on the film's clock.
 *
 * WHY THERE IS AN OFFSET AT ALL
 * `public/audio/VO.mp3` is the narration as delivered — it starts when the recording starts.
 * The film's clock is the reference edit, where that narration was placed some way in. The
 * two are the same performance and not the same timeline, so every sentence boundary read
 * off the stem is wrong by a constant until this number is added to it.
 *
 * WHY IT IS MEASURED AND NOT WRITTEN DOWN ONCE
 * A constant in a file is a claim about two assets that can each be replaced without the
 * other. Re-recorded narration, or a re-cut reference, silently invalidates it — and the
 * failure is not a crash, it is a finished film whose Japanese lines all land half a second
 * out. So the number is derived from the two assets themselves, and the spread is reported
 * alongside it: a stem that has been re-cut rather than merely shifted shows up as a wide
 * spread instead of a plausible-looking median.
 *
 *     node scripts/measure-vo-offset.mjs
 *
 * Writes docs/audio/vo-offsets.json, which the pacing step reads.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "docs/audio");
const read = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n), "utf8"));

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const words = (t) =>
  t.words.map((w) => ({ w: norm(w.word), start: w.start })).filter((w) => w.w);

const stem = words(read("english-vo.json"));
const film = words(read("reference-english.json"));
console.log(`${stem.length} words in the stem, ${film.length} in the reference edit`);

/**
 * Longest common subsequence over the two word streams, so the offset is measured only on
 * words both transcripts actually agree on. The two were transcribed from different audio —
 * one clean, one under music — and they disagree on roughly a dozen words. Pairing by
 * position instead would line up a real word against a misheard one and quietly poison the
 * median with a few large deltas.
 */
const n = stem.length;
const m = film.length;
const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--) {
  for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = stem[i].w === film[j].w ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
}
const deltas = [];
for (let i = 0, j = 0; i < n && j < m; ) {
  if (stem[i].w === film[j].w) {
    deltas.push({ w: stem[i].w, stem: stem[i].start, film: film[j].start, d: film[j].start - stem[i].start });
    i++;
    j++;
  } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
  else j++;
}

const ds = deltas.map((d) => d.d).sort((a, b) => a - b);
const pct = (p) => ds[Math.min(ds.length - 1, Math.floor(p * ds.length))];
const median = pct(0.5);
const iqr = pct(0.75) - pct(0.25);

console.log(`  ${deltas.length} words matched (${((deltas.length / n) * 100).toFixed(0)}% of the stem)`);
console.log(`  offset: median ${median.toFixed(3)}s   IQR ${iqr.toFixed(3)}s   p5 ${pct(0.05).toFixed(3)}s   p95 ${pct(0.95).toFixed(3)}s`);

/**
 * Drift check. A pure shift has the same delta at the end as at the start; a stem running at
 * a different rate does not, and that difference is what a fixed offset cannot fix.
 */
const half = Math.floor(deltas.length / 2);
const med = (a) => {
  const s = a.map((x) => x.d).sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const drift = med(deltas.slice(half)) - med(deltas.slice(0, half));
console.log(`  drift across the film: ${drift >= 0 ? "+" : ""}${drift.toFixed(3)}s (second half minus first)`);

const ok = iqr < 0.25 && Math.abs(drift) < 0.15;
if (!ok) {
  console.error(
    "\n  These two do not look like the same performance at a fixed offset.\n" +
      "  A wide spread or real drift means the stem has been re-cut, not just shifted, and a\n" +
      "  single number cannot place it. Re-align the stem before going further.",
  );
  process.exit(1);
}

const out = {
  generated: new Date().toISOString(),
  /** Add this to a time read off VO.mp3 to get the same moment in film time. */
  englishStemToFilm: Number(median.toFixed(3)),
  /** Measured by spectrogram match against the reference's music-only gaps; see
      scripts/measure-vo-offset.mjs's sibling analysis in docs/japanese-voiceover.md. */
  musicStemToFilm: 0,
  evidence: {
    wordsMatched: deltas.length,
    iqr: Number(iqr.toFixed(3)),
    driftSeconds: Number(drift.toFixed(3)),
  },
};
fs.writeFileSync(path.join(DIR, "vo-offsets.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`  wrote docs/audio/vo-offsets.json`);

/**
 * Answer "will this draft script need to be sped up?" before anyone records it.
 *
 *     node scripts/predict-vo-fit.mjs docs/audio/japanese-vo-v3.txt
 *
 * WHY THE PER-BEAT BUDGET IS NOT THE WHOLE ANSWER
 *
 * scripts/score-vo-script.py measures each line against its own window, which is the right
 * unit for writing — it tells you which sentence is too long. But it is pessimistic about
 * what happens next, because the pipeline does not place lines one at a time. A line that
 * overruns its own window by half a second, sitting next to one with a second of slack,
 * gets placed early and never compressed at all; that is the entire reason the placement is
 * solved globally rather than walked forward (see scripts/build-japanese-vo.mjs).
 *
 * So this runs the actual solver — the same `place()` the build calls — over predicted
 * durations, and reports the tempos that would result. A beat over budget on paper and at
 * 1.00x here is a beat that is fine.
 *
 * The durations are predictions, at 8.48 mora/sec. They carry the calibration's own error
 * (median 0.38s a line), so treat a tempo of 1.02 as "no compression" rather than a promise.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

import { place } from "./lib/vo-placement.mjs";

// The same constants the build uses. Duplicated deliberately and narrowly: importing them
// would mean importing build-japanese-vo.mjs, which runs ffmpeg on import.
const TEMPO_MAX = 1.25;
const GAP = 0.1;
const SYNC_VS_TEMPO = 20;
const FILM = 212;

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("usage: node scripts/predict-vo-fit.mjs <script.txt>");
  process.exit(1);
}

const rows = JSON.parse(
  execFileSync("python3", ["scripts/score-vo-script.py", "--json", file], { encoding: "utf8" }),
);

const { start, tempo } = place({
  anchor: rows.map((r) => r.start),
  dur: rows.map((r) => r.seconds),
  gap: GAP,
  tempoMax: TEMPO_MAX,
  syncVsTempo: SYNC_VS_TEMPO,
});

const N = rows.length;
const offs = rows.map((r, i) => start[i] - r.start);
const compressed = rows.filter((_, i) => tempo[i] > 1.02);

console.log(`${N} beats placed, predicted from mora`);
for (const r of rows) {
  const i = r.beat - 1;
  const t = tempo[i];
  if (t <= 1.02 && Math.abs(offs[i]) < 0.5) continue;
  console.log(
    `  beat ${String(r.beat).padStart(2)}: ${t.toFixed(3)}x, ` +
      `${offs[i] >= 0 ? "+" : ""}${offs[i].toFixed(2)}s from anchor`,
  );
}
const mean = tempo.reduce((a, b) => a + b) / N;
const end = start[N - 1] + rows[N - 1].seconds / tempo[N - 1];
console.log(
  `  tempo: mean ${mean.toFixed(3)}, max ${Math.max(...tempo).toFixed(3)}, ` +
    `${tempo.filter((t) => t < 1.001).length} of ${N} untouched, ` +
    `${compressed.length} above 1.02`,
);
console.log(
  `  sync:  worst ${Math.max(...offs.map(Math.abs)).toFixed(2)}s, ` +
    `last line ends at ${end.toFixed(1)}s of ${FILM}s`,
);

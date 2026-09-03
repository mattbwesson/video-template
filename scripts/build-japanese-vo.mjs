/**
 * Re-time the Japanese voiceover to the film, and mix the Japanese cut's soundtrack.
 *
 * THE SHAPE OF THE PROBLEM
 * The Japanese read is 231.4s. The film is 212s. Simply starting it at zero puts the closing
 * line 19 seconds after the closing shot, and every line before it somewhere it does not
 * belong — which matters because the picture is cut to the narration. The line about search
 * plays over the search screen or it plays over the wrong screen.
 *
 * So each sentence is placed against the English sentence it translates
 * (docs/audio/vo-alignment.json) and sped up only as much as its slot demands.
 *
 * WHY NOT ONE TEMPO FOR THE WHOLE TRACK
 * That was tried first and it is the obvious idea: 221s of Japanese content into ~206s of
 * film needs about 1.07x, which sounds like nothing. It does not work, because the surplus
 * is not spread evenly. Holding every line within a second of its anchor with a single
 * tempo needs 1.20x EVERYWHERE — the whole read rushed, to fix a dozen crowded lines.
 * Per-sentence tempo does the same job at a mean of 1.09x with most lines untouched at 1.00.
 *
 * WHY THE PLACEMENT IS SOLVED AND NOT WALKED FORWARD
 * The first version was a forward pass: place each line at its anchor, compress if it
 * collides with the next. It is myopic, and the failure is specific. A crowded line can only
 * be relieved by starting earlier, which requires the PREVIOUS line to finish earlier — but
 * a forward pass has already placed that one, at tempo 1.00, because on its own it fit
 * fine. So congestion piles up: the last third of the film ran eight consecutive lines at
 * the tempo cap and still drifted 1.16s late.
 *
 * Solving it instead lets compression fall a little on the roomy line BEFORE the crowded
 * one, which is what a person mixing this would do. Same worst-case tempo, and no line more
 * than 0.87s from its anchor.
 *
 *     node scripts/build-japanese-vo.mjs
 *
 * Writes public/audio/japanese-voiceover-paced.mp3 (the re-timed read on its own, for
 * checking) and public/audio/japanese-soundtrack.mp3 (what the composition plays).
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "docs/audio");

/** 5300 frames at 25 fps. The last line has to finish inside this. */
const FILM = 212;

/**
 * The tempo ceiling. 1.25x is brisk but still reads as the same performance; past about
 * 1.3x WSOLA starts to sound clipped on Japanese mora, which are short to begin with.
 */
const TEMPO_MAX = 1.25;

/** Silence held between one line and the next, so two lines never butt together. */
const GAP = 0.1;

/**
 * How much a second of sync error is worth against a unit of tempo. Swept over 2..80: the
 * curve is flat from 2 to 20 and then sync degrades quickly, so 20 is the last value that
 * costs nothing. It buys mean tempo 1.090 with every line inside 0.87s of its anchor.
 */
const SYNC_VS_TEMPO = 20;

const alignment = JSON.parse(fs.readFileSync(path.join(DIR, "vo-alignment.json"), "utf8"));
const S = alignment.sentences;
const N = S.length;
const dur = S.map((s) => s.japaneseEnd - s.japaneseStart);
const anchor = S.map((s) => s.englishStart);

/**
 * Isotonic regression by pool-adjacent-violators.
 *
 * This is the part that makes the placement exactly solvable rather than a heuristic.
 * Substituting z_i = s_i - sum of everything scheduled before it turns "line i must finish
 * before line i+1 starts" into "z must not decrease", and turns "put every line as near its
 * anchor as possible" into least squares. That pair is isotonic regression, which PAVA
 * solves exactly in one pass — so for any set of tempos, the best possible placement is not
 * searched for, it is computed.
 */
const pava = (b) => {
  const v = [];
  const w = [];
  const n = [];
  for (const x of b) {
    v.push(x);
    w.push(1);
    n.push(1);
    while (v.length > 1 && v[v.length - 2] > v[v.length - 1] - 1e-12) {
      const v1 = v.pop(), w1 = w.pop(), n1 = n.pop();
      const v2 = v.pop(), w2 = w.pop(), n2 = n.pop();
      v.push((v1 * w1 + v2 * w2) / (w1 + w2));
      w.push(w1 + w2);
      n.push(n1 + n2);
    }
  }
  const out = [];
  for (let i = 0; i < v.length; i++) for (let k = 0; k < n[i]; k++) out.push(v[i]);
  return out;
};

const startsFor = (tempo) => {
  const played = dur.map((d, i) => d / tempo[i]);
  const cum = [0];
  for (let i = 0; i < N - 1; i++) cum.push(cum[i] + played[i] + GAP);
  return pava(anchor.map((a, i) => a - cum[i])).map((z, i) => z + cum[i]);
};

const cost = (tempo) => {
  const s = startsFor(tempo);
  let c = 0;
  for (let i = 0; i < N; i++) c += (s[i] - anchor[i]) ** 2 + SYNC_VS_TEMPO * (tempo[i] - 1) ** 2;
  return c;
};

// Projected gradient descent over the 35 tempos. The inner placement is exact, so this only
// has to search the tempos — 35 numbers, each boxed into [1, TEMPO_MAX]. Never below 1:
// slowing a read down to fill a gap sounds worse than the silence it replaces.
let tempo = new Array(N).fill(1.05);
let step = 0.02;
for (let it = 0; it < 600; it++) {
  const c0 = cost(tempo);
  const h = 1e-4;
  const grad = [];
  for (let i = 0; i < N; i++) {
    const t = tempo.slice();
    t[i] = Math.min(TEMPO_MAX, t[i] + h);
    grad.push((cost(t) - c0) / h);
  }
  const norm = Math.hypot(...grad) || 1;
  const next = tempo.map((x, i) => Math.max(1, Math.min(TEMPO_MAX, x - (step * grad[i]) / norm)));
  if (cost(next) < c0) tempo = next;
  else step *= 0.7;
  if (step < 1e-4) break;
}

const start = startsFor(tempo);
const plan = S.map((s, i) => ({
  sentence: i,
  english: s.english,
  japanese: s.japanese,
  anchor: Number(anchor[i].toFixed(3)),
  start: Number(start[i].toFixed(3)),
  offset: Number((start[i] - anchor[i]).toFixed(3)),
  tempo: Number(tempo[i].toFixed(4)),
  sourceStart: s.japaneseStart,
  sourceEnd: s.japaneseEnd,
  played: Number((dur[i] / tempo[i]).toFixed(3)),
}));

const offs = plan.map((p) => Math.abs(p.offset));
const end = plan.at(-1).start + plan.at(-1).played;
console.log(`${N} sentences placed`);
console.log(
  `  tempo: mean ${(tempo.reduce((a, b) => a + b) / N).toFixed(3)}, max ${Math.max(...tempo).toFixed(3)}, ` +
    `${tempo.filter((t) => t < 1.001).length} left at 1.00`,
);
console.log(
  `  sync:  worst ${Math.max(...offs).toFixed(2)}s, median ${offs.sort((a, b) => a - b)[N >> 1].toFixed(2)}s, ` +
    `last line ends at ${end.toFixed(1)}s of ${FILM}s`,
);
if (end > FILM) {
  console.error(`  the read does not fit inside the film — it runs ${(end - FILM).toFixed(1)}s over.`);
  process.exit(1);
}

const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });

/**
 * Pass one: cut, speed up and lay out the read.
 *
 * WHY THIS ASSEMBLES SAMPLES INSTEAD OF WRITING ONE FILTER GRAPH
 * The obvious way to do this in ffmpeg is 35 atrim/atempo/adelay chains summed by amix, and
 * that is what this was. It produced a file that played, sounded like Japanese, and was
 * wrong: the 0.64s lead-in had vanished and the whole read sat early, and at least one chunk
 * had been dropped entirely. Bisecting the graph found the lead-in was being eaten by the
 * `apad,atrim=0:212` tail, and separately that amix's `duration=longest` was not honouring
 * the longest input when 35 atrim branches shared one auto-split source.
 *
 * Both are the same class of problem: in a graph that large the placement is an emergent
 * property of filters interacting, so a mistake is silent and comes out as a film narrated
 * over the wrong screens. Cutting and stretching each sentence on its own — one short,
 * obvious ffmpeg command per sentence — and then writing it into the output buffer at a
 * computed sample index makes the placement arithmetic instead of emergent. The offset is
 * exact by construction, and the returned length of every chunk is checked against what was
 * asked for below.
 */
const SRC = "public/audio/japanese-voiceover.mp3";
const PACED = "public/audio/japanese-voiceover-paced.mp3";
const RATE = 48000;
const FADE = Math.round(0.015 * RATE);

const total = FILM * RATE;
const bus = new Float32Array(total);
let worstLength = 0;

for (const p of plan) {
  const raw = `/tmp/jp-chunk-${p.sentence}.raw`;
  // One sentence, one chain, nothing shared: trim it, reset its clock, change its speed.
  // Where it lands is decided below, in samples, not by a filter.
  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", SRC,
     "-af", `atrim=start=${p.sourceStart}:end=${p.sourceEnd},asetpts=N/SR/TB,atempo=${p.tempo.toFixed(6)}`,
     "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", String(RATE), raw],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  const buf = fs.readFileSync(raw);
  const n = buf.length >> 1;
  worstLength = Math.max(worstLength, Math.abs(n / RATE - p.played));

  const at = Math.round(p.start * RATE);
  for (let i = 0; i < n && at + i < total; i++) {
    // 15ms fades on each edge. Not cosmetic: a sentence boundary often falls mid-breath
    // rather than in silence, and an instantaneous edge there is an audible click.
    let g = 1;
    if (i < FADE) g = i / FADE;
    else if (i > n - FADE) g = Math.max(0, (n - i) / FADE);
    bus[at + i] += (buf.readInt16LE(i << 1) / 32768) * g;
  }
  fs.unlinkSync(raw);
}
console.log(`  assembled ${plan.length} chunks; worst length error ${(worstLength * 1000).toFixed(1)} ms`);

/** A 16-bit mono WAV, written by hand so the assembled bus goes to disk without a re-encode
    round trip that would need its own verification. */
const wav = (samples) => {
  const data = Buffer.alloc(samples.length * 2);
  let clipped = 0;
  for (let i = 0; i < samples.length; i++) {
    let v = samples[i];
    if (v > 1 || v < -1) {
      clipped++;
      v = Math.max(-1, Math.min(1, v));
    }
    data.writeInt16LE(Math.round(v * 32767), i << 1);
  }
  if (clipped) console.log(`  ${clipped} samples clipped while writing (chunks overlapped)`);
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
};
const pacedWav = "/tmp/jp-paced.wav";
fs.writeFileSync(pacedWav, wav(bus));
ff(["-i", pacedWav, "-ac", "2", "-ar", String(RATE), "-b:a", "192k", PACED]);
console.log(`  wrote ${PACED}`);

/** Integrated loudness, so the mix below is set from measurement rather than from taste. */
const lufs = (file) => {
  // ebur128 prints its summary on STDERR, like everything else ffmpeg says about a file.
  // Reading stdout gets an empty string, a NaN gain, and a filter graph that will not build.
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-filter_complex", "ebur128", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const value = Number(/I:\s*(-?[\d.]+)\s*LUFS/.exec(out.split("Integrated loudness:")[1] ?? "")?.[1]);
  if (!Number.isFinite(value)) {
    console.error(`  could not read the loudness of ${file}:\n${out.slice(-800)}`);
    process.exit(1);
  }
  return value;
};

/**
 * Pass two: the soundtrack the Japanese cut plays.
 *
 * The targets are all read off the English film rather than chosen. The reference mix is
 * -19.7 LUFS overall with its narration stem at -20.3, so the Japanese narration is set to
 * the same -20.3 and the whole mix ends at the same -19.7 — the two cuts then play at the
 * same level, which is the only reason the numbers matter.
 *
 * The music is the delivered stem at its full -11.6 LUFS, which is far too loud to sit under
 * a voice. Measuring the reference in its 26 narration gaps puts the film's bed a median
 * 14.7 dB below the stem, so that is the gain, and a sidechain from the narration takes it
 * further down while anyone is speaking.
 */
const MUSIC = "public/audio/Quantum_Flow.wav";
const MIX = "public/audio/japanese-soundtrack.mp3";
const ENGLISH_VO_LUFS = -20.3;
const REFERENCE_MIX_LUFS = -19.7;
const MUSIC_UNDER_STEM_DB = -14.7;

const pacedLufs = lufs(PACED);
const voGain = ENGLISH_VO_LUFS - pacedLufs;
console.log(`  paced read is ${pacedLufs.toFixed(1)} LUFS; ${voGain >= 0 ? "+" : ""}${voGain.toFixed(1)} dB to match the English stem`);

const mixGraph = [
  `[0:a]volume=${voGain.toFixed(2)}dB,asplit=2[vo][key]`,
  // Trimmed to the film and faded, because the stem is 217.2s against a 212s film and would
  // otherwise be cut off mid-bar on the last frame.
  `[1:a]atrim=0:${FILM},asetpts=N/SR/TB,volume=${MUSIC_UNDER_STEM_DB}dB,afade=t=out:st=${FILM - 2.5}:d=2.5[music]`,
  `[music][key]sidechaincompress=threshold=0.03:ratio=6:attack=25:release=350:makeup=1[bed]`,
  `[bed][vo]amix=inputs=2:normalize=0:duration=first[sum]`,
  `[sum]loudnorm=I=${REFERENCE_MIX_LUFS}:TP=-1.0:LRA=7[out]`,
].join(";\n");
const mixFile = "/tmp/jp-mix-graph.txt";
fs.writeFileSync(mixFile, mixGraph);
ff(["-i", PACED, "-i", MUSIC, "-filter_complex_script", mixFile, "-map", "[out]", "-ac", "2", "-ar", "48000", "-b:a", "192k", MIX]);

const mixLufs = lufs(MIX);
const size = (f) => `${(fs.statSync(f).size / 1e6).toFixed(1)} MB`;
console.log(`  wrote ${MIX} (${size(MIX)}, ${mixLufs.toFixed(1)} LUFS against the reference's ${REFERENCE_MIX_LUFS})`);

fs.writeFileSync(
  path.join(DIR, "vo-pacing.json"),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      settings: { TEMPO_MAX, GAP, SYNC_VS_TEMPO, FILM },
      measured: { pacedLufs, mixLufs, voGain: Number(voGain.toFixed(2)), musicGainDb: MUSIC_UNDER_STEM_DB },
      sentences: plan,
    },
    null,
    2,
  ) + "\n",
);
console.log(`  wrote docs/audio/vo-pacing.json`);

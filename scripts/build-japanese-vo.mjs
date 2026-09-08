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

import { place } from "./lib/vo-placement.mjs";

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
 * The weight on tempo in the cost, against a second of sync error squared. Raising it makes
 * the solver move a line rather than compress it.
 *
 * THIS VALUE DEPENDS ON THE READ, WHICH IS WHY THE SWEEP IS WORTH RE-RUNNING
 *
 * It was 20, swept against the v1 read: that read was 231.4s into a 212s film, so there was
 * no slack anywhere, sync degraded immediately past 20, and the choice was between rushed
 * lines and late ones. The v3 read is 223.1s and trims to ~222s, which leaves room — and at
 * 20 the solver was spending none of it, holding sync to 0.23s while compressing two lines
 * to 1.086x.
 *
 * Re-swept against this read, 20 to 4000: tempo falls fast to about 320 and then flattens,
 * while sync degrades slowly throughout.
 *
 *      20   mean 1.010   max 1.086   worst sync 0.23s
 *     160   mean 1.003   max 1.025   worst sync 0.47s
 *     320   mean 1.002   max 1.014   worst sync 0.52s     <- here
 *     640   mean 1.001   max 1.007   worst sync 0.55s
 *
 * 320 is the knee. It makes every line effectively untouched — 1.014x is not audible on any
 * material — for a worst-case drift of 0.52s, a third of the 1.5s tolerance in
 * verify-japanese-vo.mjs. The drift never accumulates: it appears as a crowded line starting
 * early and the next starting late by the same amount.
 *
 * Re-run the sweep after a new recording rather than trusting this number.
 */
const SYNC_VS_TEMPO = 320;

/**
 * The longest pause allowed INSIDE a sentence, and the reason the number is 1.00.
 *
 * It is measured off the English narration, not chosen: across the 28 mid-sentence pauses in
 * the reference read, the longest is 1.00s and the median is 0.52s. The Japanese read pauses
 * longer — median 0.66s, longest 1.42s, 19.9s of internal silence in total against the
 * English 15.6s.
 *
 * That difference is worth almost the entire problem. The read is 223.1s and the film is
 * 212s, so it overruns by 11.1s — and there is 19.9s of silence sitting inside it. Speeding
 * the speech up to absorb an overrun that is mostly silence is the wrong trade: it makes the
 * performance worse to preserve pauses that are already longer than the ones the film was
 * cut to. So the pauses give first, capped at the longest the English ever takes, and only
 * what is left over is paid for in tempo.
 *
 * A pause is trimmed from its middle — each side keeps half the retained silence — so every
 * cut lands in room tone rather than against a consonant.
 */
const PAUSE_MAX = 1.0;

/** Below this, a gap is the space between words rather than a pause between phrases. */
const PAUSE_MIN = 0.35;

const alignment = JSON.parse(fs.readFileSync(path.join(DIR, "vo-alignment.json"), "utf8"));
const S = alignment.sentences;
const N = S.length;
const anchor = S.map((s) => s.englishStart);

const WORDS = JSON.parse(fs.readFileSync(path.join(DIR, "japanese-voiceover.json"), "utf8")).words;

/**
 * A sentence as the spans of source audio that will actually be used, with its over-long
 * internal pauses cut out of the middle.
 *
 * Returns one span for a sentence that never pauses, which is byte-for-byte what this
 * script did before pause trimming existed.
 */
const runsFor = (s) => {
  const inside = WORDS.filter((w) => w.start >= s.japaneseStart - 1e-6 && w.end <= s.japaneseEnd + 1e-6);
  const cuts = [];
  for (let i = 0; i + 1 < inside.length; i++) {
    const gap = inside[i + 1].start - inside[i].end;
    if (gap > PAUSE_MIN) cuts.push({ at: inside[i].end, gap, keep: Math.min(gap, PAUSE_MAX) });
  }
  const runs = [];
  let from = s.japaneseStart;
  for (const c of cuts) {
    runs.push({ start: from, end: c.at + c.keep / 2 });
    from = c.at + c.gap - c.keep / 2;
  }
  runs.push({ start: from, end: s.japaneseEnd });
  return runs;
};

const runs = S.map(runsFor);
const dur = runs.map((rs) => rs.reduce((a, r) => a + (r.end - r.start), 0));

const trimmed = S.reduce((a, s, i) => a + (s.japaneseEnd - s.japaneseStart) - dur[i], 0);
console.log(`  trimmed ${trimmed.toFixed(1)}s of over-long internal pauses (cap ${PAUSE_MAX}s)`);

const { start, tempo } = place({
  anchor,
  dur,
  gap: GAP,
  tempoMax: TEMPO_MAX,
  syncVsTempo: SYNC_VS_TEMPO,
});

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
  runs: runs[i].map((r) => ({ start: Number(r.start.toFixed(3)), end: Number(r.end.toFixed(3)) })),
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
  // Each RUN of a sentence is cut and placed on its own, so the pauses between them come
  // out at the length the plan asked for rather than the length the reader took. A sentence
  // with no over-long pause has exactly one run, which is what this did before.
  let played = 0;
  for (const [r, run] of p.runs.entries()) {
    const raw = `/tmp/jp-chunk-${p.sentence}-${r}.raw`;
    // One run, one chain, nothing shared: trim it, reset its clock, change its speed.
    // Where it lands is decided below, in samples, not by a filter.
    execFileSync(
      "ffmpeg",
      ["-y", "-v", "error", "-i", SRC,
       "-af", `atrim=start=${run.start}:end=${run.end},asetpts=N/SR/TB,atempo=${p.tempo.toFixed(6)}`,
       "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", String(RATE), raw],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    const buf = fs.readFileSync(raw);
    const n = buf.length >> 1;

    const at = Math.round((p.start + played) * RATE);
    for (let i = 0; i < n && at + i < total; i++) {
      // 15ms fades on each edge. Not cosmetic: a run boundary falls in the middle of a
      // pause, which is room tone rather than digital silence, and an instantaneous edge
      // there is an audible click.
      let g = 1;
      if (i < FADE) g = i / FADE;
      else if (i > n - FADE) g = Math.max(0, (n - i) / FADE);
      bus[at + i] += (buf.readInt16LE(i << 1) / 32768) * g;
    }
    played += n / RATE;
    fs.unlinkSync(raw);
  }
  worstLength = Math.max(worstLength, Math.abs(played - p.played));
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

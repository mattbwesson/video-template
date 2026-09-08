/**
 * Find and repair spans a transcription silently dropped.
 *
 * Whisper does not fail when it loses a stretch of speech. It returns a clean transcript
 * with a hole in it, and every downstream step believes it: the aligner sees a long pause
 * where a sentence should be, the build cuts chunks only from spans the transcript
 * describes, and the finished soundtrack is missing that audio entirely. It plays fine and
 * it sounds fine — it just does not say the line.
 *
 * That happened here. The 233.4s Japanese read lost 24.62-28.98s —
 * 「休暇明けも大丈夫。AIによるパーソナライズされた要約です。」, the one line that belongs
 * under the "Back from time off?" card. Re-transcribing that window ALONE recovered it
 * immediately, which is what makes this repairable rather than a re-record.
 *
 * The test is not "is there a gap" — a read has a pause between every sentence, about 1.1s
 * here. It is "is there a gap that CONTAINS SPEECH", measured from the waveform:
 *
 *   1. Find transcript gaps longer than MIN_GAP.
 *   2. Measure short-window RMS across each. A gap that is genuinely a pause sits at the
 *      noise floor; one that hides speech does not.
 *   3. Re-transcribe just that window, with padding, and splice the words back in at
 *      absolute time.
 *
 * Re-transcribing the window alone works because the model's attention is not competing
 * with three minutes of surrounding audio; the same span it skipped in the full file comes
 * back on the first try.
 *
 *   node scripts/repair-transcript-holes.mjs                 # report only
 *   node scripts/repair-transcript-holes.mjs --write         # splice and rewrite the JSON
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

process.loadEnvFile(".env");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY is not set."); process.exit(1); }

const WRITE = process.argv.includes("--write");
const SRC = "public/audio/japanese-voiceover.mp3";
const JSON_PATH = "docs/audio/japanese-voiceover.json";
/** Longer than any sentence pause in this read (they run ~1.1s). */
const MIN_GAP = 2.5;
/** Above the noise floor by this much, in dB, counts as speech. */
const SPEECH_DB = -45;
/** Re-transcribed with this much context either side, so the model has onset to work with. */
const PAD = 1.0;

const pcm = (t0, dur) => {
  const out = execFileSync("ffmpeg", ["-v","error","-i",SRC,"-ss",String(t0),"-t",String(dur),
    "-ac","1","-ar","16000","-f","s16le","-"], { maxBuffer: 1 << 28 });
  const a = new Float32Array(out.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = out.readInt16LE(i * 2) / 32768;
  return a;
};
const rmsDb = (a) => {
  let s = 0; for (const v of a) s += v * v;
  return 20 * Math.log10(Math.sqrt(s / (a.length || 1)) + 1e-9);
};

/** Fraction of 100ms windows in a span that are above the speech floor. */
const speechFraction = (t0, t1) => {
  const a = pcm(t0, t1 - t0);
  const win = 1600;
  let n = 0, hot = 0;
  for (let i = 0; i + win <= a.length; i += win) { n++; if (rmsDb(a.subarray(i, i + win)) > SPEECH_DB) hot++; }
  return n ? hot / n : 0;
};

const transcribeWindow = async (t0, dur) => {
  const wav = `/tmp/repair-${t0.toFixed(2)}.wav`;
  execFileSync("ffmpeg", ["-y","-v","error","-i",SRC,"-ss",String(t0),"-t",String(dur),
    "-ac","1","-ar","16000","-c:a","pcm_s16le",wav]);
  const form = new FormData();
  form.set("file", new File([fs.readFileSync(wav)], path.basename(wav), { type: "audio/wav" }));
  form.set("model", "whisper-1");
  form.set("language", "ja");
  form.set("prompt", "Workvivo、Zoom、社員エクスペリエンスプラットフォーム。");
  form.set("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions",
    { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
  if (!res.ok) { console.error(`  HTTP ${res.status}\n  ${await res.text()}`); process.exit(1); }
  return res.json();
};

const doc = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const words = doc.words;
const gaps = [];
for (let i = 0; i < words.length - 1; i++) {
  const a = words[i].end ?? words[i].start, b = words[i + 1].start;
  if (b - a > MIN_GAP) gaps.push({ from: a, to: b, at: i });
}
console.log(`  ${words.length} words, ${gaps.length} gap(s) over ${MIN_GAP}s`);

let repaired = 0;
for (const g of gaps) {
  const frac = speechFraction(g.from, g.to);
  const verdict = frac > 0.25 ? "SPEECH — dropped by the transcriber" : "genuine pause";
  console.log(`  ${g.from.toFixed(2)}-${g.to.toFixed(2)}s (${(g.to - g.from).toFixed(2)}s)  ${(frac * 100).toFixed(0)}% above floor  ${verdict}`);
  if (frac <= 0.25) continue;

  const t0 = Math.max(0, g.from - PAD), dur = g.to - g.from + PAD * 2;
  const j = await transcribeWindow(t0, dur);
  console.log(`      recovered: "${j.text.trim()}"`);
  if (!j.words?.length) { console.log("      nothing came back; left as-is"); continue; }
  // Keep only words that fall inside the hole, so the padding does not duplicate
  // neighbours that the full transcript already has.
  const recovered = j.words
    .map((w) => ({ word: w.word, start: +(t0 + w.start).toFixed(2), end: +(t0 + w.end).toFixed(2) }))
    .filter((w) => w.start >= g.from - 0.15 && w.end <= g.to + 0.15);
  console.log(`      ${recovered.length} word(s) inside the hole, ${recovered[0]?.start.toFixed(2)}-${recovered.at(-1)?.end.toFixed(2)}s`);
  if (WRITE && recovered.length) {
    words.splice(g.at + 1, 0, ...recovered);
    repaired++;
  }
}

if (WRITE && repaired) {
  doc.text = words.map((w) => w.word).join("");
  fs.writeFileSync(JSON_PATH, JSON.stringify(doc, null, 2));
  console.log(`\n  spliced ${repaired} hole(s); rewrote ${JSON_PATH} (${words.length} words)`);
} else if (!WRITE) {
  console.log("\n  report only — pass --write to splice");
}

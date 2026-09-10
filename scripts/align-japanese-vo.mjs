/**
 * Match the Japanese voiceover to the English narration, sentence by sentence.
 *
 * THE PROBLEM THIS SOLVES
 * Both recordings are the same script, and both are transcribed with timestamps
 * (scripts/transcribe-vo.mjs). What is missing is the correspondence: which stretch of the
 * Japanese recording is the translation of which English sentence. Without that you cannot
 * place a Japanese line under the picture the English line was cut to.
 *
 * WHY A MODEL AND NOT A RULE
 * Three cheaper ideas were tried against the data and all three fail:
 *
 *  - Split on pauses. Whisper finds 50 pauses over 0.12s in the Japanese read, and they do
 *    not fall where the English sentences end. The English has a 2.7s beat after "tied to
 *    company values"; at the same point the Japanese is mid-phrase, between 認め and 合う.
 *
 *  - Split on punctuation. Whisper returns Japanese with no sentence punctuation at all —
 *    only spaces, and they are not sentence ends either.
 *
 *  - Split proportionally by length. This is the one that looks reasonable and is worst,
 *    because it assumes a constant expansion ratio. It is not constant: "Back from time
 *    off?" is four English words and 休暇明けも大丈夫 is a full Japanese clause.
 *
 * What actually identifies the boundary is knowing that 休暇明けも大丈夫 MEANS "back from
 * time off". That is a translation judgement, so it is asked of the model that does
 * translation judgements.
 *
 * WHY IT ALIGNS SENTENCES AND NOT PHRASES
 * Japanese reorders within a sentence and the alignment would be non-monotonic if it went
 * finer. The English says "the AI native employee experience platform where comms,
 * knowledge, action, and insight come together"; the Japanese says the four nouns first and
 * puts プラットフォームです at the end. Across sentences the order is stable, so sentences
 * are the smallest unit on which "chunk i comes before chunk i+1" is actually true — and
 * that ordering is what makes the result checkable.
 *
 *     node scripts/align-japanese-vo.mjs
 *
 * Writes docs/audio/vo-alignment.json, which is committed. Building the paced audio reads
 * that file and never calls the API, so the audio can be rebuilt offline and a change to
 * the alignment is a reviewable diff rather than a silent re-roll.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "docs/audio");
const URL = "https://api.openai.com/v1/responses";

const ca = path.join(ROOT, ".certs/corporate-ca.pem");
if (fs.existsSync(ca) && process.env.NODE_EXTRA_CA_CERTS !== ca) {
  const r = spawnSync(process.execPath, [import.meta.filename, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_EXTRA_CA_CERTS: ca },
  });
  process.exit(r.status ?? 1);
}

process.loadEnvFile(path.join(ROOT, ".env"));
const KEY = process.env.OPENAI_API_KEY?.trim();
if (!KEY) {
  console.error("OPENAI_API_KEY is not set — put it in .env, the same one the wizard uses.");
  process.exit(1);
}
const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";

const read = (name) => JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8"));

/** 5300 frames at 25 fps — the composition's own length, which is what the last sentence
    has to finish inside. */
const FILM_SECONDS = 212;

/**
 * The English narration as sentences, with a start time for each.
 *
 * WHY NOT JUST JOIN WHISPER'S SEGMENTS
 * The first version grouped segments until one ended on a full stop, which worked on the
 * transcript of the mixed reference and collapsed on the transcript of the clean stem. The
 * difference is that Whisper segments on pauses it can hear: under music it cut the
 * narration into 74 short pieces, and on clean audio it ran 38 long ones that each contain
 * several sentences and end on a full stop. Joining those gave 17 "sentences", one of them
 * 36 seconds long — an alignment unit that spans five screens is no anchor at all.
 *
 * So the sentence split comes from the punctuation in the text, and the TIME for each
 * boundary comes from the word stream, which is per-word regardless of how segments fell.
 *
 * WHY THE WORDS ARE MATCHED BY ACCUMULATION AND NOT BY INDEX
 * The two do not have the same length: the text has 456 words, the stream has 465. Whisper
 * emits "AI-powered" as one word in the segment text and two tokens in the stream. Indexing
 * one by the other lines up from the start and is silently one word out from the first
 * hyphen onward — which is 135 words in, far enough that the first few sentences look
 * right. Consuming tokens until they spell the word is immune to it.
 */
export const englishSentences = (en) => {
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const text = en.segments.map((s) => s.text.trim()).join(" ");
  const stream = en.words.map((w) => ({ ...w, n: norm(w.word) })).filter((w) => w.n);

  const out = [];
  let i = 0;
  let skipped = 0;
  for (const raw of text.split(/(?<=[.?!])\s+/)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const words = sentence.split(/\s+/).map(norm).filter(Boolean);
    const first = i;
    for (const want of words) {
      let acc = "";
      while (i < stream.length && acc !== want) {
        // A token that cannot extend the word we are looking for means the transcript and
        // the stream disagree here. Dropping it and carrying on re-syncs on the next word
        // rather than derailing every sentence after it.
        if (!want.startsWith(acc + stream[i].n)) {
          if (acc === "") {
            i++;
            skipped++;
            continue;
          }
          break;
        }
        acc += stream[i].n;
        i++;
      }
    }
    if (i > first) {
      out.push({ start: stream[first].start, end: stream[i - 1].end, text: sentence });
    }
  }
  const consumed = out.length ? out.length : 0;
  console.log(`  ${consumed} sentences from ${stream.length} word tokens (${skipped} tokens skipped)`);
  return out;
};

const en = read("english-vo.json");
const ja = read("japanese-voiceover.json");
const offsets = read("vo-offsets.json");

/**
 * Sentence times are shifted onto the FILM's clock here, once, at the boundary where the
 * transcript stops being a fact about an audio file and starts being a fact about the edit.
 * Every number written to vo-alignment.json is therefore in film time, and nothing
 * downstream has to remember that VO.mp3 starts 0.64s before the film does.
 */
const sentences = englishSentences(en).map((s) => ({
  ...s,
  start: s.start + offsets.englishStemToFilm,
  end: s.end + offsets.englishStemToFilm,
}));
const tokens = ja.words;

console.log(`${sentences.length} English sentences, ${tokens.length} Japanese tokens`);

const englishList = sentences.map((s, i) => `${i}. ${s.text}`).join("\n");
// Indexed, because the answer is an index. Asking for the Japanese TEXT back instead would
// mean string-matching a model's reproduction of it against the transcript, and any single
// character it normalised differently would fail to match.
const japaneseList = tokens.map((w, i) => `${i}:${w.word}`).join(" ");

const instructions = [
  "You align a Japanese voiceover to the English script it was translated from.",
  "",
  "You are given the English narration as numbered sentences, and the Japanese recording as",
  "a numbered stream of transcription tokens. The Japanese is a translation of the same",
  "script, read straight through in the same order, so the Japanese rendering of sentence",
  "N always begins after the Japanese rendering of sentence N-1.",
  "",
  "For every English sentence, return the index of the first Japanese token where its",
  "translation begins.",
  "",
  "Rules:",
  "- Sentence 0 always starts at token 0.",
  "- The indices must strictly increase. Every token belongs to exactly one sentence.",
  "- Split on meaning, not on length. Japanese reorders freely inside a sentence, so a",
  "  sentence's translation may put its nouns first and its verb last; what matters is only",
  "  where one sentence's translation ends and the next one's begins.",
  "- Tokens are sub-word fragments. Land the boundary on the first token of the first word,",
  "  not part-way through a word.",
  "- Also return `firstWords`: the first few tokens starting at your index, joined, so the",
  "  index can be checked against the text it claims to point at.",
].join("\n");

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["alignment"],
  properties: {
    alignment: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentence", "startToken", "firstWords"],
        properties: {
          sentence: { type: "integer" },
          startToken: { type: "integer" },
          firstWords: { type: "string" },
        },
      },
    },
  },
};

const res = await fetch(URL, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: MODEL,
    instructions,
    input: `ENGLISH SENTENCES\n${englishList}\n\nJAPANESE TOKENS\n${japaneseList}`,
    // Not a transformation with the answer already in the prompt — it is a search for 34
    // boundaries that have to agree with each other. This is the one call in the repo that
    // earns real reasoning.
    reasoning: { effort: "medium" },
    text: {
      format: { type: "json_schema", name: "vo_alignment", strict: true, schema },
    },
    max_output_tokens: 20000,
  }),
});
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}\n${await res.text()}`);
  process.exit(1);
}
const body = await res.json();
const text = body.output
  ?.flatMap((o) => o.content ?? [])
  .filter((c) => c.type === "output_text")
  .map((c) => c.text)
  .join("");
if (!text) {
  console.error("No output_text in the response:\n" + JSON.stringify(body, null, 2).slice(0, 2000));
  process.exit(1);
}
const { alignment } = JSON.parse(text);

/**
 * Checked rather than trusted. A boundary list that is the right length and the wrong order
 * produces negative-length chunks downstream and an audio file that is silent in places —
 * a failure that is much cheaper to catch here, against the constraint, than in a render.
 */
const problems = [];
if (alignment.length !== sentences.length) {
  problems.push(`got ${alignment.length} boundaries for ${sentences.length} sentences`);
}
if (alignment[0]?.startToken !== 0) problems.push(`sentence 0 starts at ${alignment[0]?.startToken}, not 0`);
for (let i = 1; i < alignment.length; i++) {
  const prev = alignment[i - 1].startToken;
  const here = alignment[i].startToken;
  if (here <= prev) problems.push(`sentence ${i} starts at ${here}, not after sentence ${i - 1} at ${prev}`);
  if (here >= tokens.length) problems.push(`sentence ${i} starts at ${here}, past the last token ${tokens.length - 1}`);
}
if (problems.length) {
  console.error("The alignment is not usable:\n  " + problems.join("\n  "));
  process.exit(1);
}

const rows = alignment.map((a, i) => {
  const startTok = a.startToken;
  const endTok = (alignment[i + 1]?.startToken ?? tokens.length) - 1;
  return {
    sentence: i,
    english: sentences[i].text,
    englishStart: Number(sentences[i].start.toFixed(2)),
    englishEnd: Number(sentences[i].end.toFixed(2)),
    startToken: startTok,
    endToken: endTok,
    // The token stream carries the times; these are the numbers the build step cuts on.
    japaneseStart: Number(tokens[startTok].start.toFixed(2)),
    japaneseEnd: Number(tokens[endTok].end.toFixed(2)),
    japanese: tokens.slice(startTok, endTok + 1).map((t) => t.word).join(""),
  };
});

const out = {
  generated: new Date().toISOString(),
  model: MODEL,
  english: {
    source: "docs/audio/english-vo.json",
    duration: en.duration,
    // Recorded so a reader of this file can tell that its times are film times.
    stemToFilmOffset: offsets.englishStemToFilm,
  },
  japanese: { source: "docs/audio/japanese-voiceover.json", duration: ja.duration },
  sentences: rows,
};
const dst = path.join(DIR, "vo-alignment.json");
fs.writeFileSync(dst, JSON.stringify(out, null, 2) + "\n");

const u = body.usage ?? {};
console.log(`  ${u.input_tokens ?? "?"} in / ${u.output_tokens ?? "?"} out on ${MODEL}`);
console.log(`  wrote ${path.relative(ROOT, dst)}`);
for (const r of rows) {
  const jaDur = r.japaneseEnd - r.japaneseStart;
  const win = (rows[r.sentence + 1]?.englishStart ?? FILM_SECONDS) - r.englishStart;
  console.log(
    `${String(r.sentence).padStart(2)}  en ${r.englishStart.toFixed(1).padStart(6)} win ${win.toFixed(1).padStart(5)}` +
      `  ja ${r.japaneseStart.toFixed(1).padStart(6)} len ${jaDur.toFixed(1).padStart(5)}` +
      `  x${(jaDur / win).toFixed(2)}  ${r.japanese.slice(0, 28)}`,
  );
}

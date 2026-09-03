/**
 * Transcribe the film's two soundtracks with OpenAI Whisper, with timestamps.
 *
 * WHY THIS EXISTS
 * The Japanese cut needs a Japanese voiceover laid over the same 212 seconds the English
 * one narrates. The two recordings are not the same length — the supplied Japanese read is
 * 231.4s, nineteen seconds longer than the entire film — so it cannot simply be dropped in
 * at 0 and left to run. Every line has to land where the English line it replaces lands,
 * because the picture is cut to the English: a sentence about search plays over the search
 * screen, and a Japanese track that drifts four seconds late narrates the wrong screen.
 *
 * To place lines you first have to know where they are, in both recordings. That is what
 * this does, and it is the only step that needs the network.
 *
 * WHERE THE ENGLISH AUDIO COMES FROM
 * There is no separate English VO file. The reference edit — the same `<Video>` that
 * WorkvivoCut lays underneath everything — carries the film's entire soundtrack, narration
 * and music together. So the English transcript is pulled from the reference's own audio
 * track. See the REFERENCE_VIDEO comment in src/WorkvivoCut.tsx.
 *
 * WHY whisper-1 AND NOT gpt-4o-transcribe
 * Only whisper-1 returns `verbose_json` with segment and word timestamps. The newer
 * transcription models are more accurate on words and give you no times at all, which for
 * this job is the one thing that matters.
 *
 *     node scripts/transcribe-vo.mjs            # both tracks
 *     node scripts/transcribe-vo.mjs english    # just the English stem
 *     node scripts/transcribe-vo.mjs japanese   # just the VO
 *
 * Output is JSON under docs/audio/, committed, so the pacing step downstream is
 * reproducible without re-spending on the API.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs/audio");
const URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * Node reads NODE_EXTRA_CA_CERTS once, at startup, so it cannot be set from inside the
 * process that needs it. Same re-exec dance as scripts/dev.mjs, for the same reason: on a
 * network that intercepts TLS, `fetch` to api.openai.com fails with
 * SELF_SIGNED_CERT_IN_CHAIN while curl to the same URL is perfectly happy.
 */
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

const TRACKS = {
  /**
   * The English narration, from the isolated VO stem rather than the reference edit.
   *
   * The first pass transcribed the reference video's own audio, because at the time that
   * was the only English there was. It worked, but every word was heard through the music
   * bed underneath it. The clean stem gives boundaries that are not guesses at where a
   * word ends behind a synth pad.
   *
   * It is NOT on the film's clock. The stem runs 0.640s ahead of where the same narration
   * sits in the edit — measured, not assumed, and re-measured by
   * scripts/measure-vo-offset.mjs whenever a stem is replaced. Everything downstream works
   * in film time, so that offset is added when the transcript is read, not here.
   */
  english: {
    src: "public/audio/VO.mp3",
    out: "english-vo.json",
    // Named rather than auto-detected. Whisper guesses per-file, and a music-heavy
    // opening has been known to make it guess Welsh and then translate into it.
    language: "en",
    prompt:
      "Workvivo, Zoom, employee experience platform, intranet, Spaces, Journeys, " +
      "Seer, newsletters, podcasts, employee app.",
  },
  /** The mixed reference edit. Kept because it is the only recording that is already on
      the film's clock, which is what makes it the yardstick the stem's offset is measured
      against. Not used for sentence boundaries any more. */
  "english-mixed": {
    src: "public/img/L2 Video(Virgin Airline).mp4",
    out: "reference-english.json",
    language: "en",
    prompt:
      "Workvivo, Zoom, employee experience platform, intranet, Spaces, Journeys, " +
      "Seer, newsletters, podcasts, employee app.",
  },
  japanese: {
    src: "public/audio/japanese-voiceover.mp3",
    out: "japanese-voiceover.json",
    language: "ja",
    prompt: "Workvivo、Zoom、従業員体験プラットフォーム、社内SNS、スペース、ジャーニー。",
  },
  /**
   * The re-timed read, transcribed again so the result can be checked rather than assumed.
   * Everything upstream is a plan; this is the only measurement of what the file actually
   * does. See scripts/verify-japanese-vo.mjs.
   */
  "japanese-paced": {
    src: "public/audio/japanese-voiceover-paced.mp3",
    out: "japanese-paced.json",
    language: "ja",
    prompt: "Workvivo、Zoom、従業員体験プラットフォーム、社内SNS、スペース、ジャーニー。",
  },
};

/**
 * 16 kHz mono PCM, which is what Whisper resamples to internally anyway. The point is the
 * size: the endpoint rejects anything over 25 MB, and 212 seconds of the reference's own
 * 48 kHz stereo AAC in an MP4 container would be sent as the whole 310 MB file, video and
 * all. This is 6.8 MB.
 */
const wav = (src) => {
  const dst = path.join("/tmp", `whisper-${path.basename(src).replace(/\W+/g, "-")}.wav`);
  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", dst],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  return dst;
};

const transcribe = async (name) => {
  const track = TRACKS[name];
  const src = path.join(ROOT, track.src);
  if (!fs.existsSync(src)) {
    console.error(`  missing ${track.src}`);
    process.exit(1);
  }

  const audio = wav(src);
  const bytes = fs.statSync(audio).size;
  console.log(`${name}: ${track.src} -> ${(bytes / 1e6).toFixed(1)} MB of 16 kHz mono`);
  if (bytes > 25e6) {
    console.error("  over the 25 MB limit; this file would need splitting on silence first.");
    process.exit(1);
  }

  const form = new FormData();
  form.set("file", new File([fs.readFileSync(audio)], path.basename(audio), { type: "audio/wav" }));
  form.set("model", "whisper-1");
  form.set("language", track.language);
  form.set("prompt", track.prompt);
  form.set("response_format", "verbose_json");
  // Repeated rather than comma-joined: the field is an array and the API reads it as one.
  form.append("timestamp_granularities[]", "segment");
  form.append("timestamp_granularities[]", "word");

  const started = Date.now();
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  if (!res.ok) {
    // The body is where the real reason is — a bare status tells you nothing about which
    // of the eight form fields it disliked.
    console.error(`  HTTP ${res.status} ${res.statusText}\n  ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dst = path.join(OUT_DIR, track.out);
  fs.writeFileSync(dst, JSON.stringify(json, null, 2) + "\n");

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `  ${json.segments?.length ?? 0} segments, ${json.words?.length ?? 0} words, ` +
      `${Number(json.duration).toFixed(1)}s of audio, ${secs}s to transcribe`,
  );
  console.log(`  wrote ${path.relative(ROOT, dst)}`);
};

const want = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const names = want.length ? want : Object.keys(TRACKS);
for (const name of names) {
  if (!TRACKS[name]) {
    console.error(`Unknown track '${name}'. Try: ${Object.keys(TRACKS).join(", ")}`);
    process.exit(1);
  }
  await transcribe(name);
}

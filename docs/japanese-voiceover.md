# The Japanese voiceover

How the Japanese cut gets a soundtrack, why it is a build artefact rather than something
Remotion assembles, and what each number in it was measured from.

## The problem

`L2VirginAirline` has no audio of its own. The reference edit laid underneath the whole film
carries the entire soundtrack — narration and music together, in one mixed track — and
`WorkvivoCut` plays it unmuted. That is fine until the narration has to be in Japanese.

The supplied Japanese read is **231.4 seconds**. The film is **212**. Starting it at zero
puts the closing line nineteen seconds after the closing shot, and every line before it
somewhere it does not belong. That matters more than it might sound, because the picture is
cut to the narration: the line about search plays over the search screen, or it plays over
the wrong screen.

So each Japanese sentence has to be placed against the English sentence it translates, and
sped up only as much as its slot demands.

## The assets

| File | What it is | Length |
| --- | --- | --- |
| `public/img/L2 Video(Virgin Airline).mp4` | The reference edit. Its audio is the film's clock. | 212.0s |
| `public/audio/VO.mp3` | The English narration, isolated | 212.3s |
| `public/audio/Quantum_Flow.wav` | The music bed, at full level, no ducking | 217.2s |
| `public/audio/japanese-voiceover.mp3` | The Japanese read, as delivered | 231.4s |
| `public/audio/japanese-soundtrack.mp3` | **Built.** What the composition plays. | 212.0s |

Only the last one ships; the rest are excluded in `.dockerignore`, because the music stem
alone is 42 MB.

### Neither stem is on the film's clock by default

Two offsets were measured rather than assumed, and both matter:

- **`VO.mp3` runs 0.640s ahead of the film.** Measured by `scripts/measure-vo-offset.mjs`,
  which transcribes both the stem and the reference edit and matches them word by word
  through a longest common subsequence. 464 of 465 words matched; the offset has an **IQR of
  0.000s and zero drift** across the film, so it is a pure shift and a single number places
  it. The script fails rather than emitting a number if that stops being true — a re-cut
  stem shows up as a wide spread instead of a plausible-looking median.

- **`Quantum_Flow.wav` is already aligned, to within 20ms.** Cross-correlating envelopes
  said nothing useful (peak 0.08) because a track mixed to a steady level has almost no
  envelope to correlate. Matching log-spectrogram frames from the film's five music-only
  narration gaps against the whole stem put all five at the same lag, `+0.020s`, at cosine
  0.88–0.94 with clear separation from the runners-up.

## The pipeline

```bash
npm run audio:transcribe   # Whisper, with timestamps, on every track
npm run audio:offset       # where the English stem sits on the film's clock
npm run audio:align        # which Japanese sentence translates which English one
npm run audio:build        # re-time the read, mix the soundtrack
npm run audio:verify       # transcribe the result and check it landed
```

Only the first three touch the network. Their output is committed under `docs/audio/`, so
the audio rebuilds offline and any change to an alignment is a reviewable diff rather than a
silent re-roll.

### 1. Transcribe — `scripts/transcribe-vo.mjs`

`whisper-1`, because it is the only OpenAI transcription model that returns `verbose_json`
with segment and word timestamps. The newer `gpt-4o-transcribe` models are better on words
and give no times at all, which for this job is the only thing that matters.

### 2. Align — `scripts/align-japanese-vo.mjs`

Which stretch of the Japanese recording translates which English sentence. Three cheaper
ideas were tried against the data first and all three fail:

- **Split on pauses.** Whisper finds 50 pauses over 0.12s in the Japanese read and they do
  not fall where the English sentences end. The English has a 2.7s beat after "tied to
  company values"; at that point the Japanese is mid-phrase, between 認め and 合う.
- **Split on punctuation.** Whisper returns Japanese with no sentence punctuation at all.
- **Split proportionally by length.** The one that looks reasonable and is worst, because it
  assumes a constant expansion ratio. "Back from time off?" is four English words and
  休暇明けも大丈夫 is a full Japanese clause.

What identifies the boundary is knowing that 休暇明けも大丈夫 *means* "back from time off",
so it is asked of the model. It returns a token index per sentence, not the Japanese text,
so nothing depends on the model reproducing the transcript character for character. The
result is checked for length, for starting at zero and for being strictly increasing before
it is written.

**It aligns sentences, never phrases.** Japanese reorders within a sentence — the English
says "the AI native employee experience platform where comms, knowledge, action, and insight
come together", the Japanese says the four nouns first and puts プラットフォームです at the
end. Sentences are the smallest unit on which "chunk *i* comes before chunk *i+1*" is
actually true.

English sentences themselves come from punctuation in the text, with times read off the word
stream. Grouping Whisper's *segments* was the first attempt and it collapsed on clean audio:
under music Whisper cut the narration into 74 short segments, but on the clean stem it ran 38
long ones that each contain several sentences, and joining those gave 17 "sentences", one of
them 36 seconds long.

### 3. Build — `scripts/build-japanese-vo.mjs`

**Placement.** Each sentence has a source duration and an anchor (the English sentence's
start, in film time). Choose a start and a tempo for each so that lines land on their anchors
without overlapping, minimising `Σ (start − anchor)² + 20·(tempo − 1)²`.

- *Why not one tempo for the whole read.* The obvious idea: 221s of content into ~206s needs
  about 1.07×, which sounds like nothing. It does not work, because the surplus is not spread
  evenly. Holding every line within a second of its anchor at a single tempo needs **1.20×
  everywhere** — the whole read rushed to fix a dozen crowded lines. Per-sentence tempo does
  the same job at a mean of **1.09×** with nine of the 35 untouched at 1.00.

- *Why it is solved and not walked forward.* The first version was a forward pass: place at
  the anchor, compress on collision. It is myopic in a specific way — a crowded line can only
  be relieved by starting earlier, which needs the *previous* line to finish earlier, but a
  forward pass has already placed that one at tempo 1.00 because on its own it fit. Congestion
  piled up: the last third ran eight consecutive lines at the tempo cap and still drifted
  1.16s late.

  Solving it lets a little compression fall on the roomy line *before* the crowded one, which
  is what a person mixing this would do. Substituting `z_i = s_i − (everything scheduled
  before it)` turns "line *i* finishes before line *i+1* starts" into "`z` must not decrease"
  and the anchor objective into least squares — which is isotonic regression, solved exactly
  by pool-adjacent-violators in one pass. So for any set of tempos the best placement is
  computed, not searched for, and only the 35 tempos need optimising.

- *Why the weight is 20.* Swept 2 to 80. The curve is flat from 2 to 20 and sync degrades
  quickly after, so 20 is the last value that costs nothing.

**Assembly is sample-accurate, not a filter graph.** The natural way to do this in ffmpeg is
35 `atrim`/`atempo`/`adelay` chains summed by `amix`, and that is what it was. It produced a
file that played, sounded like Japanese, and was wrong: the 0.64s lead-in had vanished, the
whole read sat early, and chunks were being dropped. Bisecting found the lead-in was eaten by
the `apad,atrim=0:212` tail, and separately that `amix`'s `duration=longest` was not honouring
the longest input across 35 branches sharing one auto-split source.

Both are the same class of problem: in a graph that size the placement is an emergent property
of filters interacting, so a mistake is silent and comes out as a film narrated over the wrong
screens. Cutting each sentence with one short obvious command and writing it into the output
buffer at a computed sample index makes the placement arithmetic instead of emergent.

**The mix.** Every level is read off the English film rather than chosen:

| | Measured | Used for |
| --- | --- | --- |
| Reference mix | −19.7 LUFS | what the finished Japanese mix is normalised to |
| English VO stem | −20.3 LUFS | what the Japanese narration is set to |
| Music stem | −11.6 LUFS | far too loud to sit under a voice, so |
| Film's bed in its 26 narration gaps | median 14.7 dB below the stem | the music gain |

Plus a sidechain from the narration, so the bed steps back while anyone is speaking. The
music is trimmed to 212s with a 2.5s fade — the stem is 217.2s and would otherwise be cut off
mid-bar on the last frame.

### 4. Verify — `scripts/verify-japanese-vo.mjs`

Everything above is intent. Nothing in it confirms that `atrim` cut where it meant to, that
`atempo` produced the length it was asked for, or that the chunks were indexed correctly — and
a single off-by-one gives a file that plays perfectly well and narrates the wrong screens for
three and a half minutes.

So the built file is **transcribed again** and compared against the English anchors. Current
result:

```
against the English anchors: median 0.18s, worst 0.98s
all 35 sentences land within 1.5s of the line they translate
```

This is what caught the `amix` bug: every sentence measured a consistent −0.6s against its
own plan, which is not noise, it is a shift.

## Wiring

`WorkvivoCut` takes `ownSoundtrack`, defaulting to `false`, so `L2VirginAirline`, the wizard's
customised cut and the gallery are unaffected by the prop existing. Only `src/Japanese.tsx`
passes it, and it is the only composition with a soundtrack of its own to play instead.

`Audio` comes from `@remotion/media`, not from `remotion`, for the same reason `Video` does in
`WorkvivoCut`: the plain one is an HTML media element and `@remotion/web-renderer` refuses
those, so it would break the wizard's in-browser export.

Confirmed on a rendered slice: the render matches the Japanese soundtrack at cosine **0.970**
(the 60ms lag is AAC priming delay) and the English reference at 0.402, which is the floor for
unrelated audio — the reference really is muted.

## Known rough edge

Sentence 13's chunk ends on チャット ("chat"), which belongs to sentence 14. The reader paused
*after* that word rather than before it, so both Whisper and the alignment put the boundary
there. Moving it earlier would mean cutting through the middle of the reader's own phrase,
which sounds worse than one word arriving half a second early. Left as it is, deliberately.

## When a stem is replaced

Re-run the whole pipeline. Do not carry the offsets over: `measure-vo-offset.mjs` exists
precisely because a constant in a file is a claim about two assets that can each be replaced
without the other, and the failure mode is not a crash — it is a finished film whose lines all
land half a second out.

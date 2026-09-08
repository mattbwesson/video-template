#!/usr/bin/env python3
"""
Measure how fast the current Japanese read actually speaks, in mora per second.

    python3 scripts/calibrate-mora-rate.py

Prints the rate to put in RATE in scripts/score-vo-script.py. Run this after every new
recording: the rate is a property of the voice, not of the language, and a different voice
shifts every prediction in docs/japanese-voiceover-script.md by a common factor.

MEASURE SPEECH, NOT SPEECH-PLUS-SILENCE

This is the whole reason the script exists rather than a one-liner dividing mora by chunk
duration. The first calibration attempt did exactly that and reported mora as a WORSE
predictor than characters, which cannot be true if mora is the real unit. The fault was in
the measurement: a chunk runs from the first word to the last, and the reader's pauses are
inside it, so that ratio is really mora per second of speech-plus-pause — and pause length
is the thing that varies most between lines. Excluding internal gaps over GAP seconds puts
mora ahead of characters, which is the result below.

WHY IT REPORTS CHARACTERS TOO

Not for the doc's benefit — as a check on itself. If characters ever come out ahead on a new
read, something is wrong with the mora counting for that voice (a product name it says
differently, say) and the number should not be trusted until that is understood.
"""

from __future__ import annotations

import json
import os
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mora import mora  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "docs", "audio")

# A silence longer than this is a pause between phrases, not part of saying a word. 0.35s is
# comfortably above Whisper's timestamp jitter and below the shortest deliberate beat in
# this read.
GAP = 0.35


def speech_span(words: list[dict], start: float, end: float) -> float | None:
    """Seconds of actual speech in [start, end], with the reader's pauses taken out."""
    inside = [w for w in words if w["start"] >= start - 1e-6 and w["end"] <= end + 1e-6]
    if len(inside) < 2:
        return None
    span = inside[-1]["end"] - inside[0]["start"]
    pauses = sum(
        max(0.0, b["start"] - a["end"])
        for a, b in zip(inside, inside[1:])
        if b["start"] - a["end"] > GAP
    )
    return span - pauses


def main() -> None:
    alignment = json.load(open(os.path.join(DIR, "vo-alignment.json")))["sentences"]
    words = json.load(open(os.path.join(DIR, "japanese-voiceover.json")))["words"]

    rows = []
    for s in alignment:
        secs = speech_span(words, s["japaneseStart"], s["japaneseEnd"])
        if not secs or secs <= 0:
            continue
        text = s["japanese"]
        rows.append((mora(text), len(text.replace("、", "").replace("。", "")), secs, text))

    print(f"{len(rows)} of {len(alignment)} chunks usable, gaps over {GAP}s excluded\n")
    print(f"  {'unit':<11}{'rate':>8}{'cv':>8}{'median err':>12}{'worst':>8}")
    best = {}
    for name, idx in (("mora", 0), ("characters", 1)):
        rates = [r[idx] / r[2] for r in rows]
        rate = statistics.median(rates)
        cv = statistics.stdev(rates) / statistics.mean(rates)
        errs = sorted(abs(r[idx] / rate - r[2]) for r in rows)
        best[name] = (rate, cv)
        print(
            f"  {name:<11}{rate:>8.2f}{cv:>8.3f}"
            f"{statistics.median(errs):>11.2f}s{max(errs):>7.2f}s"
        )

    m_cv, c_cv = best["mora"][1], best["characters"][1]
    if m_cv >= c_cv:
        print(
            f"\n  WARNING: characters predict this read better than mora (cv {c_cv:.3f} vs "
            f"{m_cv:.3f}).\n  Do not use this rate until that is understood — check LATIN in "
            f"scripts/mora.py against\n  how this voice says the product names."
        )
        sys.exit(1)
    print(f"\n  mora is {(c_cv / m_cv - 1) * 100:.0f}% tighter than characters")
    print(f"  set RATE = {best['mora'][0]:.2f} in scripts/score-vo-script.py")


if __name__ == "__main__":
    main()

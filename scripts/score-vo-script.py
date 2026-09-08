#!/usr/bin/env python3
"""
Score a Japanese voiceover script against the windows the picture actually gives it.

    python3 scripts/score-vo-script.py docs/audio/japanese-vo-v3.txt

WHY THE UNIT IS MORA AND NOT CHARACTERS

The first version of this analysis measured lines in characters. That is wrong: a kanji
carries two or three mora and a katakana character carries one, so a character count is a
different unit depending on the script mix of the line being counted — exactly the thing
that varies most between a line like `エンゲージメントサーベイ` and one like `経営層と現場`.

Measured against the actual read, per line:

    mora/sec   8.48   cv 0.139   median error 0.38s   worst 1.44s
    chars/sec  7.56   cv 0.162   median error 0.61s   worst 1.75s

The mora model is 59% more accurate per line. The rate below is that calibration.

HOW THE RATE WAS CALIBRATED, AND THE MISTAKE WORTH NOT REPEATING

The first calibration pass gave mora a WORSE coefficient of variation than characters,
which cannot be true if mora is the real unit. The cause was the measurement, not the
model: it divided each sentence's mora by its chunk duration, and a chunk includes the
reader's pauses. So the "rate" was really speech-plus-silence, and the silence is what
varied. Measuring speech-only spans — first word onset to last word offset, minus internal
gaps over 0.35s — puts mora ahead, which is what the numbers above are.

WHY THE BUDGET IS 85% OF THE WINDOW AND NOT ALL OF IT

A window is the gap between one English line's start and the next. Filling all of it means
the reader begins the next sentence at the exact instant the last one ends, for 31
sentences. Real narration breathes. Budget at 85% leaves that room; a line between 85% and
100% still fits without compression but has no pause around it, and only past 100% does
scripts/build-japanese-vo.mjs have to speed the line up.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mora import mora  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALIGNMENT = os.path.join(ROOT, "docs", "audio", "vo-alignment.json")

# Mora per second, from the read in public/audio/japanes-voiceover-2.mp3. See above.
RATE = 8.48

# Fraction of the window a line should occupy, leaving the rest as breath.
FILL = 0.85

# The film ends 5.3s after the last English line starts; there is no line after it to
# measure a gap against.
LAST_WINDOW = 5.3

# Which English sentences each Japanese beat covers. Not 1:1: the Japanese merges four
# pairs the English splits, because Japanese puts the verb last and a sentence that ends
# mid-clause cannot be placed under the picture the English clause was cut to.
BEATS = {
    1: [0, 1], 2: [2], 3: [3], 4: [4, 5], 5: [6], 6: [7], 7: [8], 8: [9], 9: [10],
    10: [11], 11: [12], 12: [13], 13: [14], 14: [15, 16], 15: [17], 16: [18], 17: [19],
    18: [20], 19: [21, 22], 20: [23], 21: [24], 22: [25], 23: [26], 24: [27], 25: [28],
    26: [29], 27: [30], 28: [31], 29: [32], 30: [33], 31: [34],
}


def windows() -> list[float]:
    """Each English sentence's window: from its start to the next one's."""
    starts = [s["englishStart"] for s in json.load(open(ALIGNMENT))["sentences"]]
    return [starts[i + 1] - starts[i] for i in range(len(starts) - 1)] + [LAST_WINDOW]


def score(path: str):
    win = windows()
    starts = [s["englishStart"] for s in json.load(open(ALIGNMENT))["sentences"]]
    lines = [l.strip() for l in open(path, encoding="utf8") if l.strip()]
    if len(lines) != len(BEATS):
        sys.exit(f"{path} has {len(lines)} beats, expected {len(BEATS)}")

    rows, total = [], 0
    for i, text in enumerate(lines, 1):
        w = sum(win[k] for k in BEATS[i])
        m = mora(text)
        total += m
        rows.append(
            {
                "beat": i,
                "start": starts[BEATS[i][0]],
                "window": w,
                "budget": int(w * FILL * RATE),
                "mora": m,
                "seconds": m / RATE,
                "fill": (m / RATE) / w,
                "text": text,
            }
        )
    return rows, total


def main() -> None:
    args = sys.argv[1:]
    # --json is how scripts/predict-vo-fit.mjs gets the per-beat durations. It runs the
    # real placement solver over them, so "will this draft need compression" is answered
    # by the same code that will later do the compressing.
    if "--json" in args:
        args.remove("--json")
        rows, _ = score(args[0])
        print(json.dumps(rows, ensure_ascii=False))
        return
    rows, total = score(args[0])
    print(f"{'beat':>4} {'start':>7} {'window':>7} {'budget':>7} {'mora':>5} {'speech':>7} {'fill':>6}")
    for r in rows:
        flag = "" if r["fill"] <= FILL else ("  tight" if r["fill"] <= 1.0 else "  OVER")
        print(
            f"{r['beat']:>4} {r['start']:>6.1f}s {r['window']:>6.1f}s {r['budget']:>7} "
            f"{r['mora']:>5} {r['seconds']:>6.1f}s {r['fill']:>5.0%}{flag}"
        )
    over = [r["beat"] for r in rows if r["fill"] > 1.0]
    tight = [r["beat"] for r in rows if FILL < r["fill"] <= 1.0]
    print(f"\n  needs compression: {over or 'none'}")
    print(f"  fits but no breath: {tight or 'none'}")
    print(f"  {total} mora = {total / RATE:.1f}s of speech in a 212s film")


if __name__ == "__main__":
    main()

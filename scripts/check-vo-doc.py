#!/usr/bin/env python3
"""
Check that docs/japanese-voiceover-script.md still says what the tools say.

    python3 scripts/check-vo-doc.py

The document claims its tables are generated rather than remembered. That claim decays the
moment someone edits a line in the script and not the table, which is precisely how the v2
log came to omit beat 2's その, つながる→なる and です — the log recorded the edits its author
remembered making, and nothing compared it to the file.

So this compares three things against their sources and exits non-zero on any drift:

  * every row of the script table, against scripts/score-vo-script.py
  * every cell of the change-log's diff column, against scripts/script-diff.py
  * the beat count

It does NOT check the prose. A reason can still be wrong; it just cannot describe an edit
that is not there, or omit one that is.
"""

import json
import re
import subprocess
import sys

DOC = "docs/japanese-voiceover-script.md"
V1 = "docs/audio/japanese-vo-v1.txt"
V3 = "docs/audio/japanese-vo-v3.txt"
FILL = 0.85


def run(*cmd: str) -> str:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"{' '.join(cmd)} failed:\n{r.stderr}")
    return r.stdout


def section(doc: str, start: str, end: str) -> str:
    return doc[doc.index(start) : doc.index(end)]


def rows_of(text: str) -> dict:
    """Markdown table rows keyed by the integer in the first column."""
    out = {}
    for line in text.split("\n"):
        m = re.match(r"\|\s*(\d+)\s*\|(.+)\|$", line)
        if m:
            out[int(m.group(1))] = [c.strip() for c in m.group(2).split("|")]
    return out


def main() -> None:
    doc = open(DOC, encoding="utf8").read()
    problems = []

    # --- the script table ---
    scored = json.loads(run("python3", "scripts/score-vo-script.py", "--json", V3))
    band = lambda f: "room" if f <= FILL else ("snug" if f <= 1.0 else "over")
    table = rows_of(section(doc, "## The script", "## What a `snug`"))
    if set(table) != {r["beat"] for r in scored}:
        problems.append(f"script table has beats {sorted(table)}, script file has {len(scored)}")
    for r in scored:
        cells = table.get(r["beat"])
        if not cells:
            continue
        want = [
            f"{r['start']:.1f}s", f"{r['window']:.1f}s", str(r["mora"]),
            f"{r['seconds']:.1f}s", band(r["fill"]), r["text"],
        ]
        if cells != want:
            for got, exp in zip(cells, want):
                if got != exp:
                    problems.append(f"beat {r['beat']}: table says {got!r}, tool says {exp!r}")

    # --- the change log ---
    real = {}
    for line in run("python3", "scripts/script-diff.py", V1, V3).strip().split("\n"):
        n, d = line.split("\t")
        real[int(n)] = d
    logged = rows_of(section(doc, "## What changed from v1", "## Unchanged and deliberate"))
    norm = lambda x: x.replace("`", "").replace(" ", "").replace(" ", "")
    for beat in sorted(set(real) | set(logged)):
        if beat not in logged:
            problems.append(f"beat {beat} changed but is not in the change log: {real[beat]}")
        elif beat not in real:
            problems.append(f"beat {beat} is in the change log but did not change")
        elif norm(logged[beat][0]) != norm(real[beat]):
            problems.append(
                f"beat {beat} diff column drifted:\n"
                f"      doc:  {logged[beat][0]}\n"
                f"      tool: {real[beat]}"
            )

    if problems:
        print(f"{DOC} is out of date:")
        for p in problems:
            print(f"  {p}")
        sys.exit(1)
    print(f"{DOC}: {len(scored)} beats and {len(real)} logged changes all match the tools")


if __name__ == "__main__":
    main()

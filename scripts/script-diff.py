#!/usr/bin/env python3
"""
Word-level diff between two Japanese voiceover scripts, one line per beat.

WHY THIS EXISTS RATHER THAN A HAND-WRITTEN TABLE

The v2 change log was written by hand, and it was wrong by omission: beat 2 also dropped
その, changed つながる to なる and dropped です, and beat 17 dropped 各種 — none of which
appeared in the table. Worse, beat 21's stated reason was "きちんと and 本当に are duplicate
intensifiers", which is true, but the same edit also removed 社員にとって, the possessor.
A reviewer reading only the log would have approved changes they had never seen.

A hand-written log records the edits its author remembers making. This one records the
edits that are actually in the file, so the two cannot drift.

    python3 scripts/script-diff.py old.txt new.txt

Tokenises with fugashi (same tagger as scripts/mora.py, so the two agree on word
boundaries) and reports every insertion, deletion and replacement per beat.
"""

import difflib
import sys

try:
    from fugashi import Tagger
except ImportError:
    sys.exit("fugashi is not installed; pip install fugashi unidic-lite")

_TAGGER = Tagger("-Owakati")


def tokens(line: str) -> list[str]:
    """Words, not characters. Punctuation is kept — dropping a 。 changes the read."""
    return [w.surface for w in _TAGGER(line)]


def diff_beat(old: str, new: str) -> list[str]:
    """Every difference between two beats, as human-readable change phrases."""
    a, b = tokens(old), tokens(new)
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b).get_opcodes():
        if tag == "equal":
            continue
        removed, added = "".join(a[i1:i2]), "".join(b[j1:j2])
        if tag == "replace":
            out.append(f"{removed} → {added}")
        elif tag == "delete":
            out.append(f"−{removed}")
        else:
            out.append(f"+{added}")
    return out


def read(path: str) -> list[str]:
    return [l.strip() for l in open(path, encoding="utf8") if l.strip()]


def main() -> None:
    old, new = read(sys.argv[1]), read(sys.argv[2])
    if len(old) != len(new):
        sys.exit(f"beat count differs: {len(old)} vs {len(new)}")
    changed = 0
    for i, (o, n) in enumerate(zip(old, new), 1):
        if o == n:
            continue
        changed += 1
        print(f"{i}\t" + " ; ".join(diff_beat(o, n)))
    print(f"\n{changed} of {len(old)} beats changed", file=sys.stderr)


if __name__ == "__main__":
    main()

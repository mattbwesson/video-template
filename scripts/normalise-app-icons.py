#!/usr/bin/env python3
"""
Crop the padding out of the app icons in public/img/integrations so every mark draws at
the same visual size.

The set arrived from two different conventions. Most marks are a full-bleed square — a
coloured tile with the logo already sized inside it, like Zoom or LinkedIn. Eight were a
bare glyph sitting in a large OPAQUE WHITE square, so at the same box size they rendered
visibly smaller than everything beside them, and picking one for a Quick Links tile made
that tile look wrong.

The white is opaque, which is why this is not obvious and why an alpha-bounds check misses
it: by transparency every icon already fills its box. What differs is the INK.

The fix is a viewBox, not a redraw. Tightening it to a square centred on the mark, sized
so the mark occupies TARGET of it, crops the padding away without touching a path — and it
is reversible, because the artwork is all still there outside the box.

The numbers come from rendering each file and measuring, which needs a browser, so they
are recorded here rather than recomputed: see the measurement in the commit that added
this. Re-run after adding icons only if a new one looks small.

    python3 scripts/normalise-app-icons.py
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "public", "img", "integrations")

# file stem -> the square viewBox that puts its ink at ~86% of the box, measured by
# rendering the original at 512px and finding the non-white bounds.
BOXES = {
    "altera": (22.56, 22.56, 160.47, 160.47),
    "google-drive": (29.36, 30.92, 741.28, 741.28),
    "hailey": (48.73, 48.73, 110.54, 110.54),
    "humi": (23.87, 16.76, 166.75, 166.75),
    "microsoft": (53.49, 45.45, 346.44, 346.44),
    "paychex": (32.95, 32.76, 136.36, 136.36),
    "salesforce": (53.11, 54.67, 692.22, 692.22),
    "sesame": (26.10, 26.48, 144.75, 144.75),
}

VIEWBOX = re.compile(r'viewBox="[-\d.eE]+[ ,]+[-\d.eE]+[ ,]+[-\d.eE]+[ ,]+[-\d.eE]+"')
# A width/height pair in user units would fight the new box, so they go: the consumer
# sizes these itself (SlotIcon draws into a fixed square, the picker into a grid cell).
SIZE_ATTR = re.compile(r'\s(?:width|height)="[\d.]+(?:px)?"')


def main() -> None:
    changed = 0
    for stem, box in BOXES.items():
        path = os.path.join(DIR, f"{stem}.svg")
        if not os.path.exists(path):
            print(f"  {stem}: no file, skipped")
            continue
        svg = open(path, encoding="utf8").read()
        head_end = svg.find(">", svg.find("<svg"))
        head, rest = svg[: head_end + 1], svg[head_end + 1 :]
        new = f'viewBox="{box[0]} {box[1]} {box[2]} {box[3]}"'
        if VIEWBOX.search(head):
            head = VIEWBOX.sub(new, head, count=1)
        else:
            head = head.replace("<svg", f"<svg {new}", 1)
        head = SIZE_ATTR.sub("", head)
        open(path, "w", encoding="utf8").write(head + rest)
        print(f"  {stem}: {new}")
        changed += 1
    print(f"  {changed} icons normalised")


if __name__ == "__main__":
    main()

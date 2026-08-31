#!/usr/bin/env python3
"""
Crop the padding out of the app icons in public/img/integrations so every mark draws at
the same visual size.

The set arrived from two different conventions. Most marks are a full-bleed square — a
coloured tile with the logo already sized inside it, like Zoom or LinkedIn. Eleven were a
bare glyph sitting in a large OPAQUE WHITE square, so at the same box size they rendered
visibly smaller than everything beside them, and picking one for a Quick Links tile made
that tile look wrong.

The target is FULL, not "most of the box". A first pass cropped to 86% and only moved the
problem: 40 icons fill their box completely and cannot go further, so the cropped ones
were then the odd ones out in the other direction — smaller on the right of the grid
rather than larger. Uniform means matching the 40, which means 100%.

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

# file stem -> the square viewBox that crops to the mark exactly, measured by rendering
# each file at 512px and finding its non-white bounds with a sensitive threshold, so an
# antialiased edge is not shaved off.
BOXES = {
    "altera": (33.69, 33.84, 137.90, 137.90),
    "google-drive": (81.48, 82.32, 637.04, 637.04),
    "hailey": (56.50, 56.50, 94.78, 94.78),
    "humi": (35.43, 28.48, 143.30, 143.30),
    "microsoft": (77.85, 69.81, 297.72, 297.72),
    "OneDrive": (50.00, 7.03, 701.56, 701.56),
    "paychex": (42.80, 42.35, 116.92, 116.92),
    "salesforce": (101.78, 102.67, 594.88, 594.88),
    "sesame": (36.28, 36.66, 124.39, 124.39),
    "slack": (70.31, 70.31, 659.38, 659.38),
    "workspace": (34.20, 57.37, 392.91, 392.91),
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

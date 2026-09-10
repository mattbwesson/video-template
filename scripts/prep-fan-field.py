#!/usr/bin/env python3
"""
Lift the HQ fan's background out of the reference still.

The reference's field is a soft mesh — bright violet bottom-left, blue-violet across the
top, dark at the middle-left and right — and SVG has no mesh gradient. Three blooms over
a diagonal got close and were still measurably wrong everywhere the eye lands. So the
field is the reference's own pixels: everything outside the fan is copied verbatim, and
the region the fan covers is diffusion-inpainted from its surroundings, which yields a
smooth continuation that only ever shows through the gaps and around the badge.

    python3 scripts/prep-fan-field.py

Reads docs/reference/hq-fan-original.png, writes public/img/hq-fan-field.png.
"""

import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "reference", "hq-fan-original.png")
OUT = os.path.join(ROOT, "public", "img", "hq-fan-field.png")

# Fan geometry, as measured from the reference.
FX, FY, R = 950, 869, 740
BX, BY, HALO = 961, 864, 172
SCALE = 4       # inpaint at quarter size; the field is smooth and this is 16x faster
ITER = 260
FEATHER = 14


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    W, H = src.size
    yy, xx = np.mgrid[0:H, 0:W]
    inside_fan = (np.hypot(xx - FX, yy - FY) <= R + 14) & (yy <= FY + 12)
    inside_halo = np.hypot(xx - BX, yy - BY) <= HALO
    hole = inside_fan | inside_halo

    small = src.resize((W // SCALE, H // SCALE), Image.LANCZOS)
    hole_s = Image.fromarray((hole * 255).astype(np.uint8)).resize(small.size, Image.NEAREST)
    known = np.asarray(hole_s) < 128
    img = np.asarray(small).astype(np.float32)
    orig = img.copy()
    # Seed the hole with the mean of the known pixels so the first blurs have something.
    img[~known] = orig[known].mean(axis=0)
    for _ in range(ITER):
        blurred = np.asarray(
            Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))
        ).astype(np.float32)
        img[~known] = blurred[~known]
    filled = Image.fromarray(img.astype(np.uint8)).resize((W, H), Image.BICUBIC)

    # Feathered composite: exact reference outside the hole, inpaint inside.
    m = Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER))
    out = Image.composite(filled, src, m)
    out.save(OUT, optimize=True)
    print(f"  wrote {os.path.relpath(OUT, ROOT)}  {os.path.getsize(OUT) // 1024} KB")
    a = np.asarray(out).astype(int)
    for (x, y) in [(60, 60), (60, 1040), (1860, 540), (1860, 1040), (960, 60)]:
        print(f"  ({x:4},{y:4}) ref #{'%02x%02x%02x' % tuple(np.asarray(src)[y, x])}  out #{'%02x%02x%02x' % tuple(a[y, x])}")
    for (x, y) in [(610, 240), (250, 760), (1300, 200), (960, 700)]:
        print(f"  inpainted ({x:4},{y:3}) -> #{'%02x%02x%02x' % tuple(a[y, x])}")


if __name__ == "__main__":
    main()

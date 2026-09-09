#!/usr/bin/env python3
"""
Cut the icon burst that flies off the permission toggle (global 4720-4735) out of the
reference footage as an RGBA sprite per frame.

WHY SPRITES AND NOT DRAWN ELEMENTS
The burst is eight glass-rendered 3D icons — magnifier, chat bubble, trend arrow, calendar,
megaphone, medal, question mark, stars — tumbling in perspective while they fade. They are
not in any icon library and they rotate in three axes over twelve frames. Drawing them
flat would look nothing like the reference; tracking each one's pose would be a day's work
for 0.5 seconds of screen time.

The reference is the same footage the rest of the scene is rebuilt from, so its own
pixels are the exact answer. The frame is cut against frame 4736, which has the same
toggle at the same position over the same bloom but no icons left, so everything that
differs from it IS the burst. Alpha is the size of that difference, feathered, and the
colour is the reference pixel itself: composited back over a matching bloom and toggle
the result is the reference pixel again, and where alpha is partial the two colours are
within the threshold of each other anyway.

    python3 scripts/prep-toggle-burst.py

Reads the frames from out/ref (extract them first — see the header of
src/AdminCategoriesScene.tsx) and writes public/img/toggle-burst/f4720.png … f4735.png,
each cropped to the same box so the scene can place them at one fixed offset.
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "out", "ref")
OUT = os.path.join(ROOT, "public", "img", "toggle-burst")

FIRST, LAST = 4720, 4735
CLEAN = 4736
# The union of every frame's difference, with a margin. Fixed so one offset places them all.
X0, Y0, X1, Y1 = 1040, 280, 1410, 790
THRESHOLD = 18  # below this a pixel is codec noise, not icon
KNOB_CX, KNOB_CY, KNOB_R = 1087, 540, 96  # the knob in its on position


def load(f):
    p = os.path.join(REF, f"{f:04d}.png")
    if not os.path.exists(p):
        sys.exit(f"missing {p} — extract the reference frames first")
    return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)


def main():
    os.makedirs(OUT, exist_ok=True)
    clean = load(CLEAN)[Y0:Y1, X0:X1]
    for f in range(FIRST, LAST + 1):
        a = load(f)[Y0:Y1, X0:X1]
        diff = np.abs(a - clean).max(axis=2)
        # Hard alpha where the icon clearly is, a two-pixel feather around it, and nothing
        # where the frame matches the clean plate.
        core = diff > THRESHOLD
        core = ndimage.binary_opening(core, iterations=1)  # drop lone codec specks
        # The knob is a pixel or two smaller in these frames than in the clean plate, so
        # its rim differs by a thin ring that is not an icon. Mask the rim out.
        yy, xx = np.mgrid[Y0:Y1, X0:X1]
        rim = np.abs(np.hypot(xx - KNOB_CX, yy - KNOB_CY) - KNOB_R) < 9
        core &= ~rim
        soft = ndimage.binary_dilation(core, iterations=2)
        alpha = np.where(core, 1.0, np.where(soft, np.clip(diff / THRESHOLD, 0, 1) * 0.6, 0.0))
        alpha = ndimage.gaussian_filter(alpha, 0.6)
        rgba = np.dstack([a.astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
        Image.fromarray(rgba).save(os.path.join(OUT, f"f{f}.png"))
        print(f"f{f}.png  covered {core.mean() * 100:.1f}%")
    print(f"box ({X0},{Y0})-({X1},{Y1}) → place at left {X0}, top {Y0}, {X1 - X0}x{Y1 - Y0}")


if __name__ == "__main__":
    main()

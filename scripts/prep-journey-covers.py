#!/usr/bin/env python3
"""
Build the cover photos for the Journeys card wall (src/JourneyCardsScene.tsx).

The stock photos in public/img/workvivo were cropped out of Workvivo screenshots,
so most of them carry a white (or lilac) page margin and a rounded corner along one
or more edges. Dropped straight into a card those margins read as a bright band
across the top of the photo. This trims the uniform border off each source, then
centre-crops the result to the card's 2.006:1 aspect and writes it to
public/img/journeys/.

Run it again after swapping any source photo:

    python3 scripts/prep-journey-covers.py

Requires Pillow (dev-only; not a runtime dependency of the video).
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "public", "img", "workvivo")
OUT_DIR = os.path.join(ROOT, "public", "img", "journeys")

# Card aspect: JOURNEY_CARD_W / JOURNEY_CARD_H.
ASPECT = 495.64 / 247.11

# source file -> output name, in the reading order of the card wall.
COVERS = [
    ("news_1.png", "it-security.png"),
    ("news_2.png", "new-hire.png"),
    ("story_manager.png", "relocation.png"),
    ("pages_1.png", "ai-adoption.png"),
    ("post_virgin.png", "culture.png"),
    ("mobile_news_1.png", "parental-leave.png"),
    ("pages_2.png", "leadership.png"),
    ("story_summit.png", "continuous-learning.png"),
    ("pages_3.png", "sustainability.png"),
]

# How far a pixel may sit from the border colour and still count as border.
TOLERANCE = 26


# A margin row is allowed a few stray pixels — the photo's own content sometimes
# touches the frame edge at one corner, and a strict all-or-nothing test would stop
# the sweep on the very first row and leave the whole margin in place.
OUTLIER_FRACTION = 0.06


def _matches(pixels, coords, ref):
    """True if all but a few pixels in `coords` are within TOLERANCE of `ref`."""
    budget = int(len(coords) * OUTLIER_FRACTION)
    for xy in coords:
        p = pixels[xy]
        if max(abs(p[i] - ref[i]) for i in range(3)) > TOLERANCE:
            budget -= 1
            if budget < 0:
                return False
    return True


def trim_border(im):
    """Eat the page margin inward from each edge.

    Each edge is judged against the colour that edge started as — white on most of
    these crops, the page's lilac on one — and an edge is only eaten at all if that
    colour is light. Judging a line against whatever pixel currently sits at the
    edge would let a large flat *dark* region (the AI tile's blue field) read as
    margin and get shaved off.
    """
    px = im.load()
    w, h = im.size
    left, top, right, bottom = 0, 0, w, h

    def light(c):
        return min(c[:3]) > 170

    top_ref, bottom_ref = px[w // 2, 0], px[w // 2, h - 1]
    left_ref, right_ref = px[0, h // 2], px[w - 1, h // 2]

    if light(top_ref):
        while top < bottom - 1 and _matches(px, [(x, top) for x in range(left, right)], top_ref):
            top += 1
    if light(bottom_ref):
        while bottom > top + 1 and _matches(px, [(x, bottom - 1) for x in range(left, right)], bottom_ref):
            bottom -= 1
    if light(left_ref):
        while left < right - 1 and _matches(px, [(left, y) for y in range(top, bottom)], left_ref):
            left += 1
    if light(right_ref):
        while right > left + 1 and _matches(px, [(right - 1, y) for y in range(top, bottom)], right_ref):
            right -= 1

    # A rounded corner survives the sweep above (its row is not uniform), so shave a
    # couple of pixels more once the flat margin is gone.
    pad = 3
    return im.crop(
        (
            min(left + pad, right - 1),
            min(top + pad, bottom - 1),
            max(right - pad, left + 1),
            max(bottom - pad, top + 1),
        )
    )


def center_crop(im, aspect):
    w, h = im.size
    if w / h > aspect:
        new_w = int(round(h * aspect))
        x = (w - new_w) // 2
        return im.crop((x, 0, x + new_w, h))
    new_h = int(round(w / aspect))
    y = (h - new_h) // 2
    return im.crop((0, y, w, y + new_h))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for src, dst in COVERS:
        im = Image.open(os.path.join(SRC_DIR, src)).convert("RGB")
        before = im.size
        out = center_crop(trim_border(im), ASPECT)
        out.save(os.path.join(OUT_DIR, dst))
        print(f"{src} {before} -> {dst} {out.size}")


if __name__ == "__main__":
    main()

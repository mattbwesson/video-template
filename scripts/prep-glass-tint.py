#!/usr/bin/env python3
"""
Tint a neutral glass render into the purple family in public/img/glass/.

Those icons (chat, rocket, mag) carry their wash baked into the pixels, because every CSS
way of applying one is dropped or damaged by the in-browser export: `mix-blend-mode` is not
composited, `mask-image` paints its whole box, and a CSS `filter` is not scoped to the
element that sets it — it stays on the canvas and bleeds onto whatever is drawn next
(docs/browser-render-best-practices.md). The script that baked them is not in the repo, so
this recovers the treatment from the shipped art rather than guessing at it.

Two passes, both measured off REFERENCE:

1. Luma histogram match. A neutral render can sit anywhere on the tonal scale — the arrow
   supplied for 3903 is much darker than the bubble it stands beside — so its luminance is
   first remapped onto the reference's own distribution. Without this the tint is the right
   hue at the wrong weight, which reads as a different material rather than the same one.

2. Duotone. The reference's luma -> mean RGB curve is sampled into a lookup and applied to
   the matched luminance. That curve is the whole treatment: deep violet in the shadows,
   running clean white at the speculars.

Alpha is carried through untouched, so the glass keeps its own edges.

    python3 scripts/prep-glass-tint.py public/img/hq-scale.png public/img/glass/scale.png

Requires Pillow (dev-only; not a runtime dependency of the video).
"""

import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENCE = os.path.join(ROOT, "public", "img", "glass", "chat.png")

# Below this alpha a pixel is edge feathering, not glass, and would drag the statistics.
SOLID = 80


def luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def visible(im: Image.Image):
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= SOLID:
                yield x, y, r, g, b


def cdf(im: Image.Image) -> list[float]:
    """Cumulative luminance distribution over the glass, 256 bins."""
    hist = [0] * 256
    for _, _, r, g, b in visible(im):
        hist[min(255, int(luma(r, g, b)))] += 1
    total = sum(hist) or 1
    out, run = [], 0
    for n in hist:
        run += n
        out.append(run / total)
    return out


def duotone(im: Image.Image) -> list[tuple[int, int, int]]:
    """The reference's luma -> mean RGB curve, filled across empty bins."""
    sums = [[0.0, 0.0, 0.0, 0] for _ in range(256)]
    for _, _, r, g, b in visible(im):
        s = sums[min(255, int(luma(r, g, b)))]
        s[0] += r
        s[1] += g
        s[2] += b
        s[3] += 1
    curve: list[tuple[int, int, int] | None] = [
        (round(s[0] / s[3]), round(s[1] / s[3]), round(s[2] / s[3])) if s[3] else None
        for s in sums
    ]
    # Bins the reference never occupies are interpolated from the ones it does, so the
    # lookup is total — a source tone the reference lacks still resolves to the family.
    known = [i for i, c in enumerate(curve) if c]
    for i in range(256):
        if curve[i]:
            continue
        lo = max([k for k in known if k < i], default=known[0])
        hi = min([k for k in known if k > i], default=known[-1])
        if lo == hi:
            curve[i] = curve[lo]
            continue
        t = (i - lo) / (hi - lo)
        curve[i] = tuple(  # type: ignore[assignment]
            round(curve[lo][j] + (curve[hi][j] - curve[lo][j]) * t) for j in range(3)
        )
    return curve  # type: ignore[return-value]


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: prep-glass-tint.py <source.png> <output.png>")
    src_path, out_path = sys.argv[1], sys.argv[2]

    ref = Image.open(REFERENCE).convert("RGBA")
    src = Image.open(src_path).convert("RGBA")

    ref_cdf, src_cdf, curve = cdf(ref), cdf(src), duotone(ref)

    # Histogram match: for each source tone, the reference tone at the same rank.
    match = []
    j = 0
    for i in range(256):
        while j < 255 and ref_cdf[j] < src_cdf[i]:
            j += 1
        match.append(j)

    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    sp, op = src.load(), out.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = sp[x, y]
            if a == 0:
                continue
            op[x, y] = (*curve[match[min(255, int(luma(r, g, b)))]], a)

    out.save(out_path)
    print(f"  wrote {os.path.relpath(out_path, ROOT)}  {out.size}")


if __name__ == "__main__":
    main()

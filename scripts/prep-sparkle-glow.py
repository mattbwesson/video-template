#!/usr/bin/env python3
"""
Build the sparkle that sits beside "AI Widget Builder" at global 3058-3109
(src/WorkvivoCut.tsx -> CreateYourOwnScene).

Two jobs, both of which have to happen offline rather than in CSS.

1. Reframe. The supplied art fills almost its whole canvas, where the asset it
   replaced filled 60% of a 736px frame. The scene sizes the icon with
   `objectFit: contain`, which fits the FRAME and not the art, so dropping a
   tightly-cropped file straight in renders it about half again too big. Placing
   the art at ART px inside a CANVAS px frame keeps the swap to a picture change.

2. Glow. Every CSS way of drawing one is dropped or damaged by the browser
   export: `mix-blend-mode` is not composited, `radial-gradient` does not paint
   at all, and `filter: drop-shadow` is not scoped to the element that sets it —
   it stays on the canvas and bleeds onto whatever is drawn next. Baked pixels
   are the one form that renders identically in Chromium and in the web renderer.

   The two passes are the headline's own `0 0 25px / 0 0 50px` white text-shadow
   converted into this asset's pixel space, so the mark and the words beside it
   are lit the same way. The icon draws ~315px tall from a 736px file, so a CSS
   blur radius r (sigma r/2) becomes sigma r/2 * 736/315.

Run it again whenever the source art is replaced:

    python3 scripts/prep-sparkle-glow.py

Requires Pillow (dev-only; not a runtime dependency of the video).
"""

import os
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img", "hq-sparkle-NEW.png")
OUT = os.path.join(ROOT, "public", "img", "hq_sparkle_glow.png")

# Frame and art size of the asset this replaced, kept so the swap is layout-neutral.
CANVAS = 736
ART = 444

# (sigma, peak alpha) — wide and faint first, then tight and brighter over it.
GLOW = [(46, 0.30), (24, 0.55)]

# Anything below this alpha is treated as empty when finding the art's bounds.
ART_FLOOR = 25


def main() -> None:
    src = Image.open(SRC).convert("RGBA")

    # Trim to the art itself, then scale its LONG side to ART so a non-square
    # source keeps its aspect instead of being stretched to the frame.
    bbox = src.split()[3].point(lambda a: 255 if a > ART_FLOOR else 0).getbbox()
    art = src.crop(bbox)
    w, h = art.size
    scale = ART / max(w, h)
    art = art.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    placed = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    placed.paste(art, ((CANVAS - art.size[0]) // 2, (CANVAS - art.size[1]) // 2))

    # The glow is the art's own silhouette, blurred — so it follows the shape
    # rather than the box, which is what a box-shadow would have given us.
    alpha = placed.split()[3]
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    for sigma, peak in GLOW:
        layer = Image.new("RGBA", (CANVAS, CANVAS), (255, 255, 255, 0))
        layer.putalpha(alpha.filter(ImageFilter.GaussianBlur(sigma)).point(
            lambda v, p=peak: int(v * p)
        ))
        out = Image.alpha_composite(out, layer)
    out = Image.alpha_composite(out, placed)

    out.save(OUT)
    print(f"  wrote {os.path.relpath(OUT, ROOT)}  {out.size}  art {art.size}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Bake a purple overlay into the glass icons the HQ fan uses.

Baked, not applied in CSS, for the same reason prep-glass-tint.py exists: every CSS way of
tinting an image is dropped or damaged by the in-browser export — `mix-blend-mode` is not
composited, `mask-image` paints its whole box, and a `filter` is not scoped to its element
and bleeds onto whatever is drawn next (docs/browser-render-best-practices.md). A PNG with
the colour already in its pixels renders the same everywhere.

The overlay is a translucent purple laid over the icon's RGB, weighted by luminance: full
strength in the shadows and midtones, backing off on the speculars so the glass keeps its
white highlights and still reads as glass rather than as a flat purple shape. Alpha is
carried through untouched.

    python3 scripts/prep-fan-icons.py

Writes public/img/glass/fan/*.png. Re-run after changing PURPLE or the sources.
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public", "img")
OUT = os.path.join(IMG, "glass", "fan")

# The bright end of the fan's own gradient, so the icons sit in the same family.
PURPLE = (0x7A, 0x4D, 0xFF)
# Overlay strength on black and on white. Everything between is interpolated.
K_DARK = 0.62
K_LIGHT = 0.22

SOURCES = {
    "chat": os.path.join(IMG, "glass", "chat.png"),
    "mag": os.path.join(IMG, "glass", "mag.png"),
    "rocket": os.path.join(IMG, "glass", "rocket.png"),
    "scale": os.path.join(IMG, "glass", "scale.png"),
    "sparkle": os.path.join(IMG, "hq-sparkle-NEW.png"),
}


def overlay(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
            k = K_DARK + (K_LIGHT - K_DARK) * luma
            px[x, y] = (
                round(r * (1 - k) + PURPLE[0] * k),
                round(g * (1 - k) + PURPLE[1] * k),
                round(b * (1 - k) + PURPLE[2] * k),
                a,
            )
    return im


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for name, src in SOURCES.items():
        out = os.path.join(OUT, f"{name}.png")
        overlay(Image.open(src)).save(out, optimize=True)
        print(f"  {name}: {os.path.getsize(out) // 1024} KB")


if __name__ == "__main__":
    main()

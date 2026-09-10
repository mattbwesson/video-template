#!/usr/bin/env python3
"""
Trace the text-editor glyphs out of the supplied icon sheet into a defs module.

WHY TRACE RATHER THAN CROP TO PNG
The sheet is a JPEG, so every glyph carries compression ringing and a slightly off-white
background — cropped and composited that reads as a grey haze around each icon on a dark
UI. It is also fixed-resolution, and these are drawn at 16px in the toolbar and much larger
in the gallery. Traced to paths they are clean at any size, take colour from `paint`, and
land in the same symbol registry as every other icon in this library.

WHAT IS TRACED
Nineteen labelled cells, of which eighteen carry a glyph worth having. `FORMAT` is skipped:
its cell is the word "Normal", which the toolbar sets as live text. The dropdown chevron is
skipped too — it is small enough on the sheet that the crop kept catching its neighbours,
and the zoom-ui library already carries a clean one (`#i-docs-chevron`).

Four cells hold a glyph AND text — the align icons carry a chevron, COLOR PICKER is "Aa"
with one, TRANSLATION is a mark plus the word "English". Those are cropped to the glyph
before tracing, which is what ICONS below records.

HOW
potrace, via the pure-Python `potracer`, on a bilevel of each crop. potrace fits Béziers,
where a contour-follower would return polygon soup and show as faceting on the round
glyphs — the emoji face, the undo arrow. The result is a FILLED outline of what were
strokes, which paints identically and scales the same.

    .venv-trace/bin/python scripts/prep-editor-icons.py

Writes src/components/workvivo/WorkvivoEditorIcons.tsx.
"""

import os

import numpy as np
import potrace
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img", "Gemini_Generated_Image_eive1geive1geive.jpeg")
OUT = os.path.join(ROOT, "src", "components", "workvivo", "WorkvivoEditorIcons.tsx")

# The sheet's grid, measured off the panel.
ROWS = [(320, 534), (536, 748), (752, 964), (968, 1180)]
COLS = [(784, 1082), (1090, 1386), (1394, 1692), (1702, 2000)]
ROW5_Y = (1204, 1430)
ROW5_X = [(784, 1186), (1194, 1590), (1598, 2002)]

# name, (row, col), and the fraction of the cell to keep — (x0, x1, y0, y1).
# The default keeps the top 62%, which is the glyph above its label.
FULL = (0.0, 1.0, 0.06, 0.62)
LEFT = (0.10, 0.62, 0.06, 0.62)      # glyph only, chevron cropped off
ICONS = [
    ("undo", 0, 0, FULL), ("redo", 0, 1, FULL), ("bold", 0, 3, FULL),
    ("italic", 1, 0, FULL), ("strikethrough", 1, 1, FULL), ("code", 1, 2, FULL),
    ("text-size", 1, 3, LEFT),
    ("align-left", 2, 0, LEFT), ("align-center", 2, 1, LEFT), ("align-right", 2, 2, LEFT),
    ("plus", 2, 3, FULL),
    ("link", 3, 0, FULL), ("emoji", 3, 1, FULL),
    ("translate", 3, 2, (0.06, 0.295, 0.06, 0.62)),
    ("mobile-view", 3, 3, FULL),
    ("add-page-icon", 4, 0, (0.0, 1.0, 0.06, 0.60)),
    ("add-cover-image", 4, 1, (0.0, 1.0, 0.06, 0.60)),
    ("full-width", 4, 2, (0.0, 1.0, 0.06, 0.60)),
]

VB = 24.0          # the viewBox every glyph is normalised into
PAD = 1.6          # padding inside it


def cell(row: int, col: int) -> tuple:
    if row == 4:
        x0, x1 = ROW5_X[col]
        return x0, ROW5_Y[0], x1, ROW5_Y[1]
    x0, x1 = COLS[col]
    y0, y1 = ROWS[row]
    return x0, y0, x1, y1


def trace(img: Image.Image) -> tuple:
    """Bilevel -> a path string normalised into the shared viewBox."""
    # 3x, so potrace has enough pixels to fit smooth curves through a 16px-ish glyph.
    img = img.convert("L").resize((img.width * 3, img.height * 3), Image.LANCZOS)
    a = np.array(img).astype(np.float32)
    # The sheet's ink is dark grey on near-white; the midpoint of the two is a safe cut.
    ink = a < (a.min() + a.max()) / 2
    if ink.sum() < 40:
        raise SystemExit("  empty crop")

    # INVERTED on purpose. potrace.Bitmap treats values BELOW blacklevel (0.5) as ink, so a
    # boolean mask where True means "this is a stroke" hands it the exact opposite: the
    # glyph reads as white and the cell background as black, and every icon traces as a
    # filled rectangle with the glyph knocked out of it. Passing ~ink puts the strokes below
    # the threshold. It also drops the whole-bitmap outer contour that came with the
    # inverted form.
    path = potrace.Bitmap(~ink).trace(turdsize=6, alphamax=1.0, opttolerance=0.2)

    # Normalise to what was actually TRACED, not to the mask.
    #
    # These two are not the same set of pixels and assuming they were is a real bug: the
    # crop keeps a sliver of the cell's rounded border, which is dark enough to land in the
    # mask but small enough that `turdsize` correctly drops it from the trace. Sizing
    # against the mask therefore scaled every glyph to a box containing specks nobody drew —
    # the plus came out filling 8.7 of its 24 units instead of 20.8, i.e. a third of the
    # size, and on a 86px button that was a 30px cross.
    pts = []
    for curve in path:
        pts.append((curve.start_point.x, curve.start_point.y))
        for seg in curve:
            if seg.is_corner:
                pts.append((seg.c.x, seg.c.y))
            else:
                pts.append((seg.c1.x, seg.c1.y))
                pts.append((seg.c2.x, seg.c2.y))
            pts.append((seg.end_point.x, seg.end_point.y))
    if not pts:
        raise SystemExit("  nothing traced")
    xsv = [q[0] for q in pts]
    ysv = [q[1] for q in pts]
    x0, x1, y0, y1 = min(xsv), max(xsv), min(ysv), max(ysv)
    span = max(x1 - x0, y1 - y0) or 1
    k = (VB - 2 * PAD) / span
    ox = PAD + ((VB - 2 * PAD) - (x1 - x0) * k) / 2
    oy = PAD + ((VB - 2 * PAD) - (y1 - y0) * k) / 2
    f = lambda p: (round((p.x - x0) * k + ox, 2), round((p.y - y0) * k + oy, 2))

    out = []
    for curve in path:
        sx, sy = f(curve.start_point)
        out.append(f"M{sx} {sy}")
        for seg in curve:
            if seg.is_corner:
                cx, cy = f(seg.c)
                ex, ey = f(seg.end_point)
                out.append(f"L{cx} {cy}L{ex} {ey}")
            else:
                a1 = f(seg.c1)
                a2 = f(seg.c2)
                e = f(seg.end_point)
                out.append(f"C{a1[0]} {a1[1]} {a2[0]} {a2[1]} {e[0]} {e[1]}")
        out.append("Z")
    return "".join(out), int(ink.sum())


def main() -> None:
    sheet = Image.open(SRC)
    symbols = []
    for name, row, col, frac in ICONS:
        cx0, cy0, cx1, cy1 = cell(row, col)
        w, h = cx1 - cx0, cy1 - cy0
        box = (
            int(cx0 + frac[0] * w), int(cy0 + frac[2] * h),
            int(cx0 + frac[1] * w), int(cy0 + frac[3] * h),
        )
        d, px = trace(sheet.crop(box))
        symbols.append((name, d))
        print(f"    i-edit-{name:<16} {px:>6} ink px -> {len(d):>5} chars of path")

    parts = "".join(
        f'<symbol id="i-edit-{n}" viewBox="0 0 24 24"><path d="{d}" fill="currentColor" /></symbol>'
        for n, d in symbols
    )
    src = f'''import {{ registerSymbolMarkup }} from "./symbolRegistry";

/**
 * Text-editor glyphs, traced from the supplied icon sheet.
 *
 * GENERATED — do not edit. Run `.venv-trace/bin/python scripts/prep-editor-icons.py` after
 * changing public/img/Gemini_Generated_Image_eive1geive1geive.jpeg.
 *
 * Traced rather than cropped: the sheet is a JPEG, so a crop carries compression ringing
 * and an off-white background that reads as a grey haze on a dark UI, and it is
 * fixed-resolution where these are drawn at 16px in the toolbar and much larger in the
 * gallery. potrace fits Béziers, so the round glyphs stay round at any size.
 *
 * Every path is a FILLED outline of what was a stroke — which paints identically — and
 * carries `fill="currentColor"`, so `SymbolSvg`'s `paint` recolours it without relying on
 * inheritance the exporter may not resolve.
 *
 * All are normalised into a 24x24 box with 1.6 of padding, so they line up with each other
 * at a common render size regardless of how big they were drawn on the sheet.
 */

const defs = `{parts}`;

registerSymbolMarkup(defs);

/** The ids this module registers. */
export const EDITOR_ICON_IDS = [
{chr(10).join(f'  "#i-edit-{n}",' for n, _ in symbols)}
] as const;
'''
    open(OUT, "w", encoding="utf8").write(src)
    print(f"  {len(symbols)} glyphs -> {os.path.relpath(OUT, ROOT)} ({len(src) // 1024} KB)")


if __name__ == "__main__":
    main()

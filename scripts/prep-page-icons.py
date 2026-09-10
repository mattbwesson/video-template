#!/usr/bin/env python3
"""
Turn public/img/page-icons/*.svg into a registered defs module for the icon library.

WHY A GENERATED MODULE AND NOT <img src={staticFile(...)}>
An SVG loaded through an <img> comes out garbled in this project's export, and a <use>
pointing into another <svg> root resolves to nothing — both are written up in
docs/browser-render-best-practices.md and in symbolRegistry.tsx's header. Everything in
this library is inlined into its consuming <svg> instead, and these join it the same way.

WHY EVERY PATH GETS AN EXPLICIT fill
The supplied files carry no fill at all, so they would paint black and rely on inheriting
a colour from an ancestor. Inheritance is the one thing the rasterizer cannot be relied on
to resolve, which is why SymbolSvg has a `paint` prop that substitutes a literal into the
markup. That substitution needs something to substitute, so `fill="currentColor"` is baked
onto each shape here and the call site passes `paint`.

VIEWBOXES ARE LEFT ALONE
The ten are drawn on ten different artboards — 84.44x81.51, 78.13x69.45, 84.47x76.47 and
so on — so they are NOT square and must not be forced into a square viewBox. Rendered into
a square box the default preserveAspectRatio letterboxes them, which keeps each glyph's
own proportions and puts them on a common width.

    python3 scripts/prep-page-icons.py

Writes src/components/workvivo/WorkvivoFormIcons.tsx.
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img", "page-icons")
OUT = os.path.join(ROOT, "src", "components", "workvivo", "WorkvivoFormIcons.tsx")

# File stem -> symbol id. Spelled out rather than derived, because one of the files is
# named `contage-field` and the question type is "Contact Field"; deriving the id would
# have carried the typo into every call site.
NAMES = {
    "short-text": "short-text",
    "paragraph": "paragraph",
    "multiple-choice": "multiple-choice",
    "checkbox": "checkbox",
    "number-line": "number-line",
    "eNPS": "enps",
    "file-upload": "file-upload",
    "date-time": "date-time",
    "dropdown": "dropdown",
    "contage-field": "contact-field",
}

SHAPES = ("path", "rect", "circle", "ellipse", "polygon", "polyline")


def body(markup: str) -> str:
    """The <svg>'s children, with an explicit fill on every shape."""
    inner = re.sub(r"^.*?<svg\b[^>]*>", "", markup, flags=re.S)
    inner = re.sub(r"</svg>\s*$", "", inner, flags=re.S)
    inner = re.sub(r"<(defs|style)\b.*?</\1>", "", inner, flags=re.S)   # the files carry none, but be safe
    inner = re.sub(r"\s+", " ", inner).strip()

    def add_fill(m: re.Match) -> str:
        """Re-emit a shape with an explicit fill, ALWAYS self-closed.

        Every element in SHAPES is empty, so this is always correct — and getting it wrong
        is not obvious. Emitting `<path …>` instead of `<path … />` makes each shape the
        PARENT of the next rather than its sibling, and a browser renders only the
        outermost. On screen that read as every icon having lost its inner detail: a
        circle with no dot, a box with no tick, an arrow with no "123". It looks like a
        styling problem and it is a nesting one.
        """
        tag, attrs = m.group(1), m.group(2).rstrip().rstrip("/").rstrip()
        if "fill=" in attrs:
            return f"<{tag}{attrs} />"
        return f"<{tag}{attrs} fill=\"currentColor\" />"

    return re.sub(r"<(" + "|".join(SHAPES) + r")\b([^>]*?)/?>", add_fill, inner)


def main() -> None:
    symbols = []
    for stem, name in NAMES.items():
        path = os.path.join(SRC, stem + ".svg")
        raw = open(path, encoding="utf8").read()
        vb = re.search(r'viewBox="([^"]+)"', raw)
        if not vb:
            raise SystemExit(f"  {stem}.svg has no viewBox")
        symbols.append((name, vb.group(1), body(raw)))

    parts = "".join(
        f'<symbol id="i-form-{n}" viewBox="{v}">{b}</symbol>' for n, v, b in symbols
    )
    src = f'''import {{ registerSymbolMarkup }} from "./symbolRegistry";

/**
 * Question-type glyphs for the Surveys & Forms builder.
 *
 * GENERATED — do not edit. Run `python3 scripts/prep-page-icons.py` after changing
 * anything in public/img/page-icons/, which is the source of truth for these.
 *
 * They register into the shared symbol registry at module scope, exactly as
 * WorkvivoIcons.tsx does, so `<Icon href="#i-form-checkbox" />` works anywhere in the
 * project once this module is imported.
 *
 * Each keeps its own viewBox — the ten are drawn on ten different artboards and are not
 * square — so a square render box letterboxes them rather than distorting them. Each
 * shape carries `fill="currentColor"` so the call site can pass `paint` and never depend
 * on colour inheritance, which the exporter does not reliably resolve.
 */

const defs = `{parts}`;

registerSymbolMarkup(defs);

/** The ids this module registers, in the palette's order. */
export const FORM_ICON_IDS = [
{chr(10).join(f'  "#i-form-{n}",' for n, _, _ in symbols)}
] as const;
'''
    open(OUT, "w", encoding="utf8").write(src)
    print(f"  {len(symbols)} symbols -> {os.path.relpath(OUT, ROOT)} ({len(src) // 1024} KB)")
    for n, v, b in symbols:
        print(f"    i-form-{n:<16} viewBox {v:<22} {len(b):>5} chars")


if __name__ == "__main__":
    main()

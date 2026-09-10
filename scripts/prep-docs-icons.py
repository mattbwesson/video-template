#!/usr/bin/env python3
"""
Lift the Zoom Docs toolbar glyphs out of the zoom-ui skill's library into this project.

WHY COPY THEM IN RATHER THAN REACH FOR THEM AT RENDER TIME
The library lives in ~/.claude/skills/zoom-ui, which is a tool on one machine and not a
dependency of this repo. A render in CI or in the container has no access to it. So the
glyphs this film actually uses are copied into a generated defs module and committed, the
same way the survey builder's are.

They are real Zoom art, captured from live surfaces — not redrawn. Anything the library
does not have is NOT invented here; see PAGE_BLOCK_GAPS in WorkvivoPageEditor.tsx for the
ones it lacks and what is drawn in their place.

    python3 scripts/prep-docs-icons.py

Writes src/components/workvivo/WorkvivoDocsIcons.tsx.
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.expanduser("~/.claude/skills/zoom-ui/assets/icons.json")
OUT = os.path.join(ROOT, "src", "components", "workvivo", "WorkvivoDocsIcons.tsx")

# Library id -> the id this project uses. Only what the page editor's toolbar needs.
WANTED = {
    "ui.undo": "undo",
    "ui.redo": "redo",
    "ui.turn-into-text-formatting": "paragraph-style",
    "ui.bold": "bold",
    "ui.italicize": "italic",
    "ui.strikethrough": "strikethrough",
    "ui.mark-as-code": "code",
    "ui.text-color": "text-size",
    "ui.turn-into-list": "align",
    "ui.insert": "insert",
    "ui.link": "link",
    "ui.emoji-smiley": "emoji",
    "ui.instant-translate": "translate",
    "ui.translate-full-page": "translate-page",
    "ui.polished-view": "mobile-view",
    "ui.page-width-default": "page-width",
    "ui.dropdown-arrow-8": "chevron",
    # A plain stroked plus. ui.add-page is the Docs header glyph — a PAGE with a plus on
    # it — and rendered at 86px in the button it read as a black blob, not the thin grey
    # cross the reference draws.
    "ui.plus-24": "plus",
}


def main() -> None:
    if not os.path.exists(LIB):
        raise SystemExit(f"  zoom-ui library not found at {LIB}")
    icons = {i["id"]: i for i in json.load(open(LIB, encoding="utf8"))["icons"]}

    missing = [k for k in WANTED if k not in icons]
    if missing:
        raise SystemExit("  not in the library: " + ", ".join(missing))

    symbols = []
    for lib_id, name in WANTED.items():
        ic = icons[lib_id]
        if ic.get("format") != "svg":
            print(f"  skipping {lib_id}: format {ic.get('format')}")
            continue
        svg = ic["svg"]
        inner = re.sub(r"^.*?<svg\b[^>]*>", "", svg, flags=re.S)
        inner = re.sub(r"</svg>\s*$", "", inner, flags=re.S)
        inner = re.sub(r"\s+", " ", inner).strip()
        symbols.append((name, ic["viewBox"], inner, ic["name"]))

    parts = "".join(f'<symbol id="i-docs-{n}" viewBox="{v}">{b}</symbol>' for n, v, b, _ in symbols)
    listing = "\n".join(f" *   i-docs-{n:<16} {orig}" for n, _, _, orig in symbols)
    src = f'''import {{ registerSymbolMarkup }} from "./symbolRegistry";

/**
 * Zoom Docs toolbar glyphs, from the zoom-ui skill's library.
 *
 * GENERATED — do not edit. Run `python3 scripts/prep-docs-icons.py`.
 *
 * These are Zoom's own art, captured from live surfaces, not redrawn. They are copied into
 * this repo rather than read from the skill at render time because the skill is a tool on
 * one machine and a render in the container has no access to it.
 *
 * They register into the shared symbol registry at module scope, so
 * `<SymbolSvg href="#i-docs-bold" />` works anywhere once this module is imported. Most
 * carry `fill="currentColor"` already, so `paint` recolours them.
 *
{listing}
 */

const defs = `{parts}`;

registerSymbolMarkup(defs);
'''
    open(OUT, "w", encoding="utf8").write(src)
    print(f"  {len(symbols)} glyphs -> {os.path.relpath(OUT, ROOT)} ({len(src) // 1024} KB)")


if __name__ == "__main__":
    main()

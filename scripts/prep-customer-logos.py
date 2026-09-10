"""
Cut the customer logo wall's tiles out of docs/reference/Conclusion Logos.png.

    python3 scripts/prep-customer-logos.py

The reference is the wall rendered at 7680x4320 — four times the frame — with a
transparent background: 13 columns by 7 rows on a 608px pitch, the Workvivo tile in the
middle. Each tile's artwork is found by its alpha inside a pitch-sized window around the
cell's centre and written to public/img/customer-logos/<name>.png as RGBA, at the
reference's own resolution. The names are the ones CUSTOMER_GRID_ROWS in
src/components/workvivo/WorkvivoCustomerLogos.tsx already uses, so an existing tile is
simply replaced by its sharper self; the fourteen edge cells and three others that were
drawn placeholders get new files and are wired in that table.

The two edge columns are cut by the image's own edge. That is the side the film never
shows: at the wall's widest the outer cards overhang the frame by 106px of their 146,
so what survives of each is what is on screen. The centre cell is skipped — the film
draws it from an SVG.

Cell centres are fitted from the artwork's own column and row projections rather than
typed, so the script does not depend on the pitch being exactly 608.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/reference/Conclusion Logos.png"
OUT = ROOT / "public/img/customer-logos"

COLS, ROWS = 13, 7
MARGIN = 6  # px of clear space kept around the artwork

# Row-major, one name per cell; None is the centre tile the film draws itself.
NAMES: list[list[str | None]] = [
    ["graincorp", "trajan", "visy", "huboo", "uta", "virgin", "zailab", "james-whelan",
     "kindred", "port-of-tauranga", "airasia", "gxo", "frauscher"],
    ["nordell", "inghams", "irish-rail", "bus-eireann", "virgin-australia",
     "fujifilm-biosciences", "exos", "uniphar", "amazon", "jamul-casino", "scoot",
     "melbourne-airport", "evri"],
    ["osterman", "ajinomoto", "walden", "air-india", "walmart", "wider-circle",
     "appalachian-regional-healthcare", "spring-health", "white-castle", "delta", "flexjet",
     "skycity", "grilld"],
    ["bimeda-alt", "melbourne-airport-alt", "changi-airport-group", "ryanair", "valor",
     "nhs-royal-berkshire", None, "bupa", "london-ambulance-service", "amc-theatres",
     "unidentified-fish-mark", "rsl-australia", "adelaide"],
    ["tao-group-hospitality", "sentientjet", "airnav-ireland", "wizz-air", "volvo",
     "empirx-health", "greater-good-health", "pms-presbyterian-medical-services", "pettitts",
     "endeavour-group", "insomnia-coffee", "gordon-food-service", "emaar"],
    ["lixil", "san-diego-international-airport", "aerocloud", "hickorys-smokehouse",
     "am-fresh-group", "aib", "bimeda", "harris-farm-markets", "woodies", "kmart",
     "koko-black", "winc", "topgolf"],
    ["airlite-plastics", "corporate-wings", "aer-lingus", "madison-square-garden",
     "salt-and-straw", "gsk", "scope", "iceland", "rue-gilt-groupe", "bishs-rv", "maxi-zoo",
     "thirty-one", "sports-endeavors"],
]


def segments(profile: np.ndarray, min_len: int) -> list[tuple[int, int]]:
    """Runs of non-zero in a 1-D profile, at least min_len long."""
    on = profile > 0
    out: list[tuple[int, int]] = []
    start = None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    if start is not None and len(on) - start >= min_len:
        out.append((start, len(on)))
    return out


def merge(segs: list[tuple[int, int]], gap: int) -> list[tuple[int, int]]:
    """Join runs closer than `gap` — a tile whose artwork has a hairline of clear space."""
    out: list[tuple[int, int]] = []
    for s, e in segs:
        if out and s - out[-1][1] < gap:
            out[-1] = (out[-1][0], e)
        else:
            out.append((s, e))
    return out


def fit_centres(segs: list[tuple[int, int]], n: int, length: int) -> list[float]:
    """Centres of n equally spaced cells, fitted to the interior runs (the two edge cells
    are clipped by the image and their runs are not centred on the cell)."""
    centres = [(s + e) / 2 for s, e in segs]
    if len(centres) != n:
        sys.exit(f"expected {n} runs, found {len(centres)}: {segs}")
    interior = np.array(centres[1:-1])
    idx = np.arange(1, n - 1)
    pitch, offset = np.polyfit(idx, interior, 1)
    fitted = [offset + pitch * k for k in range(n)]
    if fitted[0] < -pitch / 2 or fitted[-1] > length + pitch / 2:
        sys.exit("fitted grid falls outside the image")
    return fitted


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    a = np.asarray(im)
    alpha = a[..., 3]
    ink = alpha > 16

    col_runs = merge(segments(ink.sum(axis=0), 20), 60)
    row_runs = merge(segments(ink.sum(axis=1), 20), 60)
    cx = fit_centres(col_runs, COLS, im.width)
    cy = fit_centres(row_runs, ROWS, im.height)
    # Each axis keeps its own pitch: a reference with tighter rows than columns would
    # otherwise get a window narrower than a column and cut wide artwork mid-glyph.
    half_x, half_y = int((cx[1] - cx[0]) / 2), int((cy[1] - cy[0]) / 2)
    print(f"grid: pitch {2 * half_x}x{2 * half_y}px, columns from {cx[0]:.0f} to {cx[-1]:.0f}, rows from {cy[0]:.0f} to {cy[-1]:.0f}")

    OUT.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    for r, row in enumerate(NAMES):
        for c, name in enumerate(row):
            if name is None:
                continue
            x0, x1 = max(0, int(cx[c]) - half_x), min(im.width, int(cx[c]) + half_x)
            y0, y1 = max(0, int(cy[r]) - half_y), min(im.height, int(cy[r]) + half_y)
            window = ink[y0:y1, x0:x1]
            ys, xs = np.nonzero(window)
            if len(xs) == 0:
                sys.exit(f"no artwork in cell row {r} col {c} ({name})")
            # Artwork that reaches the window's own edge is running into the next cell —
            # a mis-fitted grid — and is an error, unlike the image edge, which is expected.
            at_window = (xs.min() == 0 and x0 > 0) or (xs.max() == window.shape[1] - 1 and x1 < im.width) \
                or (ys.min() == 0 and y0 > 0) or (ys.max() == window.shape[0] - 1 and y1 < im.height)
            if at_window:
                sys.exit(f"artwork in row {r} col {c} ({name}) touches the cell window; the grid fit is off")
            bx0, bx1 = x0 + xs.min() - MARGIN, x0 + xs.max() + 1 + MARGIN
            by0, by1 = y0 + ys.min() - MARGIN, y0 + ys.max() + 1 + MARGIN
            bx0, by0 = max(0, bx0), max(0, by0)
            bx1, by1 = min(im.width, bx1), min(im.height, by1)
            tile = im.crop((bx0, by0, bx1, by1))
            clipped = " (clipped by the image edge)" if bx0 == 0 or bx1 == im.width else ""
            tile.save(OUT / f"{name}.png", optimize=True)
            print(f"  {name}.png  {tile.width}x{tile.height}{clipped}")
            written.append(name)
    print(f"{len(written)} tiles written to {OUT.relative_to(ROOT)}")
    reconcile(set(written))


TABLE = ROOT / "src/components/workvivo/WorkvivoCustomerLogos.tsx"


def reconcile(written: set[str]) -> None:
    """The table and this script name the same 90 files in two languages. Remotion's <Img>
    cancels the whole render on a file that is not there, so a stem present on one side
    and not the other is an error here, where it is cheap, rather than at frame 4983."""
    referenced = set(re.findall(r"img/customer-logos/([a-z0-9-]+)\.png", TABLE.read_text()))
    on_disk = {p.stem for p in OUT.glob("*.png")}
    problems = []
    if referenced - written:
        problems.append(f"table names tiles this script does not write: {sorted(referenced - written)}")
    if written - referenced:
        problems.append(f"tiles written that the table never shows: {sorted(written - referenced)}")
    if on_disk - written:
        problems.append(f"stale files in {OUT.relative_to(ROOT)} from an earlier run: {sorted(on_disk - written)}")
    if problems:
        sys.exit("\n".join(problems))
    print(f"table {TABLE.relative_to(ROOT)} and {OUT.relative_to(ROOT)} agree on all {len(written)} tiles")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Build the embedded Noto Sans JP subset for the Japanese cut.

WHY EMBED RATHER THAN FETCH
The first version of the Japanese composition called `@remotion/google-fonts`' `loadFont`,
which fetches from fonts.gstatic.com at render time. Google serves CJK families split across
~120 unicode-range chunks per weight, so that was ~480 requests per render, and on a network
with a TLS-intercepting proxy every render died with a bare `NetworkError`.

It also took the ENGLISH cut down with it. `loadFont` ran at module scope and `Root.tsx`
imports `Japanese.tsx`, so the font fetch happened for every composition in the bundle — a
Japanese-only feature could break L2VirginAirline, which is exactly what the whole
composition was built not to do.

So the font is embedded, the same way WorkvivoStyles.css embeds four 23 KB InterX subsets.
No network at render time, and nothing to go wrong on someone else's machine.

WHY IT IS SMALL ENOUGH TO EMBED
A full Noto Sans JP weight is 5.1 MB, which is not embeddable. But the cut's script is
fixed — it is a video, not an app — so the subset only needs the ~655 characters that
actually appear in japaneseCopy.ts. That is 104 KB a weight.

    python3 scripts/prep-japanese-font.py

Re-run it after adding characters to the translation. A character that is not in the subset
renders as tofu, so the check at the bottom fails the build rather than letting one through.
"""

import base64
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COPY = os.path.join(ROOT, "src", "japanese", "japaneseCopy.ts")
OUT = os.path.join(ROOT, "src", "japanese", "JapaneseFont.css")

# The weights the shared stylesheets actually ask for: 600 (141 declarations), 500 (124),
# 700 (53), 400 (47). Loading a weight that is not here means a synthesised bold, and
# synthesised CJK is visibly wrong in a way synthesised Latin often is not.
WEIGHTS = ["400", "500", "600", "700"]

# Latin, the punctuation Japanese mixes in, and full-width forms. The CJK comes from the
# copy itself.
EXTRA = "U+0020-007E,U+00B7,U+2018-201D,U+2026,U+3000-303F,U+FF01-FF60"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def characters() -> str:
    """Every character the Japanese copy uses, read from the source of truth."""
    src = open(COPY, encoding="utf8").read()
    # String literals only — not the identifiers or the English prose in the comments.
    lits = re.findall(r'"((?:[^"\\]|\\.)*)"', src)
    return "".join(sorted(set("".join(lits))))


def fetch(weight: str, dest: str) -> None:
    css_url = (
        "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@"
        + weight
        + "&display=block"
    )
    req = urllib.request.Request(css_url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=60).read().decode("utf8")
    url = re.search(r"https://fonts\.gstatic\.com[^)]+", css)
    if not url:
        sys.exit(f"  could not find a font URL for weight {weight}")
    urllib.request.urlretrieve(url.group(0), dest)


def main() -> None:
    chars = characters()
    txt = "/tmp/jp-subset-chars.txt"
    open(txt, "w", encoding="utf8").write(chars)
    print(f"  {len(chars)} unique characters in japaneseCopy.ts")

    faces = []
    for w in WEIGHTS:
        src, woff = f"/tmp/noto-{w}.ttf", f"/tmp/noto-{w}.woff2"
        if not os.path.exists(src):
            fetch(w, src)
        subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset", src,
                f"--text-file={txt}", f"--unicodes={EXTRA}",
                "--layout-features=kern,liga,vert,vrt2,palt",
                "--flavor=woff2", f"--output-file={woff}",
            ],
            check=True,
        )
        b64 = base64.b64encode(open(woff, "rb").read()).decode("ascii")
        kb = len(b64) * 3 // 4 // 1024
        print(f"  w{w}: {os.path.getsize(src) // 1024 // 1024}MB -> {kb}KB")
        faces.append(
            "@font-face{font-family:NotoSansJPX;font-style:normal;font-display:block;"
            f"font-weight:{w};src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
        )

    header = (
        "/* Noto Sans JP, subset to the characters japaneseCopy.ts actually uses.\n"
        "   GENERATED — do not edit. Run scripts/prep-japanese-font.py after changing the\n"
        "   translation, or new characters render as tofu.\n\n"
        "   Embedded rather than fetched because loading it over the network cost ~480\n"
        "   requests per render and failed outright behind a TLS-intercepting proxy — taking\n"
        "   the English cut down with it, since Root.tsx imports the Japanese module. */\n"
    )
    open(OUT, "w", encoding="utf8").write(header + "\n".join(faces) + "\n")
    print(f"  wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == "__main__":
    main()

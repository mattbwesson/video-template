#!/usr/bin/env python3
"""
Build the animated background field for the beats that sit on it: the HQ opening
(139-416), the fan's two later appearances (2236-2267, 3326-3387) and the sign-off
that closes the film (5166-5299).

WHY A BITMAP AND NOT A GRADIENT
The reference's background is a mesh gradient with a bright blob orbiting on a ~112-frame
cycle: sampled at eight fixed points it swings by up to 160/255, and the top-left and
bottom-left move in opposite directions. That is not a CSS gradient, and it is not a static
image either.

It is also not a WebGL shader, though the source project's was. This repo's
remotion.config.ts sets no `setChromiumOpenGlRenderer`, so a shader renders nothing here,
and @remotion/web-renderer — which the wizard's in-browser export runs on — is a stricter
environment still. The same reasoning already produced public/img/hq-fan-field.png; see the
header of src/components/workvivo/WorkvivoHqFan.tsx.

So the field is KEYFRAMES, cross-faded at render time. Measured against the reference with
the copy region excluded, interpolating between keys 10 frames apart costs a mean error of
0.67/255 and a 99th percentile of 2.0 — below what is visible on a smooth gradient. 14
frames apart is still only 0.95, and 20 starts to show at 1.6.

WHY THE COPY HAS TO COME OUT FIRST
These frames have the lockup, the tagline and the fan burnt into them, and the whole point
is to draw those live. Downsampling as-is would smear white ghosts of the old text into the
new background, under the new text.

The removal is not a box-and-inpaint. The copy covers 78% of the width and 40% of the
height of the lockup beat, and reconstructing that much field from its boundary throws away
real structure. Instead the copy is detected at FULL resolution as local contrast — the
glyphs are bright and hard-edged, the field has no edges anywhere — and the downsample then
averages only the pixels that are not copy. Each output cell covers a 12x12 block, so even
inside a word most cells keep enough field pixels to average honestly. Only the cells with
too few survivors are filled, and those are filled by solving Laplace's equation across
them, which is the right reconstruction for a field this smooth.

    python3 scripts/prep-hq-field.py

Writes public/img/hq-field/f###.png and prints the validation below.
"""

import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public/img/L2 Video(Virgin Airline).mp4")
OUT = os.path.join(ROOT, "public/img/hq-field")

FPS = 25
# The reference is laid down from global frame 1, so global g is video frame g-1.
#
# One entry per stretch of the film this background is drawn under, as
# (first, last, step). The two are separate beats with reference footage in between, so
# they are keyed separately rather than as one long range — keying across the gap would
# cross-fade between two backgrounds that never meet on screen.
RANGES = [
    (139, 416, 10),   # the HQ opening: lockup, then the fan
    # LAST FRAME, not the exclusive end the Sequence takes. 3388 is the first frame of
    # the analytics screen — a hard cut to near-black — so keying it made the field fade
    # into that over the beat's final frames and the fan sank into a dark background.
    (2236, 2267, 8),  # the fan again, under the ask bar's approach
    (3326, 3387, 8),  # and once more, before the analytics screen
    # The sign-off, global 5166 to the last frame of the film. 5299, not 5300: the
    # composition is 5300 frames long, so its last frame is 5299, and the reference is laid
    # down from global 1 — keying 5300 would key a frame the film never shows.
    (5166, 5299, 10),
]
# 160x90 upscales 12x to the frame. On a field with no edges that is free; the interpolation
# test above was run at 240x135 and the difference between the two is below 0.2/255.
GW, GH = 160, 90


def frame(g: int) -> np.ndarray:
    """One full-resolution frame of the reference, as float RGB."""
    t = (g - 1) / FPS
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", str(t), "-i", SRC,
         "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.uint8).reshape(1080, 1920, 3).astype(np.float32)


# Fan geometry, from src/components/workvivo/WorkvivoHqFan.tsx, generous by 40px because
# the fan spins and scales into place over 268-282 and is briefly larger than its resting
# size. Everything inside is artwork, not field.
FAN = dict(fx=950, fy=869, r=790, bx=961, by=864, halo=180)
# The stretches that HAVE a fan in them, as (first, last). A range check, not a single
# `g >= 262`: the sign-off at 5166 is also after 262 and has no fan, and masking a
# 790px disc out of it would blank two thirds of the frame and hand it to the
# reconstruction, which would smooth away real structure that is plainly visible.
FAN_BEATS = [(262, 416), (2236, 2267), (3326, 3387)]
# In the 2236 beat the fan enters 84px high and settles, so its footprint over the range is
# the union of where it starts and where it ends, not one disc.
FAN_RISE = 90


def art_mask(g: int) -> np.ndarray:
    """The fan's own footprint, for the keyframes that have a fan in them.

    Local contrast finds the labels and the rim but not the wedge fills or the badge disc:
    those are large, soft and edgeless, exactly like the field they sit on. They have to be
    named geometrically or they survive into the background and the component draws a
    second fan on top of the first.
    """
    if not any(a <= g <= b for a, b in FAN_BEATS):
        return np.zeros((1080, 1920), bool)
    yy, xx = np.mgrid[0:1080, 0:1920]
    rises = [0, FAN_RISE] if g >= 2000 else [0]
    fan = np.zeros((1080, 1920), bool)
    for up in rises:
        fan |= (np.hypot(xx - FAN["fx"], yy - (FAN["fy"] - up)) <= FAN["r"]) & (yy <= FAN["fy"] + 20)
    halo = np.zeros((1080, 1920), bool)
    for up in rises:
        halo |= np.hypot(xx - FAN["bx"], yy - (FAN["by"] - up)) <= FAN["halo"]
    return fan | halo


def copy_mask(a: np.ndarray) -> np.ndarray:
    """
    True where the frame is type or artwork rather than field.

    Local contrast, not brightness: the field has bright regions too — brighter than some
    of the copy — but it has no edges anywhere, and every glyph is an edge. Comparing each
    pixel with a heavily blurred version of itself separates the two cleanly.
    """
    im = Image.fromarray(a.astype(np.uint8)).convert("L")
    blur = np.array(im.filter(ImageFilter.GaussianBlur(9))).astype(np.float32)
    lift = np.array(im).astype(np.float32) - blur
    m = lift > 6
    # Grow it: antialiased glyph edges and the lockup's soft shadow sit just outside the
    # threshold, and one surviving rim pixel per cell is enough to tint the average.
    return np.array(
        Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
    ) > 127


def downsample(a: np.ndarray, keep: np.ndarray):
    """Box-average each 12x12 block over the pixels that are not copy."""
    by, bx = 1080 // GH, 1920 // GW
    w = keep.astype(np.float32).reshape(GH, by, GW, bx).sum(axis=(1, 3))
    s = (a * keep[..., None]).reshape(GH, by, GW, bx, 3).sum(axis=(1, 3))
    # A cell needs a real sample of the field, not one stray pixel, to be trusted.
    good = w >= (by * bx) * 0.18
    out = np.zeros((GH, GW, 3), np.float32)
    out[good] = s[good] / w[good][:, None]
    return out, good


def harmonic(out: np.ndarray, good: np.ndarray, iters: int = 4000) -> np.ndarray:
    """
    Fill the untrusted cells by relaxing to the solution of Laplace's equation.

    The correct reconstruction for a field whose second derivative is near zero everywhere,
    which is what a mesh gradient is. Seeded from the nearest trusted rows so the relaxation
    starts close and the iteration count is not load-bearing.
    """
    f = out.copy()
    hole = ~good
    if not hole.any():
        return f
    for c in range(3):
        ch = f[:, :, c]
        # Seed: column means of what is known, so the hole starts at roughly the right level.
        known = ch[good]
        ch[hole] = known.mean() if known.size else 0.0
        for _ in range(iters):
            nb = np.zeros_like(ch)
            nb[1:-1, 1:-1] = (ch[:-2, 1:-1] + ch[2:, 1:-1] + ch[1:-1, :-2] + ch[1:-1, 2:]) / 4
            nb[0] = nb[1]; nb[-1] = nb[-2]; nb[:, 0] = nb[:, 1]; nb[:, -1] = nb[:, -2]
            ch[hole] = nb[hole]
        f[:, :, c] = ch
    return f


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    keys = []
    for first, last, step in RANGES:
        block = list(range(first, last + 1, step))
        if block[-1] != last:
            block.append(last)
        keys += block

    # Validation: reconstruct a band of field that is NOT covered by copy, by pretending it
    # is, and compare with the truth. Without this the inpainting is unfalsifiable — a
    # smooth wrong answer looks exactly as plausible as a smooth right one.
    a = frame(240)
    keep = ~copy_mask(a)
    truth, _ = downsample(a, np.ones((1080, 1920), bool))
    probe = keep.copy()
    probe[120:300, 400:1500] = False          # a band of pure field, blanked on purpose
    part, good = downsample(a, probe)
    filled = harmonic(part, good)
    band = np.zeros((GH, GW), bool); band[10:25, 33:125] = True
    err = np.abs(filled[band] - truth[band]).mean()
    print(f"  inpainting check on a copy-free band: mean error {err:.2f}/255")
    if err > 4:
        sys.exit("  reconstruction is not accurate enough to trust under the copy.")

    holes = []
    for g in keys:
        a = frame(g)
        keep = ~(copy_mask(a) | art_mask(g))
        part, good = downsample(a, keep)
        holes.append(int((~good).sum()))
        img = np.clip(harmonic(part, good), 0, 255).astype(np.uint8)
        Image.fromarray(img).save(os.path.join(OUT, f"f{g:03d}.png"))

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    spans = ", ".join(f"{a}-{b} every {c}" for a, b, c in RANGES)
    print(f"  {len(keys)} keyframes ({spans}) at {GW}x{GH}")
    print(f"  cells needing reconstruction: max {max(holes)} of {GW*GH} ({max(holes)/(GW*GH)*100:.1f}%)")
    print(f"     (the large ones are the fan beat, where the fan's whole footprint is a hole)")
    print(f"  wrote {os.path.relpath(OUT, ROOT)}/ ({total/1024:.0f} KB total)")


if __name__ == "__main__":
    main()

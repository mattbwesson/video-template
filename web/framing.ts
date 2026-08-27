/**
 * How a photo sits inside a frame it does not match.
 *
 * Ported from public/refs/framing feature.html, with one substantial change to how it
 * reaches the video and one to what it is keyed by. Both are explained below, because
 * neither is obvious from the reference and both would look like mistakes otherwise.
 *
 * ---------------------------------------------------------------------------------------
 * WHY THIS BAKES PIXELS INSTEAD OF SETTING CSS
 *
 * The reference reframes with `background-position` (an `<img>` would use
 * `object-position`). Neither survives the export. The in-browser renderer implements
 * `object-fit` — `calculateCover` in @remotion/web-renderer takes a fit mode, a container
 * size and an intrinsic size — and there is NO object-position anywhere in it, so a cover
 * crop is always centred. Framing set that way would be visible in the `<Player>` and
 * absent from the MP4, which is the exact failure mode docs/browser-render-best-practices.md
 * exists to prevent, and the MP4 is the product.
 *
 * So the crop is baked into the pixels. `cropToFrame` computes the window the reference
 * would have shown and draws just that window to a canvas; the composition receives an
 * ordinary photo through the ordinary `imageOverrides` channel and paints it with the
 * `object-fit: cover` it already used. Nothing downstream needs to know framing exists,
 * and there is no CSS for the exporter to drop.
 *
 * There is precedent: `BASELINE_ASSETS.personAvatar` is a pre-cropped copy of the baseline
 * headshot for the same reason — see the comment on `avatarFitFor` in
 * CustomizationProvider.tsx, which notes that a framing `object-fit` has no equivalent for
 * had to be baked rather than emulated.
 *
 * ---------------------------------------------------------------------------------------
 * WHY THIS IS KEYED BY POSITION, NOT BY PHOTO
 *
 * The reference keeps framing per SHOT — "the same shot can be cast into the hero and a
 * grid cell, and a focal point survives both shapes" — which is right for a four-scene cut
 * where shots and positions are roughly one-to-one.
 *
 * This cut has ~116 positions and typically a dozen photos, so every photo is already
 * dealt to five or six places at different shapes. Per-shot framing would mean one drag
 * silently re-cropping six frames the operator is not looking at. It would also force the
 * bake to be shape-agnostic: the only way one baked image can survive an arbitrary later
 * `cover` is to put the focal point at its exact centre, and the largest centred box around
 * a point at 20% is 40% of the width — a hard zoom nobody asked for.
 *
 * Per position, the bake is exactly the window the frame shows, at the shape it actually
 * is, and framing matches what the Image section above it already does: it changes the
 * position you clicked and leaves the rest of the cut alone.
 */

/**
 * `x`/`y` are percentages in CSS `background-position` terms — the point p% across the
 * PHOTO is aligned with the point p% across the FRAME, so 50/50 centres and 0/0 pins the
 * top-left corners together. `z` multiplies the cover scale; 1 is "just covers".
 */
export type Framing = { x: number; y: number; z: number };

/** What every position starts at, and what "Reset" restores. */
export const FRAME0: Framing = { x: 50, y: 50, z: 1 };

/**
 * A position's framing plus the bake it produced.
 *
 * `src` is the photo the bake was made FROM. Held so that swapping the photo in the Image
 * section invalidates the bake instead of leaving the previous photo's crop pinned to the
 * position — the two sections edit the same slot and can disagree.
 *
 * `baked` is empty while the canvas work is in flight (and on the frame after a drag,
 * which is debounced), and the position simply shows the uncropped photo until it lands.
 */
export type SlotFraming = Framing & {
  src: string;
  /** Aspect ratio (w/h) of the frame this was baked for, as measured from the Player. */
  aspect: number;
  baked: string;
};

export const isDefaultFraming = (f: Framing): boolean =>
  f.x === 50 && f.y === 50 && f.z === 1;

export const clampPct = (v: number): number => Math.min(100, Math.max(0, v));

/**
 * The rectangle of the source photo that a `cover`-fitted frame actually shows.
 *
 * All of it in frame units, then converted to source pixels at the end. `ar >= R` is the
 * "photo is wider than the frame" case, where cover matches the heights and the width
 * spills; otherwise it matches the widths and the height spills.
 *
 * Returned unclamped-then-clamped: the arithmetic can run a hair outside the image on
 * extreme zooms, and a `drawImage` source rect outside the bitmap draws nothing at all
 * rather than clipping, which would produce a blank photo instead of a tight one.
 */
export const cropToFrame = (
  /** Natural size of the photo. */
  sw: number,
  sh: number,
  /** Aspect ratio (w/h) of the frame it is being drawn into. */
  R: number,
  f: Framing,
): { sx: number; sy: number; sWidth: number; sHeight: number } => {
  const ar = sw / sh;
  // Frame measured as 1 unit tall; width is therefore R.
  const W = R;
  const H = 1;
  const dh = ar >= R ? H * f.z : (W * f.z) / ar;
  const dw = ar >= R ? dh * ar : W * f.z;

  // Negative when the photo spills — that spill is the room the drag has to move in.
  const left = (W - dw) * (f.x / 100);
  const top = (H - dh) * (f.y / 100);

  const pxPerUnitX = sw / dw;
  const pxPerUnitY = sh / dh;

  const sx = -left * pxPerUnitX;
  const sy = -top * pxPerUnitY;
  const sWidth = W * pxPerUnitX;
  const sHeight = H * pxPerUnitY;

  const cx = Math.max(0, Math.min(sx, sw));
  const cy = Math.max(0, Math.min(sy, sh));
  return {
    sx: cx,
    sy: cy,
    sWidth: Math.max(1, Math.min(sWidth, sw - cx)),
    sHeight: Math.max(1, Math.min(sHeight, sh - cy)),
  };
};

/**
 * How much of the photo hangs outside the frame, in frame units.
 *
 * Negative on an axis means there is spill there, i.e. room to drag. Zero or positive
 * means the photo already fits that axis and sliding it would only reveal background — the
 * panel uses this to say so rather than letting the operator drag against nothing.
 */
export const frameSlack = (
  ar: number,
  R: number,
  f: Framing,
): { x: number; y: number } => {
  const W = R;
  const H = 1;
  const dh = ar >= R ? H * f.z : (W * f.z) / ar;
  const dw = ar >= R ? dh * ar : W * f.z;
  return { x: W - dw, y: H - dh };
};

/**
 * The `background-size` that reproduces cover-plus-zoom, for the panel's own preview.
 *
 * Only the wizard's UI uses this. It is deliberately NOT how the video is framed — see the
 * note at the top of this file — and must not be copied into a composition component.
 */
export const previewBackgroundSize = (ar: number, R: number, z: number): string => {
  if (!ar) return z === 1 ? "cover" : `${100 * z}% ${100 * z}%`;
  return ar >= R ? `auto ${100 * z}%` : `${100 * z}% auto`;
};

/**
 * Longest edge of a baked crop.
 *
 * Matched to `MAX_EDGE` in uploads.ts for the same reason it was chosen there: the largest
 * position in the cut is a 452px billboard on a 1920 stage, so 1600 is already generous,
 * and every baked crop is a second copy of a photo held in React state alongside the
 * original. A zoomed crop is a SUBSET of an upload that was itself capped at 1600, so this
 * ceiling is rarely the binding constraint — it exists to stop a 1.0x bake of a large
 * source from doubling that source's cost for no visible gain.
 */
const MAX_BAKE_EDGE = 1600;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load the photo to crop it"));
    img.src = url;
  });

/**
 * Draw the framed window of `src` to a new data URL.
 *
 * Returns the ORIGINAL url unchanged when the framing is the default, so an untouched
 * position never pays for a re-encode and never differs by a JPEG generation from the
 * photo the operator uploaded.
 */
export const bakeFraming = async (
  src: string,
  aspect: number,
  f: Framing,
): Promise<string> => {
  if (isDefaultFraming(f)) return src;

  const img = await loadImage(src);
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (!sw || !sh) return src;

  const { sx, sy, sWidth, sHeight } = cropToFrame(sw, sh, aspect, f);

  const longest = Math.max(sWidth, sHeight);
  const scale = longest > MAX_BAKE_EDGE ? MAX_BAKE_EDGE / longest : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sWidth * scale));
  canvas.height = Math.max(1, Math.round(sHeight * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

  // JPEG for the same reason uploads.ts gives: these are photographs, and a PNG of a
  // downscaled photo is several times the size. 0.9 rather than that file's 0.86 because
  // this is a re-encode of an already-encoded JPEG and the losses compound.
  return canvas.toDataURL("image/jpeg", 0.9);
};

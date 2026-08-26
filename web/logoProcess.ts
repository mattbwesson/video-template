/**
 * Turn whatever logo file an operator found into the two versions the cut needs.
 *
 * Ported from the ZVA builder's treatment (`docs/zva-logo-treatment.md` §2), with two
 * deliberate differences:
 *
 *  - **White-matte removal is unconditional.** ZVA exposes it as a checkbox defaulting
 *    on; here there is no checkbox. Every screen the logo lands on is either the intro's
 *    white circle — where knocking out a white box is a visual no-op — or a near-black
 *    header, where leaving the box in is always wrong.
 *  - **Force-white is not optional either**, but it produces a SECOND output rather than
 *    replacing the first. The colour mark goes on the white circle, the white knockout
 *    goes in every UI header. One upload, two treatments, no question asked.
 *
 * Output is a PNG data URL, never an SVG and never a blob URL. PNG because the render
 * paths must not have to deal with SVG-in-`<img>` sizing (ZVA §5); data URL because the
 * wizard keeps every upload as one (see uploads.ts).
 */

/** Longest side an SVG is rasterized to. Above the biggest on-screen use, well below silly. */
const SVG_RASTER_MAX_PX = 1200;

// --- white-matte thresholds (ZVA §2.2) -------------------------------------------
/** Step 1: a pixel this close to white in its DARKEST channel ... */
const NEAR_WHITE_MIN_CHANNEL = 246;
/** ... and this flat in colour, is the box the logo was exported on. */
const NEAR_GRAY_MAX_CHROMA = 28;
/** Step 2: bright ... */
const MATTE_MIN_LUMA = 200;
/** ... and unsaturated enough to be an anti-aliased edge against that box. */
const MATTE_MAX_CHROMA = 32;

/** Alpha at or above which a pixel counts as ink — for force-white and for cropping. */
const ALPHA_FLOOR = 8;

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Drop the white box the logo was exported on, in two passes.
 *
 * The second pass is the one that matters for quality. A hard "white becomes
 * transparent" test leaves every anti-aliased edge as a ring of near-white pixels — a
 * white fringe that is invisible on white and glaringly obvious on navy. Instead, a
 * bright unsaturated pixel is treated as the true colour already composited over white:
 * alpha becomes how far it sits from white, and the colour is recovered by undoing that
 * composite. Mid-grey on the edge of black type comes back as black at half alpha, which
 * is what it was before someone flattened it.
 *
 * Saturated pixels are never touched, whatever their brightness, so a pale brand yellow
 * survives and only genuine greys are read as matte.
 */
const removeWhiteMatte = (d: Uint8ClampedArray): void => {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const mn = Math.min(r, g, b);
    const chroma = Math.max(r, g, b) - mn;

    if (mn >= NEAR_WHITE_MIN_CHANNEL && chroma <= NEAR_GRAY_MAX_CHROMA) {
      d[i + 3] = 0;
      continue;
    }
    if (luma(r, g, b) < MATTE_MIN_LUMA || chroma > MATTE_MAX_CHROMA) continue;

    const a = (255 - mn) / 255;
    if (a <= 0) {
      d[i + 3] = 0;
      continue;
    }
    d[i] = clamp255((r - 255) / a + 255);
    d[i + 1] = clamp255((g - 255) / a + 255);
    d[i + 2] = clamp255((b - 255) / a + 255);
    d[i + 3] = Math.round(d[i + 3] * a);
  }
};

/**
 * Every pixel with ink becomes pure white; alpha is left alone.
 *
 * Shape survives, colour goes. Run AFTER the matte removal, never instead of it: on a
 * flattened white-boxed logo, forcing white first paints the box white too and the whole
 * file becomes an opaque white rectangle.
 */
const forceWhite = (d: Uint8ClampedArray): void => {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < ALPHA_FLOOR) continue;
    d[i] = 255;
    d[i + 1] = 255;
    d[i + 2] = 255;
  }
};

/**
 * Crop to the alpha bounding box.
 *
 * A logo shipped inside a huge transparent artboard otherwise renders as a small mark
 * floating in a big empty box, and every `max-width` in the layout is spent on nothing.
 * Note this CHANGES the aspect ratio relative to the uploaded file (ZVA §6) — nothing
 * downstream may assume the original dimensions.
 */
const cropToContent = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): HTMLCanvasElement => {
  const { width: w, height: h } = canvas;
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return canvas;
  }
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < ALPHA_FLOOR) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  // No opaque pixels at all: keep what we have rather than producing a 0x0 canvas.
  if (x1 < 0) return canvas;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  if (cw === w && ch === h) return canvas;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) return canvas;
  octx.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  return out;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not decode logo"));
    img.src = url;
  });

/**
 * An SVG's own idea of how big it is, so it can be rasterized at a sensible size.
 *
 * An `<img>` given an SVG with no intrinsic size reports 0x0 in some engines and a
 * 300x150 default in others, so the size is read out of the markup instead. Percentage
 * lengths are ignored — they are relative to a viewport the file does not have.
 */
const svgRasterSize = (text: string): { w: number; h: number } => {
  const attr = (name: string): number | null => {
    const m = new RegExp(`<svg[^>]*\\b${name}\\s*=\\s*["']([^"']+)["']`, "i").exec(text);
    if (!m || m[1].includes("%")) return null;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  let w = attr("width");
  let h = attr("height");
  if (!w || !h) {
    const vb = /<svg[^>]*\bviewBox\s*=\s*["']([^"']+)["']/i.exec(text);
    const p = vb?.[1].trim().split(/[\s,]+/).map(Number);
    if (p && p.length === 4 && p[2] > 0 && p[3] > 0) {
      w = w || p[2];
      h = h || p[3];
    }
  }
  if (!w || !h) return { w: SVG_RASTER_MAX_PX, h: SVG_RASTER_MAX_PX };
  // Normalize the LONGEST side to the raster size, scaling up as readily as down. The
  // declared width of an SVG is an authoring convenience, not a resolution — a mark
  // authored at 118x70 is just as sharp at 1200 wide, and rasterizing it at 118 would
  // put a blurry logo in a 240px topbar for no reason.
  const scale = SVG_RASTER_MAX_PX / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
};

const isSvg = (file: File): boolean =>
  file.type === "image/svg+xml" || /\.svg$/i.test(file.name);

const readText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsText(file);
  });

const readDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });

/** Decode the file onto a canvas at a sensible size. SVGs are always rasterized. */
const drawToCanvas = async (
  file: File,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> => {
  const url = await readDataUrl(file);
  const img = await loadImage(url);

  const size = isSvg(file)
    ? svgRasterSize(await readText(file))
    : { w: img.naturalWidth, h: img.naturalHeight };
  if (!size.w || !size.h) throw new Error("logo has no dimensions");

  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, size.w, size.h);
  return { canvas, ctx };
};

export type ProcessedLogo = {
  /** Matte removed, colour kept, cropped. For light ground — the intro's white circle. */
  colour: string;
  /** The same, then forced to white. For every UI header, all of which are dark. */
  white: string;
  /** True when the file could not be processed and `colour` is the raw upload. */
  degraded: boolean;
};

/**
 * One upload in, two PNG data URLs out.
 *
 * Failure degrades rather than throwing, following ZVA §2.5: a raster that cannot be
 * processed ships raw, because a slightly-wrong logo beats no logo. The white version
 * has no raw fallback — forcing white is the whole point of it — so it comes back empty
 * and `CustomizationProvider` falls back to the colour mark on its own.
 */
export const processLogo = async (file: File): Promise<ProcessedLogo> => {
  let raw = "";
  try {
    raw = await readDataUrl(file);
    const { canvas, ctx } = await drawToCanvas(file);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    removeWhiteMatte(pixels.data);
    ctx.putImageData(pixels, 0, 0);
    const colour = cropToContent(canvas, ctx).toDataURL("image/png");

    // Force-white works off the matte-removed pixels, so the second pass re-reads them
    // from the same canvas rather than starting over from the file.
    const whitePixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    forceWhite(whitePixels.data);
    ctx.putImageData(whitePixels, 0, 0);
    const white = cropToContent(canvas, ctx).toDataURL("image/png");

    return { colour, white, degraded: false };
  } catch {
    return { colour: raw, white: "", degraded: true };
  }
};

/**
 * Take the operator's OWN reversed logo more or less as given.
 *
 * The derived knockout is a guess, and on some marks it is a bad one: anything with white
 * cut-outs inside a solid shape — the Taco Bell bell, a knocked-out roundel — comes back
 * with the cut-outs filled, because "every pixel with ink becomes white" cannot know that
 * some of that ink was a hole. When a brand kit ships a real reversed logo, that file wins.
 *
 * Deliberately NOT run through `removeWhiteMatte`: this file is white on purpose, and
 * rule 1 of the matte pass ("near-white and near-grey becomes transparent") would erase
 * the entire mark. Nor is it forced to white — a two-tone reversed logo is a real thing
 * and it is not this function's business to flatten one.
 *
 * What it does do is rasterize (so an SVG becomes a PNG like everything else) and crop to
 * the alpha box, which is safe on any file and stops a small mark inside a large
 * transparent artboard from rendering tiny.
 */
export const processReversedLogo = async (file: File): Promise<string> => {
  try {
    const { canvas, ctx } = await drawToCanvas(file);
    return cropToContent(canvas, ctx).toDataURL("image/png");
  } catch {
    // Ships raw rather than nothing: a slightly-wrong logo beats no logo, and the
    // operator chose this file precisely because the derived one was wrong.
    try {
      return await readDataUrl(file);
    } catch {
      return "";
    }
  }
};

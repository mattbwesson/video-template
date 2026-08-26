/**
 * Pull the brand colours out of an uploaded logo.
 *
 * This is a convenience, not a source of truth: the operator can override every value it
 * produces, and the composition only ever sees what is in the picker. It runs on a 72x72
 * downsample because a logo's palette is a handful of flat fills — sampling more pixels
 * finds the same colours more slowly.
 *
 * Ported from video-customizer-reveal-dark.html, unchanged in behaviour.
 */

import { cleanHex, fromRgb, type Hex } from "../src/customize/color";

/** Bucket width when quantising. Coarse enough that antialiased edges fold into the fill. */
const BIN = 22;

/** Most colours a logo is allowed to contribute. */
const MAX_SWATCHES = 5;

/** Manhattan distance below which two candidates count as the same colour. */
const MIN_SEPARATION = 85;

export const extractPalette = (dataUrl: string): Promise<Hex[]> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve([]);
    img.onload = () => {
      const n = 72;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = n;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, n, n);

      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, n, n).data;
      } catch {
        // Tainted canvas. Only reachable if a logo ever arrives as a cross-origin URL
        // rather than a data URL, which the upload path does not do.
        return resolve([]);
      }

      const weights: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 160) continue; // transparent padding
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx > 242 && mn > 236) continue; // the white the logo sits on
        if (mx < 22) continue; // near-black outlines and type
        if (mx - mn < 24) continue; // greys carry no brand information
        const key = [r, g, b].map((v) => Math.round(v / BIN) * BIN).join(",");
        // Weight by area AND by saturation, so a small vivid mark beats a large muted
        // photograph behind it.
        weights[key] = (weights[key] ?? 0) + (0.45 + (mx - mn) / mx);
      }

      const picked: number[][] = [];
      for (const [key] of Object.entries(weights).sort((a, b) => b[1] - a[1])) {
        if (picked.length >= MAX_SWATCHES) break;
        const v = key.split(",").map(Number);
        const tooClose = picked.some(
          (p) =>
            Math.abs(p[0] - v[0]) + Math.abs(p[1] - v[1]) + Math.abs(p[2] - v[2]) <
            MIN_SEPARATION,
        );
        if (!tooClose) picked.push(v);
      }

      resolve(picked.map((v) => cleanHex(fromRgb(v[0], v[1], v[2]))));
    };
    img.src = dataUrl;
  });

import React from "react";

/**
 * A radial gradient the in-browser export can paint.
 *
 * CSS `radial-gradient(...)` is correct in the Player, the Studio and the CLI render and
 * paints NOTHING in the wizard's export — measured on @remotion/web-renderer 4.0.496, where
 * a linear gradient in the same probe painted fine (docs/browser-render-best-practices.md
 * §5). An SVG `<radialGradient>` does paint there, so every wash in the film is one of
 * these: same centre, same radii, same stops as the CSS it replaced, drawn onto a rect the
 * size of the box the CSS background used to fill.
 *
 * Geometry is stated in px of that box, because that is how CSS resolves its keywords:
 *   - `closest-side` at the centre of a w×h box is rx = w/2, ry = h/2;
 *   - `circle farthest-corner` is r = distance from the centre to the farthest corner
 *     (`farthestCorner` below);
 *   - `ellipse farthest-corner` at the centre is rx = w/√2, ry = h/√2
 *     (`ellipseFarthestCorner`);
 *   - `<rx> <ry> at <x> <y>` is those four, resolved against the box.
 * An ellipse is a circle of radius rx with the y axis scaled by ry/rx about the centre —
 * `<radialGradient>` has one `r`, so the second radius rides in `gradientTransform`.
 * `spreadMethod` defaults to `pad`, which is what CSS does beyond the last stop.
 *
 * Every stop is split into `stopColor` + `stopOpacity`, and each pair of stops is resampled
 * into `SUBSTOPS` steps computed in PREMULTIPLIED colour. CSS interpolates a gradient
 * premultiplied — a fade from rgba(109,40,217,.62) to rgba(1,0,38,0) stays that violet and
 * only thins — while Chrome interpolates SVG stops unpremultiplied, so the same two stops
 * drift through a colour halfway to the end stop's (1,0,38) and the wash reads darker: 17
 * levels of red at the midpoint, measured on the Amplify field. Sampling the premultiplied
 * ramp and handing Chrome the unpremultiplied colour at each sample brings it back to the
 * CSS ramp to within a level. `transparent` and any alpha-0 stop take the colour of the
 * nearest opaque neighbour, so a fade to nothing is a fade and not a fade through black.
 *
 * `id` must be unique per mounted instance: two gradients with one id paint with the first
 * one's stops. The wrapper, not the svg, carries the placement — an inline `position` or
 * `opacity` on an `<svg>` root is serialised into the image the export draws and breaks
 * it (see SymbolSvg in components/workvivo/symbolRegistry.tsx).
 */
export type WashStop = [at: number, color: string];

const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;
const HEX = /^#([0-9a-f]{6})$/i;

type Rgba = [r: number, g: number, b: number, a: number];

/** `rgba(r,g,b,a)` / `rgb(r,g,b)` / `#rrggbb` / `transparent`. Anything else is an error:
 *  a wash is authored here, not researched, so an unknown form is a typo. */
const parse = (color: string): Rgba => {
  const c = color.trim();
  if (c === "transparent") return [0, 0, 0, 0];
  const m = RGBA.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  const h = HEX.exec(c);
  if (h) return [parseInt(h[1].slice(0, 2), 16), parseInt(h[1].slice(2, 4), 16), parseInt(h[1].slice(4, 6), 16), 1];
  throw new Error(`RadialWash: unsupported colour "${color}"`);
};

const SUBSTOPS = 8;

/** The stops as Chrome should be handed them: resampled along the premultiplied ramp. */
const premultipliedStops = (stops: WashStop[]): { offset: number; color: string; opacity: number }[] => {
  const parsed = stops.map(([at, color]) => ({ at, c: parse(color) }));
  // An alpha-0 stop carries whatever colour the author typed; give it its neighbour's so
  // the segment fades in place rather than toward black.
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].c[3] === 0) {
      const n = parsed[i - 1]?.c[3] ? parsed[i - 1] : parsed[i + 1];
      if (n) parsed[i].c = [n.c[0], n.c[1], n.c[2], 0];
    }
  }
  const out: { offset: number; color: string; opacity: number }[] = [];
  const push = (offset: number, c: Rgba) =>
    out.push({ offset, color: `rgb(${c[0].toFixed(2)},${c[1].toFixed(2)},${c[2].toFixed(2)})`, opacity: c[3] });
  for (let i = 0; i < parsed.length - 1; i++) {
    const [a, b] = [parsed[i], parsed[i + 1]];
    for (let k = 0; k < SUBSTOPS; k++) {
      const t = k / SUBSTOPS;
      const alpha = a.c[3] + (b.c[3] - a.c[3]) * t;
      const ch = (j: 0 | 1 | 2) => {
        const pm = a.c[j] * a.c[3] + (b.c[j] * b.c[3] - a.c[j] * a.c[3]) * t;
        return alpha > 0 ? pm / alpha : a.c[j] + (b.c[j] - a.c[j]) * t;
      };
      push(a.at + (b.at - a.at) * t, [ch(0), ch(1), ch(2), alpha]);
    }
  }
  const last = parsed[parsed.length - 1];
  push(last.at, last.c);
  return out;
};

export const farthestCorner = (cx: number, cy: number, width: number, height: number): number =>
  Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy));

export const ellipseFarthestCorner = (width: number, height: number): { rx: number; ry: number } => ({
  rx: width / Math.SQRT2,
  ry: height / Math.SQRT2,
});

export const RadialWash: React.FC<{
  id: string;
  /** The box the wash fills, px. */
  width: number;
  height: number;
  /** Centre and radii in px within the box; `ry` defaults to `rx` (a circle). */
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  stops: WashStop[];
  /** Placement and opacity — applied to the wrapper. Defaults to the box's top-left. */
  style?: React.CSSProperties;
}> = ({ id, width, height, cx, cy, rx, ry = rx, stops, style }) => {
  const resampled = premultipliedStops(stops);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, pointerEvents: "none", ...style }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <defs>
          <radialGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={rx}
            gradientTransform={ry === rx ? undefined : `translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})`}
          >
            {resampled.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill={`url(#${id})`} />
      </svg>
    </div>
  );
};

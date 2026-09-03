import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./WorkvivoHqFanStyles.css";

/**
 * The HQ capability fan — three glass wedges radiating from the HQ mark.
 *
 * Geometry is computed, not hand-drawn. Everything hangs off `CX`/`CY`, `R_IN` and
 * `R_OUT`, so nudging the fan is changing three numbers rather than re-authoring the
 * path commands, and the three wedges stay concentric by construction.
 *
 * BUILT AS ONE INLINE <svg> ON PURPOSE
 *
 * The obvious CSS approach — `conic-gradient` for the wedges, `radial-gradient` for the
 * glows, a pseudo-element for the ring — would look right in the Player and render as a
 * flat rectangle in the export. The browser renderer paints no `radial-gradient` at all,
 * never draws pseudo-elements, and ignores `z-index`. See
 * docs/browser-render-best-practices.md.
 *
 * Inline SVG sidesteps all three: real elements, in DOM order, with gradients the
 * rasterizer honours. `width`/`height` are set alongside `viewBox` because the exporter
 * decodes at intrinsic size and a viewBox-only root has none.
 *
 * TWO THINGS THE FIRST VERSION GOT WRONG, AND WHY THEY ARE SUBTLE
 *
 * The gap between wedges was ANGULAR — six degrees — which reads as even and is not: a
 * 6° gap is 13px wide at the hub and 76px at the rim. The reference's gaps are parallel
 * bands of constant width. That is a perpendicular OFFSET of each straight edge, and
 * on a circle an offset of `d` shows up as an angle of `asin(d / r)` — larger at the
 * hub, smaller at the rim. `edgeAt` is that one line of trigonometry.
 *
 * And the corners were sharp. SVG paths have no corner radius, so each corner is a
 * quadratic fillet: both edges are trimmed back by `CORNER` and joined with a curve
 * whose control point is the corner itself. At these radii the fillet is
 * indistinguishable from a true arc.
 */

const W = 1920;
const H = 1080;

/** Fan origin — the centre of the HQ badge. */
const CX = 960;
const CY = 858;
/**
 * The wedges run in UNDER the badge — their tips are hidden by the disc, which is drawn
 * after them — so this is well inside `BADGE_R`.
 */
const R_IN = 76;
const R_OUT = 725;

/** The band between wedges, in px, the same width from hub to rim. */
const GAP = 26;
/** Fillet radius on every wedge corner. */
const CORNER = 16;

/** Badge and its halo. */
const BADGE_R = 102;
const RING_R = 113;

/**
 * Wedge spans, in degrees CCW from the +x axis, sharing a boundary line at 119° and
 * 61°. The gap is centred on each boundary, so the centre wedge is 58° and the sides
 * 61° — slightly narrower, so the eye lands on it.
 */
const WEDGES = [
  { key: "comm", from: 180, to: 119 },
  { key: "search", from: 119, to: 61 },
  { key: "people", from: 61, to: 0 },
] as const;

type Pt = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

const pt = (angle: number, r: number): Pt => {
  const a = rad(angle);
  // Minus on y because SVG's y grows downward while the angle is measured the maths way.
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};

/**
 * Where a wedge's straight edge meets a circle of radius `r`, once that edge has been
 * pushed inward by half the gap. Points at every radius on the same offset line ARE the
 * line, which is what keeps the edge straight and the gap parallel.
 */
const edgeAt = (boundary: number, r: number, side: "from" | "to"): number => {
  const shift = deg(Math.asin(GAP / 2 / r));
  return side === "from" ? boundary - shift : boundary + shift;
};

/** A point `dist` along the segment from `a` toward `b`. */
const along = (a: Pt, b: Pt, dist: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  return [a[0] + (dx / len) * dist, a[1] + (dy / len) * dist];
};

const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/**
 * An annular sector with parallel gaps and rounded corners.
 *
 * Corners in screen order: P1 outer-left, P2 outer-right, P3 inner-right, P4 inner-left.
 * The outer arc walks clockwise on screen (decreasing angle, sweep 1); the inner arc is
 * retraced the other way (sweep 0). Every edge is trimmed by `CORNER` at both ends and
 * the corner itself becomes the control point of the joining curve.
 */
const wedgePath = (from: number, to: number): string => {
  const fo = edgeAt(from, R_OUT, "from");
  const tOut = edgeAt(to, R_OUT, "to");
  const fi = edgeAt(from, R_IN, "from");
  const tIn = edgeAt(to, R_IN, "to");

  const P1 = pt(fo, R_OUT);
  const P2 = pt(tOut, R_OUT);
  const P3 = pt(tIn, R_IN);
  const P4 = pt(fi, R_IN);

  // Trim distances along the arcs, as angles.
  const dO = deg(CORNER / R_OUT);
  const dI = deg(CORNER / R_IN);

  const A1 = pt(fo - dO, R_OUT);
  const A2 = pt(tOut + dO, R_OUT);
  const A3 = pt(tIn + dI, R_IN);
  const A4 = pt(fi - dI, R_IN);

  const S1 = along(P2, P3, CORNER);
  const S2 = along(P3, P2, CORNER);
  const S3 = along(P4, P1, CORNER);
  const S4 = along(P1, P4, CORNER);

  return [
    `M ${f(A1)}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${f(A2)}`,
    `Q ${f(P2)} ${f(S1)}`,
    `L ${f(S2)}`,
    `Q ${f(P3)} ${f(A3)}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${f(A4)}`,
    `Q ${f(P4)} ${f(S3)}`,
    `L ${f(S4)}`,
    `Q ${f(P1)} ${f(A1)}`,
    "Z",
  ].join(" ");
};

/**
 * The endpoints of a CSS-style `linear-gradient(θ)` over a wedge's bounding box.
 *
 * CSS measures θ clockwise from "up", and runs the gradient line through the centre with
 * a length equal to the box's projection onto it — so the two colour stops sit exactly on
 * the far corners. Reproduced here so the angles can be read straight off a design tool.
 */
const cssGradientLine = (from: number, to: number, thetaDeg: number): [Pt, Pt] => {
  // Bounding box, from the outer arc sampled every degree plus the inner corners.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const take = ([x, y]: Pt) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };
  const fo = edgeAt(from, R_OUT, "from"), tOut = edgeAt(to, R_OUT, "to");
  for (let a = tOut; a <= fo; a += 1) take(pt(a, R_OUT));
  take(pt(fo, R_OUT)); take(pt(tOut, R_OUT));
  take(pt(edgeAt(from, R_IN, "from"), R_IN)); take(pt(edgeAt(to, R_IN, "to"), R_IN));
  const w = maxX - minX, h = maxY - minY;
  const cx = minX + w / 2, cy = minY + h / 2;
  const t = rad(thetaDeg);
  const dx = Math.sin(t), dy = -Math.cos(t);
  const len = Math.abs(w * Math.sin(t)) + Math.abs(h * Math.cos(t));
  return [
    [cx - (dx * len) / 2, cy - (dy * len) / 2],
    [cx + (dx * len) / 2, cy + (dy * len) / 2],
  ];
};

/**
 * Fill angle per pane, AS SUPPLIED — measured the way design tools measure a gradient:
 * from the horizontal, counter-clockwise positive. CSS measures from vertical, clockwise,
 * so the conversion is `90 - θ`. The tell was which panes looked wrong after a literal
 * CSS reading: 45° is the one angle both conventions agree on, and the two that differed
 * were exactly the two flagged.
 */
const FILL_ANGLE: Record<(typeof WEDGES)[number]["key"], number> = {
  comm: 45,
  search: -11,
  people: -65,
};
const toCssAngle = (designDeg: number): number => 90 - designDeg;
const FILL_FROM = "#1d1470";
const FILL_TO = "#580fe6";

/**
 * Label and icon placement, measured off the reference at 1920x1080.
 *
 * Measured, not derived: the reference's labels do not sit on the wedges' bisectors and
 * are not symmetric about the centre — the left block is 437px out, the right 403 — so a
 * formula would be a formula for something other than the reference. Each is the CENTRE
 * of the thing, since every element here is placed by translate(-50%, -50%).
 */
const LABEL: Record<(typeof WEDGES)[number]["key"], Pt> = {
  comm: [523, 706],
  search: [960, 459],
  people: [1363, 706],
};

/**
 * Each icon's ink centre and ink size, in px, measured off the reference — followed by
 * how much of its own canvas the source art actually fills, and where the ink's centre
 * sits within it (as fractions), measured from the PNG's alpha.
 *
 * The second pair is what makes the first pair honest. The glass PNGs carry padding:
 * the chat bubble is 59% of its canvas, the rocket 57%. Size the BOX to the reference's
 * number and the bubble draws at two-thirds of it. So `spot` sizes the box so that the
 * INK matches, and shifts it so the ink's centre — not the canvas's — lands on the point.
 *
 * Re-measure with: alpha > 40 bbox over public/img/glass/fan/*.png.
 */
type IconSpot = {
  x: number;
  y: number;
  ink: number;
  frac: number;
  cx: number;
  cy: number;
};
const ICON: Record<string, IconSpot> = {
  chat: { x: 472, y: 506, ink: 110, frac: 0.59, cx: 0.506, cy: 0.494 },
  chat2: { x: 570, y: 557, ink: 64, frac: 0.59, cx: 0.506, cy: 0.494 },
  // Inline SVGs: fraction and centre are the path's extent within its viewBox.
  heart: { x: 566, y: 487, ink: 34, frac: 0.81, cx: 0.5, cy: 0.49 },
  mag: { x: 961, y: 238, ink: 94, frac: 0.676, cx: 0.5, cy: 0.471 },
  doc: { x: 857, y: 251, ink: 30, frac: 0.786, cx: 0.5, cy: 0.5 },
  rocket: { x: 1293, y: 510, ink: 77, frac: 0.566, cx: 0.498, cy: 0.486 },
  scale: { x: 1348, y: 457, ink: 51, frac: 0.735, cx: 0.494, cy: 0.483 },
  sparkle: { x: 1432, y: 520, ink: 118, frac: 0.878, cx: 0.504, cy: 0.502 },
};

const place = ([x, y]: Pt): React.CSSProperties => ({ left: x, top: y });
const spot = ({ x, y, ink, frac, cx, cy }: IconSpot): React.CSSProperties => {
  const box = ink / frac;
  return {
    left: x - (cx - 0.5) * box,
    top: y - (cy - 0.5) * box,
    width: box,
    height: box,
  };
};

/**
 * Sparkle specks around the halo — the reference scatters a few tiny points of light
 * in the ring's upper half, which is most of what makes it read as glowing rather than
 * merely stroked. Angle, distance beyond the ring, radius, opacity.
 */
const SPECKS: [number, number, number, number][] = [
  [128, 28, 2.4, 0.9],
  [104, 42, 1.6, 0.7],
  [78, 34, 2.0, 0.85],
  [152, 46, 1.4, 0.55],
  [58, 52, 1.5, 0.6],
  [96, 62, 1.2, 0.45],
  [140, 20, 1.3, 0.75],
];

export const WorkvivoHqFan: React.FC = () => (
  <AbsoluteFill className="hqf">
    <svg
      className="hqf-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* The field. Darkest top-right, blue-violet top-left, a broad violet lift across
            the whole bottom — the reference is a blurred mesh, and one diagonal plus
            three soft blooms is the cheapest thing that reads the same. */}
        <linearGradient id="hqf-field" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0a2c" />
          <stop offset="0.32" stopColor="#151348" />
          <stop offset="0.62" stopColor="#2c2390" />
          <stop offset="0.84" stopColor="#4a38ca" />
          <stop offset="1" stopColor="#5e4ae6" />
        </linearGradient>
        <radialGradient id="hqf-bloom-tl" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3a38b4" stopOpacity="0.78" />
          <stop offset="0.6" stopColor="#2e2c9c" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2a2890" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hqf-bloom-b" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7458f6" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#6244e4" stopOpacity="0.4" />
          <stop offset="1" stopColor="#4a30c0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hqf-bloom-br" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#4e3ccc" stopOpacity="0.5" />
          <stop offset="1" stopColor="#4e3ccc" stopOpacity="0" />
        </radialGradient>

        {/* Wedge fills run hub -> rim along each bisector, deeper and more translucent
            at the hub, lighter and more saturated at the rim. userSpaceOnUse so the
            direction is the wedge's own, not its bounding box's. */}
        {WEDGES.map((w) => {
          const [[x1, y1], [x2, y2]] = cssGradientLine(w.from, w.to, toCssAngle(FILL_ANGLE[w.key]));
          return (
            <linearGradient
              key={w.key}
              id={`hqf-w-${w.key}`}
              gradientUnits="userSpaceOnUse"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            >
              <stop offset="0" stopColor={FILL_FROM} stopOpacity="0.9" />
              <stop offset="1" stopColor={FILL_TO} stopOpacity="0.9" />
            </linearGradient>
          );
        })}

        {/* One clip per wedge, so the inner rim light below can be a wide stroke that
            only shows on the INSIDE of the edge — that inset glow is most of what makes
            a translucent shape read as a pane of glass rather than a tinted region. */}
        {WEDGES.map((w) => (
          <clipPath key={w.key} id={`hqf-c-${w.key}`}>
            <path d={wedgePath(w.from, w.to)} />
          </clipPath>
        ))}
        {/* The glass edge, per pane: a 1.4px line that is white where the light hits and
            fades to NOTHING by the far corner — the border is itself on a transparency
            gradient, which is what makes it read as the edge of a pane rather than an
            outline around a shape. The rim inside it follows the same direction, much
            softer. Light direction is screen-space, from the top of each pane. */}
        {WEDGES.map((w) => {
          const lit = w.key === "comm" ? 45 : w.key === "search" ? 0 : -45;
          const [[x1, y1], [x2, y2]] = cssGradientLine(w.from, w.to, lit);
          return (
            <React.Fragment key={w.key}>
              <linearGradient
                id={`hqf-edge-${w.key}`}
                gradientUnits="userSpaceOnUse"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient
                id={`hqf-rim-${w.key}`}
                gradientUnits="userSpaceOnUse"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
              </linearGradient>
            </React.Fragment>
          );
        })}
        {/* Frost: a white wash that is strongest along the top of each pane and gone by
            its middle. Vertical in screen space, since that is where the light is. */}
        <linearGradient
          id="hqf-frost"
          gradientUnits="userSpaceOnUse"
          x1={CX}
          y1={CY - R_OUT}
          x2={CX}
          y2={CY - R_OUT * 0.35}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#e8e2ff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#e8e2ff" stopOpacity="0" />
        </linearGradient>

        {/* The halo, in three layers: a wide soft cyan glow, a thin bright ring that is
            cyan at the upper-left and fades to nothing at the lower-right, and a
            fainter inner ring a few px inside it. Plus the specks. */}
        <radialGradient id="hqf-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor="#9ff0ff" stopOpacity="0" />
          <stop offset="0.66" stopColor="#9ff0ff" stopOpacity="0.32" />
          <stop offset="0.8" stopColor="#a8b8ff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#a8b8ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="hqf-ring"
          gradientUnits="userSpaceOnUse"
          x1={CX - RING_R}
          y1={CY - RING_R}
          x2={CX + RING_R}
          y2={CY + RING_R}
        >
          <stop offset="0" stopColor="#a4f6ee" />
          <stop offset="0.3" stopColor="#b8c6ff" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#8a70f8" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8a70f8" stopOpacity="0.04" />
        </linearGradient>
        {/* Light spilling up between the wedges from the hub. */}
        <radialGradient id="hqf-spill" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#b9f0ff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#9c8cff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#9c8cff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#hqf-field)" />
      <ellipse cx={260} cy={170} rx={720} ry={470} fill="url(#hqf-bloom-tl)" />
      <ellipse cx={500} cy={1010} rx={920} ry={390} fill="url(#hqf-bloom-b)" />
      <ellipse cx={CX} cy={CY + 150} rx={520} ry={250} fill="url(#hqf-bloom-b)" />
      <ellipse cx={1580} cy={1050} rx={640} ry={300} fill="url(#hqf-bloom-br)" />

      {WEDGES.map((w) => {
        const d = wedgePath(w.from, w.to);
        return (
          <g key={w.key}>
            <path d={d} fill={`url(#hqf-w-${w.key})`} />
            <path d={d} fill="url(#hqf-frost)" />
            <g clipPath={`url(#hqf-c-${w.key})`}>
              <path
                d={d}
                fill="none"
                stroke={`url(#hqf-rim-${w.key})`}
                strokeWidth="14"
                strokeLinejoin="round"
              />
            </g>
            <path
              d={d}
              fill="none"
              stroke={`url(#hqf-edge-${w.key})`}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      {/* Halo layers, then the badge — in DOM order, since the export ignores z-index. */}
      <ellipse cx={CX} cy={CY - 30} rx={230} ry={190} fill="url(#hqf-spill)" />
      <circle cx={CX} cy={CY} r={RING_R + 70} fill="url(#hqf-halo)" />
      <circle
        cx={CX}
        cy={CY}
        r={RING_R}
        fill="none"
        stroke="url(#hqf-ring)"
        strokeWidth="3"
      />
      <circle
        cx={CX}
        cy={CY}
        r={RING_R - 7}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="1"
      />
      {SPECKS.map(([a, dist, r, o], i) => {
        const [x, y] = pt(a, RING_R + dist);
        return <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" fillOpacity={o} />;
      })}

      <circle cx={CX} cy={CY} r={BADGE_R} fill="#07060f" />
      <rect
        x={CX - 52}
        y={CY - 40}
        width={104}
        height={80}
        rx={19}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
      />
      {/* The mark, inlined from public/img/hq-logo.svg (viewBox 0 0 118 70) — SVG
          delivered through an <img> comes out garbled in the export. */}
      <g transform={`translate(${CX - 36} ${CY - 21}) scale(${72 / 118})`}>
        <path
          d="M0 61.6015V1.18048H14.3572V25.2556H36.593V1.18048H51.0326V61.6015H36.593V37.0049H14.3572V61.6015H0Z"
          fill="#ffffff"
        />
        <path
          d="M71.0184 31.4321C71.0184 43.6755 77.2773 50.9502 86.9952 50.9502C96.7131 50.9502 102.972 43.7579 102.972 31.4321C102.972 19.1063 96.6307 11.8317 86.9952 11.8317C77.3597 11.8317 71.0184 19.024 71.0184 31.4321ZM56.2219 31.4321C56.2219 12.0787 68.4654 0 87.0501 0C105.635 0 117.796 11.9964 117.796 31.4321C117.796 41.6441 114.419 49.7698 108.6 55.1778L111.949 60.0642C114.831 64.2643 111.812 69.9742 106.733 69.9742C104.564 69.9742 102.56 68.8761 101.407 67.0643L97.5366 61.1897C94.4072 62.2054 90.8659 62.7819 87.0501 62.7819C68.383 62.7819 56.2219 50.7855 56.2219 31.4321Z"
          fill="#ffffff"
        />
      </g>
    </svg>

    {/* --- glass icons -------------------------------------------------------------
        The HQ scenes' glass PNGs with a purple overlay BAKED IN by
        scripts/prep-fan-icons.py — a CSS tint would not survive the export. Positions and
        sizes are the reference's, measured. */}
    <Img className="hqf-i hqf-i-chat" style={spot(ICON.chat)} src={staticFile("img/glass/fan/chat.png")} alt="" />
    <Img className="hqf-i hqf-i-chat2" style={spot(ICON.chat2)} src={staticFile("img/glass/fan/chat.png")} alt="" />
    <svg className="hqf-i hqf-i-heart" style={spot(ICON.heart)} viewBox="0 0 64 64">
      <path
        d="M32 56S6 40.5 6 23.5C6 14.4 13.2 7 22.2 7c5.9 0 9.2 3 9.8 4.6C32.6 10 35.9 7 41.8 7 50.8 7 58 14.4 58 23.5 58 40.5 32 56 32 56Z"
        fill="#cfc2ff"
      />
    </svg>

    <Img className="hqf-i hqf-i-mag" style={spot(ICON.mag)} src={staticFile("img/glass/fan/mag.png")} alt="" />
    <svg className="hqf-i hqf-i-doc" style={spot(ICON.doc)} viewBox="0 0 56 56">
      <rect x="12" y="6" width="32" height="44" rx="5" fill="rgba(170,140,255,0.28)" stroke="#d6caff" strokeWidth="2.5" />
      <path d="M20 18h16M20 27h16M20 36h10" stroke="#d6caff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>

    <Img className="hqf-i hqf-i-rocket" style={spot(ICON.rocket)} src={staticFile("img/glass/fan/rocket.png")} alt="" />
    <Img className="hqf-i hqf-i-scale" style={spot(ICON.scale)} src={staticFile("img/glass/fan/scale.png")} alt="" />
    <Img className="hqf-i hqf-i-sparkle" style={spot(ICON.sparkle)} src={staticFile("img/glass/fan/sparkle.png")} alt="" />

    {/* --- labels ----------------------------------------------------------------- */}
    <div className="hqf-label" style={place(LABEL.comm)}>
      <div className="hqf-title">
        Communication
        <br />& Engagement
      </div>
      <div className="hqf-sub">
        Reach, engage, and
        <br />
        align every employee
      </div>
    </div>

    <div className="hqf-label" style={place(LABEL.search)}>
      <div className="hqf-title">
        Search &<br />
        Knowledge
      </div>
      <div className="hqf-sub">
        Find and access what
        <br />
        you need instantly
      </div>
    </div>

    <div className="hqf-label" style={place(LABEL.people)}>
      <div className="hqf-title">
        People
        <br />
        Intelligence
      </div>
      <div className="hqf-sub">
        Turn signals into insight,
        <br />
        action, and results
      </div>
    </div>
  </AbsoluteFill>
);

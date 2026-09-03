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
const R_IN = 120;
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

/** A point on a wedge's bisector, at a fraction of the way from hub to rim. */
const seat = (from: number, to: number, frac: number): Pt =>
  pt((from + to) / 2, R_IN + (R_OUT - R_IN) * frac);

/**
 * Where each wedge's highlight sits.
 *
 * The reference is lit from above the centre, so every wedge is brightest at the part of
 * its rim NEAREST the top — for the centre wedge that is its own apex, for the sides it
 * is the upper corner facing inward. Biasing the bisector 60% of the way toward 90°
 * puts the sheen there for all three without a per-wedge number.
 */
const sheenAt = (from: number, to: number): Pt => {
  const mid = (from + to) / 2;
  return pt(mid + (90 - mid) * 0.72, R_OUT * 0.86);
};

// Label seats, and the icon clusters as offsets from them — so moving a label by
// changing a fraction above moves its icons with it.
const COMM = seat(180, 119, 0.52);
const SEARCH = seat(119, 61, 0.62);
const PEOPLE = seat(61, 0, 0.52);

const at = (base: Pt, dx: number, dy: number): React.CSSProperties => ({
  left: base[0] + dx,
  top: base[1] + dy,
});

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
          const centre = w.key === "search";
          const light = w.key === "people";
          // Dark end -> light end, per wedge. The sides run outer-bottom corner to
          // top-inner corner; the centre runs hub to apex.
          const [x1, y1] = centre
            ? pt(90, R_IN)
            : pt(w.key === "comm" ? 176 : 4, R_OUT * 0.55);
          const [x2, y2] = centre
            ? pt(90, R_OUT)
            : pt(w.key === "comm" ? 116 : 64, R_OUT * 0.96);
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
              <stop
                offset="0"
                stopColor={centre ? "#4a2ce8" : "#3e2ccc"}
                stopOpacity={centre ? 0.84 : 0.62}
              />
              <stop
                offset="0.5"
                stopColor={centre ? "#5c3cf6" : "#5242dc"}
                stopOpacity={centre ? 0.88 : 0.6}
              />
              <stop
                offset="1"
                stopColor={centre ? "#7c5eff" : light ? "#7c72f2" : "#7266ee"}
                stopOpacity={centre ? 0.84 : light ? 0.5 : 0.54}
              />
            </linearGradient>
          );
        })}

        {/* A soft white sheen near the rim of each wedge — the "lit from above" haze. */}
        {WEDGES.map((w) => {
          const [cx, cy] = sheenAt(w.from, w.to);
          return (
            <radialGradient
              key={w.key}
              id={`hqf-s-${w.key}`}
              gradientUnits="userSpaceOnUse"
              cx={cx}
              cy={cy}
              r={360}
            >
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="0.35" stopColor="#dcd2ff" stopOpacity="0.14" />
              <stop offset="1" stopColor="#dcd2ff" stopOpacity="0" />
            </radialGradient>
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
        <linearGradient
          id="hqf-rim"
          gradientUnits="userSpaceOnUse"
          x1={CX}
          y1={CY - R_OUT}
          x2={CX}
          y2={CY}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
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
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#e8e2ff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#e8e2ff" stopOpacity="0" />
        </linearGradient>

        {/* Edge light. Brightest along the top of the rim, and still visible at the hub —
            a glass edge catches light along its whole length. */}
        <linearGradient
          id="hqf-edge"
          gradientUnits="userSpaceOnUse"
          x1={CX}
          y1={CY - R_OUT}
          x2={CX}
          y2={CY}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.28" />
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
            <path d={d} fill={`url(#hqf-s-${w.key})`} />
            {/* 16px stroke, clipped to the pane, so 8px of soft light sits just inside
                every edge and none of it spills into the gap. */}
            <g clipPath={`url(#hqf-c-${w.key})`}>
              <path
                d={d}
                fill="none"
                stroke="url(#hqf-rim)"
                strokeWidth="16"
                strokeLinejoin="round"
              />
            </g>
            <path
              d={d}
              fill="none"
              stroke="url(#hqf-edge)"
              strokeWidth="1.5"
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
        Real PNGs rather than drawn shapes: the same assets the HQ scenes use, so the
        fan matches them exactly. Each cluster is placed relative to its label. */}
    <Img className="hqf-i hqf-i-chat" style={at(COMM, -75, -147)} src={staticFile("img/glass/chat.png")} alt="" />
    <Img className="hqf-i hqf-i-chat2" style={at(COMM, 8, -94)} src={staticFile("img/glass/chat.png")} alt="" />
    <svg className="hqf-i hqf-i-heart" style={at(COMM, 5, -181)} width="60" height="60" viewBox="0 0 64 64">
      <path
        d="M32 56S6 40.5 6 23.5C6 14.4 13.2 7 22.2 7c5.9 0 9.2 3 9.8 4.6C32.6 10 35.9 7 41.8 7 50.8 7 58 14.4 58 23.5 58 40.5 32 56 32 56Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>

    <Img className="hqf-i hqf-i-mag" style={at(SEARCH, 3, -127)} src={staticFile("img/glass/mag.png")} alt="" />
    <svg className="hqf-i hqf-i-doc" style={at(SEARCH, -91, -110)} width="52" height="52" viewBox="0 0 56 56">
      <rect x="12" y="6" width="32" height="44" rx="5" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
      <path d="M20 18h16M20 27h16M20 36h10" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>

    <Img className="hqf-i hqf-i-rocket" style={at(PEOPLE, -20, -107)} src={staticFile("img/glass/rocket.png")} alt="" />
    <Img className="hqf-i hqf-i-scale" style={at(PEOPLE, 27, -182)} src={staticFile("img/glass/scale.png")} alt="" />
    <Img className="hqf-i hqf-i-sparkle" style={at(PEOPLE, 112, -135)} src={staticFile("img/hq-sparkle-NEW.png")} alt="" />

    {/* --- labels ----------------------------------------------------------------- */}
    <div className="hqf-label" style={at(COMM, 0, 0)}>
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

    <div className="hqf-label" style={at(SEARCH, 0, 0)}>
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

    <div className="hqf-label" style={at(PEOPLE, 0, 0)}>
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

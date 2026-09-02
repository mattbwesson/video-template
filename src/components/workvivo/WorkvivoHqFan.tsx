import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./WorkvivoHqFanStyles.css";

/**
 * The HQ capability fan — three glass wedges radiating from the HQ mark.
 *
 * Geometry is computed, not hand-drawn. Everything hangs off `C`, `R_IN` and `R_OUT`
 * below, so nudging the fan is changing three numbers rather than re-authoring nine path
 * commands, and the three wedges stay concentric by construction.
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
 */

const W = 1920;
const H = 1080;

/** Fan origin — the centre of the HQ badge. */
const CX = 960;
const CY = 858;
const R_IN = 120;
const R_OUT = 725;

/** Badge and its halo. */
const BADGE_R = 102;
const RING_R = 113;

/**
 * Wedge spans, in degrees CCW from the +x axis. The fan is a half-circle split three ways
 * with a 6° gap between each, and the centre wedge is narrower so the eye lands on it.
 */
const WEDGES = [
  { key: "comm", from: 180, to: 122 },
  { key: "search", from: 116, to: 64 },
  { key: "people", from: 58, to: 0 },
] as const;

const pt = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  // Minus on y because SVG's y grows downward while the angle is measured the maths way.
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};

/**
 * An annular sector.
 *
 * Sweep flags are the fiddly part: `from > to` walks clockwise **on screen** (again, the
 * flipped y), so the outer arc takes sweep 1 and the inner arc, retraced the other way,
 * takes 0. Large-arc is always 0 — no wedge here reaches 180°.
 */
const wedgePath = (from: number, to: number): string => {
  const [x1, y1] = pt(from, R_OUT);
  const [x2, y2] = pt(to, R_OUT);
  const [x3, y3] = pt(to, R_IN);
  const [x4, y4] = pt(from, R_IN);
  return [
    `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    `L ${x3.toFixed(1)} ${y3.toFixed(1)}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)}`,
    "Z",
  ].join(" ");
};

/** Where a wedge's label block sits: on its bisector, at a given fraction of the radius. */
const seat = (from: number, to: number, frac: number): [number, number] =>
  pt((from + to) / 2, R_IN + (R_OUT - R_IN) * frac);

const COMM = seat(180, 122, 0.52);
const SEARCH = seat(116, 64, 0.62);
const PEOPLE = seat(58, 0, 0.52);

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
        {/* The field: near-black navy in the corners, lifting to violet at the bottom
            left of centre, which is where the reference's light source sits. */}
        <linearGradient id="hqf-field" x1="0.8" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#090717" />
          <stop offset="0.34" stopColor="#120b30" />
          <stop offset="0.62" stopColor="#241456" />
          <stop offset="0.85" stopColor="#4d2cb0" />
          <stop offset="1" stopColor="#7b4ee6" />
        </linearGradient>
        <radialGradient id="hqf-bloom" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8a5cff" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#6a3ce0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#4a25b0" stopOpacity="0" />
        </radialGradient>

        {/* Each wedge lightens toward its outer arc, so the fan reads as lit from below. */}
        <linearGradient id="hqf-w-comm" x1="0.1" y1="1" x2="0.7" y2="0">
          <stop offset="0" stopColor="#3a22c4" stopOpacity="0.88" />
          <stop offset="1" stopColor="#5233e8" stopOpacity="0.86" />
        </linearGradient>
        <linearGradient id="hqf-w-search" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#5a30f2" stopOpacity="0.90" />
          <stop offset="1" stopColor="#6f45ff" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="hqf-w-people" x1="0.9" y1="1" x2="0.3" y2="0">
          <stop offset="0" stopColor="#4326d4" stopOpacity="0.88" />
          <stop offset="1" stopColor="#5b39ee" stopOpacity="0.84" />
        </linearGradient>

        {/* Edge light. Brightest at the top of the arc, gone by the straight edges. */}
        <linearGradient id="hqf-edge" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>

        {/* The halo: a cyan-to-violet sweep, which is why it is a gradient on a stroked
            circle rather than a flat ring colour. */}
        <linearGradient id="hqf-ring" x1="0.05" y1="0.15" x2="0.85" y2="1">
          <stop offset="0" stopColor="#8ff2e4" />
          <stop offset="0.28" stopColor="#a6b4ff" stopOpacity="0.8" />
          <stop offset="0.62" stopColor="#7a5cf0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#7a5cf0" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="hqf-ring-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#8fe6ff" stopOpacity="0" />
          <stop offset="0.78" stopColor="#8fe6ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#8fe6ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#hqf-field)" />
      {/* Two blooms, not one. The wide one sets the violet wash across the lower canvas;
          the tight one sits under the badge, which is the brightest point in the
          reference and what makes the mark read as the light source. */}
      <ellipse cx={CX - 250} cy={CY + 150} rx={880} ry={430} fill="url(#hqf-bloom)" />
      <ellipse cx={CX} cy={CY + 90} rx={430} ry={300} fill="url(#hqf-bloom)" />

      {WEDGES.map((w) => (
        <g key={w.key}>
          <path d={wedgePath(w.from, w.to)} fill={`url(#hqf-w-${w.key})`} />
          <path
            d={wedgePath(w.from, w.to)}
            fill="none"
            stroke="url(#hqf-edge)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* Badge halo, then the badge, in DOM order — the renderer ignores z-index. */}
      <circle cx={CX} cy={CY} r={RING_R + 26} fill="url(#hqf-ring-glow)" />
      <circle
        cx={CX}
        cy={CY}
        r={RING_R}
        fill="none"
        stroke="url(#hqf-ring)"
        strokeWidth="3.5"
      />
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
        Real PNGs rather than drawn shapes: these are the same assets the HQ scenes use,
        so the fan matches them exactly instead of approximating them. */}
    <Img className="hqf-i hqf-i-chat" src={staticFile("img/glass/chat.png")} alt="" />
    <Img className="hqf-i hqf-i-chat2" src={staticFile("img/glass/chat.png")} alt="" />
    <Img className="hqf-i hqf-i-mag" src={staticFile("img/glass/mag.png")} alt="" />
    <Img className="hqf-i hqf-i-rocket" src={staticFile("img/glass/rocket.png")} alt="" />
    <Img className="hqf-i hqf-i-scale" src={staticFile("img/glass/scale.png")} alt="" />
    <Img
      className="hqf-i hqf-i-sparkle"
      src={staticFile("img/hq-sparkle-NEW.png")}
      alt=""
    />

    {/* Heart and document have no asset in the library, so they are drawn — inline, and
        in the same glassy white as the PNGs so the cluster reads as one set. */}
    <svg className="hqf-i hqf-i-heart" width="64" height="64" viewBox="0 0 64 64">
      <path
        d="M32 56S6 40.5 6 23.5C6 14.4 13.2 7 22.2 7c5.9 0 9.2 3 9.8 4.6C32.6 10 35.9 7 41.8 7 50.8 7 58 14.4 58 23.5 58 40.5 32 56 32 56Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>
    <svg className="hqf-i hqf-i-doc" width="56" height="56" viewBox="0 0 56 56">
      <rect
        x="12"
        y="6"
        width="32"
        height="44"
        rx="5"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
      />
      <path
        d="M20 18h16M20 27h16M20 36h10"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>

    {/* --- labels ----------------------------------------------------------------- */}
    <div className="hqf-label" style={{ left: COMM[0], top: COMM[1] }}>
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

    <div className="hqf-label" style={{ left: SEARCH[0], top: SEARCH[1] }}>
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

    <div className="hqf-label" style={{ left: PEOPLE[0], top: PEOPLE[1] }}>
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

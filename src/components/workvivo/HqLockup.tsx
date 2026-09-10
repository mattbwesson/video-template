import React from "react";

/**
 * The `workvivo HQ` lockup — wordmark, rounded square and the HQ letters, with the square's
 * stroke gradient turning slowly.
 *
 * The artwork is public/img/hq-logo2.svg, inlined. Two notes on why it is inlined and why
 * it is THIS file:
 *
 *  - Inline, not `<Img src={staticFile("...svg")}>`. An SVG loaded through an <img> comes
 *    out garbled in this project's export; see docs/browser-render-best-practices.md and
 *    the same note in WorkvivoHqFan.
 *
 *  - This file rather than public/refs/hq-opening's workvivo-hq-nosquare.svg, which the
 *    reference package used. That one is the wordmark cut into eleven pieces — seven
 *    <path>s, three <polygon>s and a <rect> — and reassembling it by pattern-matching the
 *    markup produced a wordmark with a wedge where the "i" should be. This artwork carries
 *    the whole wordmark as a single path, so there is nothing to reassemble and nothing to
 *    get wrong. It also fits the reference better: its aspect is 3.86 against the film's
 *    measured 3.87, where the other artwork is 3.905.
 *
 * The gradient is the artwork's own — white to white at 0.3 alpha, running about 141
 * degrees — rebuilt as a line across the square's box so the angle can turn.
 */

/** The artwork's viewBox. Every coordinate below is in these units. */
const ART_W = 665;
const ART_H = 172;

/** The square's box, read off its path: 166x166 at (495.5, 2.77), 5.545 stroke. */
const SQ = { x: 495.501, y: 2.77261, size: 166 };

/** The artwork's own gradient angle, as a CSS angle: its vector is (165.56, 202.87). */
const BASE_ANGLE = 140.8;

/** A CSS gradient angle as an SVG userSpaceOnUse line across the given box. */
const gradientLine = (x: number, y: number, w: number, h: number, deg: number) => {
  const t = (deg * Math.PI) / 180;
  const dx = Math.sin(t);
  const dy = -Math.cos(t);
  const len = Math.abs(w * Math.sin(t)) + Math.abs(h * Math.cos(t));
  const cx = x + w / 2;
  const cy = y + h / 2;
  return { x1: cx - (dx * len) / 2, y1: cy - (dy * len) / 2, x2: cx + (dx * len) / 2, y2: cy + (dy * len) / 2 };
};

export interface HqLockupProps {
  /** Rendered width of the whole lockup, square included. */
  width: number;
  /** Degrees the square's stroke gradient has turned from the artwork's own angle. */
  gradientAngle?: number;
  style?: React.CSSProperties;
}

export const HqLockup: React.FC<HqLockupProps> = ({ width, gradientAngle = 0, style }) => {
  const g = gradientLine(SQ.x, SQ.y, SQ.size, SQ.size, BASE_ANGLE + gradientAngle);
  const id = "hql-stroke";
  return (
    <svg
      width={width}
      height={(width * ART_H) / ART_W}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* workvivo */}
      <path d="M20.6436 119.03L0 55.2327H8.23549L25.53 110.795L42.001 55.2327H51.5542L68.1349 110.795L85.1824 55.2327H93.5277L73.1311 119.03H63.1113L46.7776 65.1153L30.4439 119.03H20.6711H20.6436ZM102.889 87.1864C102.889 101.626 110.273 113.073 125.07 113.073C139.866 113.073 147.141 101.626 147.141 87.1864C147.141 72.7468 139.756 61.1897 125.07 61.1897C110.383 61.1897 102.889 72.637 102.889 87.1864ZM94.7905 87.0766C94.7905 67.2839 106.704 53.915 125.07 53.915C143.435 53.915 155.239 67.2839 155.239 87.0766C155.239 106.869 143.325 120.348 125.07 120.348C106.814 120.348 94.7905 106.979 94.7905 87.0766ZM165.176 119.03V55.2327H172.341L172.698 69.0683C175.443 59.6524 181.291 55.2327 190.597 55.2327H197.514V63.4682H189.993C179.012 63.4682 173.055 70.9899 173.055 81.7235V119.058H165.176V119.03ZM203.719 119.03V31.3772H211.46V88.1472L249.755 55.2327H260.379L230.676 80.8725L262.053 119.03H252.28L224.966 85.7589L211.487 97.5631V119.03H203.746H203.719ZM285.689 119.03L261.12 55.2327H269.465L290.575 111.152L311.686 55.2327H320.031L295.352 119.03H285.689ZM326.372 119.03V55.2327H334.114V119.03H326.372ZM325.549 43.8952V32.6949H334.855V43.8952H325.549ZM364.887 119.03L340.318 55.2327H348.663L369.773 111.152L390.884 55.2327H399.229L374.55 119.03H364.887ZM407.574 87.1864C407.574 101.626 414.959 113.073 429.755 113.073C444.552 113.073 451.826 101.626 451.826 87.1864C451.826 72.7468 444.442 61.1897 429.755 61.1897C415.069 61.1897 407.574 72.637 407.574 87.1864ZM399.449 87.0766C399.449 67.2839 411.363 53.915 429.728 53.915C448.093 53.915 459.897 67.2839 459.897 87.0766C459.897 106.869 447.983 120.348 429.728 120.348C411.472 120.348 399.449 106.979 399.449 87.0766Z" fill="#ffffff" />
      {/* the rounded square */}
      <path d="M643.493 2.77261H513.51C503.564 2.77261 495.501 10.8352 495.501 20.7809V150.764C495.501 160.71 503.564 168.773 513.51 168.773H643.493C653.439 168.773 661.501 160.71 661.501 150.764V20.7809C661.501 10.8352 653.439 2.77261 643.493 2.77261Z" stroke={`url(#${id})`} strokeWidth="5.54523" />
      {/* H */}
      <path d="M520.593 116.285V55.864H534.95V79.9391H557.186V55.864H571.625V116.285H557.186V91.6884H534.95V116.285H520.593Z" fill="#ffffff" />
      {/* Q */}
      <path d="M591.611 86.1156C591.611 98.3591 597.87 105.634 607.588 105.634C617.306 105.634 623.565 98.4414 623.565 86.1156C623.565 73.7899 617.223 66.5152 607.588 66.5152C597.952 66.5152 591.611 73.7075 591.611 86.1156ZM576.814 86.1156C576.814 66.7622 589.058 54.6835 607.643 54.6835C626.227 54.6835 638.388 66.6799 638.388 86.1156C638.388 96.3276 635.012 104.453 629.192 109.861L632.541 114.748C635.424 118.948 632.404 124.658 627.325 124.658C625.157 124.658 623.153 123.56 622 121.748L618.129 115.873C615 116.889 611.458 117.465 607.643 117.465C588.976 117.465 576.814 105.469 576.814 86.1156Z" fill="#ffffff" />
    </svg>
  );
};

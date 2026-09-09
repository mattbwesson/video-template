import React from "react";
import { useT } from "../../customize/uiStrings";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./WorkvivoHqFanStyles.css";

/**
 * The HQ capability fan — three glass wedges radiating from the HQ mark.
 *
 * Every number in this file is MEASURED from docs/reference/hq-fan-original.png at
 * 1920x1080, not designed. Where the measurement disagrees with what looked right, the
 * measurement won, and the disagreements are the interesting part:
 *
 * - The fan is not concentric with the badge. The rim fits a circle at (950, 869)
 *   R=740 to 1.9px; the badge disc is centred at (961, 864). Both are kept as they are.
 * - The three wedges are 60° each, with the two internal gaps 36px wide and constant
 *   from hub to rim, and the two OUTER edges inset 5px from the 180°/0° radials.
 * - The fill axes are not the supplied angles. The supplied 45/-11/-65 are what the
 *   design tool reports; the composite on screen — that fill, translucent, over a field
 *   that brightens toward the bottom-left — regresses to 69°/123°/180° CSS with R² of
 *   0.52/0.89/0.87, and its stops land INSIDE the wedge rather than on the bounding-box
 *   corners. `FILL_LINE` is that fit, endpoint for endpoint.
 * - The field is a bitmap. It is the reference's own pixels outside the fan and an
 *   inpainted continuation under it (scripts/prep-fan-field.py), because the mesh it
 *   is cannot be stated in SVG and three blooms over a diagonal were wrong everywhere
 *   the eye lands.
 *
 * BUILT AS ONE INLINE <svg> ON PURPOSE. The CSS equivalents — conic-gradient wedges,
 * radial-gradient glows, a pseudo-element ring — render in the Player and export as a
 * flat rectangle: the browser renderer paints no radial-gradient, never draws
 * pseudo-elements, and ignores z-index. See docs/browser-render-best-practices.md.
 */

const W = 1920;
const H = 1080;

// ── Geometry, measured ───────────────────────────────────────────────────────────────

/** Fan origin: the rim circle's centre. NOT the badge centre — see the header. */
const FX = 950;
const FY = 869;
const R_OUT = 740;
/** Well inside the badge disc, so the tips are hidden by it. */
const R_IN = 70;

/** Internal gaps, constant width; outer edges sit 5px inside the horizontal. */
const GAP = 36;
const OUTER_INSET = 5;
const CORNER = 17;

/** Badge disc and its ring, measured from the disc's own centre. */
const BX = 961;
const BY = 864;
const BADGE_R = 117;
const RING_R = 121;
/** The HQ mark box's centre — 2px left and 2px below the disc centre, per the reference. */
const MX = 958;
const MY = 862;

const WEDGES = [
  { key: "comm", from: 180, to: 120 },
  { key: "search", from: 120, to: 60 },
  { key: "people", from: 60, to: 0 },
] as const;
type Key = (typeof WEDGES)[number]["key"];

type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

const pt = (angle: number, r: number): Pt => {
  const a = rad(angle);
  // Minus on y because SVG's y grows downward while the angle is measured the maths way.
  return [FX + r * Math.cos(a), FY - r * Math.sin(a)];
};

/**
 * Where a wedge's straight edge meets a circle of radius `r`, once the edge has been
 * pushed inward by half the gap — or by the smaller outer inset on the fan's own two
 * boundaries. A perpendicular offset of `d` shows up on a circle as `asin(d / r)`.
 */
const edgeAt = (boundary: number, r: number, side: "from" | "to"): number => {
  const inset = boundary === 180 || boundary === 0 ? OUTER_INSET : GAP / 2;
  const shift = deg(Math.asin(inset / r));
  return side === "from" ? boundary - shift : boundary + shift;
};

const along = (a: Pt, b: Pt, dist: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  return [a[0] + (dx / len) * dist, a[1] + (dy / len) * dist];
};

const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/**
 * An annular sector with parallel gaps and rounded corners. Corners in screen order:
 * P1 outer-left, P2 outer-right, P3 inner-right, P4 inner-left. The outer arc walks
 * clockwise on screen (sweep 1); the inner arc is retraced (sweep 0). Each corner is a
 * quadratic fillet: both edges trimmed by CORNER, the corner itself the control point.
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
 * A CSS-style `linear-gradient(θ)` over a wedge's bounding box: the line through the
 * centre, sized to the box's projection. Used for the EDGE light, whose direction was
 * read off the rim's brightness by angle. The fills do not use it — see FILL_LINE.
 */
const cssGradientLine = (from: number, to: number, thetaDeg: number): [Pt, Pt] => {
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
  return [[cx - (dx * len) / 2, cy - (dy * len) / 2], [cx + (dx * len) / 2, cy + (dy * len) / 2]];
};

// ── Fills, fitted ────────────────────────────────────────────────────────────────────

/**
 * The supplied stops are #1d1470 -> #580fe6. Diffed against the reference, the render came
 * out 14 lower in BLUE at every sample — all three panes, hub to rim, red and green within
 * ±2 — which is the export's colour-profile conversion showing, not the gradient's shape.
 * At FILL_ALPHA that is +16 on the stop, so these are the supplied values with that lift.
 */
const FILL_FROM = "#1d1480";
const FILL_TO = "#580ff6";
/** Fitted fill opacity over the field bitmap; the diff against the reference chose it. */
const FILL_ALPHA = 0.86;

/**
 * The gradient line per pane — where the fill is exactly FILL_FROM and exactly FILL_TO —
 * regressed from the reference's pixels. The supplied design angles (45, -11, -65) are
 * what the tool says; these are what the screen shows once the field is under it.
 */
const FILL_LINE: Record<Key, [Pt, Pt]> = {
  comm: [[-456, 1070], [700, 621]],
  search: [[590, 231], [1042, 527]],
  people: [[1303, 154], [1306, 784]],
};

/**
 * Edge light per pane: where the 1.5px rim line is brightest, read off the rim by angle.
 * Left is lit from the BOTTOM-left (the field is brightest there), centre from the top,
 * right from the top-left. `lit` is the CSS angle toward the bright end.
 */
const EDGE: Record<Key, { lit: number; dim: number; bright: number }> = {
  comm: { lit: 225, dim: 0.22, bright: 0.34 },
  search: { lit: 0, dim: 0.22, bright: 0.4 },
  people: { lit: -45, dim: 0.22, bright: 0.46 },
};

// ── Text and icons, measured ─────────────────────────────────────────────────────────

/** Title-block top-centre. The .hqf-label is anchored at its top so a baseline can be hit. */
const LABEL: Record<Key, Pt> = {
  comm: [526, 615],
  search: [955, 368],
  people: [1365, 615],
};

/**
 * Icon ink centre and size from the reference; then how much of its canvas each PNG's
 * ink fills and where the ink's centre sits (alpha > 40 bbox), so `spot` sizes the box
 * for the INK and lands the ink's centre — not the canvas's — on the point.
 */
type IconSpot = { x: number; y: number; ink: number; frac: number; cx: number; cy: number };
const ICON: Record<string, IconSpot> = {
  chat: { x: 478, y: 512, ink: 104, frac: 0.59, cx: 0.506, cy: 0.494 },
  chat2: { x: 579, y: 555, ink: 67, frac: 0.59, cx: 0.506, cy: 0.494 },
  heart: { x: 573, y: 482, ink: 33, frac: 0.81, cx: 0.5, cy: 0.49 },
  mag: { x: 960, y: 238, ink: 122, frac: 0.676, cx: 0.5, cy: 0.471 },
  doc: { x: 859, y: 249, ink: 37, frac: 0.786, cx: 0.5, cy: 0.5 },
  chip: { x: 1044, y: 276, ink: 24, frac: 0.8, cx: 0.5, cy: 0.5 },
  target: { x: 1357, y: 460, ink: 34, frac: 0.9, cx: 0.5, cy: 0.5 },
  rocket: { x: 1308, y: 518, ink: 80, frac: 0.566, cx: 0.498, cy: 0.486 },
  sparkle: { x: 1416, y: 512, ink: 105, frac: 0.878, cx: 0.504, cy: 0.502 },
};
const spot = ({ x, y, ink, frac, cx, cy }: IconSpot, opacity = 1): React.CSSProperties => {
  const box = ink / frac;
  return { left: x - (cx - 0.5) * box, top: y - (cy - 0.5) * box, width: box, height: box, opacity };
};
const place = ([x, y]: Pt, opacity = 1): React.CSSProperties => ({ left: x, top: y, opacity });

/**
 * What a wedge looks like with its fill off.
 *
 * The reference reveals the three panes one at a time — Communication arrives with the fan,
 * Search fills at global 285-293, People at 306-313 — and drops the last two back to glass
 * at 393-399. An unfilled pane is not hidden: the rim, the label and the icons stay, all
 * much fainter, and the field reads almost straight through.
 *
 * These two fractions are fitted by whole-frame MAE against the reference, the same way
 * every other number in this file was; see the header.
 */
const GLASS_FILL = 0.14;
/**
 * 0.20, solved rather than chosen. An unlit label's peak whiteness in the reference is
 * 69-76 out of 255, measured at three places across both beats the fan appears in; undoing
 * the composite over the field puts the ink at 0.20. The first value here was 0.42, which
 * rendered those labels at 122 — comfortably readable where the reference's are ghosts. It
 * survived a whole-frame MAE check because three faint labels are a small share of a 1920
 * x 1080 frame, which is exactly the kind of thing an average hides.
 */
const GLASS_INK = 0.2;

/** Specks in the halo's upper half: angle from the badge, distance beyond the ring, r, α. */
const SPECKS: [number, number, number, number][] = [
  [120, 30, 2.2, 0.85],
  [100, 46, 1.5, 0.6],
  [76, 36, 1.8, 0.8],
  [146, 50, 1.3, 0.5],
  [56, 56, 1.4, 0.55],
  [94, 66, 1.1, 0.4],
];
const bpt = (angle: number, r: number): Pt => [BX + r * Math.cos(rad(angle)), BY - r * Math.sin(rad(angle))];

export interface WorkvivoHqFanProps {
  /**
   * Per-pane fill, 0 = glass and 1 = filled. Defaults to all filled, which is the state
   * the whole file was measured in and what every existing caller — the gallery entry, the
   * `WorkvivoHqFan` composition — renders today.
   */
  fills?: Partial<Record<Key, number>>;
  /**
   * Draw the built-in field bitmap. Off for a caller that supplies its own background: the
   * opening sequence animates the field across 29 keyframes, and the static one underneath
   * would show as a hard rectangle of the wrong mesh.
   */
  field?: boolean;
}

export const WorkvivoHqFan: React.FC<WorkvivoHqFanProps> = ({ fills, field = true }) => {
  /**
   * The pane labels are the only words in this file, and they are product chrome — the
   * three capabilities HQ is built around, not anything about a customer — so they go
   * through `ui()` rather than the copy table.
   *
   * Each label is looked up WHOLE and the translation supplies its own line break, rather
   * than looking up each line separately. Splitting first collides: the fan's "People"
   * (as in People Intelligence) and the side nav's "People" are the same key and want
   * different words — the nav's is already "メンバー", which is wrong here. Keying on the
   * whole label makes each one unambiguous, and it lets a translation break where its own
   * language wants to instead of where English did.
   *
   * The break is still a <br />, not white-space:pre-line: the exporter rewraps every text
   * node in spans and a bare newline does not reliably survive that.
   */
  const t = useT();
  const label = (s: string) =>
    t(s)
      .split("\n")
      .map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ));
  const fill = (k: Key) => fills?.[k] ?? 1;
  /** Fill alpha for a pane: full when filled, GLASS_FILL of it when not. */
  const paneAlpha = (k: Key) => FILL_ALPHA * (GLASS_FILL + (1 - GLASS_FILL) * fill(k));
  /** Label and icon opacity, on the same ramp. */
  const ink = (k: Key) => GLASS_INK + (1 - GLASS_INK) * fill(k);

  return (
  <AbsoluteFill className="hqf" style={field ? undefined : { background: "transparent" }}>
    {/* The reference's own field. See the header and scripts/prep-fan-field.py. */}
    {field && <Img className="hqf-field" src={staticFile("img/hq-fan-field.png")} alt="" />}

    <svg className="hqf-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {WEDGES.map((w) => {
          const [[x1, y1], [x2, y2]] = FILL_LINE[w.key];
          const [[ex1, ey1], [ex2, ey2]] = cssGradientLine(w.from, w.to, EDGE[w.key].lit);
          return (
            <React.Fragment key={w.key}>
              <linearGradient id={`hqf-w-${w.key}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0" stopColor={FILL_FROM} stopOpacity={paneAlpha(w.key)} />
                <stop offset="1" stopColor={FILL_TO} stopOpacity={paneAlpha(w.key)} />
              </linearGradient>
              {/* The rim and the edge light dim with the pane too. Leaving them at full
                  strength was the first attempt and it read wrong immediately: an unfilled
                  pane became a bright empty outline, where the reference's is barely there. */}
              <linearGradient id={`hqf-edge-${w.key}`} gradientUnits="userSpaceOnUse" x1={ex1} y1={ey1} x2={ex2} y2={ey2}>
                <stop offset="0" stopColor="#ffffff" stopOpacity={EDGE[w.key].dim * ink(w.key)} />
                <stop offset="1" stopColor="#ffffff" stopOpacity={EDGE[w.key].bright * ink(w.key)} />
              </linearGradient>
              <linearGradient id={`hqf-rim-${w.key}`} gradientUnits="userSpaceOnUse" x1={ex1} y1={ey1} x2={ex2} y2={ey2}>
                <stop offset="0" stopColor="#ffffff" stopOpacity={0.03 * ink(w.key)} />
                <stop offset="1" stopColor="#ffffff" stopOpacity={0.1 * ink(w.key)} />
              </linearGradient>
              <clipPath id={`hqf-c-${w.key}`}>
                <path d={wedgePath(w.from, w.to)} />
              </clipPath>
            </React.Fragment>
          );
        })}

        {/* Ring: near-white at the top, lavender at the bottom, dim at the sides — sampled
            at r=122: top #f1e1ff, bottom #bac2e7, sides #6b73ce. */}
        <linearGradient id="hqf-box" gradientUnits="userSpaceOnUse" x1={MX} y1={MY - 50} x2={MX} y2={MY + 50}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#d8d8ee" stopOpacity="0.5" />
        </linearGradient>
        {/* The disc is not flat: near-black at the centre, lifting to a navy band inside
            its edge (ref mean over r60-112 is #090a2b against a flat #0c0a1f). */}
        <radialGradient id="hqf-disc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#06041a" />
          <stop offset="0.78" stopColor="#080628" />
          <stop offset="1" stopColor="#11103a" />
        </radialGradient>
        {/* Ring, sampled at r=121 around the circle and placed on a vertical gradient by
            (1 - sin θ) / 2: the highlight is a NARROW band at the very top — #f1e1ff at
            90°, already #6b6ad8 by 45° — with a softer lift at the bottom. A two-stop
            gradient lit the whole upper half and was 34/255 off in the ring band. */}
        <linearGradient id="hqf-ring" gradientUnits="userSpaceOnUse" x1={BX} y1={BY - RING_R} x2={BX} y2={BY + RING_R}>
          <stop offset="0" stopColor="#f1e1ff" />
          <stop offset="0.146" stopColor="#7c7bd5" />
          <stop offset="0.5" stopColor="#6c75b8" />
          <stop offset="0.854" stopColor="#979cc2" />
          <stop offset="1" stopColor="#bac2e7" />
        </linearGradient>
        {/* Halo: the radial profile from the badge centre — +106 lum at the ring, +52 at
            r132, +17 at r140, gone by r150 — as stops on a circle of r=152. */}
        <radialGradient id="hqf-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.66" stopColor="#dfe6ff" stopOpacity="0" />
          <stop offset="0.77" stopColor="#dfe6ff" stopOpacity="0.07" />
          <stop offset="0.8" stopColor="#dfe6ff" stopOpacity="0.36" />
          <stop offset="0.868" stopColor="#cfe0ff" stopOpacity="0.2" />
          <stop offset="0.92" stopColor="#cfe0ff" stopOpacity="0.06" />
          <stop offset="0.97" stopColor="#cfe0ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {WEDGES.map((w) => {
        const d = wedgePath(w.from, w.to);
        return (
          <g key={w.key}>
            <path d={d} fill={`url(#hqf-w-${w.key})`} />
            <g clipPath={`url(#hqf-c-${w.key})`}>
              <path d={d} fill="none" stroke={`url(#hqf-rim-${w.key})`} strokeWidth="12" strokeLinejoin="round" />
            </g>
            <path d={d} fill="none" stroke={`url(#hqf-edge-${w.key})`} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* Disc, halo, ring, specks, mark — in DOM order, since the export ignores z-index.
          The disc goes under the halo so the halo's inner stops read as a glow on the
          disc's edge, which the reference has (lum 15 -> 38 across r104..116). */}
      <circle cx={BX} cy={BY} r={BADGE_R} fill="url(#hqf-disc)" />
      <circle cx={BX} cy={BY} r={152} fill="url(#hqf-halo)" />
      <circle cx={BX} cy={BY} r={RING_R} fill="none" stroke="url(#hqf-ring)" strokeWidth="6" />
      {SPECKS.map(([a, dist, r, o], i) => {
        const [x, y] = bpt(a, RING_R + dist);
        return <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" fillOpacity={o} />;
      })}
      {/* The mark's box is SQUARE — 100x100 at (958, 862) — with a 2px outline that is
          bright at the top and about half that at the bottom. A white-threshold bbox read
          it as 100x74 because the dim bottom edge fell under the threshold; the 3x crop
          against the reference caught that. The letters are centred in it. */}
      <rect x={MX - 50} y={MY - 50} width={100} height={100} rx={12} fill="none" stroke="url(#hqf-box)" strokeWidth="2.2" />
      {/* Inlined from public/img/hq-logo.svg (viewBox 0 0 118 70) — SVG through an <img>
          comes out garbled in the export. */}
      <g transform={`translate(${MX - 35 + 3} ${MY - 20.8 + 4}) scale(${70 / 118})`}>
        <path d="M0 61.6015V1.18048H14.3572V25.2556H36.593V1.18048H51.0326V61.6015H36.593V37.0049H14.3572V61.6015H0Z" fill="#ffffff" />
        <path d="M71.0184 31.4321C71.0184 43.6755 77.2773 50.9502 86.9952 50.9502C96.7131 50.9502 102.972 43.7579 102.972 31.4321C102.972 19.1063 96.6307 11.8317 86.9952 11.8317C77.3597 11.8317 71.0184 19.024 71.0184 31.4321ZM56.2219 31.4321C56.2219 12.0787 68.4654 0 87.0501 0C105.635 0 117.796 11.9964 117.796 31.4321C117.796 41.6441 114.419 49.7698 108.6 55.1778L111.949 60.0642C114.831 64.2643 111.812 69.9742 106.733 69.9742C104.564 69.9742 102.56 68.8761 101.407 67.0643L97.5366 61.1897C94.4072 62.2054 90.8659 62.7819 87.0501 62.7819C68.383 62.7819 56.2219 50.7855 56.2219 31.4321Z" fill="#ffffff" />
      </g>
    </svg>

    {/* Glass PNGs with the purple overlay baked in by scripts/prep-fan-icons.py — a CSS
        tint would not survive the export. Three have no asset and are drawn: the heart,
        the document, the target, and the small chip beside the loupe. */}
    {/* The four drawn icons are a positioned <div> around an svg that fills it, not a
        positioned svg. The export serialises an inline svg's own style attribute into the
        image it draws, so `left/top` on the root moved the glyph out of its viewport and
        `opacity` on the root was applied twice — once baked in, once by the renderer — which
        is why the unlit icons came out at a third of their intended strength. The <Img>
        icons are untouched: an <img> is drawn as a replaced element and never serialised. */}
    <Img className="hqf-i" style={spot(ICON.chat, ink("comm"))} src={staticFile("img/glass/fan/chat.png")} alt="" />
    <Img className="hqf-i" style={spot(ICON.chat2, ink("comm"))} src={staticFile("img/glass/fan/chat.png")} alt="" />
    <div className="hqf-i" style={spot(ICON.heart, ink("comm"))}>
      <svg viewBox="0 0 64 64" style={{ display: "block", width: "100%", height: "100%" }}>
      <path d="M32 56S6 40.5 6 23.5C6 14.4 13.2 7 22.2 7c5.9 0 9.2 3 9.8 4.6C32.6 10 35.9 7 41.8 7 50.8 7 58 14.4 58 23.5 58 40.5 32 56 32 56Z" fill="#e9e2ff" />
    </svg>
    </div>

    <Img className="hqf-i" style={spot(ICON.mag, ink("search"))} src={staticFile("img/glass/fan/mag.png")} alt="" />
    <div className="hqf-i" style={spot(ICON.doc, ink("search"))}>
      <svg viewBox="0 0 56 56" style={{ display: "block", width: "100%", height: "100%" }}>
      <rect x="12" y="6" width="32" height="44" rx="5" fill="rgba(190,170,255,0.3)" stroke="#dcd2ff" strokeWidth="2.5" />
      <path d="M20 18h16M20 27h16M20 36h10" stroke="#dcd2ff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
    </div>
    <div className="hqf-i" style={spot(ICON.chip, ink("search"))}>
      <svg viewBox="0 0 40 40" style={{ display: "block", width: "100%", height: "100%" }}>
      <rect x="4" y="4" width="32" height="32" rx="7" fill="rgba(190,170,255,0.3)" stroke="#dcd2ff" strokeWidth="2.5" />
      <circle cx="14" cy="20" r="2.6" fill="#f0eaff" /><circle cx="20" cy="20" r="2.6" fill="#f0eaff" /><circle cx="26" cy="20" r="2.6" fill="#f0eaff" />
    </svg>
    </div>

    <div className="hqf-i" style={spot(ICON.target, ink("people"))}>
      <svg viewBox="0 0 40 40" style={{ display: "block", width: "100%", height: "100%" }}>
      <circle cx="20" cy="20" r="16" fill="rgba(190,170,255,0.25)" stroke="#e6e0ff" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="#e6e0ff" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="3.2" fill="#f4f0ff" />
    </svg>
    </div>
    <Img className="hqf-i" style={spot(ICON.rocket, ink("people"))} src={staticFile("img/glass/fan/rocket.png")} alt="" />
    <Img className="hqf-i" style={spot(ICON.sparkle, ink("people"))} src={staticFile("img/glass/fan/sparkle.png")} alt="" />

    <div className="hqf-label" style={place(LABEL.comm, ink("comm"))}>
      <div className="hqf-title">{label("Communication\n& Engagement")}</div>
      <div className="hqf-sub">{label("Reach, engage, and\nalign every employee")}</div>
    </div>
    <div className="hqf-label" style={place(LABEL.search, ink("search"))}>
      <div className="hqf-title">{label("Search &\nKnowledge")}</div>
      <div className="hqf-sub">{label("Find and access what\nyou need instantly")}</div>
    </div>
    <div className="hqf-label" style={place(LABEL.people, ink("people"))}>
      <div className="hqf-title">{label("People\nIntelligence")}</div>
      <div className="hqf-sub">{label("Turn signals into insight,\naction, and results")}</div>
    </div>
  </AbsoluteFill>
  );
};

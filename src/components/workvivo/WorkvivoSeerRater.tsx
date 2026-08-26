import React from "react";
import { CursorArrow } from "../CursorArrow";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoSeerRaterStyles.css";
import { SEER_TABS, WorkvivoSeerChrome } from "./WorkvivoSeerChrome";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * Seer Insights — the Rater tab: a segment x driver score heatmap.
 *
 * The Rater tab is not in the Seer pitch deck at all — "Rater", "Export CSV", "All
 * Segments" and "Round 6" appear nowhere in Seer Pitch - V2.html — and the reference
 * shows it inside *Workvivo's* chrome rather than the deck's. So the top bar, rail and
 * page head come from WorkvivoSeerChrome, which is this screen's own chrome lifted out
 * so its two siblings can wear it too, and only the filter row and the heatmap below are
 * drawn here from the screenshot.
 *
 * The chrome mounts WorkvivoTopbar, so this must render inside a
 * <CustomizationProvider>; WorkvivoSeerRaterScene does that.
 */

export { SEER_TABS };

/**
 * Driver columns, in the reference's order. The last one is cut off at the frame edge
 * there; the table is wider than the pane on purpose so it is cut off here too.
 */
export const SEER_DRIVERS = [
  "Engagement",
  "Wellbeing",
  "My Job",
  "Productivity",
  "Culture and Values",
  "Empowerm...",
  "Career Development",
  "Compensation and Benefits",
  "Senior Leadership",
  "Reward and Recognition",
];

/**
 * Column geometry, sampled off the reference.
 *
 * The first driver column is wider than the rest there — 146 against 116 — so the widths
 * come through a <colgroup> rather than a single `width` on .wsr-colhead. 200 + 146 +
 * 9 x 116 = 1390 against the 1348 the pane gives, which is what leaves the tenth driver
 * as a 74px sliver at the right edge, exactly as the screenshot cuts it.
 */
const ROWHEAD_W = 200;
const FIRST_COL_W = 146;
const COL_W = 116;

export type SeerRaterRow = {
  name: string;
  type: string;
  /** One score per driver, 0–10. */
  scores: number[];
};

/**
 * The heatmap's nine rows.
 *
 * The SCORES are fixed and the names are not: a segment is this company's own office or
 * department, but the numbers beside it are the shape of the reference's chart and
 * inventing plausible engagement scores per tenant is exactly the kind of made-up
 * specific the research pass is told never to produce. Inside the film the names come
 * from `copy.seer.segments` and only the scores are read from here.
 */
export const SEER_RATER_ROWS: SeerRaterRow[] = [
  { name: "Global", type: "All Segments", scores: [9.0, 5.8, 10, 9.0, 7.1, 9.0, 7.1, 9.0, 6.6, 9.0] },
  { name: "Boston", type: "Location", scores: [8.3, 4.3, 9.0, 10, 8.3, 7.1, 8.3, 8.3, 4.6, 8.3] },
  { name: "London", type: "Location", scores: [9.0, 2.2, 10, 7.1, 4.4, 6.6, 7.1, 9.0, 6.6, 7.1] },
  { name: "CX", type: "Department", scores: [9.0, 1.3, 7.1, 6.6, 7.1, 6.6, 9.0, 8.3, 7.1, 6.6] },
  { name: "Human Resources", type: "Department", scores: [7.1, 1.6, 8.2, 7.1, 7.1, 5.8, 7.1, 5.8, 5.8, 7.1] },
  { name: "IT", type: "Department", scores: [8.3, 4.4, 8.3, 8.3, 4.4, 4.4, 7.1, 7.1, 8.3, 5.8] },
  { name: "Marketing", type: "Department", scores: [7.1, 1.7, 9.0, 8.3, 3.9, 7.1, 3.9, 8.3, 3.9, 7.1] },
  { name: "Product", type: "Department", scores: [8.3, 2.1, 7.1, 2.1, 7.1, 8.3, 7.1, 2.1, 2.1, 6.6] },
  { name: "Sales", type: "Department", scores: [8.3, 1.3, 7.2, 8.3, 8.3, 1.7, 8.3, 1.7, 0, 4.4] },
];

/**
 * The heatmap ramp, sampled off the reference.
 *
 * Deliberately not a linear red-to-green: the reference holds a wide, near-neutral cream
 * band across the 6.5–8 range and only breaks to green above 8.5, which is what makes a
 * 9.0 read as "good" rather than "slightly above average". A straight lerp between two
 * endpoints loses that and flattens the whole table to muddy yellow.
 */
const RAMP: { v: number; c: [number, number, number] }[] = [
  { v: 0, c: [248, 113, 113] },
  { v: 2.5, c: [248, 113, 113] },
  { v: 4.5, c: [252, 165, 165] },
  { v: 6.0, c: [254, 202, 202] },
  { v: 7.2, c: [254, 249, 195] },
  { v: 8.3, c: [254, 240, 138] },
  { v: 9.0, c: [134, 239, 172] },
  { v: 10, c: [74, 222, 128] },
];

/**
 * The number's own ramp, sampled off the reference alongside the fill.
 *
 * The reference does not print the scores in a flat grey — each one is a darkened,
 * hue-matched version of the cell it sits in, so a green cell carries green-black text
 * and a red one carries maroon. Kept as its own table rather than derived from RAMP by
 * a darkening function: the pale cells want noticeably lighter text than a fixed
 * multiplier gives them, and matching the screenshot at both ends matters more than the
 * two ramps sharing an implementation.
 */
const TEXT_RAMP: { v: number; c: [number, number, number] }[] = [
  { v: 0, c: [140, 25, 25] },
  { v: 2.5, c: [140, 25, 25] },
  { v: 4.5, c: [145, 30, 30] },
  { v: 6.0, c: [150, 40, 40] },
  { v: 7.2, c: [133, 90, 14] },
  { v: 8.3, c: [133, 77, 14] },
  { v: 9.0, c: [22, 101, 52] },
  { v: 10, c: [20, 83, 45] },
];

const sampleRamp = (
  ramp: { v: number; c: [number, number, number] }[],
  score: number,
): string => {
  const v = Math.max(0, Math.min(10, score));
  let lo = ramp[0];
  let hi = ramp[ramp.length - 1];
  for (let i = 0; i < ramp.length - 1; i += 1) {
    if (v >= ramp[i].v && v <= ramp[i + 1].v) {
      lo = ramp[i];
      hi = ramp[i + 1];
      break;
    }
  }
  const span = hi.v - lo.v;
  const t = span === 0 ? 0 : (v - lo.v) / span;
  const ch = (i: number) => Math.round(lo.c[i] + (hi.c[i] - lo.c[i]) * t);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
};

/** The cell fill for a 0–10 score. */
export const seerScoreColor = (score: number): string => sampleRamp(RAMP, score);

/** The number's colour for a 0–10 score — a darkened match for its cell, not flat grey. */
export const seerScoreTextColor = (score: number): string => sampleRamp(TEXT_RAMP, score);

/** A chevron and a magnifier are two lines each — no Seer-specific drawing to get wrong. */
const ChevronDown: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M3 4.75L6 7.75L9 4.75"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface WorkvivoSeerRaterProps {
  /** Which tab carries the underline. */
  activeTab?: string;
  round?: string;
  score?: string;
  drivers?: string[];
  rows?: SeerRaterRow[];
  /** Seer's accent. The deck drives this from the customer-brand override. */
  accent?: string;
  accentSoft?: string;
  /** Demo pointer, in body coordinates. Omit for none. */
  cursor?: { left: number; top: number } | null;
  /** Whether tiles scale in with a diagonal wave. Default true. */
  animated?: boolean;
  /** Explicit frame override (defaults to useCurrentFrame()). */
  frame?: number;
}

export const WorkvivoSeerRater: React.FC<WorkvivoSeerRaterProps> = ({
  activeTab = "Rater",
  round = "Round 6 (2026/06/15)",
  score = "Score: Engagement",
  drivers = SEER_DRIVERS,
  rows,
  accent = "#EE6A35",
  accentSoft = "#FDECE5",
  cursor = { left: 336, top: 107 },
  animated = true,
  frame: frameProp,
}) => {
  const currentFrame = useCurrentFrame();
  const frame = animated ? (frameProp ?? currentFrame) : 100;
  const { copy } = useCustomization();
  const EASE = Easing.bezier(0.16, 1, 0.3, 1);

  // Names from the copy table, scores from the baseline chart. Zipped positionally, so
  // the row order — Global first, then locations, then departments — is the copy slot's
  // to keep and the guide says so.
  const resolvedRows: SeerRaterRow[] =
    rows ??
    SEER_RATER_ROWS.map((row, i) => ({
      ...row,
      name: copy.seer.segments[i].name,
      type: copy.seer.segments[i].kind,
    }));

  return (
    <WorkvivoSeerChrome activeTab={activeTab} accent={accent} accentSoft={accentSoft}>
                <div className="wsr-filters">
                  <span className="wsr-pill">
                    {round}
                    <ChevronDown />
                  </span>
                  <span className="wsr-pill">
                    {score}
                    <ChevronDown />
                  </span>
                  <span className="wsr-export">Export CSV</span>
                </div>

                <div className="wsr-tablewrap" data-vc-slot="seer.rater">
                  <table
                    className="wsr-table"
                    style={{
                      width:
                        ROWHEAD_W + FIRST_COL_W + Math.max(0, drivers.length - 1) * COL_W,
                    }}
                  >
                    <colgroup>
                      <col style={{ width: ROWHEAD_W }} />
                      {drivers.map((d, i) => (
                        <col key={d} style={{ width: i === 0 ? FIRST_COL_W : COL_W }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="wsr-corner" />
                        {drivers.map((d) => (
                          <th className="wsr-colhead" key={d}>
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedRows.map((row, rowIndex) => (
                        <tr key={row.name}>
                          <th className="wsr-rowhead">
                            <div className="wsr-rowname">{row.name}</div>
                            <div className="wsr-rowtype">{row.type}</div>
                          </th>
                          {drivers.map((d, colIndex) => {
                            const v = row.scores[colIndex];
                            const tileStart = (rowIndex + colIndex) * 0.7;
                            const tileProgress = animated
                              ? interpolate(frame, [tileStart, tileStart + 9], [0, 1], {
                                  easing: EASE,
                                  extrapolateLeft: "clamp",
                                  extrapolateRight: "clamp",
                                })
                              : 1;

                            return (
                              <td className="wsr-cell" key={d}>
                                <div
                                  className="wsr-chip"
                                  style={{
                                    background: seerScoreColor(v),
                                    color: seerScoreTextColor(v),
                                    transform: `scale(${tileProgress})`,
                                    opacity: tileProgress,
                                    transformOrigin: "center center",
                                    willChange: "transform, opacity",
                                  }}
                                >
                                  {/* Only 0 and 10 drop the decimal, as the reference has them —
                                      9.0 keeps its, so an is-integer test is not enough. */}
                                  {v === 0 || v === 10 ? v : v.toFixed(1)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {cursor ? (
                  <CursorArrow
                    color="black"
                    style={{
                      position: "absolute",
                      left: cursor.left,
                      top: cursor.top,
                      width: 72,
                      height: 80,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}
    </WorkvivoSeerChrome>
  );
};


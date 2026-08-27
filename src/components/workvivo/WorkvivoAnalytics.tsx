import React from "react";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoGlassEdge.css";
import "./WorkvivoAnalyticsStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";
import { GlassRing } from "./GlassRing";

/**
 * Workvivo Analytics & Reporting — the Snapshot tab.
 *
 * Sits on the same `.device` / `.app` / `.scaler` shell as WorkvivoHomeContainer and
 * reuses WorkvivoTopbar, so it must render inside a <CustomizationProvider>.
 *
 * The gauges and bar charts are drawn here rather than sourced from the icon library:
 * they are data visualisation, not Workvivo iconography, and there is nothing in the
 * library to look up. Both are built from primitives that need no path data — the gauge
 * is a `stroke-dasharray` on a `<circle>`, the bars are `<rect>`s.
 */

const RAIL_TOP = [
  { icon: "#i-ui-activity-feed", label: "Activity Feed", caret: true },
  // No bookmark glyph in the library; `pin` is the nearest save-for-later mark.
  { icon: "#i-ui-pin", label: "Bookmarks" },
  { icon: "#i-ui-connect", label: "Following" },
  { icon: "#i-ui-latest-posts", label: "Recent Updates" },
  { icon: "#i-ui-shout-out", label: "Campaigns" },
  // No flag glyph either; `manage-posts` is the nearest moderation mark.
  { icon: "#i-ui-manage-posts", label: "Reported" },
];

const RAIL_BOTTOM = [
  { icon: "#i-ui-spotlight", label: "Spotlight" },
  { icon: "#i-ui-chat", label: "Chat" },
  { icon: "#i-ui-spaces", label: "Spaces", caretRight: true },
];

const TABS = ["Snapshot", "Activation", "Advanced Usage", "Advanced Content", "Governance"];

interface Gauge {
  label: string;
  /** 0-100, and the number printed in the middle. */
  pct: number;
  /** Count reached, and the denominator printed at the arc's end. */
  value: number;
  total: number;
  color: string;
}

const GAUGES: Gauge[] = [
  { label: "Activation Rate", pct: 99.54, value: 429, total: 431, color: "#2DD4BF" },
  { label: "Onboarding Rate", pct: 99.07, value: 427, total: 431, color: "#EC4899" },
  { label: "Mobile App Users", pct: 85.55, value: 367, total: 429, color: "#7C3AED" },
  { label: "Profile Picture Upload", pct: 93.47, value: 401, total: 419, color: "#2563EB" },
];

/**
 * A 270-degree gauge.
 *
 * `stroke-dasharray` on a circle rather than an arc path, so there is no `d=` here to be
 * mistaken for library art. The circle is rotated so its gap sits at the bottom, and the
 * track and fill share one geometry — the fill just stops early.
 */
export const GaugeDial: React.FC<{ gauge: Gauge; progress?: number }> = ({
  gauge,
  progress = 1,
}) => {
  const size = 200;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75; // 270 of 360 degrees
  const arc = circumference * sweep;
  const currentPct = gauge.pct * progress;
  const filled = arc * (currentPct / 100);

  // Little numbers appear when the animation completes (at progress >= 0.95)
  const numbersOpacity = progress >= 0.95 ? Math.min(1, (progress - 0.95) / 0.05) : 0;

  // Calculate position for current value right next to the colored arc endpoint
  const angleDeg = 135 + 270 * (gauge.pct / 100);
  const angleRad = (angleDeg * Math.PI) / 180;
  const valX = size / 2 + (r + 18) * Math.cos(angleRad);
  const valY = size / 2 + (r + 18) * Math.sin(angleRad) + 4;
  const valAnchor = valX > size / 2 ? "start" : "end";

  return (
    <svg
      width={size}
      height={size - 18}
      viewBox={`0 0 ${size} ${size - 18}`}
      style={{ overflow: "visible" }}
    >
      <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={gauge.color}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
        />
      </g>
      <text
        x={size / 2}
        y={size / 2 + 10}
        textAnchor="middle"
        fontSize="30"
        fontWeight="600"
        fill="#111827"
      >
        {currentPct.toFixed(2)}%
      </text>

      {/* Scale ends and value appear next to the semi-circle when complete */}
      <g style={{ opacity: numbersOpacity, transition: "opacity 0.2s ease" }}>
        <text x="8" y={size - 14} fontSize="12" fill="#9CA3AF">
          0
        </text>
        <text x={size - 8} y={size - 14} fontSize="12" fill="#9CA3AF" textAnchor="end">
          {gauge.total}
        </text>
        <text
          x={valX}
          y={valY}
          fontSize="12"
          fontWeight="500"
          fill="#4B5563"
          textAnchor={valAnchor}
        >
          {gauge.value}
        </text>
      </g>
    </svg>
  );
};

interface Chart {
  label: string;
  color: string;
  bars: number[];
  /** Top of the y-axis. Bars grow from zero, so this sets the headroom above the peak. */
  max: number;
}

/** Deterministic sample series — a video frame must not depend on Math.random(). */
const series = (n: number, seed: number, lo: number, hi: number) =>
  Array.from({ length: n }, (_, i) => {
    const t = Math.sin((i + seed) * 1.7) * 0.5 + Math.sin((i + seed) * 0.6) * 0.5;
    return lo + ((t + 1) / 2) * (hi - lo);
  });

const CHARTS: Chart[] = [
  { label: "Monthly Active Users", color: "#22D3EE", bars: series(7, 1, 370, 430), max: 550 },
  { label: "Weekly Active Users", color: "#F472B6", bars: series(32, 3, 180, 390), max: 450 },
  { label: "Daily Active Users", color: "#FBBF24", bars: series(60, 5, 200, 360), max: 450 },
];

/** Bars are `<rect>`s and gridlines are `<line>`s — no path data, so nothing here can be
 *  mistaken for a Workvivo glyph. */
export const BarChart: React.FC<{ chart: Chart; progress?: number }> = ({
  chart,
  progress = 1,
}) => {
  const w = 420;
  const h = 210;
  const padL = 34;
  const padB = 20;
  const top = 8;
  const y = (v: number) => top + (1 - v / chart.max) * (h - top - padB);
  const slot = (w - padL - 8) / chart.bars.length;
  const barW = Math.max(2, slot * 0.62);
  const ticks = Array.from({ length: Math.round(chart.max / 100) }, (_, i) => i * 100);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" height={210}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={w - 4} y1={y(v)} y2={y(v)} stroke="#F3F4F6" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 4} fontSize="11" fill="#9CA3AF" textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {chart.bars.map((v, i) => {
        const animatedV = v * progress;
        return (
          <rect
            key={i}
            x={padL + i * slot + (slot - barW) / 2}
            y={y(animatedV)}
            width={barW}
            height={Math.max(0, y(0) - y(animatedV))}
            fill={chart.color}
          />
        );
      })}
      <line x1={padL} x2={w - 4} y1={y(0)} y2={y(0)} stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  );
};

interface LineChartData {
  title: string;
  subtitle: string;
  color: string;
  points: number[];
  dates: string[];
}

export const LINE_CHARTS: LineChartData[] = [
  {
    title: "% of Monthly Active over Time users",
    subtitle: "Shown as % active users in selected time period",
    color: "#22D3EE",
    points: [93, 91, 91, 92, 87, 94],
    dates: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"],
  },
  {
    title: "% of Monthly Active over Time users",
    subtitle: "Shown as % active users in selected time period",
    color: "#EC4899",
    points: [90, 32, 91, 94, 89, 93, 85, 74, 82, 77, 94, 91, 89, 94, 86, 86, 80],
    dates: ["Dec 7, 2025", "Jan 1, 2026", "Feb 1, 2026", "Mar 1, 2026", "Apr 1, 2026", "May 1, 2026", "Jun 1, 2026", "Jun 14, 2026"],
  },
  {
    title: "% of Monthly Active over Time users",
    subtitle: "Shown as % active users in selected time period",
    color: "#F59E0B",
    points: [
      86, 15, 80, 18, 68, 22, 82, 17, 70, 24, 78, 14, 72, 28, 68, 12,
      70, 20, 68, 15, 72, 25, 73, 16, 60, 20, 75, 18, 69, 14, 62, 22,
      65, 16, 65, 15, 60, 12, 62, 18, 60, 10, 58
    ],
    dates: ["Dec 1, 2025", "Jan 1, 2026", "Feb 1, 2026", "Mar 1, 2026", "Apr 1, 2026", "May 1, 2026", "Jun 1, 2026", "Jun 14, 2026"],
  },
];

export const LineChart: React.FC<{ chart: LineChartData; progress?: number }> = ({
  chart,
  progress = 1,
}) => {
  const w = 420;
  const h = 230;
  const padL = 38;
  const padR = 14;
  const padT = 16;
  const padB = 58;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const y = (pct: number) => padT + (1 - pct / 100) * plotH;
  const ticks = [0, 20, 40, 60, 80, 100];

  // Construct SVG path for line
  const d = chart.points
    .map((pct, i) => {
      const px = padL + (i / (chart.points.length - 1)) * plotW;
      const py = y(pct);
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" height={230} style={{ width: "100%", display: "block" }}>
      {/* Horizontal gridlines and Y-axis percentage labels */}
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={w - padR}
            y1={y(v)}
            y2={y(v)}
            stroke={v === 0 ? "#E5E7EB" : "#F3F4F6"}
            strokeWidth="1"
          />
          <text
            x={padL - 6}
            y={y(v) + 3}
            fontSize="11"
            fill="#9CA3AF"
            textAnchor="end"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* X-axis Rotated Dates */}
      {chart.dates.map((date, i) => {
        const dx = padL + (i / (chart.dates.length - 1)) * plotW;
        const dy = h - padB + 16;
        return (
          <text
            key={date + i}
            x={dx}
            y={dy}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="end"
            transform={`rotate(-42 ${dx} ${dy})`}
          >
            {date}
          </text>
        );
      })}

      {/* Animated Colored Line */}
      <path
        d={d}
        fill="none"
        stroke={chart.color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1200"
        strokeDashoffset={1200 * (1 - Math.max(0, Math.min(1, progress)))}
      />
    </svg>
  );
};

/** The four photos in the strip behind the page title, and where an upload lands. */
const BANNER: { src: string; slot: ImageSlotKey }[] = [
  { src: "img/workvivo/news_3.png", slot: "analytics.banner.0" },
  { src: "img/workvivo/pages_2.png", slot: "analytics.banner.1" },
  { src: "img/workvivo/story_summit.png", slot: "analytics.banner.2" },
  { src: "img/workvivo/news_2.png", slot: "analytics.banner.3" },
];

export interface WorkvivoAnalyticsProps {
  gaugeProgress?: number;
  chartProgress?: (chartIndex: number) => number;
  segmentStyle?: (chartIndex: number) => React.CSSProperties;
  lineChartProgress?: (chartIndex: number) => number;
  lineSegmentStyle?: (chartIndex: number) => React.CSSProperties;
}

export const WorkvivoAnalytics: React.FC<WorkvivoAnalyticsProps> = ({
  gaugeProgress = 1,
  chartProgress,
  segmentStyle,
  lineChartProgress,
  lineSegmentStyle,
}) => {
  const { person, image } = useCustomization();

  return (
    <div className="device wv-glass-edge" style={{ width: 1760, minHeight: 1080, height: "auto" }}>
      <GlassRing />
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />

          <div className="an-shell">
            <aside className="an-rail">
              {RAIL_TOP.map((n) => (
                <div className="an-nav" key={n.label}>
                  <Icon href={n.icon} width={20} height={20} />
                  <span className="an-nav-label">{n.label}</span>
                  {n.caret ? <span className="an-caret" /> : null}
                </div>
              ))}

              <div className="an-nav">
                <img className="an-me-av" src={person.avatarUrl} style={person.avatarFit} alt="" />
                <span className="an-nav-label">{person.name}</span>
                <span className="an-me-badge">Profile</span>
              </div>

              <span className="an-navgap" />

              {RAIL_BOTTOM.map((n) => (
                <div className="an-nav" key={n.label}>
                  <Icon href={n.icon} width={20} height={20} />
                  <span className="an-nav-label">{n.label}</span>
                  {n.caretRight ? <span className="an-caret an-caret-right" /> : null}
                </div>
              ))}
            </aside>

            <main className="an-main">
              <div className="an-banner">
                {BANNER.map((b) => (
                  <img
                    key={b.slot}
                    data-vc-slot={b.slot}
                    src={image(b.slot, staticFile(b.src))}
                    alt=""
                  />
                ))}
              </div>

              <div className="an-head">
                <div className="an-title">
                  <Icon href="#i-ui-spaces" width={42} height={42} />
                  Analytics &amp; Reporting
                </div>
                <div className="an-headacts">
                  <span className="an-btn">Revert to Old Version</span>
                  <span className="an-btn">Open Fullscreen</span>
                </div>
              </div>

              <div className="an-tabs">
                {TABS.map((t) => (
                  <span className={t === "Snapshot" ? "an-tab an-on" : "an-tab"} key={t}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="an-panel">
                <div className="an-filters">
                  {["Primary Team", "Secondary Team", "Tertiary Team"].map((t) => (
                    <div key={t}>
                      <div className="an-label">
                        {t}
                        <span className="an-info">i</span>
                      </div>
                      <div className="an-field">
                        <span>All</span>
                        <span className="an-caret" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="an-gauges">
                  {GAUGES.map((g) => (
                    <div key={g.label}>
                      <div className="an-label an-label-section">{g.label}</div>
                      <div className="an-gauge">
                        <GaugeDial gauge={g} progress={gaugeProgress} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="an-dates">
                  {[
                    { label: "Date From", value: "2026/06/01" },
                    { label: "Date To", value: "2026/07/01" },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="an-label">
                        {d.label}
                        <span className="an-info">i</span>
                      </div>
                      <div className="an-field">
                        <span>{d.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="an-charts">
                  {CHARTS.map((c, i) => (
                    <div
                      key={c.label}
                      style={segmentStyle ? segmentStyle(i) : undefined}
                    >
                      <div className="an-label an-label-section">{c.label}</div>
                      <div className="an-chart">
                        <BarChart
                          chart={c}
                          progress={chartProgress ? chartProgress(i) : 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="an-line-charts">
                  {LINE_CHARTS.map((c, i) => (
                    <div
                      key={c.title + i}
                      className="an-line-chart-card"
                      style={lineSegmentStyle ? lineSegmentStyle(i) : undefined}
                    >
                      <div className="an-label">{c.title}</div>
                      <div className="an-line-chart-subtitle">{c.subtitle}</div>
                      <LineChart
                        chart={c}
                        progress={lineChartProgress ? lineChartProgress(i) : 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

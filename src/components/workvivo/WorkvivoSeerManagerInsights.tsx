import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoSeerManagerInsightsStyles.css";
import { SEER_TABS, WorkvivoSeerChrome } from "./WorkvivoSeerChrome";
import {
  Camera,
  CalendarNext,
  CalendarPrev,
  ChevLeft,
  ChevRight,
  FaceDetractor,
  FacePassive,
  FacePromoter,
  Hourglass,
  Link,
  People,
  Pulse,
  Question,
  TrendUp,
} from "./WorkvivoSeerManagerIcons";

/**
 * Seer Insights — Engagement tab, manager view.
 *
 * The device box, top bar, rail and page head (title, Manage button, tab strip) come
 * from WorkvivoSeerChrome, shared verbatim with WorkvivoSeerRater and
 * WorkvivoSeerInsights. Only the page below the tab strip is this screen's own,
 * rebuilt from the 1477px capture; every measurement runs through one conversion,
 * `reference px x 0.7014`, documented in the stylesheet header along with the
 * cross-checks that show it holds.
 *
 * Icons come from WorkvivoSeerManagerIcons, lifted intact from the previous build rather
 * than redrawn — none of them exist in Workvivo's library, and the workvivo-ui rule is
 * that an invented glyph which merely looks plausible is the worst outcome available.
 *
 * Two things are deliberately absent. The cursor in the capture belongs to the scene, not
 * the screen. And nothing below the shell's clip line is reachable — the capture itself
 * ends part-way through the metrics row for the same reason.
 */

export { SEER_TABS };

/** Left column of the score card. Split so "Engagement" can carry its own weight. */
const SCORE_LINES = ["Team", "Engagement", "Score"];

const SENTIMENTS = [
  { pct: "80%", name: "Promoters", tone: "green", Face: FacePromoter },
  { pct: "15%", name: "Passives", tone: "amber", Face: FacePassive },
  { pct: "05%", name: "Detractors", tone: "red", Face: FaceDetractor },
] as const;

/**
 * The six stats, in the order the capture fills them: down each column, not across.
 * `grid-auto-flow: column` in the stylesheet is what turns this order into that layout.
 */
const STATS = [
  { Ico: Pulse, tone: "red", name: "Survey Status", val: "Inactive" },
  { Ico: TrendUp, tone: "orange", name: "Score Change", val: "+2" },
  { Ico: Camera, tone: "orange", name: "Survey Duration", val: "2 Weeks" },
  { Ico: Link, tone: "orange", name: "Completed Rounds", val: "2" },
  { Ico: Hourglass, tone: "orange", name: "Frequency", val: "Monthly" },
  { Ico: People, tone: "orange", name: "Participants", val: "13,860" },
] as const;

const DATES = [
  { Ico: CalendarPrev, name: "Previous Survey", val: "2026-05-15" },
  { Ico: CalendarNext, name: "Next Survey", val: "2026-07-15" },
] as const;

/**
 * The timeline.
 *
 * Authored in a 470x120 viewBox — the chart card's own content box — so one unit is one
 * body pixel and the type inside needs no second conversion. Scores run 6..9 up the axis.
 */
const CHART = {
  w: 470,
  h: 120,
  padL: 26,
  padR: 8,
  padT: 6,
  padB: 22,
  min: 5.6,
  max: 9.4,
  points: [
    { label: "15 Jan 2026", score: 7.35 },
    { label: "15 Feb 2026", score: 8.1 },
    { label: "15 Mar 2026", score: 7.3 },
    { label: "15 Apr 2026", score: 7.2 },
    { label: "15 May 2026", score: 7.95 },
  ],
};

const chartX = (i: number) => {
  const inner = CHART.w - CHART.padL - CHART.padR;
  return CHART.padL + (inner / (CHART.points.length - 1)) * i;
};

const chartY = (score: number) => {
  const inner = CHART.h - CHART.padT - CHART.padB;
  return CHART.padT + (1 - (score - CHART.min) / (CHART.max - CHART.min)) * inner;
};

const Timeline: React.FC<{ accent: string; progress?: number }> = ({ accent, progress = 1 }) => {
  const line = CHART.points.map((p, i) => `${chartX(i)},${chartY(p.score)}`).join(" ");
  const base = CHART.h - CHART.padB;
  const rawId = React.useId ? React.useId() : "timeline";
  const clipId = `timeline-clip-${rawId.replace(/:/g, "")}`;

  const clipWidth = CHART.padL + (CHART.w - CHART.padL) * progress;

  return (
    <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} preserveAspectRatio="none">
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={clipWidth} height={CHART.h} />
        </clipPath>
      </defs>

      {[9, 8, 7, 6].map((tick) => (
        <g key={tick}>
          <line
            x1={CHART.padL}
            x2={CHART.w - CHART.padR}
            y1={chartY(tick)}
            y2={chartY(tick)}
            stroke="#f1f2f4"
            strokeWidth="1"
          />
          <text
            x={CHART.padL - 8}
            y={chartY(tick) + 3}
            textAnchor="end"
            fontSize="8"
            fill="#9ca3af"
          >
            {tick}
          </text>
        </g>
      ))}

      {/* The capture fills under the line with a pale wash of the accent that stops flat
          on the baseline, not a gradient that fades out. */}
      <g clipPath={`url(#${clipId})`}>
        <polygon
          points={`${chartX(0)},${base} ${line} ${chartX(CHART.points.length - 1)},${base}`}
          fill={accent}
          fillOpacity="0.07"
        />
        <polyline
          points={line}
          fill="none"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {CHART.points.map((p, i) => {
        const pointX = chartX(i);
        const targetRatio = i / (CHART.points.length - 1);
        const pointScale = interpolate(progress, [targetRatio - 0.08, targetRatio + 0.04], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <circle
            key={p.label}
            cx={pointX}
            cy={chartY(p.score)}
            r={2.6 * pointScale}
            fill={accent}
            stroke="#fff"
            strokeWidth="1.2"
          />
        );
      })}

      {CHART.points.map((p, i) => (
        <text
          key={p.label}
          x={chartX(i)}
          y={CHART.h - 6}
          textAnchor="middle"
          fontSize="8"
          fill="#9ca3af"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
};

/**
 * The donut ring's orange, which is deliberately NOT the accent.
 *
 * `--wsmi-accent` (#ee6a35) drives the buttons, tabs and pills and matches the capture
 * there. The rings are a lighter, warmer orange than those controls — close enough to be
 * clearly the same family, far enough that using the accent for both reads as too heavy.
 */
const RING = "#f78d45";

/**
 * A rate donut.
 *
 * 96 body px across with an 11px ring — the capture's ring is about 12% of the donut's
 * diameter, appreciably thinner than a solid gauge, with round caps at both ends.
 * The percentage is set in two sizes, the number large and the % sign a third smaller.
 */
export const Donut: React.FC<{ pct: number; progress?: number; size?: number }> = ({
  pct,
  progress = 1,
  size = 96,
}) => {
  // The ring keeps its 11:96 proportion at any size, which is what the capture shows.
  const stroke = (11 / 96) * size;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const currentPct = pct * progress;
  /**
   * Round caps add half a stroke beyond each end of the arc, so drawing the raw percentage
   * would render every ring a full stroke-width long. Shortening the dash by that much
   * puts the painted arc back on the number it is meant to show.
   */
  const arc = Math.max(0, (circumference * currentPct) / 100 - stroke);
  const displayPct = Math.round(currentPct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e6e8ec"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={RING}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2 - size * 0.042}
        y={size / 2 + size * 0.083}
        textAnchor="middle"
        fontSize={size * 0.25}
        fontWeight="700"
        fill="#111827"
      >
        {displayPct}
      </text>
      <text
        x={size / 2 + size * 0.146}
        y={size / 2 + size * 0.083}
        fontSize={size * 0.1458}
        fontWeight="700"
        fill="#111827"
      >
        %
      </text>
    </svg>
  );
};

/**
 * The score card: the 9.2 tile, its three-line label, and the sentiment split.
 *
 * Extracted so SeerManagerMobileScene can float the same card beside the phone at 3903
 * instead of rebuilding it. It is the whole card including `.wsmi-card`, so a caller only
 * has to place it — and scale it, since the measurements here are the desktop page's.
 */
export const SeerScoreCard: React.FC = () => (
  <div className="wsmi-card wsmi-score">
    <div className="wsmi-tile">
      <span>9.2</span>
    </div>
    <div className="wsmi-score-label">
      {SCORE_LINES.map((l) =>
        l === "Engagement" ? <b key={l}>{l}</b> : <div key={l}>{l}</div>,
      )}
    </div>
    <div className="wsmi-sents">
      {SENTIMENTS.map(({ pct, name, tone, Face }) => (
        <div className="wsmi-sent" key={name}>
          <span className={`wsmi-badge wsmi-badge-${tone}`}>
            <Face size={12} />
            {pct}
          </span>
          <span className="wsmi-sent-name">{name}</span>
        </div>
      ))}
    </div>
  </div>
);

const RateCard: React.FC<{
  title: string;
  pct: number;
  rows: { name: string; val: string }[];
  progress?: number;
  style?: React.CSSProperties;
}> = ({ title, pct, rows, progress = 1, style }) => (
  <div className="wsmi-card wsmi-donut" style={style}>
    <div className="wsmi-card-title">{title}</div>
    <div className="wsmi-donut-body">
      <Donut pct={pct} progress={progress} />
      <div className="wsmi-donut-stats">
        {rows.map((r) => (
          <div className="wsmi-kv" key={r.name}>
            <div className="wsmi-kv-name">{r.name}</div>
            <div className="wsmi-kv-val">{r.val}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export interface WorkvivoSeerManagerInsightsProps {
  activeTab?: string;
  round?: string;
  segment?: string;
  accent?: string;
  accentSoft?: string;
  animated?: boolean;
  frame?: number;
}

export const WorkvivoSeerManagerInsights: React.FC<
  WorkvivoSeerManagerInsightsProps
> = ({
  activeTab = "Engagement",
  round = "Round 6 (2026/06/15)",
  segment = "Segments",
  accent = "#ee6a35",
  accentSoft = "#fdece5",
  animated = true,
  frame: frameProp,
}) => {
  const currentFrame = useCurrentFrame();
  const frame = animated ? (frameProp ?? currentFrame) : 100;

  const EASE = Easing.bezier(0.16, 1, 0.3, 1);

  // Staggered animations for the 3 metrics cards (delayed 10 frames):
  // Card 1: Timeline chart (starts frame 11, completes frame 24 = global 3782)
  const timelineProgress = animated
    ? interpolate(frame, [11, 24], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const timelineOpacity = animated
    ? interpolate(frame, [11, 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const timelineY = animated
    ? interpolate(frame, [11, 22], [20, 0], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Card 2: Response Rate Donut 75% (starts frame 13, completes frame 25 = global 3783)
  const donut1Progress = animated
    ? interpolate(frame, [13, 25], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const donut1Opacity = animated
    ? interpolate(frame, [13, 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const donut1Y = animated
    ? interpolate(frame, [13, 24], [20, 0], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Card 3: Completion Rate Donut 95% (starts frame 15, completes frame 27 = global 3785)
  const donut2Progress = animated
    ? interpolate(frame, [15, 27], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const donut2Opacity = animated
    ? interpolate(frame, [15, 22], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const donut2Y = animated
    ? interpolate(frame, [15, 26], [20, 0], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <WorkvivoSeerChrome activeTab={activeTab} accent={accent} accentSoft={accentSoft}>
      <div
        className="wsc-page wsmi-page wsmi-scope"
        style={{ "--wsmi-accent": accent } as React.CSSProperties}
      >
        <div className="wsmi-filters">
          <span className="wsmi-pill wsmi-pill-on">
            {round}
            <span className="wsmi-caret" />
          </span>
          <span className="wsmi-pill wsmi-pill-off">
            {segment}
            <span className="wsmi-caret" />
          </span>
        </div>

        <div className="wsmi-sec wsmi-sec-overview">Overview</div>
        <div className="wsmi-overview">
          <SeerScoreCard />

          <div className="wsmi-card wsmi-stats">
            {STATS.map(({ Ico, tone, name, val }) => (
              <div className="wsmi-stat" key={name}>
                <span className={`wsmi-ico wsmi-ico-${tone}`}>
                  <Ico size={14} />
                </span>
                <span>
                  <div className="wsmi-stat-name">{name}</div>
                  <div className="wsmi-stat-val">{val}</div>
                </span>
              </div>
            ))}
          </div>

          <div className="wsmi-card wsmi-dates">
            {DATES.map(({ Ico, name, val }) => (
              <div className="wsmi-stat" key={name}>
                <span className="wsmi-ico wsmi-ico-orange">
                  <Ico size={14} />
                </span>
                <span>
                  <div className="wsmi-stat-name">{name}</div>
                  <div className="wsmi-stat-val">{val}</div>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="wsmi-sec wsmi-sec-question">
          Engagement Question Asked
        </div>
        <div className="wsmi-card wsmi-question">
          <span className="wsmi-q-ico">
            <Question size={11} />
          </span>
          <span className="wsmi-q-text">I enjoy the kind of work I do</span>
        </div>

        <div className="wsmi-sec wsmi-sec-metrics">Metrics</div>
        <div className="wsmi-metrics">
          <div
            className="wsmi-card wsmi-chart"
            style={{
              opacity: timelineOpacity,
              transform: `translateY(${timelineY}px)`,
              willChange: "transform, opacity",
            }}
          >
            <div className="wsmi-chart-head">
              <div className="wsmi-card-title">Engagement Score Timeline</div>
              <span className="wsmi-chart-nav">
                <span>
                  <ChevLeft size={7} />
                </span>
                <span>
                  <ChevRight size={7} />
                </span>
              </span>
            </div>
            <div className="wsmi-chart-svg">
              <Timeline accent={accent} progress={timelineProgress} />
            </div>
          </div>

          <RateCard
            title="Response Rate"
            pct={75}
            rows={[
              { name: "Responses", val: "10,395" },
              { name: "Out of", val: "13,860 Audience" },
            ]}
            progress={donut1Progress}
            style={{
              opacity: donut1Opacity,
              transform: `translateY(${donut1Y}px)`,
              willChange: "transform, opacity",
            }}
          />
          <RateCard
            title="Completion Rate"
            pct={95}
            rows={[
              { name: "Completions", val: "9875" },
              { name: "Out of", val: "10,395 Audience" },
            ]}
            progress={donut2Progress}
            style={{
              opacity: donut2Opacity,
              transform: `translateY(${donut2Y}px)`,
              willChange: "transform, opacity",
            }}
          />
        </div>
      </div>
    </WorkvivoSeerChrome>
  );
};


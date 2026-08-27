import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoSeerInsightsStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import "./WorkvivoGlassEdge.css";
import { SEER_TABS, WorkvivoSeerChrome } from "./WorkvivoSeerChrome";
import {
  CustomizationProvider,
  useOptionalCustomization,
} from "../../customize/CustomizationProvider";

/**
 * Seer Insights — the Comments tab: popular topics by sentiment, then the comment list.
 *
 * The device box, top bar, rail and page head (title, Manage button, tab strip) come
 * from WorkvivoSeerChrome, shared verbatim with WorkvivoSeerRater and
 * WorkvivoSeerManagerInsights. Only the page below the tab strip is this screen's own —
 * the filter pills, the Seer AI strip, the topic grid and the comment list, all measured
 * off a 1481-wide reference and kept in those px (see the stylesheet header for how they
 * reach the chrome's 1440 design space).
 */

export { SEER_TABS };

export type SeerFilter = {
  label: string;
  /** The orange one — the round the rest of the page is scoped to. */
  active?: boolean;
  /** AI-derived filters carry the pink sparkle. */
  ai?: boolean;
  /** "Prescriptive" explains itself with a help dot instead of a chevron. */
  help?: boolean;
};

export const SEER_FILTERS: SeerFilter[] = [
  { label: "Round 6 (2026/06/15)", active: true },
  { label: "Segment" },
  { label: "Driver" },
  { label: "Value" },
  { label: "NPS Category" },
  { label: "Topic", ai: true },
  { label: "Prescriptive", ai: true, help: true },
  { label: "Starred" },
];

export type SeerSentiment =
  | "Very Positive"
  | "Positive"
  | "Neutral"
  | "Negative"
  | "Very Negative";

export type SeerTopic = { sentiment: SeerSentiment; title: string; comments: number };

/** Five per row, in the reference's order — not sorted by volume. */
export const SEER_TOPICS: SeerTopic[] = [
  { sentiment: "Very Positive", title: "Team Collaboration", comments: 710 },
  { sentiment: "Positive", title: "Work Environment", comments: 640 },
  { sentiment: "Negative", title: "Employee Satisfaction", comments: 630 },
  { sentiment: "Negative", title: "Workplace Atmosphere", comments: 430 },
  { sentiment: "Neutral", title: "Competitive Environment", comments: 520 },
  { sentiment: "Positive", title: "Employee Morale", comments: 104 },
  { sentiment: "Negative", title: "Performance Recognition", comments: 490 },
  { sentiment: "Very Negative", title: "Coworker Relationships", comments: 880 },
  { sentiment: "Positive", title: "Workplace Communication", comments: 230 },
  { sentiment: "Negative", title: "Team Dynamics", comments: 230 },
];

export type SeerComment = {
  score: number;
  driver: string;
  survey: string;
  date: string;
  question: string;
  body: string;
};

export const SEER_COMMENTS: SeerComment[] = [
  {
    score: 7,
    driver: "Wellbeing",
    survey: "Engagement",
    date: "June 15th, 2026",
    question: "I can effectively manage my work-life balance",
    body: "I try my best to manage my work-life balance, but it can be challenging at times.",
  },
  {
    score: 9,
    driver: "Career Development",
    survey: "Engagement",
    date: "June 14th, 2026",
    question: "I am given real opportunities to grow here",
    body: "I've received great training over the last quarter",
  },
  {
    score: 2,
    driver: "Communication",
    survey: "Engagement",
    date: "June 10th, 2026",
    question: "Team meetings and communication are frequent and of high quality",
    body: "We haven't had a team meeting in a while.",
  },
];

/** The stacked bar on the sentiment row: width in px against the fill. */
const SENTIMENT_BAR: [number, string][] = [
  [99, "#4cae5e"],
  [23, "#e9c34a"],
  [28, "#e35757"],
  [10, "#d8d8de"],
];

const SENTIMENT_CLASS: Record<SeerSentiment, string> = {
  "Very Positive": "wsi-s-positive",
  Positive: "wsi-s-positive",
  Neutral: "wsi-s-neutral",
  Negative: "wsi-s-negative",
  "Very Negative": "wsi-s-negative",
};

const SCORE_CLASS = (score: number) =>
  score >= 8 ? "wsi-sc-green" : score >= 5 ? "wsi-sc-yellow" : "wsi-sc-red";

const Chevron: React.FC = () => (
  <svg className="wsi-chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Help: React.FC = () => (
  <svg className="wsi-help" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.5 9.2a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 3.6" />
    <line x1="12" y1="16.6" x2="12.01" y2="16.6" />
  </svg>
);

/** The four-point star Seer marks every AI-derived affordance with. */
const Sparkle: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg className="wsi-sparkle" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.4 2.6 15 7.8l5.2 1.6-5.2 1.6-1.6 5.2-1.6-5.2-5.2-1.6 5.2-1.6z" />
    <path d="M6.2 15.4 7 17.8l2.4.8-2.4.8-.8 2.4-.8-2.4L3 18.6l2.4-.8z" />
  </svg>
);

export interface WorkvivoSeerInsightsProps {
  /** Composition size. The 1760x1080 device is scaled to fit, centred. */
  width?: number;
  height?: number;
  /** Shows through around the device where it cannot fill the frame. */
  background?: string;
  /**
   * The standard glass edge — 16px radius, the default 10.5px band.
   */
  glassEdge?: boolean;
  /** Animate UI elements on entrance */
  animateIn?: boolean;
  /** Frame offset at which UI entrance animation begins */
  animateStartFrame?: number;
}

const WorkvivoSeerInsightsBody: React.FC<Required<WorkvivoSeerInsightsProps>> = ({
  width,
  height,
  background,
  glassEdge,
  animateIn,
  animateStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { copy } = useCustomization();
  const scale = Math.min(width / 1760, height / 1080);

  // Titles and words from the copy table; sentiment bands, comment counts, scores and
  // dates from the baseline. The chart's shape is the product's, the words on it are the
  // company's — the same split the Rater tab makes.
  const topics = SEER_TOPICS.map((t, i) => ({ ...t, title: copy.seer.topics[i] }));
  const comments = SEER_COMMENTS.map((c, i) => ({
    ...c,
    driver: copy.seer.comments[i].driver,
    question: copy.seer.comments[i].question,
    body: copy.seer.comments[i].body,
  }));

  const getAnimStyle = (startOffset: number, yDist = 24) => {
    if (!animateIn) return {};
    const startF = animateStartFrame + startOffset;
    const progress = interpolate(frame, [startF, startF + 14], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      opacity: progress,
      transform: `translateY(${(1 - progress) * yDist}px)`,
      willChange: "transform, opacity",
    };
  };

  return (
    <div
      className="wsi-seerinsights"
      style={{
        width,
        height,
        overflow: "hidden",
        background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className={glassEdge ? "wv-glass-edge" : undefined}
        style={
          {
            width: 1760,
            height: 1080,
            flex: "none",
            borderRadius: glassEdge ? 16 : undefined,
            boxShadow: glassEdge ? "0 25px 80px rgba(0, 0, 0, 0.65)" : undefined,
            ["--wv-glass-radius" as string]: glassEdge ? "16px" : undefined,
            transform: `scale(${scale})`,
          } as React.CSSProperties
        }
      >
          {/* Only when the frame is actually wearing the edge — see `glassEdge` above. */}
      {glassEdge && <GlassRing />}
        <div style={{ width: 1760, height: 1080, borderRadius: 16, overflow: "hidden" }}>
          <WorkvivoSeerChrome activeTab="Comments">
            <div className="wsc-page wsi-page">
              <div className="wsi-filters" style={getAnimStyle(0, 16)}>
                {SEER_FILTERS.map((f) => (
                  <span
                    key={f.label}
                    className={f.active ? "wsi-pill wsi-on" : "wsi-pill"}
                  >
                    {f.ai ? <Sparkle size={12} /> : null}
                    {f.label}
                    {f.help ? <Help /> : <Chevron />}
                  </span>
                ))}
              </div>

              <div className="wsi-ai" style={getAnimStyle(2, 20)}>
                <span className="wsi-ai-mark">
                  <Sparkle size={15} />
                </span>
                <span className="wsi-ai-label">Seer AI</span>
                <span className="wsi-ai-summary">Summary</span>
              </div>

              <div className="wsi-section" style={getAnimStyle(4, 20)}>
                <Sparkle size={14} />
                <span className="wsi-section-title">Popular Topics</span>
                <Help />
                <span className="wsi-view-all">View All</span>
              </div>

              <div className="wsi-topics">
                {topics.map((t, idx) => (
                  <div
                    className="wsi-topic"
                    key={t.title}
                    style={getAnimStyle(5 + idx * 1.2, 24)}
                  >
                    <div className={`wsi-topic-status ${SENTIMENT_CLASS[t.sentiment]}`}>
                      {t.sentiment}
                    </div>
                    <div className="wsi-topic-title">{t.title}</div>
                    <div className="wsi-topic-meta">
                      <b>{t.comments}</b> Comments
                    </div>
                  </div>
                ))}
              </div>

              <div className="wsi-comments-head" style={getAnimStyle(16, 24)}>
                <span className="wsi-comments-title">All Comments</span>
                <span className="wsi-comments-count">9,430 Comments</span>
              </div>

              <div className="wsi-sentiment" style={getAnimStyle(17, 24)}>
                <span className="wsi-sentiment-label">Sentiment</span>
                <span className="wsi-sentiment-value">Very Positive</span>
                <span className="wsi-bar">
                  {SENTIMENT_BAR.map(([w, c]) => (
                    <span key={c} style={{ width: w, background: c }} />
                  ))}
                </span>
              </div>

              <div
                className="wsi-list"
                data-vc-slot="seer.comments"
                style={getAnimStyle(18, 24)}>
                {comments.map((c) => (
                  <div className="wsi-comment" key={c.question + c.date}>
                    <span className={`wsi-score ${SCORE_CLASS(c.score)}`}>{c.score}</span>
                    <div className="wsi-comment-body">
                      <div className="wsi-comment-meta">
                        <span>{c.driver}</span>
                        <i />
                        <span>{c.survey}</span>
                        <i />
                        <span>{c.date}</span>
                      </div>
                      <div className="wsi-comment-title">{c.question}</div>
                      <div className="wsi-comment-text">{c.body}</div>
                    </div>
                    <span className="wsi-star">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2.6 15.1 8.9 22 9.9 17 14.8 18.2 21.7 12 18.4 5.8 21.7 7 14.8 2 9.9 8.9 8.9 12 2.6" />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WorkvivoSeerChrome>
        </div>
      </div>
    </div>
  );
};

export const WorkvivoSeerInsights: React.FC<WorkvivoSeerInsightsProps> = ({
  width = 1920,
  height = 1080,
  background = "#ffffff",
  glassEdge = true,
  animateIn = false,
  animateStartFrame = 6,
}) => {
  const hasProvider = useOptionalCustomization() !== null;
  const body = (
    <WorkvivoSeerInsightsBody
      width={width}
      height={height}
      background={background}
      glassEdge={glassEdge}
      animateIn={animateIn}
      animateStartFrame={animateStartFrame}
    />
  );
  return hasProvider ? body : <CustomizationProvider>{body}</CustomizationProvider>;
};
import { GlassRing } from "./GlassRing";

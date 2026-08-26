import React from "react";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoFeedbackArticleStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import { FIXED_COPY } from "../../customize/videoCopy";

export const ARTICLE_W = 920;

const ChevronDown: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M3 4.75L6 7.75L9 4.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The two-column-free article page the Employee Insights space links to, global
 * 4110-4253.
 *
 * The reference sets every paragraph's line breaks by hand. Those breaks are kept in the
 * copy slots as real newlines and rendered with `white-space: pre-line`, so the approved
 * cut wraps exactly where it did while researched copy — which will not carry them —
 * simply wraps on its own.
 *
 * Reaction counts and the "Published 2 days ago" line are fixed: the same numbers on
 * every tenant's screen.
 */
export const WorkvivoFeedbackArticle: React.FC = () => {
  const { copy, image } = useCustomization();
  // Fixed, not slots: the whole letter is a locked beat of the film — Workvivo's own
  // worked example rather than copy about the customer. See FIXED_COPY in videoCopy.ts.
  const article = FIXED_COPY.feedbackArticle;

  return (
    <div className="wfa-page">
      <h1 className="wfa-title">{article.title}</h1>

      <p className="wfa-subtitle" style={{ whiteSpace: "pre-line" }}>
        {article.standfirst}
      </p>

      {/* Reactions Count */}
      <div className="wfa-reactions-label">829 reactions</div>

      {/* Reaction Badges */}
      <div className="wfa-reactions-row">
        <span className="wfa-badge">
          <span className="wfa-emoji">🎉</span>
          <span className="wfa-badge-count">615</span>
        </span>
        <span className="wfa-badge">
          <span className="wfa-emoji">👏</span>
          <span className="wfa-badge-count">214</span>
        </span>
      </div>

      {/* Author and Language row */}
      <div className="wfa-author-row">
        <div className="wfa-author-info">
          <img
            data-vc-slot="voice.author.0"
            src={image("voice.author.0", staticFile("img/jay_lee_avatar.png"))}
            alt=""
            className="wfa-avatar-img"
          />
          <div>
            <div className="wfa-author-name">{article.author}</div>
            <div className="wfa-author-meta">Published 2 days ago</div>
          </div>
        </div>

        <div className="wfa-lang-selector">
          <span>{copy.article.language}</span>
          <ChevronDown />
        </div>
      </div>

      {article.sections.map((section) => (
        <div className="wfa-section" key={section.heading}>
          <h2 className="wfa-heading">{section.heading}</h2>
          {/* Split on blank lines: each becomes its own <p>, and the single newlines
              inside one are the reference's hand-set wrap points. */}
          {section.body.split(/\n\s*\n/).map((para) => (
            <p className="wfa-p" key={para.slice(0, 32)} style={{ whiteSpace: "pre-line" }}>
              {para.trim()}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

import React from "react";
import { staticFile } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoArticleStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * A single Workvivo article — banner with the title and language picker, the AI summary
 * bar, the body copy and the image row underneath.
 *
 * Authored at the reference's own 920px page width; the scene that stages it owns the
 * zoom, so every number here is the number in the design.
 *
 * Reads `copy.article` and the `article.*` image positions, so it needs a
 * <CustomizationProvider> above it. The page runs off the bottom of whatever frame it is
 * put in, exactly as the reference does, rather than being sized to fit.
 */

export const ARTICLE_W = 920;

const ChevronDown: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M3 4.75L6 7.75L9 4.75"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface WorkvivoArticleProps {
  /** These four override `copy.article`; omit them inside the film. */
  title?: string;
  language?: string;
  banner?: string;
  /**
   * Plain paragraphs instead of the structured prose.
   *
   * The reference's layout is a lead paragraph, a subheading, three bullets, a pull quote
   * and a closing line — that is what `copy.article` describes and what this draws when
   * `body` is absent. Passing an array replaces the lot with flat paragraphs, which is
   * what the gallery wants and nothing in the cut does.
   */
  body?: string[];
  /**
   * The two photos under the copy. The reference has a second Virgin crew shot the repo
   * does not carry, so the right-hand one is a stand-in.
   */
  figures?: [string, string];
  titleStyle?: React.CSSProperties;
  aiStyle?: React.CSSProperties;
  paragraphStyle?: (index: number) => React.CSSProperties;
  figureStyle?: (index: number) => React.CSSProperties;
}

export const WorkvivoArticle: React.FC<WorkvivoArticleProps> = ({
  title,
  language,
  banner,
  body,
  figures,
  titleStyle,
  aiStyle,
  paragraphStyle,
  figureStyle,
}) => {
  const { copy, image } = useCustomization();
  const article = copy.article;
  const bannerSrc = banner
    ? staticFile(banner)
    : image("article.banner.0", staticFile("img/workvivo/news_3.png"));
  const figureSrcs: [string, string] = figures
    ? [staticFile(figures[0]), staticFile(figures[1])]
    : [
        image("article.figure.0", staticFile("img/journeys/new-hire.png")),
        image("article.figure.1", staticFile("img/journeys/leadership.png")),
      ];
  const figureSlots: (string | undefined)[] = figures
    ? [undefined, undefined]
    : ["article.figure.0", "article.figure.1"];

  return (
  <div className="wa-page">
    <WorkvivoSvgDefs />

    <div className="wa-banner">
      <img data-vc-slot={banner ? undefined : "article.banner.0"} src={bannerSrc} alt="" />
      <div className="wa-banner-scrim" />
      <div className="wa-title" style={titleStyle}>{title ?? article.title}</div>
      <div className="wa-lang">
        {language ?? article.language}
        <ChevronDown />
      </div>
    </div>

    <div className="wa-body">
      <div className="wa-ai" style={aiStyle}>
        <span className="wa-ai-mark">
          <Icon href="#i-ui-askvivo" className="" width={13} height={13} />
        </span>
        <span className="wa-ai-label">AI Summary</span>
        <span className="wa-ai-open">Open</span>
      </div>

      <div className="wa-prose">
        {body ? (
          body.map((para, i) => (
            <p key={para.slice(0, 32)} style={paragraphStyle ? paragraphStyle(i) : undefined}>
              {para}
            </p>
          ))
        ) : (
          <>
            <p style={paragraphStyle ? paragraphStyle(0) : undefined}>{article.lead}</p>

            <h3 className="wa-heading" style={paragraphStyle ? paragraphStyle(1) : undefined}>
              {article.heading}
            </h3>

            <ul className="wa-list" style={paragraphStyle ? paragraphStyle(2) : undefined}>
              {article.points.map((point) => (
                <li className="wa-list-item" key={point.label}>
                  <strong>{point.label}:</strong> {point.body}
                </li>
              ))}
            </ul>

            <div className="wa-quote" style={paragraphStyle ? paragraphStyle(3) : undefined}>
              <div className="wa-quote-text">&ldquo;{article.quote}&rdquo;</div>
              <div className="wa-quote-author">{article.quoteAuthor}</div>
            </div>

            <p style={paragraphStyle ? paragraphStyle(4) : undefined}>{article.closing}</p>
          </>
        )}
      </div>

      <div className="wa-figs">
        {figureSrcs.map((src, i) => (
          <img
            key={src}
            data-vc-slot={figureSlots[i]}
            src={src}
            alt=""
            style={figureStyle ? figureStyle(i) : undefined}
          />
        ))}
      </div>
    </div>
  </div>
  );
};

import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoIntegrationsMarketplaceStyles.css";

/**
 * Workvivo Integrations Marketplace — the app-connector modal, on the tenant brand field.
 */

export interface WorkvivoIntegrationsMarketplaceProps {
  /** Per-tenant brand colour for the field behind the card. */
  brand?: string;
  /**
   * Hero banner image. Defaults to `public/img/marketplace-header.jpg`, which is the
   * whole banner (copy side and icon side baked into one asset), not just a half.
   */
  headerSrc?: string;
  /** Extra class on the stage. */
  className?: string;
  /** Whether the category cards scale in. Default true. */
  animated?: boolean;
  /** Explicit frame override (defaults to useCurrentFrame()). */
  frame?: number;
}

type Card = { title: string; sub: string; tint: string };

const CARDS: Card[] = [
  { title: "Productivity", sub: "Shortcuts, apps, docs, and journeys.", tint: "#fefce8" },
  { title: "IT & Support", sub: "IT & Support Integrations", tint: "#f5f3ff" },
  { title: "Calendar", sub: "Get a  from your provider/Calendar Integrations", tint: "#eff6ff" },
  { title: "Social Media", sub: "Add Social Media Integrations", tint: "#fdf2f8" },
  { title: "HR & People", sub: "Add Payrolls, HR and other people Integrations", tint: "#ecfdf5" },
];

/** Outline gold star icon matching red version reference */
const StarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="wim-star">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke="#F59E0B"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** The link arrow. Shaft plus head — same primitive WorkvivoWidgetStore draws. */
const ArrowRight: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <line x1="1.6" y1="8" x2="12.2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <polygon points="14.4,8 9.6,5.2 9.6,10.8" fill="currentColor" />
  </svg>
);

/** Info mark. A ring plus a stem and dot — generic chrome, not a Workvivo glyph. */
const InfoMark: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <line x1="8" y1="7.1" x2="8" y2="11.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="4.7" r="0.9" fill="currentColor" />
  </svg>
);

const ViewIntegrations: React.FC = () => (
  <span className="wim-link">
    <span>View Integrations</span>
    <ArrowRight />
  </span>
);

export const WorkvivoIntegrationsMarketplace: React.FC<WorkvivoIntegrationsMarketplaceProps> = ({
  brand = "#d40000",
  headerSrc,
  className,
  animated = true,
  frame: frameProp,
}) => {
  const currentFrame = useCurrentFrame();
  const frame = animated ? (frameProp ?? currentFrame) : 100;
  const EASE = Easing.bezier(0.16, 1, 0.3, 1);

  // Global 4415 is local 18 (4415 - 4397), global 4440 is local 43 (4440 - 4397)
  const startFrame = 18;

  return (
    <div
      className={"wim-stage" + (className ? ` ${className}` : "")}
      style={{ "--wim-brand": brand } as React.CSSProperties}>
      <WorkvivoSvgDefs />

      <div className="wim-modal">
        <div className="wim-head">
          <StarIcon />
          <h1 className="wim-h1">Integrations Marketplace</h1>
        </div>

        <div className="wim-notice">
          <InfoMark />
          <span>
            The integrations setup is explained on <span className="wim-link-inline">Workvivo Help Center</span>
          </span>
        </div>

        <div className="wim-hero">
          <img src={headerSrc ?? staticFile("img/marketplace-header.jpg")} alt="" />
        </div>

        <div className="wim-search">
          <Icon href="#i-ui-explore" width={16} height={16} />
          <span>Search Integrations</span>
        </div>

        <div className="wim-browse">
          <h2 className="wim-h2">Browse by category</h2>
          <span className="wim-link">See all Integrations</span>
        </div>

        <div className="wim-grid">
          {CARDS.map((c, i) => {
            const cStart = startFrame + i * 3.2;
            const cardProgress = animated
              ? interpolate(frame, [cStart, cStart + 12.2], [0, 1], {
                  easing: EASE,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;

            return (
              <div
                key={c.title}
                className="wim-card"
                style={{
                  background: c.tint,
                  transform: `scale(${cardProgress})`,
                  opacity: cardProgress,
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                }}
              >
                <div className="wim-card-cat">Category</div>
                <div className="wim-card-t">{c.title}</div>
                <div className="wim-card-s">{c.sub}</div>
                <ViewIntegrations />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoWidgetStoreStyles.css";

/**
 * Workvivo Widget Store — the category browser modal, on the tenant brand field.
 *
 * The modal runs off the bottom of the frame, as the reference does: it is a tall surface
 * and the shot is a crop of it, not a modal that happens to end at 1080.
 *
 * ICON PROVENANCE
 *   i-ui-*  Workvivo's own library: the search magnifier (`ui.explore`).
 *   drawn   The close X and the "View Widgets" arrow. Neither exists in the Workvivo
 *           library in any register, and both are generic chrome the reference itself
 *           draws as plain geometry, so they are built from line/polygon primitives
 *           rather than approximated from a Workvivo glyph. No path data is authored
 *           anywhere in this file.
 *
 * The card tints are the reference's own and are deliberately NOT brand-derived — they
 * stay put when the tenant colour changes, which is what makes the row read as a palette
 * of categories rather than as seven shades of one brand.
 */

export interface WorkvivoWidgetStoreProps {
  /** Per-tenant brand colour for the field behind the modal. */
  brand?: string;
  /** Which rail item is selected. Matches on label. */
  active?: string;
  /**
   * Extra style per category card, by its index in CARDS.
   *
   * Only ever transform and opacity — the reveal at 2823 grows the top row in one card at
   * a time before the modal arrives, and it does it through here rather than by copying
   * this markup so that the cards it animates and the cards the modal lands on cannot
   * drift apart. Anything that changes layout belongs in the CSS, not here.
   */
  cardStyle?: (index: number) => React.CSSProperties;
  /** Extra class on the stage. `wws-cards-only` paints the top row and nothing else. */
  className?: string;
}

const CATEGORIES = [
  "Discover",
  "Productivity",
  "Stay Informed",
  "Connect",
  "Media",
  "Technical",
  "Seer",
];

type Card = { title: string; sub: string; tint: string };

/**
 * In the reference's order — the grid is not alphabetised and does not match the rail's
 * order, and both of those are left as they are rather than tidied.
 *
 * "Seer" and "Integrations" carry the same subtitle in the reference. Kept verbatim.
 */
const CARDS: Card[] = [
  { title: "Productivity", sub: "Shortcuts, apps, docs, and journeys.", tint: "#fcf6dc" },
  { title: "Media", sub: "Podcasts, video, and embeds.", tint: "#eeeafb" },
  { title: "Stay Informed", sub: "News, events, announcements, and more.", tint: "#e8f0fe" },
  { title: "Connect", sub: "Spaces and people in motion.", tint: "#faeaef" },
  { title: "Technical", sub: "Time off, weather, live data.", tint: "#e9f7ef" },
  { title: "Seer", sub: "Skills and serialized learning.", tint: "#fcefe4" },
  { title: "Integrations", sub: "Skills and serialized learning.", tint: "#eaeafb" },
];

/** How many category cards the grid holds. Exported so a caller staggering them through
 *  `cardStyle` does not have to keep its own count of this list. */
export const WIDGET_STORE_CARD_COUNT = CARDS.length;

/** Close. Two crossed lines — not a Workvivo glyph, and not pretending to be one. */
const CloseX: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** The link arrow. Shaft plus head, from a line and a polygon. */
const ArrowRight: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <line x1="1.6" y1="8" x2="12.2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <polygon points="14.4,8 9.6,5.2 9.6,10.8" fill="currentColor" />
  </svg>
);

const Tile: React.FC<{ w: number; h: number; c: string }> = ({ w, h, c }) => (
  <span className="wws-tile" style={{ width: w, height: h, background: c }} />
);

const PEACH = "#fbe3c4";
const PINK = "#f8dbe8";
const BLUE = "#d6e4f8";

const ViewWidgets: React.FC = () => (
  <span className="wws-link">
    <span>View Widgets</span>
    <ArrowRight />
  </span>
);

export const WorkvivoWidgetStore: React.FC<WorkvivoWidgetStoreProps> = ({
  brand = "#d40000",
  active = "Discover",
  cardStyle,
  className,
}) => (
  <div
    className={"wws-stage" + (className ? ` ${className}` : "")}
    style={{ "--wws-brand": brand } as React.CSSProperties}>
    <WorkvivoSvgDefs />

    <div className="wws-modal">
      {/* ---------- category rail ---------- */}
      <aside className="wws-side">
        <div className="wws-brand">Widget Store</div>
        <div className="wws-rule" />
        <div className="wws-side-body">
          <div className="wws-caption">Widget Categories</div>
          <nav className="wws-nav">
            {CATEGORIES.map((c) => (
              <div key={c} className={"wws-nav-item" + (c === active ? " is-on" : "")}>
                {c}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* ---------- main pane ---------- */}
      <section className="wws-main">
        <div className="wws-head">
          <h1 className="wws-h1">Discover</h1>
          <span className="wws-close">
            <CloseX />
          </span>
        </div>
        <div className="wws-sub">Start with a category—or jump straight to search.</div>

        <div className="wws-search">
          <Icon href="#i-ui-explore" width={16} height={16} />
          <span>Search</span>
        </div>

        <div className="wws-hero">
          <div className="wws-hero-copy">
            <div className="wws-eyebrow">New</div>
            <div className="wws-hero-t">Make your landing page feel alive.</div>
            <div className="wws-hero-b">
              Curated widgets for comms, culture, and everyday work—organized the way
              people actually browse.
            </div>
          </div>

          {/* Abstract widget board. Decorative geometry, not a Workvivo asset. */}
          <div className="wws-hero-art">
            <div className="wws-board">
              <div className="wws-board-row">
                <Tile w={168} h={44} c={PEACH} />
                <div className="wws-board-col">
                  <Tile w={104} h={18} c={PEACH} />
                  <Tile w={104} h={18} c={PEACH} />
                </div>
              </div>
              <div className="wws-board-row">
                <Tile w={80} h={16} c={PINK} />
                <Tile w={88} h={16} c={PINK} />
                <Tile w={104} h={16} c={PINK} />
              </div>
              <div className="wws-board-row">
                <Tile w={62} h={58} c={BLUE} />
                <Tile w={112} h={58} c={BLUE} />
                <Tile w={86} h={58} c={BLUE} />
              </div>
              <div className="wws-board-row">
                <Tile w={62} h={30} c={PINK} />
                <Tile w={112} h={30} c="rgba(255,255,255,0.55)" />
                <Tile w={86} h={30} c={PINK} />
              </div>
            </div>
          </div>
        </div>

        <div className="wws-browse">
          <h2 className="wws-h2">Browse by category</h2>
          <span className="wws-link">See all widgets</span>
        </div>

        <div className="wws-grid">
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className="wws-card"
              style={{ background: c.tint, ...cardStyle?.(i) }}>
              <div className="wws-card-cat">Category</div>
              <div className="wws-card-t">{c.title}</div>
              <div className="wws-card-s">{c.sub}</div>
              <ViewWidgets />
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

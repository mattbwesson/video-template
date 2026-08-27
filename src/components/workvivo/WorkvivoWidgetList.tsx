import React from "react";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoWidgetListStyles.css";

/**
 * The Workvivo widget catalogue — two columns of installable widget cards.
 *
 * Sibling of WorkvivoWidgetStore, not a replacement: that one is the store's Discover
 * landing page (categories, hero, browse row); this is the list you scroll once you are
 * inside a category.
 *
 * Authored 1:1 with the reference at 1210 wide, so every number is the number in the
 * design and the scene owns the zoom. Standalone — no provider needed.
 */

export const WIDGET_LIST_W = 1210;

/** Card height + the gap under it. One constant because both columns share the pitch. */
export const WIDGET_CARD_PITCH = 185 + 23;

export type WidgetCategory =
  | "Stay Informed"
  | "Connect"
  | "Learn"
  | "Productivity"
  | "Technical";

/** Chip fill and text per category, as the reference tints them. */
const CHIP: Record<WidgetCategory, { bg: string; fg: string }> = {
  "Stay Informed": { bg: "#DEE6FC", fg: "#4055B4" },
  Connect: { bg: "#FBDCE1", fg: "#A93A50" },
  Learn: { bg: "#FBE7D3", fg: "#A2632C" },
  Productivity: { bg: "#D7F0DF", fg: "#2E7A52" },
  Technical: { bg: "#FAF0C9", fg: "#86691D" },
};

export type WidgetItem = {
  title: string;
  desc: string;
  category: WidgetCategory;
  /** Sprite id, or null where the library has no glyph for it. */
  icon: string | null;
  /** A file, for the one mark the sprite does not carry. Wins over `icon`. */
  iconSrc?: string;
  /** The tile's gradient, top-left to bottom-right. */
  tint: [string, string];
};

/**
 * The catalogue, in the reference's order — left column then right.
 *
 * `Billboards` is the one card whose mark is not in the sprite — the library carries no
 * billboard, signage or display glyph, checked across "billboards", "signage", "display
 * screen" and "broadcast". It used to render as an explicit gap rather than as something
 * invented; the real artwork has since been supplied, so it draws from a file instead
 * (`iconSrc`). Everything else still comes from the sprite.
 *
 * Two details are inferred because the reference crops them: the first card's title is
 * cut off above the frame (the copy reads as Upcoming Events), and Featured News's chip
 * is cut off below it.
 */
export const WIDGETS_LEFT: WidgetItem[] = [
  {
    title: "Upcoming Events",
    desc: "Stay updated , designed to keep you informed about all the exciting activities on the horizon.",
    category: "Stay Informed",
    icon: "#i-ui-events-nav-rail",
    tint: ["#F26A5A", "#E0432F"],
  },
  {
    title: "Featured Pages",
    desc: "Explore curated pages and resources handpicked for your team and interests.",
    category: "Stay Informed",
    icon: "#i-ui-pages",
    tint: ["#5AA9F8", "#2D7FE0"],
  },
  {
    title: "Billboards",
    desc: "Billboards serve as a platform for promoting and showcasing your desired content.",
    category: "Stay Informed",
    icon: null,
    iconSrc: "img/billboared.svg",
    tint: ["#F79A3E", "#EE7A1E"],
  },
  {
    title: "Trending Spaces",
    desc: "Join the conversation in the most active community spaces.",
    category: "Connect",
    icon: "#i-ui-spaces",
    tint: ["#7B7AF2", "#4F4CE0"],
  },
  {
    title: "Podcast",
    desc: "Catch up on the latest episodes from your favorite shows and discover new content.",
    category: "Learn",
    icon: "#i-ui-podcasts",
    tint: ["#9B6CF8", "#7C3AED"],
  },
];

export const WIDGETS_RIGHT: WidgetItem[] = [
  {
    title: "Apps",
    desc: "Apps provides you with instant access to essential productivity tools.",
    category: "Productivity",
    icon: "#i-ui-featured-apps",
    tint: ["#F07CB0", "#E0428A"],
  },
  {
    title: "Quick Links",
    desc: "Access your most important resources and tools instantly with customizable shortcuts.",
    category: "Productivity",
    icon: "#i-ui-quick-links",
    tint: ["#F0C04E", "#DFA01C"],
  },
  {
    title: "Posts",
    desc: "Stay updated with the latest posts in your activity feed.",
    category: "Stay Informed",
    icon: "#i-ui-posts",
    tint: ["#5A8CF8", "#2D63E0"],
  },
  {
    title: "Time Off",
    desc: "Track your vacation days and plan your next break to recharge and stay balanced.",
    category: "Technical",
    icon: "#i-ui-event-time",
    tint: ["#EFC748", "#DFA81E"],
  },
  {
    title: "Featured News",
    desc: "Get the latest updates and announcements from across your organization in one place.",
    category: "Stay Informed",
    icon: "#i-ui-featured-news",
    tint: ["#4CC98A", "#22A05C"],
  },
];

export const WidgetCard: React.FC<{ item: WidgetItem; style?: React.CSSProperties }> = ({
  item,
  style,
}) => {
  const chip = CHIP[item.category];
  return (
    <div className="wwl-card" style={style}>
      <div className="wwl-head">
        <span
          className="wwl-tile"
          style={{ background: `linear-gradient(135deg, ${item.tint[0]} 0%, ${item.tint[1]} 100%)` }}
        >
          {item.iconSrc ? (
            /* Inline, not <img src="…svg">: the file is viewBox-only with its fill in a
               <defs><style> block, which exports corner-cropped. The path is already
               white, so it needs no `fill` — it sits on the tile's gradient. */
            <InlineSvg className="wwl-tile-svg" src={staticFile(item.iconSrc)} />
          ) : item.icon ? (
            <Icon href={item.icon} className="" width={26} height={26} />
          ) : (
            <span className="wwl-glyph-missing" />
          )}
        </span>
        <span className="wwl-text">
          <span className="wwl-title" style={{ display: "block" }}>
            {item.title}
          </span>
          <span className="wwl-desc" style={{ display: "block" }}>
            {item.desc}
          </span>
        </span>
      </div>
      <span className="wwl-chip" style={{ background: chip.bg, color: chip.fg }}>
        {item.category}
      </span>
    </div>
  );
};
import { InlineSvg } from "../InlineSvg";
import { staticFile } from "remotion";

export interface WorkvivoWidgetListProps {
  left?: WidgetItem[];
  right?: WidgetItem[];
  /**
   * How far the right column hangs below the left. The reference offsets it by roughly
   * half a card, which is what stops the two columns reading as one grid.
   */
  stagger?: number;
  leftOffset?: number;
  rightOffset?: number;
  leftOpacity?: number;
  rightOpacity?: number;
  leftFilter?: string;
  rightFilter?: string;
  cardStyle?: (side: "left" | "right", index: number) => React.CSSProperties;
}

export const WorkvivoWidgetList: React.FC<WorkvivoWidgetListProps> = ({
  left = WIDGETS_LEFT,
  right = WIDGETS_RIGHT,
  stagger = 101,
  leftOffset = 0,
  rightOffset = 0,
  leftOpacity = 1,
  rightOpacity = 1,
  leftFilter,
  rightFilter,
  cardStyle,
}) => (
  <div className="wwl-list">
    <WorkvivoSvgDefs />
    <div
      className="wwl-col"
      style={{
        transform: leftOffset ? `translateY(${leftOffset}px)` : undefined,
        opacity: leftOpacity,
        filter: leftFilter,
        willChange: "transform, opacity, filter",
      }}
    >
      {left.map((w, i) => (
        <WidgetCard
          item={w}
          key={w.title}
          style={cardStyle ? cardStyle("left", i) : undefined}
        />
      ))}
    </div>
    <div
      className="wwl-col"
      style={{
        marginTop: stagger,
        transform: rightOffset ? `translateY(${rightOffset}px)` : undefined,
        opacity: rightOpacity,
        filter: rightFilter,
        willChange: "transform, opacity, filter",
      }}
    >
      {right.map((w, i) => (
        <WidgetCard
          item={w}
          key={w.title}
          style={cardStyle ? cardStyle("right", i) : undefined}
        />
      ))}
    </div>
  </div>
);

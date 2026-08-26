import React from "react";
import { Icon } from "./WorkvivoIcons";
import "./WorkvivoSeerRailStyles.css";

/**
 * The collapsed nav rail every Seer screen shares.
 *
 * WorkvivoSeerInsights, WorkvivoSeerManagerInsights and WorkvivoSeerRater each carried
 * their own copy of this. One component now, so the three cannot drift apart.
 *
 * Does NOT mount `WorkvivoSvgDefs` — every host already has the sprite on the page, and
 * a second copy would duplicate every symbol id.
 */

/** Solid fill behind the active item; its glyph is white on top. */
export const SEER_RAIL_ACTIVE_BG = "#EB640B";

/** Rail order: the active item first, then the rest below the avatar. */
export const SEER_RAIL_NAV = [
  "#i-ui-latest-posts",
  "#i-ui-spotlight",
  "#i-ui-chat",
  "#i-ui-spaces",
];

export interface WorkvivoSeerRailProps {
  /**
   * Rail width. 64 on the two 1440-body screens, 50 on the deck extract, which lays out
   * at 1843 — the same rail at a different page scale, not a different design.
   */
  width?: number;
  /** The avatar disc under the active item. Omit to leave it out. */
  /** The signed-in face. A real `<img>` — background-image does not survive the export. */
  avatarUrl?: string;
  avatarFit?: React.CSSProperties;
  activeBg?: string;
  /**
   * The inactive glyphs below the avatar. Grey by default, as the deck extract and the
   * manager screen have them; the Rater screen's reference tints them with Seer's accent.
   * The active item is unaffected — its glyph is white on `activeBg` either way.
   */
  iconColor?: string;
  nav?: string[];
}

export const WorkvivoSeerRail: React.FC<WorkvivoSeerRailProps> = ({
  width = 64,
  avatarUrl,
  avatarFit,
  activeBg = SEER_RAIL_ACTIVE_BG,
  iconColor,
  nav = SEER_RAIL_NAV,
}) => (
  <aside className="wsn-rail" style={{ width, color: iconColor }}>
    <span className="wsn-navico wsn-on" style={{ background: activeBg }}>
      <Icon href={nav[0]} className="" width={18} height={18} />
    </span>
    {avatarUrl ? (
      <img className="wsn-railav" src={avatarUrl} style={avatarFit} alt="" />
    ) : null}
    {nav.slice(1).map((href) => (
      <span className="wsn-navico" key={href}>
        <Icon href={href} className="" width={18} height={18} />
      </span>
    ))}
  </aside>
);

import React from "react";
import { staticFile } from "remotion";
import "./WorkvivoSpacesStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoSpacesSvgDefs } from "./WorkvivoSpacesIcons";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Spaces directory — the "24. Space" screen.
 *
 * This is the content column only: banner, "My Spaces" grid and the Trending Spaces rail.
 * It has no top bar or nav rail, matching the reference, so a scene can drop it into
 * whatever chrome it wants (or none). Natural size is 1320 x ~1479; the caller scales.
 *
 * Every glyph comes from Workvivo's own library via the workvivo-ui skill — the badge set
 * is literally the library's "Spaces directory badges" section, so each card wears its
 * real icon rather than an approximation. See WorkvivoSpacesIcons.tsx.
 *
 * Reads `copy.spaces` and the `spaces.*` image positions, so it needs a
 * <CustomizationProvider> above it — WorkvivoSpacesScene and WorkvivoCut both give it one.
 * What is NOT customisable here is everything the product owns: "My Spaces", "Trending
 * Spaces", "View All", "Joined", the Join buttons and the badge artwork.
 */

/**
 * What each of the ten cards keeps regardless of who the video is for.
 *
 * The badge, the cover photo, the "Corporate" tag and the gold star belong to the CARD,
 * not to the company: they are Workvivo artwork and the reference's own layout, and the
 * copy table only supplies the three lines of text over them. Indexed positionally
 * against `copy.spaces.directory`, so the fifth entry here dresses the fifth space —
 * which is the one the cursor clicks at global 1545.
 */
type SpaceChrome = {
  /** Symbol id for the badge glyph inside the purple avatar circle. */
  icon: string;
  /** Baseline cover photo under `public/img/`, used when the operator uploads nothing. */
  cover: string;
  slot: ImageSlotKey;
  tag?: string;
  starred: boolean;
};

const SPACE_CHROME: SpaceChrome[] = [
  {
    icon: "#i-ui-leadership-corner",
    cover: "img/workvivo/pages_2.png",
    slot: "spaces.card.0",
    tag: "Corporate",
    starred: true,
  },
  {
    icon: "#i-ui-managers-network",
    cover: "img/workvivo/news_2.png",
    slot: "spaces.card.1",
    tag: "Corporate",
    starred: true,
  },
  {
    icon: "#i-ui-learning-hub",
    cover: "img/workvivo/pages_1.png",
    slot: "spaces.card.2",
    tag: "Corporate",
    starred: false,
  },
  {
    icon: "#i-ui-human-resources",
    cover: "img/workvivo/pages_3.png",
    slot: "spaces.card.3",
    starred: false,
  },
  {
    icon: "#i-ui-summit-event",
    cover: "img/workvivo/news_3.png",
    slot: "spaces.card.4",
    starred: false,
  },
  {
    icon: "#i-ui-customer-success-stories",
    cover: "filler/images (2).jpeg",
    slot: "spaces.card.5",
    starred: true,
  },
  {
    icon: "#i-ui-it-support-and-resources",
    cover: "img/workvivo/post_2.png",
    slot: "spaces.card.6",
    starred: true,
  },
  {
    icon: "#i-ui-sales-enablement",
    cover: "img/workvivo/news_1.png",
    slot: "spaces.card.7",
    starred: true,
  },
  {
    icon: "#i-ui-run-club",
    cover: "img/workvivo/story_pulse.png",
    slot: "spaces.card.8",
    starred: true,
  },
  {
    icon: "#i-ui-wellbeing-heart",
    cover: "img/workvivo/story_manager.png",
    slot: "spaces.card.9",
    starred: true,
  },
];

/** Where the grid stops and the wide row under the rail begins. */
const GRID_COUNT = 6;

/**
 * The Trending rail's three cards.
 *
 * Their names and descriptions come from `copy.feed.spaces` — the same three spaces the
 * desktop homepage and the in-app screen already draw — so the badge, the pill and the
 * call to action are all that is left here.
 */
const TRENDING_CHROME = [
  { icon: "#i-ui-networking", pill: "🔥", pillEmoji: true, cta: "Join" },
  { icon: "#i-ui-ai-innovation", pill: "New", cta: "Request to Join" },
  { icon: "#i-ui-charity", pill: "New", cta: "Request to Join" },
];

const SpaceCard: React.FC<{
  chrome: SpaceChrome;
  cover: string;
  title: string;
  members: string;
  desc: string;
}> = ({ chrome, cover, title, members, desc }) => (
  <div className="sp-card">
    <img className="sp-cover" data-vc-slot={chrome.slot} src={cover} alt="" />
    <div className="sp-card-inner">
      <div className="sp-card-top">
        {chrome.tag ? <span className="sp-tag">{chrome.tag}</span> : <span />}
        <span className="sp-star">
          <Icon
            href={chrome.starred ? "#i-ui-favorite-star" : "#i-ui-favorite-star-outline"}
            width={28}
            height={28}
          />
        </span>
      </div>
      <div className="sp-card-mid">
        <span className="sp-avatar">
          <span className="sp-avatar-fill">
            <Icon href={chrome.icon} width={40} height={40} />
          </span>
        </span>
        <span className="sp-joinedwrap">
          <span className="sp-joined">
            <span className="sp-tick">&#10003;</span>Joined
          </span>
        </span>
      </div>
      <div className="sp-card-text">
        <div className="sp-card-title">{title}</div>
        <div className="sp-members">{members}</div>
        <div className="sp-desc">{desc}</div>
      </div>
    </div>
  </div>
);

export const WorkvivoSpaces: React.FC = () => {
  const { copy, image } = useCustomization();
  const { welcome, directory } = copy.spaces;

  const card = (i: number) => {
    const chrome = SPACE_CHROME[i];
    const space = directory[i];
    return (
      <SpaceCard
        key={chrome.slot}
        chrome={chrome}
        cover={image(chrome.slot, staticFile(chrome.cover))}
        title={space.name}
        members={spaceMembers(copy.companySize, i)}
        desc={space.description}
      />
    );
  };

  return (
    <div className="sp-pane">
      {/* Both defs blocks: the badge set lives in WorkvivoSpacesIcons, but the rail glyphs
          (networking, ai-innovation, charity) and the gold star are already registered by
          WorkvivoIcons, and <use> resolves against nothing if its defs are not mounted. */}
      <WorkvivoSvgDefs />
      <WorkvivoSpacesSvgDefs />

      {/* Banner. The purple is --Primary-Brand-Color #7F39F3, the per-tenant brand slot —
          not #6103ED, which is reserved for buttons, links and active states. */}
      <div className="sp-banner">
        <img
          className="sp-banner-photo"
          data-vc-slot="spaces.banner.0"
          src={image("spaces.banner.0", staticFile("img/workvivo/story_summit.png"))}
          alt=""
        />
        <div className="sp-welcome">
          <div className="sp-welcome-head">
            {/* `--sp-ring` rather than borderWidth: the stroke is a disc under the fill
                now, so the ring's thickness is the fill's inset. */}
            <span
              className="sp-avatar"
              style={{ width: 60, height: 60, ["--sp-ring" as string]: "2px" }}
            >
              <span className="sp-avatar-fill">
                <Icon href="#i-ui-learning-hub" width={30} height={30} />
              </span>
            </span>
            <div className="sp-welcome-title">{welcome.title}</div>
          </div>
          <div className="sp-welcome-body">{welcome.body}</div>
          <span className="sp-join">Join</span>
        </div>
      </div>

      <div className="sp-head">
        <h2>My Spaces</h2>
        <span className="sp-viewall">
          View All
          <span className="sp-caret" />
        </span>
      </div>

      <div className="sp-body">
        <div className="sp-grid">
          {SPACE_CHROME.slice(0, GRID_COUNT).map((_, i) => card(i))}
        </div>

        <div className="sp-grid-wide">
          {SPACE_CHROME.slice(GRID_COUNT).map((_, i) => card(GRID_COUNT + i))}
        </div>

        {/* Absolutely placed rather than a flex sibling, because the wide row below it has to
            run under the rail rather than beside it — which is what the reference does. */}
        <div className="sp-rail-slot">
          <aside className="sp-rail">
            <h3>Trending Spaces</h3>
            <div className="sp-rail-list">
              {TRENDING_CHROME.map((t, i) => (
                <div className="sp-trend" key={t.icon}>
                  <div className="sp-trend-head">
                    <span className="sp-trend-av">
                      <span className="sp-avatar-fill">
                        <Icon href={t.icon} width={26} height={26} />
                      </span>
                    </span>
                    <div className="sp-trend-name">{copy.feed.spaces[i].name}</div>
                    <span className={t.pillEmoji ? "sp-pill sp-pill-emoji" : "sp-pill"}>
                      {t.pill}
                    </span>
                  </div>
                  <div className="sp-trend-desc">{copy.feed.spaces[i].description}</div>
                  <span className="sp-trend-btn">{t.cta}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
import { spaceMembers } from "../../customize/memberCounts";

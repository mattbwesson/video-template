import React from "react";
import { InlineSvg } from "../InlineSvg";
import { staticFile } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoSpacePageStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Space page — "Annual Employee Summit".
 *
 * A 1:1 recreation of the supplied 1440x1415 Figma export: dark top bar, collapsed
 * (icon-only) nav rail, tenant banner, space header with tabs, and the three-column
 * body — 270 left rail / 568 centre feed / 269 right rail.
 *
 * Every glyph is a real Workvivo icon out of WorkvivoIcons.tsx. Three things in the
 * export carry no art of their own and are therefore drawn as obviously-generic
 * geometry rather than invented into Workvivo-looking glyphs:
 *
 *   - the rail collapse chevron, the "Admin" dropdown caret and the back arrow, which
 *     the export ships as bare rectangles with no path data (CSS borders, see .wsp-chev)
 *   - the Share arrow, which reuses the plain arrow already used by WorkvivoDesktop
 *   - the dimmed 24px control at the foot of the rail, which the export ships as an
 *     untyped placeholder image (neutral grey square at 40% opacity)
 *
 * Colour discipline: #6103ED is Workvivo's semantic primary (buttons, links, the active
 * tab); #7F39F3 is the per-tenant customer brand slot (banner, avatar and tile fills).
 */

/**
 * Every one of these overrides what the customisation would otherwise supply.
 *
 * They exist for the gallery and for any caller staging this page with artwork of its
 * own; inside the film none of them is passed, so the logo, the persona's face and the
 * four photographs all come from `useCustomization()` and are swappable on the review
 * screen. A provider is required either way.
 */
export interface WorkvivoSpacePageProps {
  /** Knockout wordmark for the dark top bar. Defaults to the tenant's. */
  logoSrc?: string;
  /** 1384x228 tenant banner behind the space header. */
  bannerSrc?: string;
  /** Artwork behind the survey call-to-action in the feed. */
  surveySrc?: string;
  /** 269x136 hero for the Featured Story card. */
  storySrc?: string;
  /** 340x221 artwork inside the countdown card. */
  countdownSrc?: string;
  /** Signed-in persona's avatar — top bar and composer. */
  meSrc?: string;
}

const RAIL_PRIMARY = [
  "#i-ui-home-nav-rail",
  "#i-ui-my-company",
  "#i-ui-resources",
  "#i-ui-chat",
  "#i-ui-spaces",
  "#i-ui-employee-insights",
  "#i-ui-admin",
];

const RAIL_EXPLORE = ["#i-ui-news", "#i-ui-events-nav-rail", "#i-ui-pages", "#i-ui-podcasts"];

const RAIL_TOOLS = ["#i-ui-surveys-and-forms", "#i-ui-newsletters", "#i-ui-journeys"];

const RAIL_CONNECT = ["#i-ui-connect", "#i-ui-teams", "#i-ui-org-chart"];

const RAIL_RESOURCES = ["#i-ui-apps-widget", "#i-ui-documents-nav", "#i-ui-gallery"];

const TABS = [
  "Feed",
  "Q&A",
  "Pages",
  "News",
  "Videos",
  "Documents",
  "Events",
  "Members",
  "More",
];

/**
 * The six faces the export stacks under ABOUT and SPACE ADMINS.
 *
 * `img/vatar-2.jpeg` is the reference's own typo and the file does not exist, so that
 * position renders empty in the baseline. It is left as it is rather than corrected,
 * because the second avatar being blank is what the approved cut shows — and it is now a
 * swap position, so an operator upload fills it.
 */
const FACES: { src: string; slot: ImageSlotKey }[] = [
  { src: "img/avatar-1.jpeg", slot: "spacepage.face.0" },
  { src: "img/vatar-2.jpeg", slot: "spacepage.face.1" },
  { src: "img/avatar-3.jpeg", slot: "spacepage.face.2" },
  { src: "img/avatar-4.jpeg", slot: "spacepage.face.3" },
  { src: "img/avatar-5.jpeg", slot: "spacepage.face.4" },
  { src: "img/avatar-6.jpeg", slot: "spacepage.face.5" },
];

const RailItem: React.FC<{ href: string }> = ({ href }) => (
  <div className="wsp-railitem">
    <Icon href={href} width={16} height={16} />
  </div>
);

/** The plain arrow WorkvivoDesktop already uses for Share. Not a Workvivo glyph. */
const ShareArrow: React.FC = () => (
  <svg width="22.52" height="22.52" viewBox="0 0 15 15" style={{ flex: "none" }}>
    <path
      d="M2.5 12.5L12.5 2.5M12.5 2.5H5M12.5 2.5V10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/**
 * The two-line stencil wordmark the export flattens out of its artwork.
 *
 * It is set at a fixed size on a fixed two-line box, so it cannot simply take the event
 * name as one string — it has to break. Splitting on the last space puts the longest word
 * on top, which is what "EMPLOYEE / SUMMIT" is; a one-word name gets one line.
 */
const Wordmark: React.FC<{ text: string; style: React.CSSProperties }> = ({
  text,
  style,
}) => {
  const words = text.trim().toUpperCase().split(/\s+/);
  const tail = words.length > 1 ? words.pop() : null;
  return (
    <div className="wsp-wordmark" style={style}>
      {words.join(" ")}
      {tail ? (
        <>
          <br />
          {tail}
        </>
      ) : null}
    </div>
  );
};

/** Featured Story / Page / Podcast all share this shape in the right rail. */
const FeaturedCard: React.FC<{
  kicker: string;
  title: React.ReactNode;
  buttonLabel: string;
  media: React.ReactNode;
  meta?: React.ReactNode;
  looseTitle?: boolean;
  padFoot?: boolean;
  height?: number;
}> = ({ kicker, title, buttonLabel, media, meta, looseTitle, padFoot, height }) => (
  <div className="wsp-rcard" style={height ? { height } : undefined}>
    {media}
    <div className="wsp-rbody">
      <div>
        <div className="wsp-rkicker">{kicker}</div>
        <div className={"wsp-rtitle" + (looseTitle ? " wsp-rtitle-loose" : "")}>{title}</div>
      </div>
      {meta}
    </div>
    <div className={"wsp-rfoot" + (padFoot ? " wsp-rfoot-pad" : "")}>
      <div className="wsp-btn-secondary">
        <Icon href="#i-ui-posts" width={16.43} height={16.43} />
        <span>{buttonLabel}</span>
      </div>
    </div>
  </div>
);

export const WorkvivoSpacePage: React.FC<WorkvivoSpacePageProps> = ({
  logoSrc,
  bannerSrc,
  surveySrc,
  storySrc,
  countdownSrc,
  meSrc,
}) => {
  const { copy, image, logo: brandLogo, person } = useCustomization();
  const { page } = copy.spaces;
  /** The card the directory clicked into at 1545 — its name is this page's title. */
  const spaceName = copy.spaces.directory[4].name;

  // An explicit prop still wins: the gallery and the still composition pass their own.
  const logo = logoSrc ?? brandLogo.onDark;
  const banner =
    bannerSrc ?? image("spacepage.banner.0", staticFile("img/workvivo/story_summit.png"));
  const survey =
    surveySrc ??
    image("spacepage.survey.0", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"));
  const story = storySrc ?? image("spacepage.story.0", staticFile("fillers/960x0.jpg"));
  const countdown =
    countdownSrc ?? image("spacepage.countdown.0", staticFile("fillers/images (3).jpeg"));
  const me = meSrc ?? person.avatarUrl;
  const face = (i: number) => image(FACES[i].slot, staticFile(FACES[i].src));

  return (
    <div className="wsp-frame">
      <WorkvivoSvgDefs />

      {/* Grey page field, painted first so everything else sits over it. */}
      <div className="wsp-pagebg" />

      {/* Tenant banner */}
      <div className="wsp-banner">
        <img data-vc-slot="spacepage.banner.0" src={banner} alt="" />
      </div>

      {/* ---------- collapsed nav rail ----------
          WorkvivoSidebar with its labels taken away, and nothing else: the same glyphs in
          the same order, in the same five groups, with the same hairline between Explore
          and the content tools. It opens with the collapse control and the signed-in
          face, which is what the sidebar's .railtop and .me collapse down to. See
          RAIL_PRIMARY and friends above for the icon lists. */}
      <div className="wsp-rail">
        <div className="wsp-rail-inner">
          <div className="wsp-collapse">
            <span className="wsp-collapsemark">|&#8592;</span>
          </div>

          <img
            className="wsp-railme"
            src={me}
            style={{ objectFit: "cover", display: "block" }}
            alt=""
          />

          <div className="wsp-railcol">
            <div className="wsp-railcol-main">
              <div className="wsp-railgrp">
                {RAIL_PRIMARY.map((href) => (
                  <RailItem key={href} href={href} />
                ))}
              </div>

              {/* Explore and the content tools are one group split by a rule, not two
                  groups — the sidebar sets them a .navdiv apart rather than a section
                  heading, and the collapsed rail keeps that distinction. */}
              <div className="wsp-railgrp">
                {RAIL_EXPLORE.map((href) => (
                  <RailItem key={href} href={href} />
                ))}
                <div className="wsp-raildiv" />
                {RAIL_TOOLS.map((href) => (
                  <RailItem key={href} href={href} />
                ))}
              </div>

              <div className="wsp-railgrp">
                {RAIL_CONNECT.map((href) => (
                  <RailItem key={href} href={href} />
                ))}
              </div>

              <div className="wsp-railgrp">
                {RAIL_RESOURCES.map((href) => (
                  <RailItem key={href} href={href} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- top bar ---------- */}
      <div className="wsp-top">
        <div className="wsp-top-inner">
          <div className="wsp-logo">
            <img src={logo} alt="" />
          </div>

          <div className="wsp-tsearch-wrap">
            <div className="wsp-tsearch">
              <Icon href="#i-ui-explore" width={24} height={24} />
              <span>Search</span>
            </div>
          </div>

          <div className="wsp-tacts">
            <div className="wsp-tacts-pill">
              <Icon href="#i-ui-notifications" width={18} height={18} />
              <InlineSvg
                src={staticFile("img/more.svg")}
                width={18}
                height={18}
                alt=""
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="wsp-tav">
                <img src={me} alt="" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- space header ---------- */}
      <div className="wsp-head">
        <div className="wsp-avatar">
          <Icon href="#i-ui-summit-event" width={41} height={42.28} />
        </div>

        <div className="wsp-headrow">
          <div className="wsp-headleft">
            <span className="wsp-back">
              <span className="wsp-chev wsp-chev-back" />
            </span>
            <div className="wsp-title">{spaceName}</div>
          </div>

          <div className="wsp-headright">
            <div className="wsp-adminlink">
              <span>Admin</span>
              <span className="wsp-chev wsp-chev-down" />
            </div>
            <div className="wsp-btn-primary">Join</div>
            <div className="wsp-iconbtn">
              <Icon href="#i-ui-favorite-star" width={20} height={19.2} />
            </div>
            <div className="wsp-iconbtn">
              <Icon
                href="#i-ui-notifications"
                width={24}
                height={24}
                style={{ color: "#6103ED" }}
              />
            </div>
          </div>
        </div>

        <div className="wsp-tabs">
          <div className="wsp-tabrule" />
          <div className="wsp-tablist">
            {TABS.map((tab) => (
              <div key={tab} className={"wsp-tab" + (tab === "Feed" ? " is-on" : "")}>
                <div className="wsp-tab-lbl">{tab}</div>
                <div className="wsp-tab-bar" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- left rail ---------- */}
      <div className="wsp-left">
        <div className="wsp-search">
          <Icon href="#i-ui-explore" width={20} height={20} />
          <span>Search Connect</span>
        </div>

        <section className="wsp-lcard wsp-lcard-about">
          <div className="wsp-about-top">
            <div className="wsp-caplabel">ABOUT</div>
            <div className="wsp-chips">
              <div className="wsp-chip">Corporate Spaces</div>
              <div className="wsp-chip">
                <Icon href="#i-ui-spaces" width={12} height={12} />
                <span>{spaceName}</span>
              </div>
            </div>
            <div className="wsp-about-text">
              {spaceName} 2026
              <br />
              <br />
              {page.about}
            </div>
          </div>

          <div className="wsp-members">
            <div className="wsp-members-count">{page.members}</div>
            <div className="wsp-avrow">
              {FACES.slice(0, 5).map((f, i) => (
                <img
                  key={f.slot}
                  className="wsp-av"
                  data-vc-slot={f.slot}
                  src={face(i)}
                  alt=""
                />
              ))}
              <div className="wsp-avmore">12k+</div>
            </div>
          </div>
        </section>

        <section className="wsp-lcard wsp-lcard-admins">
          <div className="wsp-caplabel">SPACE ADMINS</div>
          {/* The same six faces twice, the second row reversed — the export's own way of
              filling a second row without a seventh portrait. Only the first row carries
              the swap attributes, so clicking a face opens one editable rather than two
              that fight over the same position. */}
          <div className="wsp-avrow wsp-avrow-fill">
            {FACES.map((f, i) => (
              <img
                key={f.slot}
                className="wsp-av"
                data-vc-slot={f.slot}
                src={face(i)}
                alt=""
              />
            ))}
          </div>
          <div className="wsp-avrow wsp-avrow-fill">
            {FACES.map((f, i) => (
              <img
                key={f.slot}
                className="wsp-av"
                src={face(FACES.length - 1 - i)}
                alt=""
              />
            ))}
          </div>
        </section>
      </div>

      {/* ---------- centre feed ---------- */}
      <div className="wsp-feed">
        {/* Composer */}
        <section className="wsp-composer">
          <div className="wsp-comp-row">
            <span className="wsp-comp-av">
              <img src={me} alt="" />
            </span>
            {/* ONE text node, built with a template string rather than JSX text either
                side of an interpolation. This box is `display: flex; flex-direction:
                column`, and the export materialises every text node into a real <span> —
                so the three nodes JSX would otherwise produce ("What's going on, ",
                the name, "?") became three real flex items and stacked vertically. */}
            <div className="wsp-comp-ph">
              {`What\u2019s going on, ${person.firstName}?`}
            </div>
          </div>
          <div className="wsp-hr" />
          <div className="wsp-comp-acts">
            <div className="wsp-comp-act">
              <Icon href="#i-ui-shout-out" width={24.56} height={24.56} />
              <span>Give a Shout-out</span>
            </div>
            <div className="wsp-comp-act">
              <Icon href="#i-ui-post-a-value-update" width={24.56} height={24.56} />
              <span>Post a Value Update</span>
            </div>
            <div className="wsp-comp-act">
              <Icon href="#i-ui-ask-a-question" width={24.56} height={24.56} />
              <span>Ask a Question</span>
            </div>
          </div>
        </section>

        {/* Survey call-to-action */}
        {/* .wsp-survey has overflow:hidden but no position, so the photo's absolute
            fill needs the inline relative. */}
        <section
          className="wsp-survey"
          data-vc-slot="spacepage.survey.0"
          style={{ position: "relative" }}>
          <img
            src={survey}
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }}
            alt=""
          />
          <div className="wsp-survey-panel">
            <div className="wsp-survey-copy">
              <div className="wsp-survey-t">{page.survey.title}</div>
              <div className="wsp-survey-s">{page.survey.meta}</div>
            </div>
            <div className="wsp-btn-start">Start</div>
          </div>
        </section>

        {/* Shout-out post */}
        <section className="wsp-post">
          <div className="wsp-post-row">
            <img
              className="wsp-post-av"
              data-vc-slot={FACES[0].slot}
              src={face(0)}
              alt=""
            />
            <div className="wsp-post-head">
              <div className="wsp-post-by">
                <b>{page.post.author}</b> posted a Shout-out.
              </div>
              <div className="wsp-post-meta">
                <span>2 hours ago</span>
                <span>·</span>
                <Icon href="#i-ui-everyone" width={12.28} height={12.28} />
              </div>
            </div>
          </div>

          <div className="wsp-post-body">{page.post.body}</div>

          <div className="wsp-hooray">
            <div className="wsp-hooray-lbl">Hooray to:</div>
            <div className="wsp-hooray-chip">
              <img src={face(2)} alt="" />
              <span>{page.post.credit}</span>
            </div>
          </div>

          <div className="wsp-post-hr" />

          <div className="wsp-post-foot">
            <div className="wsp-post-counts">
              <span>89 reaction</span>
              <span className="wsp-sep">·</span>
              <b>33 comments</b>
            </div>
            <div className="wsp-share">
              <ShareArrow />
              <span>Share</span>
            </div>
          </div>

          <div>
            <span className="wsp-reactpill">🎉 89</span>
          </div>
        </section>

        {/* Countdown */}
        <section className="wsp-count">
          <div className="wsp-count-img">
            <img data-vc-slot="spacepage.countdown.0" src={countdown} alt="" />
            {/* The export flattens this wordmark out of the artwork and leaves it dangling
                below the feed; it belongs on the event image, so that is where it goes. */}
            <Wordmark
              text={copy.feed.event.countdownName}
              style={{ left: 18, bottom: 16, fontSize: 26.25, lineHeight: "25.29px" }}
            />
          </div>

          <div className="wsp-count-side">
            <div className="wsp-count-hdr">
              <Icon href="#i-ui-event-time" width={10.65} height={10.65} />
              <span>Countdown</span>
            </div>

            <div className="wsp-count-mid">
              <div className="wsp-count-title">{copy.feed.event.countdownName}</div>
              <div className="wsp-count-nums">
                <div className="wsp-count-unit">
                  <div className="wsp-count-num">22 :</div>
                  <div className="wsp-count-lbl">Days</div>
                </div>
                <div className="wsp-count-unit" style={{ width: 39.26 }}>
                  <div className="wsp-count-num">02</div>
                  <div className="wsp-count-lbl">Hours</div>
                </div>
                <div className="wsp-count-unit">
                  <div className="wsp-count-num">: 17</div>
                  <div className="wsp-count-lbl">Minutes</div>
                </div>
              </div>
            </div>

            <div className="wsp-btn-viewmore">View More</div>
          </div>
        </section>
      </div>

      {/* ---------- right rail ---------- */}
      <div className="wsp-right">
        <div>
          <FeaturedCard
            kicker="FEATURED STORY"
            title={page.featured.story}
            buttonLabel="News"
            media={
              <div className="wsp-rimg">
                <img data-vc-slot="spacepage.story.0" src={story} alt="" />
              </div>
            }
            meta={
              <div className="wsp-rmeta">
                <div>Posted 1 day ago</div>
                <div className="wsp-rmeta-row">
                  <Icon href="#i-ui-everyone" width={12.32} height={12.32} />
                  <span>Everyone</span>
                </div>
              </div>
            }
          />
          <div className="wsp-dots">
            <span className="wsp-dot is-on" />
            <span className="wsp-dot" />
            <span className="wsp-dot" />
            <span className="wsp-dot" />
          </div>
        </div>

        <FeaturedCard
          kicker="FEATURED PAGE"
          title={page.featured.page}
          buttonLabel="Pages"
          looseTitle
          padFoot
          media={
            <div className="wsp-rimg wsp-rimg-grad">
              <Icon
                href="#i-ui-pages"
                width={77.05}
                height={77.05}
                style={{ position: "absolute", left: 96, top: 30, color: "#ffffff" }}
              />
            </div>
          }
        />

        <FeaturedCard
          kicker="FEATURED PODCAST"
          title={page.featured.podcast}
          buttonLabel="Pages"
          looseTitle
          padFoot
          height={272.24}
          media={
            <div className="wsp-rimg wsp-rimg-grad">
              <Wordmark
                text={copy.feed.event.countdownName}
                style={{ left: 127, top: 51, fontSize: 21.49, lineHeight: "16.52px" }}
              />
            </div>
          }
        />
      </div>
    </div>
  );
};

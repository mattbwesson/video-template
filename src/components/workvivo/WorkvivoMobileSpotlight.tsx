import React from "react";
import { SymbolSvg } from "./symbolRegistry";
import { staticFile } from "remotion";
import "./WorkvivoMobileSpotlightStyles.css";
import "./WorkvivoMobileStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoMobileSvgDefs } from "./WorkvivoMobileHome";
import {
  companyInitialOf,
  useCustomization,
} from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo mobile — the Spotlight tab, whole page.
 *
 * NOTE ON OVERLAP: WorkvivoMobileHome covers the middle of this same screen (Quick Links,
 * Documents, Featured News) and is rendered in the L2 cut, so it is deliberately left
 * alone — changing it would change the video. This component is the fuller export: it adds
 * the Journeys hero, the Spaces carousel, Upcoming Events and the bottom nav. The two
 * should eventually be one; they are apart because one of them is load-bearing.
 *
 * It mounts WorkvivoSvgDefs rather than WorkvivoMobileSvgDefs. Both sprites define
 * i-ui-everyone, i-ui-favorite-star and i-ui-connect, and mounting both would put duplicate
 * <symbol id>s in the document — whichever mounted first would win, which is exactly the
 * bug docs/PORTING-HTML-REFS.md warns about.
 *
 * The status bar is iOS chrome, not Workvivo UI, so it is approximated with plain rects
 * and arcs rather than sourced from the library — which is also how the export ships it.
 */

export interface WorkvivoMobileSpotlightProps {
  /** How far the page is scrolled, in points. 0 is what the reference screenshot shows. */
  scrollTop?: number;
}

/** iOS status-bar glyphs. Host chrome — generic geometry, no path data. */
const StatusIcons: React.FC = () => (
  <>
    <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 4.4}
          y={7 - i * 2.33}
          width="3"
          height={4 + i * 2.33}
          rx="1"
          fill="#fff"
        />
      ))}
    </svg>
    <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden>
      {[
        { r: 7.5, w: 1.8 },
        { r: 4.6, w: 1.8 },
      ].map(({ r, w }) => (
        <circle
          key={r}
          cx="8"
          cy="10.5"
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={w}
          strokeDasharray={`${(2 * Math.PI * r) / 4} ${2 * Math.PI * r}`}
          transform={`rotate(-135 8 10.5)`}
        />
      ))}
      <circle cx="8" cy="9.6" r="1.5" fill="#fff" />
    </svg>
    <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="21"
        height="11"
        rx="3"
        fill="none"
        stroke="#fff"
        opacity="0.35"
      />
      <rect x="2" y="2" width="18" height="8" rx="1.6" fill="#fff" />
      <rect x="23" y="4" width="1.6" height="4" rx="0.8" fill="#fff" opacity="0.4" />
    </svg>
  </>
);

const Plus: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <rect x="8" y="2" width="2" height="14" rx="1" fill="#fff" />
    <rect x="2" y="8" width="14" height="2" rx="1" fill="#fff" />
  </svg>
);

const Burger: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
    {[5, 10, 15].map((y) => (
      <rect key={y} x="3" y={y} width="16" height="2" rx="1" fill="currentColor" />
    ))}
  </svg>
);

/** The `values and spaces` marks the mobile quick links are drawn with. */
const v = (name: string) => staticFile(`img/values and spaces/${name}`);

/**
 * The three vendor tiles, and why their MARKS are not customisable.
 *
 * A tile is a real product logo out of the sprite (or, for Zoom, a raster). The label is
 * a copy slot so a company that runs a different HR system can say so, but the artwork
 * stays put: an invented name would render against whichever logo happened to be in the
 * position, which is worse than a slightly generic one. Changing the artwork properly
 * means adding a closed vendor enum with an exhaustive path lookup — the pattern the
 * customisation guide prescribes (§4) and the job this position does not yet need.
 */
type AppMark =
  | { kind: "sprite"; href: string }
  | { kind: "raster"; src: string };

const APP_MARKS: AppMark[] = [
  { kind: "sprite", href: "#i-vendor-workday" },
  { kind: "sprite", href: "#i-vendor-servicenow" },
  // Zoom's mark is a raster in this repo, not a sprite symbol.
  { kind: "raster", src: "img/zoomicon.png" },
];

/** The four quick links' artwork, laid out two to a row. */
const QUICK_LINK_ART = [
  "valeus-payroll.svg",
  "values-star.svg",
  "values-globe.svg",
  "values-idea.svg",
];

const DOCUMENT_ART = [
  "values-policies.svg",
  "values-person.svg",
  "values-idea.svg",
  "Values-talk_bubble.svg",
];

/**
 * The four Featured News cards under the hero.
 *
 * The first two are `feed.mobileNews[1]` and `[2]` — the same headlines the phone's home
 * screen carries at global 534-600, because this is the same phone — and the last two are
 * `spotlight.news`. The publication dates are fixed chrome.
 */
const NEWS_CHROME: { when: string; img: string; slot: ImageSlotKey }[] = [
  { when: "Published 1 day ago", img: "img/workvivo/news_1.png", slot: "spotlight.news.0" },
  { when: "Published 2 days ago", img: "img/workvivo/pages_1.png", slot: "spotlight.news.1" },
  { when: "Published 4 days ago", img: "img/workvivo/post_2.png", slot: "spotlight.news.2" },
  { when: "Published 1 week ago", img: "img/workvivo/post_3.png", slot: "spotlight.news.3" },
];

/**
 * The Spaces carousel: the same three spaces as `feed.spaces`, so only the badge, the
 * cover and the member count live here.
 */
const SPACE_CHROME: { members: string; icon: string; cover: string; slot: ImageSlotKey }[] =
  [
    {
      members: "1,338 Members",
      icon: "#i-ui-networking",
      cover: "img/workvivo/news_3.png",
      slot: "spotlight.space.0",
    },
    {
      members: "11,034 Members",
      icon: "#i-ui-ai-innovation",
      cover: "img/workvivo/pages_1.png",
      slot: "spotlight.space.1",
    },
    {
      members: "5,786 Members",
      icon: "#i-ui-charity",
      cover: "img/workvivo/post_1.png",
      slot: "spotlight.space.2",
    },
  ];

const Meta: React.FC<{ when: string; white?: boolean }> = ({ when, white }) => (
  <>
    <div className={white ? "wms-meta wms-meta-white" : "wms-meta"}>
      <Icon href="#i-ui-everyone" width={14} height={14} />
      Global
    </div>
    <div className={white ? "wms-meta wms-meta-white" : "wms-meta"}>{when}</div>
  </>
);

export const WorkvivoMobileSpotlight: React.FC<WorkvivoMobileSpotlightProps> = ({
  scrollTop = 0,
}) => {
  const { copy, image, person, header, logo } = useCustomization();
  const hdr = header('mobile.hero');
  const spotlight = copy.spotlight;
  const companyInitial = companyInitialOf(copy.companyName);
  /** Hero, then the two cards below it, then the two extra Spotlight-only headlines. */
  const newsTitles = [
    copy.feed.mobileNews[1].title,
    copy.feed.mobileNews[2].title,
    spotlight.news[0].title,
    spotlight.news[1].title,
  ];

  return (
    <div className="wms-phone">
      <WorkvivoSvgDefs />
      <WorkvivoMobileSvgDefs />

      {/* Status bar — identical to WorkvivoMobileHome at frame 574 */}
      {/* Hero header — identical to WorkvivoMobileHome at frame 574 */}
      

      {/* --------------------------------------------------------- content */}
      <div className="wms-scroll">
        <div
          className="wms-track"
          style={{ transform: `translateY(${-scrollTop}px)` }}
        >
          {/* Journeys hero */}
          <div className="wms-hero">
            <img
              data-vc-slot="spotlight.journey.0"
              src={image(
                "spotlight.journey.0",
                staticFile("img/workvivo/billboard_1.png"),
              )}
              alt=""
            />
            <div className="wms-hero-scrim" />
            <div className="wms-journey">
              <span className="wms-journey-ico">
                <Icon href="#i-ui-journeys" width={20} height={20} />
              </span>
              <span className="wms-journey-text">
                <div className="wms-journey-title">{spotlight.journey}</div>
                <div className="wms-journey-bar" />
              </span>
              <span className="wms-start">Start</span>
            </div>
          </div>

          {/* Quick Links */}
          <div data-vc-slot="spotlight.links">
            <div className="wms-sec">
              <span className="wms-sec-title">Quick Links</span>
              <span className="wms-sec-link">View All</span>
            </div>
            <div className="wms-rows">
              <div className="wms-tiles">
                {APP_MARKS.map((mark, i) => (
                  <div className="wms-tile" key={spotlight.apps[i]}>
                    <span className="wms-tile-ico">
                      {mark.kind === "raster" ? (
                        <img src={staticFile(mark.src)} alt="" />
                      ) : (
                        <Icon href={mark.href} width={68} height={68} />
                      )}
                    </span>
                    <span className="wms-tile-label">{spotlight.apps[i]}</span>
                  </div>
                ))}
              </div>
              {[0, 1].map((row) => (
                <div className="wms-row2" key={row}>
                  {[0, 1].map((col) => {
                    const i = row * 2 + col;
                    return (
                      <div className="wms-link" key={spotlight.quickLinks[i]}>
                        <span className="wms-link-ico">
                          <img src={v(QUICK_LINK_ART[i])} alt="" />
                        </span>
                        <span className="wms-link-label">{spotlight.quickLinks[i]}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="wms-sec">
              <span className="wms-sec-title">Documents</span>
              <span className="wms-sec-link">View All</span>
            </div>
            <div className="wms-card">
              {DOCUMENT_ART.map((art, i) => (
                <div className="wms-doc" key={spotlight.documents[i]}>
                  <span className="wms-link-ico">
                    <img src={v(art)} alt="" />
                  </span>
                  <span className="wms-doc-label">{spotlight.documents[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured News */}
          <div>
            <div className="wms-sec">
              <span className="wms-sec-title">Featured News</span>
              <span className="wms-sec-link">View All</span>
            </div>
            <div className="wms-card" style={{ gap: 16 }}>
              <div className="wms-news-hero">
                <img
                  data-vc-slot="spotlight.lead.0"
                  src={image("spotlight.lead.0", staticFile("img/workvivo/pages_2.png"))}
                  alt=""
                />
                <div className="wms-news-hero-scrim" />
                <div className="wms-news-hero-text">
                  {/* The reference breaks this headline across two lines by hand; letting
                      it wrap on its own is what keeps a longer or shorter one whole. */}
                  <div className="wms-news-hero-title">
                    {copy.feed.mobileNews[0].title}
                  </div>
                  <Meta when="Published 2 days ago" white />
                </div>
              </div>
              {NEWS_CHROME.map((n, i) => (
                <div className="wms-news" key={n.slot}>
                  <img
                    data-vc-slot={n.slot}
                    src={image(n.slot, staticFile(n.img))}
                    alt=""
                  />
                  <div>
                    <div className="wms-news-title">{newsTitles[i]}</div>
                    <Meta when={n.when} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spaces */}
          <div>
            <div className="wms-sec">
              <span className="wms-sec-title">Spaces</span>
              <span className="wms-sec-link">See All</span>
            </div>
            <div className="wms-spaces">
              {SPACE_CHROME.map((s, i) => (
                <div className="wms-space" key={s.slot}>
                  <img
                    className="wms-space-cover"
                    data-vc-slot={s.slot}
                    src={image(s.slot, staticFile(s.cover))}
                    alt=""
                  />
                  <span className="wms-space-join">Join</span>
                  <span className="wms-space-av">
                    <Icon href={s.icon} width={26} height={26} />
                  </span>
                  <div className="wms-space-text">
                    <div className="wms-space-title">{copy.feed.spaces[i].name}</div>
                    <div className="wms-space-members">{s.members}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="wms-sec">
              <span className="wms-sec-title">Upcoming Events</span>
              <span className="wms-sec-link">View All</span>
            </div>
            <div className="wms-event-card">
              <img
                data-vc-slot="spotlight.event.0"
                src={image(
                  "spotlight.event.0",
                  staticFile("img/workvivo/story_summit.png"),
                )}
                alt=""
              />
              <div className="wms-event">
                <div className="wms-event-date">
                  <div className="wms-event-mon">AUG</div>
                  <div className="wms-event-day">13</div>
                </div>
                <div>
                  <div className="wms-event-title">{spotlight.event.title}</div>
                  {/* Two lines with a real newline between them, so a slot value that has
                      one breaks where the copy says rather than where the box happens to. */}
                  <div className="wms-event-when" style={{ whiteSpace: "pre-line" }}>
                    {spotlight.event.when}
                  </div>
                  <div className="wms-meta" style={{ marginTop: 5 }}>
                    <Icon href="#i-ui-everyone" width={14} height={14} />
                    Global
                  </div>
                </div>
              </div>
              <div className="wms-event-btn">View Event</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-hero" style={hdr.style}>
        <img
          data-vc-slot="mobile.hero.0"
          className="wm-heroimg"
          src={image("mobile.hero.0", staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"))}
          style={{ objectFit: "cover" }}
          alt=""
        />
        <div className="wm-herowash" />
        {hdr.showLogo && (
          <img className="wm-heroM" src={logo.onDark} alt={copy.companyName} />
        )}
        <div className="wm-heroV">{companyInitial}</div>
        <div className="wm-avstack"><img src={person.avatarUrl} style={person.avatarFit} alt="" /></div>
        <div className="wm-heroacts">
          <div className="wm-gbtn wm-plus"><i/><i/></div>
          <div className="wm-gbtn"><SymbolSvg width="22" height="22" href="#i-ui-employee-standalone" /></div>
        </div>
        <div className="wm-herotabs">
          <a href="#">Feed</a>
          <a href="#" className="wm-on">Spotlight</a>
        </div>
      </div>

      {/* AFTER the hero in the DOM, on purpose. The z ladder (status 5, hero 4)
          is what the Player paints by; the in-browser export paints DOM order and
          ignores sibling z-index, so the order here has to agree with the ladder or
          the export buries the status bar under the header photo. */}
      <div className="wm-status" style={{ paddingLeft: 30, paddingRight: 32 }}>
        <div className="wm-time">9:41</div>
        <div className="wm-sysico">
          <SymbolSvg width="17" height="11" href="#i-signal" />
          <SymbolSvg width="16" height="11" href="#i-wifi" />
          <SymbolSvg width="25" height="12" href="#i-battery" />
        </div>
      </div>

      {/* ----------------------------------------------------- bottom nav */}
      <div className="wms-bottom">
        <div className="wms-bnav wms-on">
          <Icon href="#i-ui-home-nav-rail" width={22} height={22} />
          <span className="wms-bnav-label">Home</span>
        </div>
        <div className="wms-bnav">
          <Icon href="#i-ui-chat" width={22} height={22} />
          <span className="wms-bnav-label">Chat</span>
        </div>
        <div className="wms-bnav">
          <Icon href="#i-ui-notifications" width={22} height={22} />
          <span className="wms-bnav-label">Inbox</span>
        </div>
        <div className="wms-bnav">
          <Burger />
          <span className="wms-bnav-label">More</span>
        </div>
      </div>
    </div>
  );
};

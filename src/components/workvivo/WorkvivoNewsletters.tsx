import React from "react";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoNewslettersStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { DocumentFolderIcon, FolderGlyph } from "./WorkvivoFolderIcon";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Newsletters screen.
 *
 * Sits on the same `.device` / `.app` / `.scaler` shell as WorkvivoHomeContainer and reuses
 * WorkvivoTopbar outright, so the top bar is byte-for-byte the one every other screen in
 * the video draws rather than a second version of it. That means this component — like the
 * home container — must render inside a <CustomizationProvider>; WorkvivoNewslettersScene
 * does that.
 *
 * The reference is a 1440-wide window while the device is 1760, so the body below the top
 * bar is designed at 1440 and scaled by 1760/1440. One transform, applied once, rather than
 * every measurement carrying the ratio — and scaling a component scales vectors and text,
 * not a bitmap (see docs/PORTING-HTML-REFS.md).
 */

export interface Newsletter {
  cover: string;
  title: string;
  scope: string;
  folder: string;
  date: string;
  status: "Sent" | "Scheduled";
}

/**
 * What each of the four cards keeps whoever the film is for: its cover photo, which
 * audience it went to, when it went, and whether it has gone yet.
 *
 * The dates and the Sent/Scheduled badges are the same on every tenant's screen, so they
 * are chrome. The title and the folder come from `copy.newsletters.items`.
 */
const NEWSLETTER_CHROME: {
  cover: string;
  slot: ImageSlotKey;
  scope: string;
  date: string;
  status: "Sent" | "Scheduled";
}[] = [
  {
    cover: "img/workvivo/news_3.png",
    slot: "newsletter.cover.0",
    scope: "Global",
    date: "June 10, 2026 12.00AM",
    status: "Sent",
  },
  {
    cover: "img/workvivo/news_2.png",
    slot: "newsletter.cover.1",
    scope: "Segments",
    date: "June 11, 2026 11.00AM",
    status: "Sent",
  },
  {
    cover: "img/workvivo/news_1.png",
    slot: "newsletter.cover.2",
    scope: "Global",
    date: "June 12, 2026 10.00AM",
    status: "Sent",
  },
  {
    // The reference's fourth cover is a dog. The project has no animal photography, so
    // this is a placeholder.
    cover: "filler/images (2).jpeg",
    slot: "newsletter.cover.3",
    scope: "Segments",
    date: "June 17, 2026 10:00AM",
    status: "Scheduled",
  },
];

/**
 * The four cards resolved against a customisation — the shape the reveal scene lays out
 * on the frame before the page they normally live in exists.
 *
 * A hook rather than a constant because the covers can be operator uploads, and because
 * NewslettersRevealScene needs exactly the same four values this screen draws.
 */
export const useNewsletters = (): Newsletter[] => {
  const { copy, image } = useCustomization();
  return NEWSLETTER_CHROME.map((chrome, i) => ({
    ...chrome,
    cover: image(chrome.slot, staticFile(chrome.cover)),
    title: copy.newsletters.items[i].title,
    folder: copy.newsletters.items[i].folder,
  }));
};

/** Decorative strip behind the page header. */
const COLLAGE_SLOTS: ImageSlotKey[] = [
  "newsletter.collage.0",
  "newsletter.collage.1",
  "newsletter.collage.2",
  "newsletter.collage.3",
  "newsletter.collage.4",
];

/** Collapsed rail. Two groups of seven, matching the reference's split. */
const NAV_TOP = [
  "#i-ui-home-nav-rail",
  "#i-ui-my-company",
  "#i-ui-resources",
  "#i-ui-chat",
  "#i-ui-spaces",
  "#i-ui-employee-insights",
  "#i-ui-admin",
];

const NAV_EXPLORE = [
  "#i-ui-news",
  "#i-ui-events-nav-rail",
  "#i-ui-pages",
  "#i-ui-podcasts",
  "#i-ui-newsletters",
  "#i-ui-journeys",
  "#i-ui-surveys-and-forms",
];

/** Decorative strip behind the page header. */
const COLLAGE = [
  "img/workvivo/pages_2.png",
  "img/workvivo/news_2.png",
  "img/workvivo/story_summit.png",
  "img/workvivo/pages_1.png",
  "img/workvivo/story_manager.png",
];

/**
 * A Recent Newsletters card.
 *
 * `style` merges onto .nl-card so a scene can size and place one itself — the reveal
 * scene lays four of them out on the frame directly, to a spec given in percentages,
 * before the page they normally live in exists.
 */
export const NewsletterCard: React.FC<{
  item: Newsletter;
  /** The image position this card's cover fills, for the wizard's swap overlay. */
  slot?: string;
  style?: React.CSSProperties;
  hoverProgress?: number;
}> = ({ item, slot, style, hoverProgress = 0 }) => (
  <div className="nl-card" style={style}>
    <img data-vc-slot={slot} src={item.cover} alt="" />
    <div className="nl-scrim" />
    <div className="nl-card-body">
      <div className="nl-card-meta">
        <div className="nl-card-title">{item.title}</div>
        <div className="nl-card-scope">{item.scope}</div>
        <div className="nl-card-folder">
          <FolderGlyph size={16} color="#fff" />
          {item.folder}
        </div>
      </div>
      <div className="nl-card-foot">
        <div className="nl-card-date">{item.date}</div>
        <span
          className={
            item.status === "Sent"
              ? "nl-badge nl-badge-sent"
              : "nl-badge nl-badge-scheduled"
          }
        >
          {item.status}
        </span>
      </div>
    </div>
    {hoverProgress > 0.001 && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "6px solid #ffffff",
          borderRadius: "14px",
          boxSizing: "border-box",
          pointerEvents: "none",
          opacity: hoverProgress,
          zIndex: 10,
        }}
      />
    )}
  </div>
);

export interface WorkvivoNewslettersProps {
  /**
   * 0 draws only the four Recent Newsletters cards, on nothing — no device, no page fill,
   * no rail, no header, no folders. 1 is the whole screen. Values between fade the chrome
   * back in around a card row that never moves, which is what lets a scene land on the
   * cards first and assemble the UI around them afterwards.
   */
  chrome?: number;
  /**
   * Draw the Recent Newsletters cards.
   *
   * false keeps the row's SPACE but hides the cards inside it, so everything below —
   * Folders especially — stays exactly where it was. A scene that has already put those
   * four cards on screen itself passes false, so the page can assemble around them
   * instead of fading a second copy in on top.
   */
  cards?: boolean;
}

export const WorkvivoNewsletters: React.FC<WorkvivoNewslettersProps> = ({
  chrome = 1,
  cards = true,
}) => {
  const { copy, image, person } = useCustomization();
  const newsletters = useNewsletters();

  return (
    <div
      className="device nl-device"
      style={{ width: 1760, height: 1080, ["--nl-chrome" as string]: chrome }}
    >
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />

          <div className="nl-shell">
            <div className="nl-body">
              <aside className="nl-rail">
                <span className="nl-navico">
                  <Icon href="#i-ui-sidebar-toggle" width={18} height={18} />
                </span>
                <img className="nl-railav" src={person.avatarUrl} style={person.avatarFit} alt="" />
                {NAV_TOP.map((href) => (
                  <span className="nl-navico" key={href}>
                    <Icon href={href} width={17} height={17} />
                  </span>
                ))}
                <span className="nl-navgap" />
                {NAV_EXPLORE.map((href) => (
                  <span
                    className={
                      href === "#i-ui-newsletters" ? "nl-navico nl-on" : "nl-navico"
                    }
                    key={href}
                  >
                    <Icon href={href} width={17} height={17} />
                  </span>
                ))}
              </aside>

              <main className="nl-main">
                {/* The photo strip is a full-bleed band behind the header, washed out and
                    fading into the page — the treatment WorkvivoAnalytics uses. It sits
                    before .nl-head in the DOM so the title paints over it: the export
                    ignores z-index and pays attention only to order. */}
                <div className="nl-banner">
                  {COLLAGE.map((src, i) => (
                    <img
                      key={src}
                      data-vc-slot={COLLAGE_SLOTS[i]}
                      src={image(COLLAGE_SLOTS[i], staticFile(src))}
                      alt=""
                    />
                  ))}
                  <div className="nl-banner-fade" />
                </div>

                <div className="nl-head">
                  <div className="nl-title">
                    <Icon href="#i-ui-newsletters" width={24} height={24} />
                    Newsletters
                  </div>
                  <div className="nl-headacts">
                    <span className="nl-btn">
                      Options
                      <span className="nl-caret" />
                    </span>
                    <span className="nl-btn nl-btn-primary">Create Newsletter</span>
                  </div>
                </div>

                <div className="nl-field">
                  <Icon href="#i-ui-explore" width={15} height={15} />
                  <span>Search Newsletters</span>
                </div>

                <div className="nl-chips">
                  <span className="nl-chip nl-on">All</span>
                  <span className="nl-chip">Drafts</span>
                  <span className="nl-chip">Scheduled</span>
                  <span className="nl-chip">Sent</span>
                </div>

                <div className="nl-sec nl-sec-recent">Recent Newsletters</div>
                <div className="nl-row">
                  {newsletters.map((n, i) => (
                    <NewsletterCard
                      key={NEWSLETTER_CHROME[i].slot}
                      item={n}
                      // No slot when the row is hidden: a scene that draws these four
                      // cards itself (NewslettersRevealScene) owns the positions, and two
                      // elements claiming one would leave the swap overlay measuring the
                      // invisible copy.
                      slot={cards ? NEWSLETTER_CHROME[i].slot : undefined}
                      style={cards ? undefined : { opacity: 0 }}
                    />
                  ))}
                  <span className="nl-next">
                    <span className="nl-caret" />
                  </span>
                </div>

                <div className="nl-sec nl-sec-folders">Folders</div>
                <div className="nl-folders">
                  <span className="nl-btn nl-viewfolders">View Folders</span>
                  {copy.newsletters.folders.map((f) => (
                    <span className="nl-folder" key={f}>
                      <DocumentFolderIcon />
                      {f}
                    </span>
                  ))}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

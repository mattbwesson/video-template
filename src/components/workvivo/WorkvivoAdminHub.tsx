import React from "react";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoAdminHubStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Admin Hub.
 *
 * Same shell as WorkvivoHomeContainer and WorkvivoNewsletters — `.device` / `.app` /
 * `.scaler` with WorkvivoTopbar reused outright, so the top bar is the one every other
 * screen in the video draws rather than a second copy of it. That means this component
 * must render inside a <CustomizationProvider>; WorkvivoAdminHubScene does that.
 *
 * The reference is a 1440-wide window on a 1760 device, so the body is designed at 1440
 * and scaled once — see the stylesheet header.
 *
 * Two product glyphs (Workvivo TV, Awards) are not in the Workvivo icon library and are
 * drawn as obvious placeholders rather than approximated. See `MissingGlyph`.
 */

/** Collapsed rail, same two groups as the Newsletters screen. */
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

/** Washed-out photo strip behind the page header. */
/** The four photos in the strip beside the page title, and where an upload lands. */
const COLLAGE: { src: string; slot: ImageSlotKey }[] = [
  { src: "img/workvivo/pages_2.png", slot: "admin.collage.0" },
  { src: "img/workvivo/news_2.png", slot: "admin.collage.1" },
  { src: "img/workvivo/story_summit.png", slot: "admin.collage.2" },
  { src: "img/workvivo/story_manager.png", slot: "admin.collage.3" },
];

const QUICK_LINKS = [
  "Billboards",
  "Manage People",
  "Moderation",
  "Surveys",
  "Reported Content",
];

/**
 * A product with no glyph in the library.
 *
 * The library has no monitor/screen and no trophy — checked across "tv", "display
 * screen", "signage", "broadcast", "trophy", "award", "recognition" and "reward". A
 * plausible-looking substitute drawn from memory would pass review and be wrong, so
 * these read as gaps instead.
 */
const MissingGlyph: React.FC = () => <span className="wah-glyph-missing" />;

const ChevronRight: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M6 3.5L10.5 8L6 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Product = {
  title: string;
  desc: string;
  /** null where the library has no glyph — rendered as an explicit gap. */
  icon: string | null;
};

const PRODUCTS: Product[] = [
  {
    title: "Analytics",
    desc: "Measure engagement, uncover trends, and turn insights into action.",
    icon: "#i-ui-post-poll",
  },
  {
    title: "Campaigns",
    desc: "Plan, launch, and measure impactful internal communication campaigns.",
    icon: "#i-ui-post-campaign",
  },
  {
    title: "Workvivo TV",
    desc: "Bring company news and updates to every screen across your workplace.",
    icon: null,
  },
  {
    title: "Awards",
    desc: "Celebrate achievements and recognize great work across your organization.",
    icon: null,
  },
  {
    title: "Surveys",
    desc: "Capture feedback, understand sentiment, make informed decisions.",
    icon: "#i-ui-surveys-and-forms",
  },
  {
    title: "Seer",
    desc: "Turn insights into meaningful actions with AI-powered recommendations.",
    icon: "#i-ui-employee-insights",
  },
  {
    title: "Newsletters",
    desc: "Create engaging newsletters that keep everyone informed and connected.",
    icon: "#i-ui-newsletters",
  },
  {
    title: "Journeys",
    desc: "Guide employees through personalized key workplace moments.",
    icon: "#i-ui-journeys",
  },
];

export const WorkvivoAdminHub: React.FC = () => {
  const { person, logo, copy, image } = useCustomization();

  return (
    <div className="device" style={{ width: 1760, height: 1080 }}>
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />

          <div className="wah-shell">
            <div className="wah-body">
              <aside className="wah-rail">
                <span className="wah-navico">
                  <Icon href="#i-ui-sidebar-toggle" width={18} height={18} />
                </span>
                <img className="wah-railav" src={person.avatarUrl} style={person.avatarFit} alt="" />
                {NAV_TOP.map((href) => (
                  <span
                    className="wah-navico"
                    key={href}
                  >
                    <Icon href={href} width={17} height={17} />
                  </span>
                ))}
                <span className="wah-navgap" />
                {NAV_EXPLORE.map((href) => (
                  <span className="wah-navico" key={href}>
                    <Icon href={href} width={17} height={17} />
                  </span>
                ))}
              </aside>

              <main className="wah-main">
                {/* ------------------------------------------------ lavender header */}
                <div className="wah-hero">
                  <div className="wah-collage">
                    {COLLAGE.map((c) => (
                      <img
                        key={c.slot}
                        data-vc-slot={c.slot}
                        src={image(c.slot, staticFile(c.src))}
                        alt=""
                      />
                    ))}
                  </div>

                  <div className="wah-headrow">
                    <div className="wah-title">
                      <Icon href="#i-ui-post-campaign" className="" width={30} height={30} />
                      Admin Hub
                    </div>
                    <span className="wah-fav">Manage Favourites</span>
                  </div>

                  <div className="wah-field">
                    <Icon href="#i-ui-explore" className="" width={15} height={15} />
                    <span>Search admin</span>
                  </div>

                  <div className="wah-sec">Quick Links</div>
                  <div className="wah-quick">
                    {QUICK_LINKS.map((q) => (
                      <span className="wah-quicklink" key={q}>
                        <Icon href="#i-ui-favorite-star" className="" width={17} height={17} />
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ----------------------------------------- products + what's new */}
                <div className="wah-lower">
                  <div className="wah-col-products">
                    <div className="wah-sec" style={{ marginBottom: 10 }}>
                      Products
                    </div>
                    <div className="wah-products">
                      {PRODUCTS.map((p) => (
                        <div className="wah-product" key={p.title}>
                          <span className="wah-product-spine" />
                          {p.icon ? (
                            <Icon href={p.icon} className="" width={22} height={22} />
                          ) : (
                            <MissingGlyph />
                          )}
                          <div className="wah-product-title">{p.title}</div>
                          <div className="wah-product-desc">{p.desc}</div>
                          <span className="wah-product-go">
                            <ChevronRight />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="wah-col-new">
                    <div className="wah-sec" style={{ marginBottom: 10 }}>
                      What&apos;s New
                    </div>
                    <div className="wah-new">
                      <img
                        className="wah-new-photo"
                        data-vc-slot="admin.new.0"
                        src={image("admin.new.0", staticFile("img/workvivo/story_summit.png"))}
                        alt=""
                      />
                      <div className="wah-new-wash" />
                      <div className="wah-new-lift" />
                      <img className="wah-new-logo" src={logo.onDark} alt="" />
                      <div className="wah-new-title">{copy.feed.event.countdownName}</div>
                    </div>
                  </div>
                </div>

                {/* Clipped by the window, as in the reference — the page runs on. */}
                <div className="wah-tools">
                  <div className="wah-sec">Admin Tools</div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * The catalogue behind the component gallery.
 *
 * One entry per renderable component in src/components/workvivo. Each entry owns the
 * stage it is drawn on — every one of these is a Remotion component, so it needs a
 * Remotion context and (for the nine that read the customisation) a
 * `CustomizationProvider`. `Stage` is what gets handed to `<Thumbnail>`; `width`/`height`
 * are the composition size that stage is drawn at, and the gallery scales from there.
 *
 * Several components are a *region* of a bigger screen and lay out against their
 * parent's classes rather than against nothing — the nav rail sizes against `.shell`,
 * the feed columns against `.cols`. Those entries rebuild the minimum wrapper chain
 * from WorkvivoHomeContainer, and no more of it than the region actually needs, so
 * each one measures here the way it does in the cut.
 */
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";

import { CustomizationProvider } from "../src/customize/CustomizationProvider";
import { DEFAULT_INPUT_PROPS } from "../src/customize/videoCopy";

import "../src/components/workvivo/WorkvivoStyles.css";
import "../src/components/workvivo/WorkvivoGlassEdge.css";

import { Icon, WorkvivoSvgDefs } from "../src/components/workvivo/WorkvivoIcons";
import { WorkvivoSpacesSvgDefs } from "../src/components/workvivo/WorkvivoSpacesIcons";
import { WorkvivoTopbar } from "../src/components/workvivo/WorkvivoTopbar";
import { WorkvivoSidebar } from "../src/components/workvivo/WorkvivoSidebar";
import { WorkvivoHero } from "../src/components/workvivo/WorkvivoHero";
import { WorkvivoBillboards } from "../src/components/workvivo/WorkvivoBillboards";
import { WorkvivoLeftColumn } from "../src/components/workvivo/WorkvivoLeftColumn";
import { WorkvivoRightColumn } from "../src/components/workvivo/WorkvivoRightColumn";
import { WorkvivoHomeContainer } from "../src/components/workvivo/WorkvivoHomeContainer";
import { WorkvivoDesktop } from "../src/components/workvivo/WorkvivoDesktop";
import { WorkvivoMobileHome } from "../src/components/workvivo/WorkvivoMobileHome";
import { WorkvivoMobileSpotlight } from "../src/components/workvivo/WorkvivoMobileSpotlight";
import { WorkvivoLiveReplay } from "../src/components/workvivo/WorkvivoLiveReplay";
import { WorkvivoLivestream } from "../src/components/workvivo/WorkvivoLivestream";
import { WorkvivoCatchMeUp } from "../src/components/workvivo/WorkvivoCatchMeUp";
import { WorkvivoPostComposer } from "../src/components/workvivo/WorkvivoPostComposer";
import { WorkvivoAiComposeSettings } from "../src/components/workvivo/WorkvivoAiComposeSettings";
import { WorkvivoSpaces } from "../src/components/workvivo/WorkvivoSpaces";
import { WorkvivoHqSearch } from "../src/components/workvivo/WorkvivoHqSearch";
import { WorkvivoHqChat } from "../src/components/workvivo/WorkvivoHqChat";
import { WorkvivoArticle } from "../src/components/workvivo/WorkvivoArticle";
import { WorkvivoWidgetList } from "../src/components/workvivo/WorkvivoWidgetList";
import { WorkvivoAdminHub } from "../src/components/workvivo/WorkvivoAdminHub";
import { WorkvivoJourneyBuilder } from "../src/components/workvivo/WorkvivoJourneyBuilder";
import { WorkvivoJourneyPhone } from "../src/components/workvivo/WorkvivoJourneyPhone";
import { WorkvivoNewsletters } from "../src/components/workvivo/WorkvivoNewsletters";
import { WorkvivoAnalytics } from "../src/components/workvivo/WorkvivoAnalytics";
import {
  DocumentFolderIcon,
  FolderGlyph,
} from "../src/components/workvivo/WorkvivoFolderIcon";
import { WorkvivoSpacePage } from "../src/components/workvivo/WorkvivoSpacePage";
import { WorkvivoBillboardScreen } from "../src/components/workvivo/WorkvivoBillboardScreen";
import { WorkvivoPhonesScene } from "../src/components/workvivo/WorkvivoPhonesScene";
import { WorkvivoNewsletterBuilder } from "../src/components/workvivo/WorkvivoNewsletterBuilder";
import { WorkvivoWidgetStore } from "../src/components/workvivo/WorkvivoWidgetStore";
import { WorkvivoIntegrationsMarketplace } from "../src/components/workvivo/WorkvivoIntegrationsMarketplace";
import { WorkvivoIntegrationsList } from "../src/components/workvivo/WorkvivoIntegrationsList";
import { WorkvivoSeerSurveyMobile } from "../src/components/workvivo/WorkvivoSeerSurveyMobile";
import { WorkvivoSeerManagerInsights } from "../src/components/workvivo/WorkvivoSeerManagerInsights";
import { WorkvivoSeerInsights } from "../src/components/workvivo/WorkvivoSeerInsights";
import { WorkvivoSeerRater } from "../src/components/workvivo/WorkvivoSeerRater";
import { WorkvivoSpaceFeed } from "../src/components/workvivo/WorkvivoSpaceFeed";
import { WorkvivoFloatingReactions } from "../src/components/workvivo/WorkvivoFloatingReactions";
import {
  WorkvivoJourneyCard,
  JOURNEY_CARD_W,
  JOURNEY_CARD_H,
} from "../src/components/workvivo/WorkvivoJourneyCard";
import { WorkvivoCustomerGrid } from "../src/components/workvivo/WorkvivoCustomerGrid";

// --- controls ----------------------------------------------------------------------

export type Control =
  | { key: string; label: string; kind: "range"; min: number; max: number; step: number; init: number }
  | { key: string; label: string; kind: "toggle"; init: boolean }
  | { key: string; label: string; kind: "select"; options: string[]; init: string };

export type Group = "Screens" | "Regions" | "Cards & panels" | "Overlays" | "Icon sets";

export type Entry = {
  id: string;
  /** The exported symbol, as you would import it. */
  name: string;
  file: string;
  group: Group;
  summary: string;
  /** Composition size this component is drawn at. */
  width: number;
  height: number;
  /** How long the component's own animation runs, for the frame scrubber. */
  durationInFrames: number;
  /** Frame the card thumbnail is taken at. */
  poster: number;
  controls?: Control[];
  Stage: React.FC<Record<string, unknown>>;
};

// --- staging helpers ---------------------------------------------------------------

/** Every component here is customisation-aware or sits next to one that is. */
const Provided: React.FC<{ children: React.ReactNode; background?: string }> = ({
  children,
  background = "#F3F4F6",
}) => (
  <CustomizationProvider input={DEFAULT_INPUT_PROPS}>
    <AbsoluteFill style={{ background, overflow: "hidden" }}>{children}</AbsoluteFill>
  </CustomizationProvider>
);

/**
 * The wrapper chain a region of the desktop home screen lays out inside.
 *
 * Lifted from WorkvivoHomeContainer — `.device > .app > .scaler` is what gives the
 * topbar its width, and `.shell` is what the sidebar sizes against. `.shell` is opt-in
 * because it also sets `height:975.714px; overflow:hidden`: correct for the whole
 * screen, but it would guillotine a feed column shown on its own at full height.
 *
 * `width` overrides the 1760px app frame for regions that are narrower than it.
 */
const HomeShell: React.FC<{
  children: React.ReactNode;
  shell?: boolean;
  width?: number;
}> = ({ children, shell = false, width = 1760 }) => (
  <div className="device" style={{ width }}>
    <WorkvivoSvgDefs />
    <div className="app" style={{ width, minHeight: 0 }}>
      <div className="scaler" style={{ width }}>
        {shell ? <div className="shell">{children}</div> : children}
      </div>
    </div>
  </div>
);

const NO_SWAP = { lead: 0, follow: 0 };

// --- icon sheets --------------------------------------------------------------------

/**
 * Sprite ids, listed rather than parsed: the sprite ships as one opaque string, so the
 * gallery cannot enumerate it at runtime. Keep in step by hand when icons are added —
 * `grep -o 'symbol id="[^"]*"'` over the source file gives the list.
 */
const UI_SPRITE_IDS = [
  "i-ui-home-nav-rail", "i-ui-my-company", "i-ui-explore", "i-ui-chat", "i-ui-spaces",
  "i-ui-pages", "i-ui-news", "i-ui-events-nav-rail", "i-ui-podcasts", "i-ui-newsletters",
  "i-ui-connect", "i-ui-teams", "i-ui-org-chart", "i-ui-documents-nav", "i-ui-resources",
  "i-ui-admin", "i-ui-employee-insights", "i-ui-apps-widget", "i-ui-gallery",
  "i-ui-journeys", "i-ui-journeys-hub", "i-ui-surveys-and-forms",
  "i-ui-surveys-and-forms-older-capture", "i-ui-pages-older-capture", "i-ui-posts",
  "i-ui-featured-news", "i-ui-featured-apps", "i-ui-featured-documents",
  "i-ui-featured-podcasts-solid", "i-ui-event-date", "i-ui-event-date-solid",
  "i-ui-event-time", "i-ui-notifications", "i-ui-add-image", "i-ui-add-gif",
  "i-ui-add-reaction", "i-ui-emoji-reaction", "i-ui-everyone", "i-ui-send",
  "i-ui-start-new-chat", "i-ui-summarise-content", "i-ui-shout-out",
  "i-ui-post-a-value-update", "i-ui-ask-a-question", "i-ui-sidebar-toggle",
  "i-ui-sidebar-collapse-arrows", "i-ui-favorite-star", "i-ui-ai-innovation",
  "i-ui-charity", "i-ui-networking", "i-ui-run-club", "i-ui-summit-event",
  "i-ui-askvivo", "i-ui-seer-admin", "i-ui-post-campaign", "i-ui-post-poll", "i-ui-quick-links", "i-ui-filter-posts", "i-ui-activity-feed", "i-ui-latest-posts", "i-ui-manage-posts", "i-ui-pin",
  "i-ui-spotlight", "i-weather-rain", "i-vendor-google-drive", "i-vendor-servicenow", "i-vendor-workday",
  "i-vendor-outlook", "i-vendor-gmail",
];

const SPACES_SPRITE_IDS = [
  "i-ui-customer-success-stories", "i-ui-human-resources", "i-ui-it-support-and-resources",
  "i-ui-leadership-corner", "i-ui-learning-hub", "i-ui-managers-network",
  "i-ui-sales-enablement", "i-ui-summit-event", "i-ui-wellbeing-heart",
  "i-ui-favorite-star-outline",
];

const IconSheet: React.FC<{
  ids: string[];
  columns: number;
  /**
   * The Spaces badge glyphs are drawn `fill="white"` for a coloured disc. Shown flat on
   * a white card they are invisible — not missing, just white on white — so that sheet
   * puts them back on a disc.
   */
  disc?: string;
}> = ({ ids, columns, disc }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 4,
      padding: 24,
      fontFamily: 'InterX,Inter,system-ui,sans-serif',
    }}
  >
    {ids.map((id) => (
      <div
        key={id}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
          padding: "14px 6px",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          minHeight: 92,
        }}
      >
        <span
          style={
            disc
              ? {
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: disc,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }
              : undefined
          }
        >
          <Icon
            href={`#${id}`}
            className=""
            width={disc ? 24 : 28}
            height={disc ? 24 : 28}
            style={{ color: disc ? "#FFFFFF" : "#6103ED" }}
          />
        </span>
        <span
          style={{
            fontSize: 10,
            lineHeight: "13px",
            color: "#6B7280",
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {id.replace(/^i-(ui|vendor|weather)-/, "")}
        </span>
      </div>
    ))}
  </div>
);

// --- the catalogue ------------------------------------------------------------------

export const ENTRIES: Entry[] = [
  // ---------------------------------------------------------------- screens
  {
    id: "home-container",
    name: "WorkvivoHomeContainer",
    file: "src/components/workvivo/WorkvivoHomeContainer.tsx",
    group: "Screens",
    summary:
      "The desktop home screen, assembled: topbar, nav rail, hero, billboards and both feed columns inside the 1760px app frame. Everything else in Regions is a piece of this.",
    width: 1760,
    height: 1080,
    durationInFrames: 120,
    poster: 0,
    controls: [{ key: "scrollTop", label: "Scroll", kind: "range", min: 0, max: 900, step: 10, init: 0 }],
    Stage: ({ scrollTop }) => (
      <Provided background="#FFFFFF">
        <WorkvivoHomeContainer
          scrollTop={Number(scrollTop) || 0}
          topSwap={NO_SWAP}
          leftSwap={NO_SWAP}
          rightSwap={NO_SWAP}
        />
      </Provided>
    ),
  },
  {
    id: "desktop",
    name: "WorkvivoDesktop",
    file: "src/components/workvivo/WorkvivoDesktop.tsx",
    group: "Screens",
    summary:
      "The standalone desktop app frame used for the shout-out beat — same chrome as the home container, but it owns the composed post and the reaction burst.",
    width: 1920,
    height: 1080,
    durationInFrames: 150,
    poster: 60,
    controls: [
      { key: "scrollTop", label: "Scroll", kind: "range", min: 0, max: 900, step: 10, init: 0 },
      { key: "showComposedPost", label: "Composed post", kind: "toggle", init: true },
    ],
    Stage: ({ scrollTop, showComposedPost }) => (
      <Provided>
        <WorkvivoDesktop
          scrollTop={Number(scrollTop) || 0}
          showComposedPost={Boolean(showComposedPost)}
          reactionsStart={0}
        />
      </Provided>
    ),
  },
  {
    id: "mobile-spotlight",
    name: "WorkvivoMobileSpotlight",
    file: "src/components/workvivo/WorkvivoMobileSpotlight.tsx",
    group: "Screens",
    summary:
      "The mobile Spotlight tab at the 393pt frame — Journeys hero, Quick Links, Documents, Featured News, Spaces and Upcoming Events over a scrolling 2162pt page, with the iOS status bar and the bottom nav. Overlaps WorkvivoMobileHome, which covers the middle of the same screen and is the one live in the cut.",
    width: 393,
    height: 850,
    durationInFrames: 60,
    poster: 0,
    controls: [{ key: "scrollTop", label: "Scroll", kind: "range", min: 0, max: 1300, step: 10, init: 0 }],
    Stage: ({ scrollTop }) => (
      <Provided background="#E10A0A">
        <WorkvivoMobileSpotlight scrollTop={Number(scrollTop) || 0} />
      </Provided>
    ),
  },
  {
    id: "mobile-home",
    name: "WorkvivoMobileHome",
    file: "src/components/workvivo/WorkvivoMobileHome.tsx",
    group: "Screens",
    summary:
      "The phone home screen at 393×852 — SF Pro type, 12px cards, the mobile nav bar. The one surface in the set that is not Inter.",
    width: 393,
    height: 852,
    durationInFrames: 120,
    poster: 0,
    controls: [{ key: "scrollTop", label: "Scroll", kind: "range", min: 0, max: 1200, step: 10, init: 0 }],
    Stage: ({ scrollTop }) => (
      <Provided background="#FFFFFF">
        <WorkvivoMobileHome scrollTop={Number(scrollTop) || 0} />
      </Provided>
    ),
  },
  {
    id: "space-page",
    name: "WorkvivoSpacePage",
    file: "src/components/workvivo/WorkvivoSpacePage.tsx",
    group: "Screens",
    summary:
      "A Space page — banner, tab strip, feed column and the right rail of featured cards. Drawn at the 1440×1415 size of the Figma export it recreates.",
    width: 1440,
    height: 1480,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSpacePage />
      </Provided>
    ),
  },
  {
    id: "billboard-screen",
    name: "WorkvivoBillboardScreen",
    file: "src/components/workvivo/WorkvivoBillboardScreen.tsx",
    group: "Screens",
    summary:
      "The Billboards digital-signage display — clock and weather bar, a large story with its media well, and a row of article, event and anniversary/QR cards on the tenant brand field. Sized from the supplied large-story export: 1259.82 content width puts the frame at 1320\u00d7742.",
    width: 1320,
    height: 742,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoBillboardScreen />
      </Provided>
    ),
  },
  {
    id: "phones",
    name: "WorkvivoPhonesScene",
    file: "src/components/workvivo/WorkvivoPhonesScene.tsx",
    group: "Screens",
    summary:
      "Two phones on a purple field \u2014 Chat on the left (photo grid, reactions, catch-up strip, composer) and a video call on the right. Reuses the mobile library's 393\u00d7852 shell, status bar and glass bezel rather than re-deriving them. Call chrome is borrowed from the Zoom icon set under an i-zm- prefix.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoPhonesScene />
      </Provided>
    ),
  },
  {
    id: "customer-grid",
    name: "WorkvivoCustomerGrid",
    file: "src/components/workvivo/WorkvivoCustomerGrid.tsx",
    group: "Screens",
    summary:
      "Customer Logo Wall — 5×11 grid of white client cards on glowing brand red mesh with center Workvivo mark.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 30,
    controls: [
      { key: "brand", label: "Brand color", kind: "select", options: ["#E10613", "#6103ED", "#0066CC", "#111827"], init: "#E10613" },
      { key: "animateIn", label: "Animate in", kind: "toggle", init: true },
    ],
    Stage: ({ brand, animateIn }) => (
      <Provided>
        <WorkvivoCustomerGrid
          brand={String(brand || "#E10613")}
          animateIn={animateIn !== false}
        />
      </Provided>
    ),
  },
  {
    id: "newsletter-builder",
    name: "WorkvivoNewsletterBuilder",
    file: "src/components/workvivo/WorkvivoNewsletterBuilder.tsx",
    group: "Screens",
    summary:
      "The newsletter builder \u2014 component palette (Layouts, Content, Post), the email canvas with its block outlines and empty-image placeholders, and the save bar. Authored at a natural 1299\u00d7731 desktop scale and scaled to fill, so the editor panel bleeds off frame as in the reference.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoNewsletterBuilder />
      </Provided>
    ),
  },
  {
    id: "widget-store",
    name: "WorkvivoWidgetStore",
    file: "src/components/workvivo/WorkvivoWidgetStore.tsx",
    group: "Screens",
    summary:
      "The Widget Store category browser \u2014 rail of widget categories, Discover pane with search, a gradient promo hero and the tinted category grid. The modal bleeds off the bottom of the frame, as the reference does.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoWidgetStore />
      </Provided>
    ),
  },
  {
    id: "integrations-marketplace",
    name: "WorkvivoIntegrationsMarketplace",
    file: "src/components/workvivo/WorkvivoIntegrationsMarketplace.tsx",
    group: "Screens",
    summary:
      "The Integrations Marketplace — a single centered card (no side rail) with a help notice, promo hero using marketplace-header.jpg, search, and the tinted category grid, on the tenant brand field.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    controls: [
      { key: "brand", label: "Brand color", kind: "select", options: ["#D40000", "#6103ED", "#0066CC", "#111827"], init: "#D40000" },
    ],
    Stage: ({ brand }) => (
      <Provided>
        <WorkvivoIntegrationsMarketplace brand={String(brand || "#D40000")} />
      </Provided>
    ),
  },
  {
    id: "integrations-list",
    name: "WorkvivoIntegrationsList",
    file: "src/components/workvivo/WorkvivoIntegrationsList.tsx",
    group: "Screens",
    summary:
      "The Integrations connector grid — cards full-bleed on the tenant brand field under a thin dark top strip, using the real app-tile logos in public/img/integrations/.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    controls: [
      { key: "brand", label: "Brand color", kind: "select", options: ["#D40000", "#6103ED", "#0066CC", "#111827"], init: "#D40000" },
    ],
    Stage: ({ brand }) => (
      <Provided>
        <WorkvivoIntegrationsList brand={String(brand || "#D40000")} />
      </Provided>
    ),
  },
  {
    id: "seer-insights",
    name: "WorkvivoSeerInsights",
    file: "src/components/workvivo/WorkvivoSeerInsights.tsx",
    group: "Screens",
    summary:
      "Seer Insights dashboard \u2014 the survey-analysis screen: top nav, tab strip, filter pills, Seer AI bar, popular-topic sentiment cards and the comment list. Extracted verbatim from the Seer pitch deck.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSeerInsights />
      </Provided>
    ),
  },
  {
    id: "seer-manager-insights",
    name: "WorkvivoSeerManagerInsights",
    file: "src/components/workvivo/WorkvivoSeerManagerInsights.tsx",
    group: "Screens",
    summary:
      "Seer Manager Insights \u2014 manager overview, engagement score, response/completion donuts, score timeline and the direct-reports row. Extracted verbatim from the Seer pitch deck.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSeerManagerInsights />
      </Provided>
    ),
  },
  {
    id: "seer-survey-mobile",
    name: "WorkvivoSeerSurveyMobile",
    file: "src/components/workvivo/WorkvivoSeerSurveyMobile.tsx",
    group: "Screens",
    summary:
      "The Seer survey on mobile \u2014 progress, illustration, rating and Previous/Skip/Next. Fits to height rather than width, being a phone. Extracted verbatim from the Seer pitch deck.",
    width: 1920,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSeerSurveyMobile />
      </Provided>
    ),
  },
  {
    id: "space-feed",
    name: "WorkvivoSpaceFeed",
    file: "src/components/workvivo/WorkvivoSpaceFeed.tsx",
    group: "Screens",
    summary:
      "A Space page's Feed tab — \"Your Voice Matters\": banner, overhanging space avatar, tab strip, and the three-column body with the About/Space Admins rail, a composer and a full post (document hero, attachment, reactions, comments). Same chassis as WorkvivoSpacePage with different content; the two are worth consolidating.",
    width: 1760,
    height: 1799,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSpaceFeed />
      </Provided>
    ),
  },
  {
    id: "spaces",
    name: "WorkvivoSpaces",
    file: "src/components/workvivo/WorkvivoSpaces.tsx",
    group: "Screens",
    summary:
      "The Spaces directory grid. No chrome of its own — the scene that stages it owns the background and the scale.",
    width: 1320,
    height: 1500,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <div style={{ width: 1320 }}>
          <WorkvivoSpacesSvgDefs />
          <WorkvivoSpaces />
        </div>
      </Provided>
    ),
  },
  {
    id: "analytics",
    name: "WorkvivoAnalytics",
    file: "src/components/workvivo/WorkvivoAnalytics.tsx",
    group: "Screens",
    summary:
      "Analytics & Reporting, Snapshot tab — team filters, four 270-degree completion gauges, a date range and three active-user bar charts. The gauges and bars are drawn from stroke-dasharray and rects rather than sourced from the icon library: they are data visualisation, not iconography.",
    width: 1760,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided background="#0A0E22">
        <WorkvivoAnalytics />
      </Provided>
    ),
  },
  {
    id: "newsletters",
    name: "WorkvivoNewsletters",
    file: "src/components/workvivo/WorkvivoNewsletters.tsx",
    group: "Screens",
    summary:
      "The Newsletters index — recent newsletters as photo cards, filter chips and the folder row. Unlike the other screens it draws its own chrome, reusing WorkvivoTopbar on the standard 1760px device with a collapsed 64px nav rail.",
    width: 1760,
    height: 1080,
    durationInFrames: 60,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoNewsletters />
      </Provided>
    ),
  },
  {
    id: "livestream",
    name: "WorkvivoLivestream",
    file: "src/components/workvivo/WorkvivoLivestream.tsx",
    group: "Screens",
    summary:
      "The livestream player with the 360px chat panel. `panelOpen` is a 0–1 progress, not a boolean, so the panel can be animated open.",
    width: 1280,
    height: 780,
    durationInFrames: 120,
    poster: 30,
    controls: [{ key: "panelOpen", label: "Panel open", kind: "range", min: 0, max: 1, step: 0.02, init: 1 }],
    Stage: ({ panelOpen }) => (
      <Provided background="#01031D">
        <WorkvivoLivestream panelOpen={Number(panelOpen)} />
      </Provided>
    ),
  },
  {
    id: "live-replay",
    name: "WorkvivoLiveReplay",
    file: "src/components/workvivo/WorkvivoLiveReplay.tsx",
    group: "Screens",
    summary: "The livestream replay on the phone, in the glass-edge device frame.",
    width: 393,
    height: 852,
    durationInFrames: 120,
    poster: 20,
    Stage: () => (
      <Provided background="#01031D">
        <WorkvivoLiveReplay />
      </Provided>
    ),
  },
  {
    id: "catch-me-up",
    name: "WorkvivoCatchMeUp",
    file: "src/components/workvivo/WorkvivoCatchMeUp.tsx",
    group: "Screens",
    summary:
      "The Catch Me Up story player on the phone. Fully driven from outside — the open state, the active slide and the progress within it are all props, so the scene owns the timing.",
    width: 393,
    height: 852,
    durationInFrames: 120,
    poster: 0,
    controls: [
      { key: "storyOpen", label: "Story open", kind: "toggle", init: true },
      { key: "activeSlide", label: "Slide", kind: "range", min: 0, max: 3, step: 1, init: 1 },
      { key: "slideProgress", label: "Slide progress", kind: "range", min: 0, max: 1, step: 0.02, init: 0.45 },
    ],
    Stage: ({ storyOpen, activeSlide, slideProgress }) => (
      <Provided background="#01031D">
        <WorkvivoCatchMeUp
          storyOpen={Boolean(storyOpen)}
          activeSlide={Number(activeSlide)}
          slideProgress={Number(slideProgress)}
          isPlaying={false}
        />
      </Provided>
    ),
  },

  {
    id: "journey-builder",
    name: "WorkvivoJourneyBuilder",
    file: "src/components/workvivo/WorkvivoJourneyBuilder.tsx",
    group: "Screens",
    summary:
      "The Journeys builder — the draggable step palette either side of a live phone preview. Brand colour is a prop: it fills the field and burns the phone's cover photo.",
    width: 1920,
    height: 1080,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided background="#E10A0A">
        <WorkvivoJourneyBuilder />
      </Provided>
    ),
  },
  {
    id: "journey-phone",
    name: "WorkvivoJourneyPhone",
    file: "src/components/workvivo/WorkvivoJourneyPhone.tsx",
    group: "Screens",
    summary:
      "The mobile journey detail screen at its native 393pt, in SF Pro. Standalone — no provider needed. Status, step count and the day list are all props.",
    width: 393,
    height: 986,
    durationInFrames: 30,
    poster: 0,
    controls: [
      { key: "status", label: "Status", kind: "select", options: ["Started", "Not Started"], init: "Started" },
      { key: "completed", label: "Steps done", kind: "range", min: 0, max: 12, step: 1, init: 3 },
      { key: "progress", label: "Bar fill", kind: "range", min: 0, max: 1, step: 0.05, init: 0 },
    ],
    Stage: ({ status, completed, progress }) => (
      <Provided background="#F7F7F7">
        <WorkvivoJourneyPhone
          brand="#E10A0A"
          status={status as "Started" | "Not Started"}
          completed={Number(completed)}
          progress={Number(progress)}
        />
      </Provided>
    ),
  },

  {
    id: "admin-hub",
    name: "WorkvivoAdminHub",
    file: "src/components/workvivo/WorkvivoAdminHub.tsx",
    group: "Screens",
    summary:
      "The Admin Hub landing page — lavender header band, quick links, the eight product tiles and the What's New card. Same 1760 device and shared top bar as the home container; body designed at 1440 and scaled once.",
    width: 1760,
    height: 1080,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided background="#FFFFFF">
        <WorkvivoAdminHub />
      </Provided>
    ),
  },

  {
    id: "seer-rater",
    name: "WorkvivoSeerRater",
    file: "src/components/workvivo/WorkvivoSeerRater.tsx",
    group: "Screens",
    summary:
      "Seer Insights, Rater tab — a segment \u00d7 driver score heatmap in Workvivo's chrome. Not a deck extract: the Rater tab isn't in the pitch deck, so this is built from the screenshot. Accent is a prop.",
    width: 1760,
    height: 1080,
    durationInFrames: 30,
    poster: 0,
    controls: [
      {
        key: "activeTab",
        label: "Tab",
        kind: "select",
        options: ["Engagement", "Drivers", "Values", "Rater", "Comments"],
        init: "Rater",
      },
      { key: "showCursor", label: "Demo pointer", kind: "toggle", init: true },
    ],
    Stage: ({ activeTab, showCursor }) => (
      <Provided background="#F3F4F6">
        <WorkvivoSeerRater
          activeTab={String(activeTab)}
          cursor={showCursor ? { left: 286, top: 94 } : null}
        />
      </Provided>
    ),
  },

  {
    id: "widget-list",
    name: "WorkvivoWidgetList",
    file: "src/components/workvivo/WorkvivoWidgetList.tsx",
    group: "Screens",
    summary:
      "The widget catalogue — two staggered columns of installable widget cards, each with a gradient tile, copy and a category chip. Sibling of WorkvivoWidgetStore, which is the store's Discover landing page.",
    width: 1210,
    height: 1120,
    durationInFrames: 30,
    poster: 0,
    controls: [
      { key: "stagger", label: "Column stagger", kind: "range", min: 0, max: 208, step: 1, init: 101 },
    ],
    Stage: ({ stagger }) => (
      <Provided background="#C4291C">
        <WorkvivoWidgetList stagger={Number(stagger)} />
      </Provided>
    ),
  },

  {
    id: "article",
    name: "WorkvivoArticle",
    file: "src/components/workvivo/WorkvivoArticle.tsx",
    group: "Screens",
    summary:
      "A single article page — banner with the title and language picker, the AI summary bar, body copy and the image row. Authored at its native 920px width; the scene owns the zoom and lets it run off the frame.",
    width: 920,
    height: 1160,
    durationInFrames: 30,
    poster: 0,
    controls: [
      {
        key: "title",
        label: "Title",
        kind: "select",
        options: ["Team Productivity", "Our Culture in Action", "Working at Virgin"],
        init: "Team Productivity",
      },
      {
        key: "language",
        label: "Language",
        kind: "select",
        options: ["English", "Français", "Español"],
        init: "English",
      },
    ],
    Stage: ({ title, language }) => (
      <Provided background="#0A0A2B">
        <WorkvivoArticle title={String(title)} language={String(language)} />
      </Provided>
    ),
  },

  {
    id: "hq-chat",
    name: "WorkvivoHqChat",
    file: "src/components/workvivo/WorkvivoHqChat.tsx",
    group: "Screens",
    summary:
      "The HQ Agent overlay mid-answer — the question asked, the agent still working, the composer waiting. Same modal and the same WorkvivoHqSidebar as the search state, with a different main pane.",
    width: 988,
    height: 653,
    durationInFrames: 30,
    poster: 0,
    controls: [
      {
        key: "question",
        label: "Question",
        kind: "select",
        options: [
          "Can you book me a day off?",
          "What is our time off policy?",
          "Who approves expenses over $500?",
        ],
        init: "Can you book me a day off?",
      },
      { key: "showTrace", label: "Reasoning trace", kind: "toggle", init: true },
    ],
    Stage: ({ question, showTrace }) => (
      <Provided background="#E10A0A">
        <WorkvivoHqChat
          question={String(question)}
          trace={showTrace ? "Searching." : null}
        />
      </Provided>
    ),
  },

  {
    id: "hq-search",
    name: "WorkvivoHqSearch",
    file: "src/components/workvivo/WorkvivoHqSearch.tsx",
    group: "Screens",
    summary:
      "The HQ Agent enterprise-search overlay — chat history rail, the agent's answer above the indexed results, and the connected-apps filter. Drawn at its own 988×582 design scale; the scene does the zoom.",
    width: 988,
    height: 582,
    durationInFrames: 30,
    poster: 0,
    controls: [
      {
        key: "query",
        label: "Query",
        kind: "select",
        options: [
          "What is our time off policy?",
          "How do I expense a flight?",
          "Who is on the cabin crew roster?",
        ],
        init: "What is our time off policy?",
      },
      { key: "showCursor", label: "Demo pointer", kind: "toggle", init: true },
    ],
    Stage: ({ query, showCursor }) => (
      <Provided background="#E10A0A">
        <WorkvivoHqSearch
          query={String(query)}
          cursor={showCursor ? { left: 126, top: 202 } : null}
        />
      </Provided>
    ),
  },

  // ---------------------------------------------------------------- regions
  {
    id: "topbar",
    name: "WorkvivoTopbar",
    file: "src/components/workvivo/WorkvivoTopbar.tsx",
    group: "Regions",
    summary:
      "The dark #00031F top bar — logo, 32px search pill, action icons and the avatar. Spans the full 1760px app frame.",
    width: 1760,
    height: 120,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided background="#00031F">
        <HomeShell>
          <WorkvivoTopbar />
        </HomeShell>
      </Provided>
    ),
  },
  {
    id: "sidebar",
    name: "WorkvivoSidebar",
    file: "src/components/workvivo/WorkvivoSidebar.tsx",
    group: "Regions",
    summary:
      "The 236px left nav rail — 36px items, 2px gaps within a group and a 20–28px break between groups.",
    width: 236,
    height: 976,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided background="#FFFFFF">
        <HomeShell shell width={236}>
          <WorkvivoSidebar />
        </HomeShell>
      </Provided>
    ),
  },
  {
    id: "hero",
    name: "WorkvivoHero",
    file: "src/components/workvivo/WorkvivoHero.tsx",
    group: "Regions",
    summary:
      "The page header band under the top bar — brand wash, logo lockup and the page title. Reads its colour from the customisation's header slot, not from a constant.",
    width: 1524,
    height: 289,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided>
        <HomeShell width={1524}>
          <WorkvivoHero />
        </HomeShell>
      </Provided>
    ),
  },
  {
    id: "billboards",
    name: "WorkvivoBillboards",
    file: "src/components/workvivo/WorkvivoBillboards.tsx",
    group: "Regions",
    summary:
      "The three-up billboard strip. `swap` is a pair of eased 0–1 progresses — the card that leaves first and the one that follows it into the vacated slot.",
    width: 1524,
    height: 260,
    durationInFrames: 60,
    poster: 0,
    controls: [
      { key: "lead", label: "Swap · lead", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
      { key: "follow", label: "Swap · follow", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
    ],
    Stage: ({ lead, follow }) => (
      <Provided>
        <HomeShell width={1524}>
          {/* `.billboards` carries margin-top:-124px so the strip rides up over the
              hero. Without the hero above it that pulls the cards off the top of the
              stage, so the padding puts back exactly what the negative margin takes. */}
          <div className="content" style={{ paddingTop: 155 }}>
            <WorkvivoBillboards swap={{ lead: Number(lead), follow: Number(follow) }} />
          </div>
        </HomeShell>
      </Provided>
    ),
  },
  {
    id: "left-column",
    name: "WorkvivoLeftColumn",
    file: "src/components/workvivo/WorkvivoLeftColumn.tsx",
    group: "Regions",
    summary: "The 886px centre feed column — posts, news, spaces and pages cards.",
    width: 886,
    height: 2500,
    durationInFrames: 60,
    poster: 0,
    controls: [
      { key: "lead", label: "Swap · lead", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
      { key: "follow", label: "Swap · follow", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
    ],
    Stage: ({ lead, follow }) => (
      <Provided>
        <HomeShell width={886}>
          <div className="cols">
            <WorkvivoLeftColumn swap={{ lead: Number(lead), follow: Number(follow) }} />
          </div>
        </HomeShell>
      </Provided>
    ),
  },
  {
    id: "right-column",
    name: "WorkvivoRightColumn",
    file: "src/components/workvivo/WorkvivoRightColumn.tsx",
    group: "Regions",
    summary:
      "The 437px right rail — weather, events, podcasts and the compact 12px-padding cards.",
    width: 437,
    height: 2260,
    durationInFrames: 60,
    poster: 0,
    controls: [
      { key: "lead", label: "Swap · lead", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
      { key: "follow", label: "Swap · follow", kind: "range", min: 0, max: 1, step: 0.02, init: 0 },
    ],
    Stage: ({ lead, follow }) => (
      <Provided>
        <HomeShell width={437}>
          <div className="cols">
            <WorkvivoRightColumn swap={{ lead: Number(lead), follow: Number(follow) }} />
          </div>
        </HomeShell>
      </Provided>
    ),
  },

  // ---------------------------------------------------------------- cards & panels
  {
    id: "journey-card",
    name: "WorkvivoJourneyCard",
    file: "src/components/workvivo/WorkvivoJourneyCard.tsx",
    group: "Cards & panels",
    summary:
      "A Journeys card — cover photo with the translucent action bar over its lower third: journey glyph, title, progress track and Start pill. 495.64×247.11 per the Figma spec.",
    width: Math.round(JOURNEY_CARD_W) + 80,
    height: Math.round(JOURNEY_CARD_H) + 80,
    durationInFrames: 30,
    poster: 0,
    controls: [
      { key: "progress", label: "Progress", kind: "range", min: 0, max: 1, step: 0.01, init: 0 },
      {
        key: "title",
        label: "Title",
        kind: "select",
        options: ["New Hire Onboarding", "IT & Security Training", "AI Adoption Program", "Sustainability at Work"],
        init: "New Hire Onboarding",
      },
    ],
    Stage: ({ progress, title }) => (
      <Provided background="#E10A0A">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <WorkvivoJourneyCard
            title={String(title)}
            image={staticFile("img/journeys/new-hire.png")}
            progress={Number(progress)}
          />
        </AbsoluteFill>
      </Provided>
    ),
  },
  {
    id: "post-composer",
    name: "WorkvivoPostComposer",
    file: "src/components/workvivo/WorkvivoPostComposer.tsx",
    group: "Cards & panels",
    summary:
      "The post composer, as a five-stage machine: the seed row, the open composer, the add-tray, the attachment tray and the values picker. `stage` selects which one is drawn.",
    width: 1100,
    height: 900,
    durationInFrames: 90,
    poster: 30,
    controls: [
      {
        key: "stage",
        label: "Stage",
        kind: "select",
        options: ["seed", "composer", "add", "tray", "values"],
        init: "composer",
      },
    ],
    Stage: ({ stage }) => (
      <Provided>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <WorkvivoPostComposer stage={stage as never} composerShownAt={0} />
        </AbsoluteFill>
      </Provided>
    ),
  },
  {
    id: "ai-compose-settings",
    name: "WorkvivoAiComposeSettings",
    file: "src/components/workvivo/WorkvivoAiComposeSettings.tsx",
    group: "Cards & panels",
    summary: "The 880px AI compose settings panel, with the CEO-voice switch as its one prop.",
    width: 1000,
    height: 820,
    durationInFrames: 60,
    poster: 20,
    controls: [{ key: "ceoVoiceOn", label: "CEO voice", kind: "toggle", init: true }],
    Stage: ({ ceoVoiceOn }) => (
      <Provided>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <WorkvivoAiComposeSettings ceoVoiceOn={Boolean(ceoVoiceOn)} />
        </AbsoluteFill>
      </Provided>
    ),
  },

  // ---------------------------------------------------------------- overlays
  {
    id: "floating-reactions",
    name: "WorkvivoFloatingReactions",
    file: "src/components/workvivo/WorkvivoFloatingReactions.tsx",
    group: "Overlays",
    summary:
      "The reaction burst that floats up off a post, plus the `useReactionCounts` hook that ticks the counts alongside it. `startFrame` is in the host component's frame-space; null parks it.",
    width: 520,
    height: 760,
    durationInFrames: 120,
    poster: 45,
    Stage: () => (
      <Provided background="#FFFFFF">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
          <WorkvivoFloatingReactions startFrame={0} />
        </AbsoluteFill>
      </Provided>
    ),
  },

  // ---------------------------------------------------------------- icon sets
  {
    id: "icons",
    name: "WorkvivoSvgDefs / Icon",
    file: "src/components/workvivo/WorkvivoIcons.tsx",
    group: "Icon sets",
    summary:
      "The shared sprite and its `<Icon>` wrapper. Mount `WorkvivoSvgDefs` once per screen, then reference glyphs by id. Every path is a real Workvivo capture — none are drawn by hand.",
    width: 1000,
    height: 900,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSvgDefs />
        <IconSheet ids={UI_SPRITE_IDS} columns={8} />
      </Provided>
    ),
  },
  {
    id: "folder-icon",
    name: "WorkvivoFolderIcon",
    file: "src/components/workvivo/WorkvivoFolderIcon.tsx",
    group: "Icon sets",
    summary:
      "Workvivo's folder mark, shared between the home feed's featured-documents rows and the Newsletters screen. FolderGlyph is the bare glyph at any size or colour; DocumentFolderIcon is the tinted tile the feed wraps it in.",
    width: 560,
    height: 200,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: 32,
            fontFamily: "InterX,Inter,system-ui,sans-serif",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 10 }}>
            <DocumentFolderIcon />
            <span>DocumentFolderIcon</span>
          </div>
          <div style={{ display: "grid", justifyItems: "center", gap: 10 }}>
            <FolderGlyph size={36} />
            <span>FolderGlyph</span>
          </div>
          {/* White is how the Newsletters cards use it, so it needs a dark ground to
              read against — same reason the Spaces badge sheet sits on a disc. */}
          <div style={{ display: "grid", justifyItems: "center", gap: 10 }}>
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                background: "#21054A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderGlyph size={28} color="#fff" />
            </span>
            <span>FolderGlyph on photo</span>
          </div>
        </div>
      </Provided>
    ),
  },
  {
    id: "spaces-icons",
    name: "WorkvivoSpacesSvgDefs",
    file: "src/components/workvivo/WorkvivoSpacesIcons.tsx",
    group: "Icon sets",
    summary:
      "The Spaces directory badge sprite — the large full-colour glyphs each Space card is stamped with, kept apart from the UI sprite because they are illustrations, not nav glyphs.",
    width: 1000,
    height: 330,
    durationInFrames: 30,
    poster: 0,
    Stage: () => (
      <Provided>
        <WorkvivoSpacesSvgDefs />
        <IconSheet ids={SPACES_SPRITE_IDS} columns={5} disc="#6103ED" />
      </Provided>
    ),
  },
];

export const GROUPS: Group[] = [
  "Screens",
  "Regions",
  "Cards & panels",
  "Overlays",
  "Icon sets",
];

/** Every control's starting value, keyed by entry id. */
export const initialControlState = (entry: Entry): Record<string, unknown> =>
  Object.fromEntries((entry.controls ?? []).map((c) => [c.key, c.init]));

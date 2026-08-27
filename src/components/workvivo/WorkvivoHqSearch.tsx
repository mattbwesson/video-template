import React from "react";
import { InlineSvg } from "../InlineSvg";
import { CursorArrow } from "../CursorArrow";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoHqSidebar } from "./WorkvivoHqSidebar";
import "./WorkvivoHqSearchStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import { FIXED_COPY } from "../../customize/videoCopy";

/**
 * The HQ Agent enterprise-search overlay — a full-screen modal over the app, with the
 * chat history rail on the left, the agent's answer above the indexed results, and the
 * connected-apps filter on the right.
 *
 * Drawn at the reference's own scale: the modal is 988x582 design units and the scene
 * that stages it does the scaling. Keeping it at 1x means every number below is the
 * number in the design.
 *
 * Three glyphs in this screen are not in the Workvivo icon library and are not invented
 * here either — see `GenericGlyphs` and `.whq-mark-placeholder` for what each one is and
 * why it looks the way it does.
 */

export const HQ_SEARCH_W = 988;
export const HQ_SEARCH_H = 680;

const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Geometry the library has no entry for.
 *
 * A chevron, an X and a plus-in-a-circle have no Workvivo-specific drawing — they are
 * two straight lines each. Drawing them from primitives here is not the same thing as
 * reconstructing a branded glyph from memory, which is why nothing else on this screen
 * is drawn locally.
 */
const ChevronDown: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden>
    <path
      d="M2 4l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseX: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3.5 3.5l9 9M12.5 3.5l-9 9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const ClearX: React.FC = () => (
  <svg width={8} height={8} viewBox="0 0 8 8" fill="none" aria-hidden>
    <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// --- content ------------------------------------------------------------------------

const FILTERS = ["Date", "Created By", "Space", "Team"];

/** Words a query is not really about — italicising these would emphasise nothing. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "at", "can", "do", "does", "for", "how", "i", "in", "is",
  "it", "me", "my", "of", "on", "or", "our", "the", "to", "we", "what", "when",
  "where", "who", "why", "you", "your",
]);

/**
 * The result title with the query's own words set in `<em>`, as the reference shows.
 *
 * The baseline hard-coded which words to italicise ("<em>Time Off</em> & Leave Policy"),
 * which only works while the query and the titles are both fixed. Matching instead means
 * a researched title emphasises whatever it genuinely shares with the researched query,
 * and a title with nothing in common renders plain rather than emphasising the wrong
 * half of itself.
 *
 * Matching is on whole words, case-insensitively; CONSECUTIVE matches merge into one
 * `<em>` — "Time Off" is one emphasis in the reference, not two — and only the FIRST run
 * in a title is emphasised. That last rule is what reproduces the approved cut exactly:
 * "Time Off & Leave Policy" also contains "Policy", and emphasising every match would
 * light up two thirds of the line where the reference lights up two words.
 */
const Highlighted: React.FC<{ text: string; terms: string }> = ({ text, terms }) => {
  const wanted = new Set(
    terms
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );

  // Split on whitespace but KEEP it, so re-joining reproduces the original spacing.
  const parts = text.split(/(\s+)/);
  const runs: { text: string; hit: boolean }[] = [];
  let seenHit = false;
  for (const part of parts) {
    const last = runs[runs.length - 1];
    const matches =
      /\S/.test(part) && wanted.has(part.toLowerCase().replace(/[^a-z0-9]/gi, ""));
    // Past the first run, a match is drawn plain — see the note above.
    const hit = matches && (!seenHit || Boolean(last?.hit));
    if (hit) seenHit = true;
    // Whitespace joins the run either side of it when both are hits, so "Time Off"
    // becomes one emphasis rather than two with a plain gap between them.
    if (last && (last.hit === hit || (!/\S/.test(part) && last.hit))) {
      last.text += part;
    } else {
      runs.push({ text: part, hit });
    }
  }

  return (
    <>
      {runs.map((run, i) =>
        run.hit ? <em key={i}>{run.text}</em> : <React.Fragment key={i}>{run.text}</React.Fragment>,
      )}
    </>
  );
};

type AppRow = {
  label: string;
  /** `radio` rows are connected sources you can filter on; `connect` rows are not linked yet. */
  state: "selected" | "radio" | "connect";
  mark: React.ReactNode;
};

/**
 * Two marks the Workvivo library does not carry.
 *
 * `vendor.*` covers 20 connectors but SharePoint is not one of them, and there is no
 * Workvivo product mark in any register. Both are drawn as obvious placeholders rather
 * than approximated: a wrong-but-plausible logo is the failure mode that ships.
 */
const WorkvivoMark = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 190 190"
    fill="none"
    style={{ borderRadius: 5, overflow: "hidden", display: "block" }}
  >
    <rect width="190" height="190" rx="36" fill="#00031F" />
    <path
      d="M121.33 132.96l-29.2-67.93c-1.9-4.43-6.34-5.9-10.22-4.52-3.64 1.29-6.43 5.9-4.56 10.24l29.14 67.71c1.9 4.41 6.31 6.01 10.59 4.18 2.66-1.14 6.17-5.24 4.27-9.68ZM148.62 102.76l-16.8-38.53c-1.86-4.27-7.03-5.1-10.57-3.43-3.26 1.54-5.47 5.9-3.78 9.83l16.18 37.67c1.9 4.42 6.29 6.2 10.58 4.46 3.1-1.26 6.35-5.49 4.38-10ZM54.45 71.27c0-4.65-3.77-8.43-8.43-8.43s-8.43 3.77-8.43,8.43,3.77 8.43 8.43 8.43 8.43-3.77 8.43-8.43ZM81.04 132.44l-16.3-38.12c-1.87-4.37-6.32-6.01-10.29-4.43-3.75 1.5-6.36 5.9-4.51 10.23l16.14 37.74c1.96 4.58 6.13 6.8 10.93 4.78 3.08-1.29 5.99-5.6 4.02-10.21Z"
      fill="#FFFFFF"
    />
  </svg>
);
const SharePointMarkPlaceholder = () => (
  <span className="whq-mark-placeholder whq-unknown" title="SharePoint logo not in library" />
);

export interface WorkvivoHqSearchProps {
  /** Overrides `FIXED_COPY.hqQuery`. Omit inside the film. */
  query?: string;
  /** Where to park the demo pointer, in the modal's own coordinates. Omit for none. */
  cursor?: { left: number; top: number } | null;
  activeNav?: "search" | "new-chat";
}

export const WorkvivoHqSearch: React.FC<WorkvivoHqSearchProps> = ({
  query,
  cursor = null,
  activeNav = "search",
}) => {
  const frame = useCurrentFrame();
  const { copy, image } = useCustomization();
  const hq = copy.hq;
  const asked = query ?? FIXED_COPY.hqQuery;

  // Staggered rise for each component section as the modal enters
  const sidebarY = interpolate(frame, [0, 16], [35, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sidebarOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const searchbarY = interpolate(frame, [3, 19], [35, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const searchbarOpacity = interpolate(frame, [3, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const filtersY = interpolate(frame, [5, 21], [35, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filtersOpacity = interpolate(frame, [5, 17], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const agentY = interpolate(frame, [7, 23], [40, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const agentOpacity = interpolate(frame, [7, 19], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const card1Y = interpolate(frame, [9, 25], [45, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card1Opacity = interpolate(frame, [9, 21], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const card2Y = interpolate(frame, [12, 28], [50, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card2Opacity = interpolate(frame, [12, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const appsHeaderY = interpolate(frame, [15, 26], [20, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appsHeaderOpacity = interpolate(frame, [15, 23], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const apps: AppRow[] = [
    {
      label: "All",
      state: "selected",
      mark: (
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#6103ED",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
          }}
        >
          <Icon href="#i-ui-apps-widget" className="" width={11} height={11} />
        </span>
      ),
    },
    { label: "Workvivo", state: "radio", mark: <WorkvivoMark /> },
    {
      label: "Zoom",
      state: "radio",
      mark: <img src={staticFile("img/zoomicon.png")} width={20} height={20} alt="" />,
    },
    {
      label: "ServiceNow",
      state: "connect",
      mark: <Icon href="#i-vendor-servicenow" className="" width={18} height={18} />,
    },
    { label: "Share Point", state: "connect", mark: <SharePointMarkPlaceholder /> },
    {
      label: "Google Drive",
      state: "connect",
      mark: <Icon href="#i-vendor-google-drive" className="" width={18} height={18} />,
    },
  ];

  return (
    <div className="whq-modal" style={{ width: HQ_SEARCH_W, height: HQ_SEARCH_H }}>
      <WorkvivoSvgDefs />

      <div
        style={{
          transform: `translateY(${sidebarY}px)`,
          opacity: sidebarOpacity,
          height: "100%",
          display: "flex",
        }}
      >
        <WorkvivoHqSidebar
          active={activeNav}
          // Drop the first entry: it is the conversation the CHAT state opens on at 2392,
          // and it has not been asked yet while search is on screen.
          history={FIXED_COPY.hqChat.history.slice(1)}
        />
      </div>

      {/* ------------------------------------------------------------------- main */}
      <div className="whq-main">
        <span className="whq-close">
          <CloseX />
        </span>

        <div
          className="whq-searchbar"
          style={{
            transform: `translateY(${searchbarY}px)`,
            opacity: searchbarOpacity,
          }}
        >
          <Icon href="#i-ui-explore" className="" width={16} height={16} />
          <span className="whq-query">
            {asked}
            <i className="whq-caret" />
          </span>
          <span className="whq-clear">
            <ClearX />
          </span>
        </div>

        <div
          className="whq-filters"
          style={{
            transform: `translateY(${filtersY}px)`,
            opacity: filtersOpacity,
          }}
        >
          {FILTERS.map((f) => (
            <span className="whq-chip" key={f}>
              {f}
              <ChevronDown />
            </span>
          ))}
          <span className="whq-sort">
            Sort By
            <span className="whq-chip">
              Most Relevant
              <ChevronDown />
            </span>
          </span>
        </div>

        <div className="whq-body">
          <div className="whq-results">
            {/* ------------------------------------------------ the agent's answer */}
            <div
              className="whq-agent"
              style={{
                transform: `translateY(${agentY}px)`,
                opacity: agentOpacity,
              }}
            >
              <div className="whq-agent-head">
                <InlineSvg
                  src={staticFile("img/hq-agent-logo.svg")}
                  alt="HQ agent"
                  style={{ height: 22, width: "auto", display: "block" }}
                />
                <span className="whq-viewmore">View More</span>
              </div>
              <div className="whq-agent-title">{hq.answer.title}</div>
              <div className="whq-agent-body">{hq.answer.body}</div>
            </div>

            {/* ------------------------------------------------- indexed results */}
            <div
              className="whq-source"
              style={{
                transform: `translateY(${card1Y}px)`,
                opacity: card1Opacity,
              }}
            >
              <WorkvivoMark />
              Workvivo
            </div>

            <article
              className="whq-card"
              style={{
                transform: `translateY(${card1Y}px)`,
                opacity: card1Opacity,
              }}
            >
              <span className="whq-card-icon">
                <Icon href="#i-ui-documents-nav" className="" width={15} height={15} />
              </span>
              <div className="whq-card-main">
                {/* The reference italicises the matched words inside each result title.
                    A researched title is not guaranteed to contain the query's words, so
                    the emphasis is applied by matching rather than by hand-splitting the
                    string — a title with no match simply renders plain. */}
                <div className="whq-title">
                  <Highlighted text={hq.results[0].title} terms={asked} />
                </div>
                <div className="whq-meta">
                  <span>Added June 23rd, 2025 (1 year ago)</span>
                  <span>•</span>
                  <span className="whq-space">
                    <Icon href="#i-ui-spaces" className="" width={11} height={11} />
                    {hq.results[0].space}
                  </span>
                </div>
                <p className="whq-desc">{hq.results[0].description}</p>

                <div className="whq-attach-label">1 Attachment</div>
                <div className="whq-attach">
                  <InlineSvg className="whq-attach-ico" src={staticFile("img/file-pdf.svg")} alt="" />
                  <div className="whq-attach-info">
                    <span className="whq-attach-name">{hq.attachment}</span>
                    <span className="whq-attach-kind">PDF document</span>
                  </div>
                  <span className="whq-attach-size">6.3 MB</span>
                </div>

                <span className="whq-tag">Document</span>
              </div>
            </article>

            {/* Clipped by the modal, exactly as in the reference — the list runs on. */}
            <article
              className="whq-card"
              style={{
                transform: `translateY(${card2Y}px)`,
                opacity: card2Opacity,
              }}
            >
              <span className="whq-card-icon">
                <Icon href="#i-ui-pages" className="" width={15} height={15} />
              </span>
              <div className="whq-card-main">
                <div className="whq-title">
                  <Highlighted text={hq.results[1].title} terms={asked} />
                </div>
                <div className="whq-meta">
                  <span className="whq-author">
                    <img
                      className="whq-avatar"
                      data-vc-slot="search.face.0"
                      src={image("search.face.0", staticFile("img/avatar-3.jpeg"))}
                      alt=""
                    />
                    {hq.resultAuthor}
                  </span>
                  <span>•</span>
                  <span>Published May 23rd, 2026 (1 month ago)</span>
                  <span>•</span>
                  <span className="whq-space">
                    <Icon href="#i-ui-spaces" className="" width={11} height={11} />
                    {hq.results[1].space}
                  </span>
                </div>
                <p className="whq-desc">{hq.results[1].description}</p>
              </div>
            </article>
          </div>

          {/* ------------------------------------------------------- connected apps */}
          <aside className="whq-apps">
            <div
              className="whq-apps-label"
              style={{
                transform: `translateY(${appsHeaderY}px)`,
                opacity: appsHeaderOpacity,
              }}
            >
              Apps
            </div>
            {apps.map((a, i) => {
              // Animate in all apps at frame 26 (global 2343) with staggered entry
              const appStart = 26 + i * 2;
              const appY = interpolate(frame, [appStart, appStart + 10], [25, 0], {
                easing: SCENE_EASE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const appX = interpolate(frame, [appStart, appStart + 10], [15, 0], {
                easing: SCENE_EASE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const appOpacity = interpolate(frame, [appStart, appStart + 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const appScale = interpolate(frame, [appStart, appStart + 10], [0.92, 1], {
                easing: SCENE_EASE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              return (
                <div
                  className={a.state === "selected" ? "whq-app whq-on" : "whq-app"}
                  key={a.label}
                  style={{
                    transform: `translate(${appX}px, ${appY}px) scale(${appScale})`,
                    opacity: appOpacity,
                    willChange: "transform, opacity",
                  }}
                >
                  <span className="whq-app-mark">{a.mark}</span>
                  {a.label}
                  {a.state === "connect" ? (
                    <span className="whq-connect">Connect</span>
                  ) : (
                    <span
                      className={a.state === "selected" ? "whq-radio whq-on" : "whq-radio"}
                    />
                  )}
                </div>
              );
            })}
          </aside>
        </div>
      </div>

      {cursor ? (
        <CursorArrow
          color="black"
          className="whq-cursor"
          style={{ left: cursor.left, top: cursor.top, height: 61 }}
        />
      ) : null}
    </div>
  );
};

import React from "react";
import { InlineSvg } from "../InlineSvg";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoSpaceFeedStyles.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Space page, Feed tab — "Your Voice Matters".
 */

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
  "#i-ui-surveys-and-forms",
  "#i-ui-newsletters",
  "#i-ui-journeys",
];

const NAV_PEOPLE = ["#i-ui-connect", "#i-ui-teams", "#i-ui-org-chart"];
const NAV_TOOLS = ["#i-ui-featured-apps", "#i-ui-documents-nav", "#i-ui-gallery"];

/** Connector logos at the foot of the rail — third-party marks, never recoloured. */
const NAV_APPS = [
  "#i-vendor-google-drive",
  "#i-vendor-outlook",
  "#i-vendor-gmail",
];

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

const REACTIONS: Array<[string, number]> = [
  ["❤️", 20],
  ["👍", 18],
  ["👏", 19],
  ["🙋", 2],
  ["🌸", 1],
  ["🥳", 30],
];

/**
 * The six faces this screen recycles through its member rows, admin rows and comments.
 *
 * Six positions for what the reference draws as more than twenty avatars: they repeat by
 * design (`face(i)` wraps), and giving every repetition its own position would ask an
 * operator for twenty portraits to dress one card.
 */
const FACES: { src: string; slot: ImageSlotKey }[] = [
  { src: "img/avatar-1.jpeg", slot: "voice.face.0" },
  { src: "img/avatar-3.jpeg", slot: "voice.face.1" },
  { src: "img/avatar-4.jpeg", slot: "voice.face.2" },
  { src: "img/avatar-5.jpeg", slot: "voice.face.3" },
  { src: "img/avatar-6.jpeg", slot: "voice.face.4" },
  { src: "img/avatar-1.jpeg", slot: "voice.face.5" },
];

/**
 * The document's title as it is set on its cover: two lines, with the last two words in
 * the heavy weight.
 *
 * The reference hard-codes both — "The Complete Guide / to our <b>HR System</b>" — and at
 * 36px in an absolutely-positioned block a one-line title simply runs off the card. So
 * the break is derived instead: the first half of the words go on line one, the rest on
 * line two, and the final two words are bolded. For the baseline string that reproduces
 * the reference exactly, and a shorter or longer title still lands on two lines.
 */
const DocTitle: React.FC<{ text: string }> = ({ text }) => {
  const words = text.trim().split(/\s+/);
  const split = Math.ceil(words.length / 2);
  const head = words.slice(0, split).join(" ");
  const tail = words.slice(split);
  const boldFrom = Math.max(0, tail.length - 2);
  return (
    <div className="wsf-doc-title">
      {head}
      {tail.length ? (
        <>
          <br />
          {tail.slice(0, boldFrom).join(" ")}
          {boldFrom ? " " : ""}
          <b>{tail.slice(boldFrom).join(" ")}</b>
        </>
      ) : null}
    </div>
  );
};

const Comment: React.FC<{
  avatarUrl: string;
  name: string;
  text: string;
  likes: number;
  liked: boolean;
}> = ({ avatarUrl, name, text, likes, liked }) => (
  <div>
    <div className="wsf-comment">
      <img
        className="wsf-av"
        src={avatarUrl}
        style={{ objectFit: "cover", objectPosition: "50% 15%", display: "block" }}
        alt=""
      />
      <div className="wsf-bubble">
        <div className="wsf-bubble-name">{name}</div>
        <div className="wsf-bubble-text">{text}</div>
      </div>
    </div>
    <div className="wsf-comment-meta">
      1 day ago
      <span className="wsf-comment-likes">
        <span style={{ color: liked ? "#FF5959" : "transparent", WebkitTextStroke: liked ? undefined : "1px #FF5959", fontSize: 13 }}>
          &#9829;
        </span>
        {likes}
      </span>
      <span className="wsf-comment-reply">Reply</span>
    </div>
  </div>
);

export const WorkvivoSpaceFeed: React.FC = () => {
  const { copy, image, person } = useCustomization();
  const voice = copy.voice;

  /** The nth avatar, wrapping — an operator upload if there is one, else the baseline. */
  const faceUrl = (i: number) => {
    const f = FACES[i % FACES.length];
    return image(f.slot, staticFile(f.src));
  };
  /** The style every face <img> shares — the crop the old background rules applied. */
  const faceFit = {
    objectFit: "cover",
    objectPosition: "50% 15%",
    display: "block",
  } as const;

  return (
    <div className="device" style={{ width: 1760, height: 1080 }}>
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />

          <div className="wsf-shell">
            <div className="wsf-body">
              {/* ---------------------------------------------------- nav rail */}
              <aside className="wsf-rail">
                <span className="wsf-navico">
                  <Icon href="#i-ui-sidebar-toggle" width={18} height={18} />
                </span>
                <img className="wsf-railav" src={person.avatarUrl} style={person.avatarFit} alt="" />
                <div className="wsf-navgroup">
                  {NAV_TOP.map((h) => (
                    <span className="wsf-navico" key={h}>
                      <Icon href={h} width={16} height={16} />
                    </span>
                  ))}
                </div>
                <div className="wsf-navgroup">
                  {NAV_EXPLORE.map((h) => (
                    <span className="wsf-navico" key={h}>
                      <Icon href={h} width={16} height={16} />
                    </span>
                  ))}
                </div>
                <div className="wsf-navgroup">
                  {NAV_PEOPLE.concat(NAV_TOOLS).map((h) => (
                    <span className="wsf-navico" key={h}>
                      <Icon href={h} width={16} height={16} />
                    </span>
                  ))}
                </div>
                <div className="wsf-navgroup">
                  {NAV_APPS.map((h) => (
                    <span className="wsf-navico" key={h}>
                      <Icon href={h} width={20} height={20} />
                    </span>
                  ))}
                  <span className="wsf-navico">
                    <img
                      className="wsf-appico"
                      src={staticFile("img/zoomicon.png")}
                      alt=""
                    />
                  </span>
                </div>
              </aside>

              {/* ------------------------------------------------ banner + head */}
              <div className="wsf-banner">
                <img
                  data-vc-slot="voice.banner.0"
                  src={image("voice.banner.0", staticFile("img/workvivo/story_summit.png"))}
                  alt=""
                />
                {/* The brand tint. It replaces a mix-blend-mode: multiply the export
                    drops — see the note in the stylesheet. */}
                <div className="wsf-banner-wash" />
              </div>

              <div className="wsf-head">
                <span className="wsf-avatar">
                  <Icon href="#i-ui-teams" width={42} height={42} />
                </span>

                <div className="wsf-titlerow">
                  <span className="wsf-caret wsf-caret-left" style={{ color: "#111827" }} />
                  <div className="wsf-title">{voice.space.name}</div>
                  <span className="wsf-admin">
                    Admin
                    <span className="wsf-caret" style={{ color: "#6103ED" }} />
                  </span>
                  <span className="wsf-join">Join</span>
                  <span className="wsf-iconbtn">
                    <Icon href="#i-ui-favorite-star" width={22} height={22} />
                  </span>
                  <span className="wsf-iconbtn">
                    <Icon href="#i-ui-notifications" width={20} height={20} />
                  </span>
                </div>

                <div className="wsf-tabs">
                  {TABS.map((t) => (
                    <span className={t === "Feed" ? "wsf-tab wsf-on" : "wsf-tab"} key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------ three columns */}
              <div className="wsf-cols">
                {/* -------------------------------------------------- left */}
                <div className="wsf-left">
                  <div className="wsf-search">
                    <Icon href="#i-ui-explore" width={16} height={16} />
                    Search Manager Insights Action
                  </div>

                  <div className="wsf-card">
                    <div className="wsf-eyebrow">ABOUT</div>
                    <div className="wsf-chips">
                      <span className="wsf-chip">Corporate Spaces</span>
                      <span className="wsf-chip">
                        <Icon href="#i-ui-spaces" width={12} height={12} />
                        Human Resources
                      </span>
                    </div>
                    <div className="wsf-about">{voice.space.about}</div>
                    <div className="wsf-members">{voice.space.members}</div>
                    <div className="wsf-avrow">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <img className="wsf-av" key={i} src={faceUrl(i)} style={faceFit} alt="" />
                      ))}
                      <span className="wsf-avmore">99+</span>
                    </div>
                  </div>

                  <div className="wsf-card">
                    <div className="wsf-eyebrow">SPACE ADMINS</div>
                    <div className="wsf-avrow">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <img className="wsf-av" key={i} src={faceUrl(i)} style={faceFit} alt="" />
                      ))}
                    </div>
                    <div className="wsf-avrow">
                      {[3, 4, 0, 1, 2, 5].map((i, n) => (
                        <img className="wsf-av" key={n} src={faceUrl(i)} style={faceFit} alt="" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------- feed */}
                <div className="wsf-feed">
                  <div className="wsf-composer">
                    <div className="wsf-composer-top">
                      <img className="wsf-av" src={person.avatarUrl} style={person.avatarFit} alt="" />
                      <span className="wsf-placeholder">
                        What&rsquo;s going on, {person.name.split(" ")[0]}?
                      </span>
                    </div>
                    <div className="wsf-rule" />
                    <div className="wsf-actions">
                      <span className="wsf-action">
                        <Icon href="#i-ui-shout-out" width={24} height={24} />
                        Give a Shout-out
                      </span>
                      <span className="wsf-action">
                        <Icon href="#i-ui-post-a-value-update" width={24} height={24} />
                        Post a Value Update
                      </span>
                      <span className="wsf-action">
                        <Icon href="#i-ui-ask-a-question" width={24} height={24} />
                        Ask a Question
                      </span>
                    </div>
                  </div>

                  <div className="wsf-post">
                    <div className="wsf-post-head">
                      <img className="wsf-av" src={faceUrl(1)} style={faceFit} alt="" />
                      <div className="wsf-post-who">
                        <div className="wsf-post-name">
                          <b>{voice.post.author}</b> posted a document.
                        </div>
                        <div className="wsf-post-meta">
                          1 day ago
                          <span className="wsf-dot" />
                          <Icon href="#i-ui-everyone" width={13} height={13} />
                        </div>
                      </div>
                      <InlineSvg
                        src={staticFile("img/more.svg")}
                        width={22}
                        height={22}
                        alt=""
                        style={{ display: "block" }}
                      />
                    </div>

                    <div className="wsf-post-space">
                      <Icon href="#i-ui-spaces" width={12} height={12} />
                      {voice.post.space}
                    </div>

                    {/* pre-line, so the slot's own newline is the paragraph break the
                        reference draws with a <br />. */}
                    <div className="wsf-post-body" style={{ whiteSpace: "pre-line" }}>
                      {voice.post.body}
                    </div>

                    <div className="wsf-doc">
                      <img
                        data-vc-slot="voice.doc.0"
                        src={image("voice.doc.0", staticFile("img/workvivo/pages_1.png"))}
                        alt=""
                      />
                      <DocTitle text={voice.post.document} />
                    </div>
                    <div className="wsf-doc-cap">{voice.post.document}</div>

                    <div className="wsf-hr" />

                    <div className="wsf-attach-label">Attachments(1)</div>
                    <div className="wsf-attach">
                      <span className="wsf-attach-left">
                        <InlineSvg
                          src={staticFile("img/file-pdf.svg")}
                          width={40}
                          height={40}
                          alt=""
                          style={{ display: "block" }}
                        />
                        PDF document
                      </span>
                      <span>756 KB</span>
                    </div>

                    <div className="wsf-hr" />

                    <div className="wsf-counts">
                      <span className="wsf-counts-left">
                        150 reactions
                        <span className="wsf-dot" />
                        0 comments
                      </span>
                      <span className="wsf-share">
                        <Icon href="#i-ui-send" width={20} height={20} />
                        Share
                      </span>
                    </div>

                    <div className="wsf-reacts">
                      {REACTIONS.map(([emoji, n], i) => (
                        <span
                          className={i === 0 ? "wsf-react wsf-react-plain" : "wsf-react"}
                          key={emoji}
                        >
                          {emoji}
                          {n}
                        </span>
                      ))}
                      <span className="wsf-react wsf-react-plain">
                        <Icon href="#i-ui-add-reaction" width={16} height={16} />
                      </span>
                    </div>

                    <div className="wsf-hr" />

                    <Comment
                      avatarUrl={faceUrl(2)}
                      name={voice.comments[0].name}
                      text={voice.comments[0].text}
                      likes={0}
                      liked={false}
                    />
                    <div style={{ height: 16 }} />
                    <Comment
                      avatarUrl={faceUrl(1)}
                      name={voice.comments[1].name}
                      text={voice.comments[1].text}
                      likes={2}
                      liked
                    />

                    <div className="wsf-viewall">View all 18 comments</div>

                    <div className="wsf-newcomment">
                      <img className="wsf-av" src={person.avatarUrl} style={person.avatarFit} alt="" />
                      <span className="wsf-newcomment-field">
                        Leave a comment...
                        <span className="wsf-newcomment-acts">
                          <Icon href="#i-ui-add-image" width={22} height={22} />
                          <span className="wsf-gif">GIF</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------- right */}
                <div className="wsf-right">
                  {/* Card 1: Featured News */}
                  <div className="wsf-card wsf-featured-news-card">
                    <div className="wsf-featured-news-header">
                      <span className="wsf-featured-news-title">
                        <Icon href="#i-ui-featured-news" width={16} height={16} />
                        Featured News
                      </span>
                      <a href="#all" className="wsf-view-all">View All</a>
                    </div>
                    <div className="wsf-featured-news-img-wrap">
                      <img
                        data-vc-slot="voice.featured.0"
                        src={image(
                          "voice.featured.0",
                          staticFile("img/workvivo/right_col_featured.png"),
                        )}
                        alt="Featured News"
                        className="wsf-featured-news-img"
                      />
                    </div>
                    <div className="wsf-featured-news-body">
                      <div className="wsf-featured-headline">
                        {voice.featured.headline}
                      </div>
                      <div className="wsf-featured-meta">
                        {voice.featured.author} &middot; 3 days ago &middot; New Hires
                      </div>
                      <div className="wsf-carousel-dots">
                        <span className="wsf-dot-active" />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Upcoming Events */}
                  <div className="wsf-card wsf-events-card">
                    <div className="wsf-events-img-wrap">
                      <img
                        data-vc-slot="voice.event.0"
                        src={image(
                          "voice.event.0",
                          staticFile("img/workvivo/right_col_events.png"),
                        )}
                        alt="Upcoming Events"
                        className="wsf-events-img"
                      />
                    </div>
                    <div className="wsf-events-body">
                      <div className="wsf-events-eyebrow">UPCOMING EVENTS</div>
                      <div className="wsf-event">
                        <div className="wsf-event-date">
                          <div className="wsf-event-mon">JUN</div>
                          <div className="wsf-event-day">19</div>
                        </div>
                        <div>
                          <div className="wsf-event-title">{voice.event.title}</div>
                          <div className="wsf-event-facts">
                            <span className="wsf-event-fact">
                              <Icon href="#i-ui-event-location" width={14} height={14} />
                              {voice.event.location}
                            </span>
                            <span className="wsf-event-fact">
                              <Icon href="#i-ui-event-time" width={14} height={14} />
                              10:00 - 16:30
                            </span>
                            <span className="wsf-event-fact">
                              <Icon href="#i-ui-everyone" width={14} height={14} />
                              Global
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

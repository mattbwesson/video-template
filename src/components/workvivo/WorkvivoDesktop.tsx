import React from 'react';
import { InlineSvg } from "../InlineSvg";
import { SymbolSvg } from "./symbolRegistry";
import { staticFile } from 'remotion';
import './WorkvivoDesktopStyles.css';
import './WorkvivoGlassEdge.css';
import { WorkvivoSvgDefs } from './WorkvivoIcons';
import {
  REACTION_GLYPH,
  WorkvivoFloatingReactions,
  useReactionCounts,
} from './WorkvivoFloatingReactions';
import { useCustomization } from '../../customize/CustomizationProvider';
import { SlotIcon } from '../../customize/SlotIcon';

/**
 * Framing for the stock people portraits. They are 476x644 with the face in the upper third,
 * so a plain `cover` crop into a circle centres on the chest and cuts the head off — the same
 * problem `avatarStyleFor` in customize/CustomizationProvider.tsx solves for the signed-in
 * persona's headshot. Pulling the frame up to 15% seats the face in the circle.
 */
const PERSON_AVATAR_FIT: React.CSSProperties = {
  objectFit: 'cover',
  objectPosition: '50% 15%',
  display: 'block',
};

export interface WorkvivoDesktopProps {
  scrollTop?: number;
  showComposedPost?: boolean;
  /** Frame the reaction burst starts, in this component's frame-space. null = no burst,
   *  so the post sits at its resting counts. */
  reactionsStart?: number | null;
}

/**
 * Draw the shout-out body with the recipient's name picked out in Workvivo purple.
 *
 * The name is a separate copy slot AND appears inside the body, because the UI highlights
 * it. Splitting on the name rather than storing the body pre-split means a rewritten post
 * still highlights correctly — and when the model writes a body that does not contain the
 * name it said it was thanking, the text simply renders unhighlighted instead of throwing.
 */
const highlightRecipient = (body: string, name: string): React.ReactNode => {
  const at = name ? body.indexOf(name) : -1;
  if (at < 0) return body;
  return (
    <>
      {body.slice(0, at)}
      <b style={{ color: '#6103ED' }}>{name}</b>
      {body.slice(at + name.length)}
    </>
  );
};

/**
 * Set the document's title on its cover: two lines, with the tail in bold.
 *
 * The baseline had this hand-lettered as `The Complete Guide<br />to our <span>HR
 * System</span>` — the break and the bold run both chosen by eye for those six words. A
 * title the model writes has a different length and different words, so both have to be
 * derived. The break goes as near the middle as a word boundary allows, and the last two
 * words take the bold, which is the same shape the approved cover has.
 *
 * Short titles (three words or fewer) stay on one line: breaking "Our Travel Policy"
 * across two lines to satisfy a rule looks like a bug rather than a design.
 */
const documentCover = (title: string): React.ReactNode => {
  const words = title.trim().split(/\s+/);
  if (words.length < 4) return <b>{title}</b>;

  // The break lands where the first line is closest to half the characters.
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length - 1; i++) {
    const head = words.slice(0, i).join(" ").length;
    const gap = Math.abs(head - (title.length - head));
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  const line1 = words.slice(0, best).join(" ");
  const rest = words.slice(best);
  const lead = rest.slice(0, -2).join(" ");
  const tail = rest.slice(-2).join(" ");
  return (
    <b>
      {line1}
      <br />
      {lead ? `${lead} ` : ""}
      <span>{tail}</span>
    </b>
  );
};

export const WorkvivoDesktop: React.FC<WorkvivoDesktopProps> = ({
  scrollTop = 0,
  showComposedPost = false,
  reactionsStart = null,
}) => {
  const reactions = useReactionCounts(reactionsStart);
  const { person, logo, copy, image, header } = useCustomization();
  const hdr = header('app.hero');
  // Same content as the homepage, so it reads the same slots — a headline that
  // changed here but not there would look like the app had lost track of its feed.
  const { news, spaces, pages, billboards, appPost, surveys } = copy.feed;

  return (
    // .wvd-app clips with overflow:hidden, which would cut away rings drawn outside it, so the
    // glass edge goes on this non-clipping wrapper instead. It matches the app's box exactly,
    // so it is invisible to anything positioning this component.
    <div className="wvd-frame wv-glass-edge">
    <div className="wvd-app">
      <WorkvivoSvgDefs />

      {/* Top bar */}
      <div className="wvd-top">
        <img className="wvd-mark" src={logo.onDark} alt={copy.companyName} />
        <div className="wvd-tsearch">
          <SymbolSvg width="17" height="17" href="#i-ui-explore" />
          <span>Search</span>
        </div>
        <div className="wvd-tacts">
          <SymbolSvg width="21" height="21" href="#i-ui-notifications" />
          <InlineSvg src={staticFile("img/more.svg")} width="18" height="18" alt="" style={{ display: "block" }} />
          <img className="wvd-tav" src={person.avatarUrl} style={person.avatarFit} alt="" />
        </div>
      </div>

      {/* Shell */}
      <div className="wvd-shell">
        {/* Left rail */}
        <aside className="wvd-rail">
          <span className="wvd-collapse">|←</span>
          <div className="wvd-me">
            <img className="wvd-meav" src={person.avatarUrl} style={person.avatarFit} alt="" />
            <div>
              <b>{person.name}</b>
              <span>{person.title}</span>
            </div>
          </div>
          <nav className="wvd-grp">
            <a className="wvd-nav wvd-on"><SymbolSvg width="16" height="16" href="#i-ui-home-nav-rail" /><span>Home</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-my-company" /><span>My Company</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-resources" /><span>Communications</span></a>
            <a className="wvd-nav">
              <SymbolSvg width="16" height="16" href="#i-ui-chat" />
              <span>Chat</span>
              <span className="wvd-astack">
                <img data-vc-slot="app.face.0" className="wvd-av" src={image("app.face.0", staticFile("img/avatar-3.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.1" className="wvd-av" src={image("app.face.1", staticFile("img/avatar-1.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              </span>
            </a>
            <a className="wvd-nav">
              <SymbolSvg width="16" height="16" href="#i-ui-spaces" />
              <span>Spaces</span>
              <span className="wvd-astack">
                <img data-vc-slot="app.face.2" className="wvd-av" src={image("app.face.2", staticFile("img/avatar-4.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.3" className="wvd-av" src={image("app.face.3", staticFile("img/avatar-5.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.4" className="wvd-av" src={image("app.face.4", staticFile("img/avatar-6.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              </span>
            </a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-employee-insights" /><span>Seer</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-admin" /><span>Admin</span></a>
          </nav>
          <div className="wvd-secl">EXPLORE</div>
          <nav className="wvd-grp">
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-news" /><span>News</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-events-nav-rail" /><span>Events</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-pages" /><span>Pages</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-podcasts" /><span>Podcasts</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-surveys-and-forms" /><span>Survey & Forms</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-newsletters" /><span>Newsletters</span></a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-journeys" /><span>Journeys</span></a>
          </nav>
          <div className="wvd-secl">CONNECT</div>
          <nav className="wvd-grp">
            <a className="wvd-nav">
              <SymbolSvg width="16" height="16" href="#i-ui-connect" />
              <span>People</span>
              <span className="wvd-astack">
                <img data-vc-slot="app.face.5" className="wvd-av" src={image("app.face.5", staticFile("img/avatar-1.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.6" className="wvd-av" src={image("app.face.6", staticFile("img/avatar-3.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.7" className="wvd-av" src={image("app.face.7", staticFile("img/avatar-4.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              </span>
            </a>
            <a className="wvd-nav">
              <SymbolSvg width="16" height="16" href="#i-ui-teams" />
              <span>Teams</span>
              <span className="wvd-astack">
                <img data-vc-slot="app.face.8" className="wvd-av" src={image("app.face.8", staticFile("img/avatar-5.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
                <img data-vc-slot="app.face.9" className="wvd-av" src={image("app.face.9", staticFile("img/avatar-6.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              </span>
            </a>
            <a className="wvd-nav"><SymbolSvg width="16" height="16" href="#i-ui-org-chart" /><span>Org Chart</span></a>
          </nav>
          <div className="wvd-secl">RESOURCES</div>
          <div className="wvd-res">
            <div><SymbolSvg width="18" height="18" href="#i-ui-apps-widget" />Apps</div>
            <div><SymbolSvg width="18" height="18" href="#i-ui-documents-nav" />Docs</div>
            <div><SymbolSvg width="18" height="18" href="#i-ui-gallery" />Gallery</div>
          </div>
          <div className="wvd-secl" style={{ marginTop: 22 }}>INTEGRATIONS</div>
          <div className="wvd-integ"><SymbolSvg width="20" height="20" href="#i-vendor-google-drive" />Google Drive</div>
        </aside>

        {/* Main scrollable area */}
        <div className="wvd-main">
          <div style={{ transform: 'translateY(-' + scrollTop + 'px)', willChange: 'transform' }}>
            {/* The banner across the top of the screen: a cover photo under a
                brand-coloured wash, matching the phone's header. The dot pattern and the
                company mark stay exactly where they were and keep painting over both —
                see the z-index ladder in WorkvivoDesktopStyles.css. */}
            <div className="wvd-hero" style={hdr.style}>
              {/* A real <img>, not a background — the in-browser export drops CSS
                  background photos (see web/renderProbe.tsx). The same office shot the
                  phone's header falls back to, deliberately: one company, one header
                  photo, on both devices. A customer run deals the two positions different
                  uploads, so the pairing only holds for the baseline demo — where it is
                  the truthful thing to show. */}
              <img
                data-vc-slot="app.hero.0"
                className="wvd-heroimg"
                src={image("app.hero.0", staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"))}
                style={{ objectFit: "cover" }}
                alt=""
              />
              <span className="wvd-herowash" />
              {hdr.showLogo && (
                <img className="wvd-heroM" src={logo.onDark} alt={copy.companyName} />
              )}
            </div>

            <div className="wvd-cols">
              {/* Left column */}
              <div>
                <section className="wvd-card">
                  <div className="wvd-chead">
                    <div className="wvd-ch"><SymbolSvg width="17" height="17" href="#i-ui-featured-news" /><span>Featured News</span></div>
                    <span className="wvd-viewall">View All</span>
                  </div>
                  <div className="wvd-body">
                    <img data-vc-slot="app.news.0"
                      className="wvd-shot"
                      src={image("app.news.0", staticFile("fillers/960x0.jpg"))}
                      alt=""
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-ttl">{news[1].title}</div>
                    <div className="wvd-meta">Megan Wilson · 3 days ago · <SymbolSvg width="13" height="13" href="#i-ui-spaces" /><span>New Hires</span></div>
                  </div>
                  <div className="wvd-dots"><i className="wvd-on" /><i /><i /></div>
                </section>

                <section className="wvd-card">
                  <div className="wvd-chead">
                    <div className="wvd-ch"><SymbolSvg width="17" height="17" href="#i-ui-spaces" /><span>Trending Spaces</span></div>
                    <span className="wvd-viewall">View All</span>
                  </div>
                  <div className="wvd-body">
                    <span data-vc-slot="app.space.0" className="wvd-tphoto">
                      <img
                        src={image("app.space.0", staticFile("fillers/images (3).jpeg"))}
                        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                        alt=""
                      />
                      <span className="wvd-tpill">Corporate</span>
                      <span className="wvd-tstar"><SymbolSvg width="18" height="18" href="#i-ui-favorite-star" /></span>
                      <span className="wvd-welcome">Welcome</span>
                    </span>
                    <div className="wvd-tb">
                      <span className="wvd-tbadge">
                        <SlotIcon slot="space.badge.4" size={26}>
                          <SymbolSvg width="26" height="26" href="#i-ui-networking" />
                        </SlotIcon>
                      </span>
                      <span className="wvd-joined">✓ Joined</span>
                      <div className="wvd-tname">{spaces[0].name}</div>
                      <div className="wvd-tmem">1,338 Members</div>
                      <div className="wvd-tdesc">{spaces[0].description}</div>
                    </div>
                  </div>
                  <div className="wvd-dots"><i className="wvd-on" /><i /><i /></div>
                </section>

                <section className="wvd-card">
                  <div className="wvd-chead">
                    <div className="wvd-ch"><SymbolSvg width="16" height="16" href="#i-ui-pages-older-capture" /><span>Featured Pages</span></div>
                    <span className="wvd-viewall">View All</span>
                  </div>
                  <div className="wvd-body">
                    <img data-vc-slot="app.page.0"
                      className="wvd-shot"
                      src={image("app.page.0", staticFile("fillers/images (1).jpeg"))}
                      alt=""
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-ttl">{pages[0].title}</div>
                    <div className="wvd-meta">1 day ago · <SymbolSvg width="13" height="13" href="#i-ui-spaces" /><span>IT</span></div>
                    <div className="wvd-rule" />
                    <img data-vc-slot="app.page.1"
                      className="wvd-shot"
                      src={image("app.page.1", staticFile("fillers/images (2).jpeg"))}
                      alt=""
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-ttl">{pages[1].title}</div>
                    <div className="wvd-meta">2 days ago · <SymbolSvg width="13" height="13" href="#i-ui-spaces" /><span>Connect</span></div>
                  </div>
                </section>
              </div>

              {/* Centre column */}
              <div>
                <section className="wvd-card">
                  <div className="wvd-chead">
                    <div className="wvd-hq"><span className="wvd-hqb">HQ</span><span>agent</span></div>
                    <span className="wvd-viewall">Expand</span>
                  </div>
                  <div className="wvd-compose">Write a message
                    <span className="wvd-sendb"><SymbolSvg width="16" height="16" href="#i-ui-send" /></span>
                  </div>
                  <div className="wvd-qacts">
                    <div className="wvd-qact"><SymbolSvg width="15" height="15" href="#i-ui-start-new-chat" />Start New Chat</div>
                    <div className="wvd-qact"><SymbolSvg width="15" height="15" href="#i-ui-summarise-content" />Summarise Content</div>
                    <div className="wvd-qact"><SymbolSvg width="15" height="15" href="#i-ui-teams" />Team Updates</div>
                  </div>
                </section>

                {showComposedPost ? (
                  <section className="wvd-card">
                    <div className="wvd-prow">
                      <img data-vc-slot="app.face.10"
                        className="wvd-pav"
                        src={image("app.face.10", staticFile("img/avatar-1.jpeg"))}
                        style={PERSON_AVATAR_FIT}
                        alt=""
                      />
                      <div>
                        <div className="wvd-pby"><b>{person.name}</b> posted a document.</div>
                        <div className="wvd-pmeta">
                          1 Sec ago &nbsp;·&nbsp; <SymbolSvg width="13" height="13" href="#i-ui-everyone" />
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          Value: {copy.composed.value}
                        </div>
                      </div>
                      <div className="wvd-kebab" style={{ color: '#6103ED' }}>···</div>
                    </div>

                    <div className="wvd-ptext" style={{ fontSize: 15, lineHeight: '23px', color: '#111827' }}>
                      {highlightRecipient(copy.composed.body, copy.composed.recipient)}
                    </div>

                    <div style={{ padding: '0 16px', position: 'relative' }}>
                      <img data-vc-slot="app.post.0"
                        src={image("app.post.0", staticFile("img/workvivo/hero_banner.png"))}
                        alt=""
                        style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                      />
                      <WorkvivoFloatingReactions startFrame={reactionsStart} />
                    </div>

                    <div className="wvd-pfoot" style={{ marginTop: 14, borderTop: '1px solid #F3F4F6' }}>
                      <span style={{ color: '#6103ED' }}>{reactions.total} reactions</span>
                      <span className="wvd-dot">·</span>
                      <span style={{ color: '#6103ED' }}>10 comments</span>
                      <span className="wvd-share" style={{ color: '#6103ED' }}>
                        <svg width="15" height="15" style={{ transform: 'rotate(-45deg)', fill: 'currentColor' }}>
                          <path d="M2.5 12.5L12.5 2.5M12.5 2.5H5M12.5 2.5V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Share
                      </span>
                    </div>

                    <div className="wvd-reacts" style={{ padding: '0 16px 16px' }}>
                      {(['heart', 'thumb', 'clap'] as const).map((kind) => (
                        <span
                          key={kind}
                          className="wvd-rx"
                          style={{
                            borderColor: '#DFC9FB',
                            background: '#F5EDFF',
                            color: '#6103ED',
                            transform: `scale(${reactions.pop[kind]})`,
                          }}
                        >
                          <span className="wvd-e">{REACTION_GLYPH[kind]}</span> {reactions.counts[kind]}
                        </span>
                      ))}
                      <span className="wvd-rxadd">
                        <SymbolSvg width="17" height="17" href="#i-ui-emoji-reaction" />
                      </span>
                    </div>
                  </section>
                ) : (
                  <section className="wvd-card">
                    <div className="wvd-prow">
                      <img data-vc-slot="app.face.11" className="wvd-pav" src={image("app.face.11", staticFile("img/avatar-3.jpeg"))} style={PERSON_AVATAR_FIT} alt="" />
                      <div>
                        <div className="wvd-pby"><b>{appPost.document.author}</b> posted a document.</div>
                        <div className="wvd-pmeta">1 day ago &nbsp;·&nbsp; <SymbolSvg width="13" height="13" href="#i-ui-everyone" /></div>
                        <div className="wvd-pspace"><SymbolSvg width="13" height="13" href="#i-ui-spaces" />{appPost.document.space}</div>
                      </div>
                      <div className="wvd-kebab">···</div>
                    </div>
                    <div className="wvd-ptext">{appPost.document.body}</div>
                    <div className="wvd-pdoc">
                      <div className="wvd-img">{documentCover(appPost.document.title)}</div>
                      <div className="wvd-cap">{appPost.document.title}</div>
                    </div>
                    <div className="wvd-att">
                      <div className="wvd-lbl">Attachments(1)</div>
                      <div className="wvd-attrow"><InlineSvg src={staticFile("img/file-pdf.svg")} style={{ width: 28, height: 33, objectFit: "contain", flex: "none" }} alt="" />PDF document<span className="wvd-kb">756 KB</span></div>
                    </div>
                    <div className="wvd-pfoot">
                      <span>42 reactions</span><span className="wvd-dot">·</span><span>12 comments</span>
                      <span className="wvd-share"><span className="wvd-sharrow"><i /><i /></span>Share</span>
                    </div>
                    <div className="wvd-reacts">
                      <span className="wvd-rx"><span className="wvd-e">❤️</span>22</span>
                      <span className="wvd-rx wvd-on"><span className="wvd-e">👍</span>20</span>
                      <span className="wvd-rx"><span className="wvd-e">👏</span>10</span>
                      <span className="wvd-rxadd"><SymbolSvg width="17" height="17" href="#i-ui-emoji-reaction" /></span>
                    </div>
                    <div className="wvd-allc">View all 12 comments</div>
                    <div className="wvd-cbox">
                      <img data-vc-slot="app.face.12" className="wvd-cav" src={image("app.face.12", staticFile("img/avatar-4.jpeg"))} style={PERSON_AVATAR_FIT} alt="" />
                      <div className="wvd-cin">Leave a comment…
                        <span className="wvd-tools">
                          <SymbolSvg width="18" height="18" href="#i-ui-add-image" />
                          <SymbolSvg width="18" height="18" href="#i-ui-add-gif" />
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                <section className="wvd-card">
                  <div className="wvd-prow">
                    <img data-vc-slot="app.face.13" className="wvd-pav" src={image("app.face.13", staticFile("img/avatar-5.jpeg"))} style={PERSON_AVATAR_FIT} alt="" />
                    <div>
                      <div className="wvd-pby"><b>{appPost.anniversary.author}</b> is celebrating a work anniversary.</div>
                      <div className="wvd-pmeta">2 days ago &nbsp;·&nbsp; <SymbolSvg width="13" height="13" href="#i-ui-everyone" /></div>
                    </div>
                    <div className="wvd-kebab">···</div>
                  </div>
                  <div className="wvd-ptext">{appPost.anniversary.body}</div>
                  <div className="wvd-pfoot">
                    <span>18 reactions</span><span className="wvd-dot">·</span><span>4 comments</span>
                    <span className="wvd-share"><span className="wvd-sharrow"><i /><i /></span>Share</span>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div>
                <section className="wvd-bb">
                  <div data-vc-slot="app.billboard.0" className="wvd-bbimg">
                    <img
                      src={image("app.billboard.0", staticFile("fillers/spotify-for-artists-in-focus-logo-billboard-pro-1260.webp"))}
                      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      alt=""
                    />
                    <div className="wvd-bpill"><SymbolSvg width="15" height="15" href="#i-ui-news" /><span>Billboards</span></div>
                  </div>
                  <div className="wvd-bbtx">
                    <h3>{billboards[1].title}</h3>
                    <div className="wvd-m">Published 1 day ago · <SymbolSvg width="12" height="12" href="#i-ui-everyone" /><span>Global</span></div>
                    <p>{billboards[1].blurb}</p>
                  </div>
                  <div className="wvd-dots" style={{ paddingBottom: 12 }}><i className="wvd-on" /><i /><i /></div>
                </section>

                <section className="wvd-card">
                  <div className="wvd-chead">
                    <div className="wvd-ch"><SymbolSvg width="16" height="16" href="#i-ui-surveys-and-forms-older-capture" /><span>Surveys &amp; Forms</span></div>
                  </div>
                  <div className="wvd-srv">
                    <img data-vc-slot="app.survey.0"
                      className="wvd-srvimg"
                      src={image("app.survey.0", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"))}
                      alt=""
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-srvt">{surveys[0].title}</div>
                    <div className="wvd-srvm">8 Minutes, 12 Questions, Anonymous</div>
                    <div className="wvd-btn">Start Survey</div>
                    <div className="wvd-rule" />
                    <img data-vc-slot="app.survey.1"
                      className="wvd-srvimg"
                      src={image("app.survey.1", staticFile("fillers/images (4).jpeg"))}
                      alt=""
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-srvt">{surveys[1].title}</div>
                    <div className="wvd-srvm">3 Minutes, 5 Questions, Anonymous</div>
                    <div className="wvd-btn">Start Survey</div>
                    <div className="wvd-rule" />
                    <img data-vc-slot="app.survey.2"
                      className="wvd-srvimg"
                      src={image("app.survey.2", staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"))}
                      alt=""
                      style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div className="wvd-srvt">{surveys[2].title}</div>
                    <div className="wvd-srvm">2 Minutes, 4 Questions, Anonymous</div>
                    <div className="wvd-btn">Start Survey</div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
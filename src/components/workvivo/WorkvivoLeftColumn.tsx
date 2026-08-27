import React from "react";
import { Img, staticFile } from "remotion";
import { Icon } from "./WorkvivoIcons";
import type { SwapProgress } from "./WorkvivoHomeContainer";
import { useCustomization } from "../../customize/CustomizationProvider";
import { SlotIcon } from "../../customize/SlotIcon";
import { DocumentFolderIcon } from "./WorkvivoFolderIcon";
import { InlineSvg } from "../InlineSvg";

/**
 * What kind of thing each Featured Documents row is, and therefore which glyph it draws.
 *
 * Fixed per position, not derived from the name: the reference's shelf is folder / PDF /
 * folder / SVG, and sniffing a file extension to pick an icon would let a researched name
 * silently change the layout of a card that is on screen for less than a second. The copy
 * table's guide is what keeps the names agreeing with these.
 */
const DOCUMENT_KINDS = ["folder", "pdf", "folder", "svg"] as const;

const FILE_GLYPH: Record<"pdf" | "svg", string> = {
  pdf: "img/file-pdf.svg",
  svg: "img/file-svg.svg",
};

interface WorkvivoLeftColumnProps {
  swap: SwapProgress;
}

export const WorkvivoLeftColumn: React.FC<WorkvivoLeftColumnProps> = ({ swap }) => {
  const { image, copy } = useCustomization();
  const { news, spaces, pages, posts, event, documents } = copy.feed;
  // Featured leads — it ends up on top, so the column reads as that card rising into the
  // lead slot and Trending dropping in behind it.
  const featuredOffsetY = 405.71 * (1 - swap.lead);
  const trendingOffsetY = -405.71 * (1 - swap.follow);

  return (
    <div className="colL">
      <section
        className="card"
        id="featured"
        style={{
          transform: `translateY(${featuredOffsetY}px)`,
          willChange: "transform",
        }}
      >
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-featured-news" className="li invert" width="20.00" height="20.00" />
            <span>Featured News</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="ngrid">
          <div className="ncard">
            <img data-vc-slot="home.news.0" className="nimg" src={image("home.news.0", staticFile("fillers/960x0.jpg"))} alt="" />
            <div className="nbody">
              <div className="ntitle">{news[0].title}</div>
              <div className="nmeta">
                Jacob Johnson &middot; 1 day ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>Global</span>
              </div>
            </div>
          </div>
          <div className="ncard">
            <img data-vc-slot="home.news.1" className="nimg" src={image("home.news.1", staticFile("fillers/images (1).jpeg"))} alt="" />
            <div className="nbody">
              <div className="ntitle">{news[1].title}</div>
              <div className="nmeta">
                Megan Wilson &middot; 3 days ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>New Hires</span>
              </div>
            </div>
          </div>
          <div className="ncard">
            <img data-vc-slot="home.news.2" className="nimg" src={image("home.news.2", staticFile("fillers/images (2).jpeg"))} alt="" />
            <div className="nbody">
              <div className="ntitle">{news[2].title}</div>
              <div className="nmeta">
                Cody Brown &middot; 1 week ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>Connect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="card"
        id="trending"
        style={{
          transform: `translateY(${trendingOffsetY}px)`,
          willChange: "transform",
        }}
      >
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-spaces" className="li dark" width="17.14" height="17.14" />
            <span>Trending Spaces</span>
            <span className="astack">
              <img data-vc-slot="home.member.0" className="av" src={image("home.member.0", staticFile("img/avatar-1.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              <img data-vc-slot="home.member.1" className="av" src={image("home.member.1", staticFile("img/avatar-3.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              <img data-vc-slot="home.member.2" className="av" src={image("home.member.2", staticFile("img/avatar-4.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              <img data-vc-slot="home.member.3" className="av" src={image("home.member.3", staticFile("img/avatar-5.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
              <img data-vc-slot="home.member.4" className="av" src={image("home.member.4", staticFile("img/avatar-6.jpeg"))} style={{ objectFit: "cover", display: "block" }} alt="" />
            </span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="tgrid">
          <div className="tcard">
            <div data-vc-slot="home.space.0" className="tphoto">
              <img
                src={image("home.space.0", staticFile("fillers/images (3).jpeg"))}
                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                alt=""
              />
              <span className="tpill">Corporate</span>
              <div className="tstar">
                <Icon href="#i-ui-favorite-star" width="20" height="20" />
              </div>
            </div>
            <div className="tbody">
              <div className="tbadge">
                <SlotIcon slot="space.badge.0" size={31.43}>
                  <Icon href="#i-ui-networking" width="31.43" height="31.43" />
                </SlotIcon>
              </div>
              <div className="joined">
                <span className="jck">&#10003;</span>Joined
              </div>
              <div className="ttitle">{spaces[0].name}</div>
              <div className="tmem">1,338 Members</div>
              <div className="tdesc">{spaces[0].description}</div>
            </div>
          </div>
          <div className="tcard">
            <div data-vc-slot="home.space.1" className="tphoto">
              <img
                src={image("home.space.1", staticFile("fillers/images (4).jpeg"))}
                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                alt=""
              />
              <span className="tpill">Corporate</span>
              <div className="tstar">
                <Icon href="#i-ui-favorite-star" width="20" height="20" />
              </div>
            </div>
            <div className="tbody">
              <div className="tbadge">
                <SlotIcon slot="space.badge.1" size={31.43}>
                  <Icon href="#i-ui-ai-innovation" width="31.43" height="31.43" />
                </SlotIcon>
              </div>
              <div className="joined">
                <span className="jck">&#10003;</span>Joined
              </div>
              <div className="ttitle">{spaces[1].name}</div>
              <div className="tmem">11,034 Members</div>
              <div className="tdesc">{spaces[1].description}</div>
            </div>
          </div>
          <div className="tcard">
            <div data-vc-slot="home.space.2" className="tphoto">
              <img
                src={image("home.space.2", staticFile("fillers/960x0.jpg"))}
                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                alt=""
              />
              <span className="tpill">Corporate</span>
              <div className="tstar">
                <Icon href="#i-ui-favorite-star" width="20" height="20" />
              </div>
            </div>
            <div className="tbody">
              <div className="tbadge">
                <SlotIcon slot="space.badge.2" size={31.43}>
                  <Icon href="#i-ui-charity" width="31.43" height="31.43" />
                </SlotIcon>
              </div>
              <div className="joined">
                <span className="jck">&#10003;</span>Joined
              </div>
              <div className="ttitle">{spaces[2].name}</div>
              <div className="tmem">5,768 Members</div>
              <div className="tdesc">{spaces[2].description}</div>
            </div>
          </div>
        </div>
        <div className="dots">
          <i className="on" />
          <i />
          <i />
        </div>
      </section>

      <section className="card" id="countdown">
        <img
          data-vc-slot="home.event.0"
          className="cdimg"
          src={image("home.event.0", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"))}
          style={{ objectFit: "cover" }}
          alt=""
        />
        <div className="cdside">
          <div className="cdname">{event.countdownName}</div>
          <div className="cdtime">22 : 02 : 17</div>
          <div className="cdlbls">
            <span>Days</span>
            <span>Hours</span>
            <span>Minutes</span>
          </div>
          <div className="cdbtn">View More</div>
        </div>
      </section>

      <section className="card" id="docs" data-vc-slot="feed.documents">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-featured-documents" className="li dark" width="18.57" height="18.57" />
            <span>Featured Documents</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="dgrid">
          {DOCUMENT_KINDS.map((kind, i) => (
            <div className="drow" key={documents[i].name}>
              {kind === "folder" ? (
                <DocumentFolderIcon />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {/* Inline, not <Img src="…svg">. Both glyphs carry their paint in a
                      <defs><style> block and neither declares width/height, which is the
                      pair the export's rasterizer cannot handle — they came out as solid
                      untrimmed blobs of the body colour with the fold and the lettering
                      missing. InlineSvg rewrites the class fills to presentation
                      attributes and hands the exporter real <svg> children. */}
                  <InlineSvg
                    src={staticFile(FILE_GLYPH[kind])}
                    width={28}
                    height={33}
                  />
                </div>
              )}
              <span>{documents[i].name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" id="pages">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-pages-older-capture" className="li dark" width="16.00" height="16.00" />
            <span>Featured Pages</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="mgrid">
          <div className="mcard">
            <img data-vc-slot="home.page.0" src={image("home.page.0", staticFile("fillers/images (1).jpeg"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{pages[0].title}</div>
              <div className="mmeta">
                1 day ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>IT</span>
              </div>
            </div>
          </div>
          <div className="mcard">
            <img data-vc-slot="home.page.1" src={image("home.page.1", staticFile("fillers/images (2).jpeg"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{pages[1].title}</div>
              <div className="mmeta">
                2 days ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>Connect</span>
              </div>
            </div>
          </div>
          <div className="mcard">
            <img data-vc-slot="home.page.2" src={image("home.page.2", staticFile("fillers/images (3).jpeg"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{pages[2].title}</div>
              <div className="mmeta">
                4 days ago &middot;{" "}
                <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
                <span>Connect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card" id="lposts">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-posts" className="li dark" width="17.14" height="17.14" />
            <span>Posts</span>
          </div>
          <a className="viewall">View More</a>
        </div>
        <div className="mgrid">
          <div className="mcard">
            <img data-vc-slot="home.post.0" src={image("home.post.0", staticFile("fillers/images (4).jpeg"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{posts[0].title}</div>
              <div className="mmeta">Sonya Clarke &middot; 1 day ago</div>
            </div>
          </div>
          <div className="mcard">
            <img data-vc-slot="home.post.1" src={image("home.post.1", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{posts[1].title}</div>
              <div className="mmeta">Sarah Black &middot; 2 days ago</div>
            </div>
          </div>
          <div className="mcard">
            <img data-vc-slot="home.post.2" src={image("home.post.2", staticFile("fillers/spotify.Bloomberg.11.27.17.jpg"))} alt="" />
            <div className="mbody">
              <div className="mtitle">{posts[2].title}</div>
              <div className="mmeta">John Tobin &middot; 2 days ago</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card survey" id="surveys">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-surveys-and-forms" className="li dark" width="16.00" height="16.00" />
            <span>Surveys &amp; Forms</span>
          </div>
          <a className="viewall"></a>
        </div>
        <img data-vc-slot="home.survey.0" src={image("home.survey.0", staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"))} alt="" />
      </section>
    </div>
  );
};

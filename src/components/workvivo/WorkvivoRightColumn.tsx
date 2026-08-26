import React from "react";
import { staticFile } from "remotion";
import { Icon } from "./WorkvivoIcons";
import type { SwapProgress } from "./WorkvivoHomeContainer";
import { useCustomization } from "../../customize/CustomizationProvider";
import { SlotIcon } from "../../customize/SlotIcon";
import type { WorkvivoCopy } from "../../customize/videoCopy";

/**
 * Artwork for each weather condition — exhaustive over the enum, so there is no member
 * without a glyph and no glyph reachable by a value the enum does not contain.
 *
 * Files rather than the sprite: only `i-weather-rain` was ever captured into
 * WorkvivoIcons, and public/img/weather carries all five. `WeatherCondition` is derived
 * from the copy table, so adding a sixth option there is a type error here until the
 * artwork is named — which is the point of the pattern.
 */
type WeatherCondition = WorkvivoCopy["feed"]["weather"]["condition"];

const WEATHER_ICON: Record<WeatherCondition, string> = {
  Sunny: "img/weather/weather-sun.svg",
  "Partly Cloudy": "img/weather/weather-partly-cloud.svg",
  Cloudy: "img/weather/weather-cloudy.svg",
  Rainy: "img/weather/weather-rain.svg",
  Snow: "img/weather/weather-snow.svg",
};

interface WorkvivoRightColumnProps {
  swap: SwapProgress;
}

export const WorkvivoRightColumn: React.FC<WorkvivoRightColumnProps> = ({ swap }) => {
  const { image, copy } = useCustomization();
  const { sidePost, event, podcast, pages, weather } = copy.feed;
  // Weather leads — it ends up on top, matching the left column's handoff direction so the
  // two columns read as the same move rather than mirrored ones.
  //
  // The two offsets are NOT mirror images, because the cards are different heights and each
  // has to clear the OTHER one to make a valid pre-swap layout:
  //   posts rises by   weather's height + gap = 185.71 + 20 = 205.71
  //   weather drops by posts' height   + gap = 396.9  + 20 = 417
  // Using 205.71 for both put weather at 205.71 while posts still occupied 0..397, so the
  // weather card sat entirely behind the posts card and was invisible until the swap began.
  const WEATHER_DROP = 417;
  const POSTS_RISE = 205.71;
  const weatherOffsetY = WEATHER_DROP * (1 - swap.lead);
  const postsOffsetY = -POSTS_RISE * (1 - swap.follow);

  return (
    <div className="colR">
      <div
        className="weather"
        style={{
          transform: `translateY(${weatherOffsetY}px)`,
          willChange: "transform",
        }}
      >
        <div className="wleft">
          {/* The degree signs and the H/L prefixes are drawn here, not stored in the
              slots — the numbers arrive bare so a stray symbol cannot wrap the card. */}
          <div className="wtemp">
            {weather.temperature}
            <sup>&deg;</sup>
          </div>
          <div className="wcity">{weather.city}</div>
        </div>
        <div className="wright">
          <div className="wcond">
            <img
              className="gi"
              src={staticFile(WEATHER_ICON[weather.condition])}
              width="25.71"
              height="25.71"
              alt=""
            />
            <span>{weather.condition}</span>
          </div>
          <div className="whl">
            <span>H {weather.high}&deg;</span>
            <span>L {weather.low}&deg;</span>
          </div>
        </div>
        <div className="wdots">
          <i className="on" />
          <i />
          <i />
        </div>
      </div>

      <section
        className="card"
        id="posts"
        style={{
          transform: `translateY(${postsOffsetY}px)`,
          willChange: "transform",
        }}
      >
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-posts" className="li dark" width="17.14" height="17.14" />
            <span>Posts</span>
          </div>
          <a className="viewall">View More</a>
        </div>
        <img data-vc-slot="side.post.0" className="pimg" src={image("side.post.0", staticFile("fillers/spotify.Bloomberg.11.27.17.jpg"))} alt="" />
        <div className="pbody">
          <div className="prow">
            <img data-vc-slot="side.face.0"
              className="pav"
              src={image("side.face.0", staticFile("img/avatar-4.jpeg"))}
              width="40.00"
              height="40.00"
              alt=""
            />
            <div>
              <div className="pby">
                <a>Arjun Sharma</a> <b>posted an article</b>
              </div>
              <div className="pago">1 day ago</div>
            </div>
          </div>
          <div className="ptitle">{sidePost.headline}</div>
          <div className="ptext">
            {sidePost.body}
          </div>
        </div>
        <div className="pfoot">
          <span>27 Comments</span>
          <div className="reacts">
            <div className="rx">
              <span className="rxe">&#127881;&#65039;</span>
              <span className="rxn">10</span>
            </div>
            <div className="rx">
              <span className="rxe">&#128079;</span>
              <span className="rxn">5</span>
            </div>
            <div className="rx on">
              <span className="rxe">&#128640;</span>
              <span className="rxn">3</span>
            </div>
            <div className="rx addrx">
              <Icon href="#i-ui-add-reaction" width="10.31" height="10.31" />
            </div>
          </div>
        </div>
      </section>

      <section className="card" id="quick">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-featured-apps" className="li dark" width="18.57" height="18.57" />
            <span>Quick Links</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="qgrid">
          <div className="qtile">
            <Icon href="#i-vendor-workday" width="62.86" height="62.86" />
            <span>Workday</span>
          </div>
          <div className="qtile">
            <Icon
              href="#i-vendor-servicenow"
              width="62.86"
              height="62.86"
              style={{ borderRadius: "14.286px", overflow: "hidden" }}
            />
            <span>Service Now</span>
          </div>
          <div className="qtile">
            <img src={staticFile("img/zoomicon.png")} width="62.86" height="62.86" alt="" />
            <span>Zoom</span>
          </div>
        </div>
      </section>

      <section className="card" id="rspace">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-spaces" className="li dark" width="17.14" height="17.14" />
            <span>Trending Spaces</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div data-vc-slot="side.space.0" className="rsimg">
          <img
            src={image("side.space.0", staticFile("fillers/images (2).jpeg"))}
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
            alt=""
          />
          <span className="rspill">Social</span>
          <div className="rsstar">
            <Icon href="#i-ui-favorite-star" width="20" height="20" />
          </div>
        </div>
        <div className="tbody">
          <div className="tbadge">
            <SlotIcon slot="space.badge.3" size={31.43}>
              <Icon href="#i-ui-run-club" width="31.43" height="31.43" />
            </SlotIcon>
          </div>
          <div className="joined">
            <span className="jck">&#10003;</span>Joined
          </div>
          <div className="ttitle">Run Club</div>
          <div className="tmem">648 Members</div>
          <div className="tdesc">
            For runners of every level. Share routes, training tips, race updates, and celebrate milestones together.
          </div>
        </div>
        <div className="dots">
          <i className="on" />
          <i />
          <i />
        </div>
      </section>

      <section className="card" id="pod" data-vc-slot="feed.podcast">
        <div className="podhead">
          <Icon href="#i-ui-featured-podcasts-solid" width="18.57" height="18.57" />
          <span>Featured Podcast</span>
        </div>
        {/* The show's artwork used to be a swappable photo here. It is the product's own
            podcast glyph now — a white tile with the mark knocked through it in the tenant
            colour — so there is nothing left to swap and no image position for it. The
            show and episode lines are still editable; see the `feed.podcast` entry in
            editables.ts, anchored on the section above. */}
        <div className="podmic" style={{ width: 125.71, height: 125.71 }}>
          <i
            style={{
              WebkitMaskImage: `url("${staticFile("img/podcast icon.svg")}")`,
              maskImage: `url("${staticFile("img/podcast icon.svg")}")`,
            }}
          />
        </div>
        <div className="podcard">
          <div className="podshow">{podcast.show}</div>
          <div className="podep">{podcast.episode}</div>
        </div>
      </section>

      <section className="card" id="events">
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-event-date-solid" className="li dark" width="18.57" height="18.57" />
            <span>Events</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div data-vc-slot="side.event.0" className="evimg">
          <img
            src={image("side.event.0", staticFile("img/workvivo/events_banner_art.png"))}
            style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
            alt=""
          />
        </div>
        <div className="evbody">
          <div className="evtitle">{event.bannerTitle}</div>
          <div className="evline">
            <Icon href="#i-ui-events-nav-rail" className="li" width="15.71" height="17.14" />
            <span>10th July</span>
          </div>
          <div className="evline">
            <svg width="15.71" height="17.14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="li">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>14:00 - 18:00</span>
          </div>
          <div className="evline">
            <svg width="15.71" height="17.14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="li">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Headquarters &amp; Livestream</span>
          </div>
          <div className="evdesc">
            Join colleagues from across the organization for an evening of updates, recognition, networking, and....
          </div>
        </div>
      </section>

      <section className="card" id="pages-r" style={{ marginTop: "21.429px" }}>
        <div className="chead">
          <div className="ch">
            <Icon href="#i-ui-pages" className="li dark" width="16.00" height="16.00" />
            <span>Featured Pages</span>
          </div>
          <a className="viewall">View All</a>
        </div>
        <div className="mcard" style={{ margin: "4.286px" }}>
          <img data-vc-slot="side.page.0" src={image("side.page.0", staticFile("img/workvivo/pages_1.png"))} alt="" style={{ width: "100%", height: "138.571px", objectFit: "cover" }} />
          <div className="mbody">
            <div className="mtitle">{pages[0].title}</div>
            <div className="mmeta">
              1 day ago &middot;{" "}
              <Icon href="#i-ui-spaces" className="li mspace" width="15.00" height="15.00" />
              <span>IT</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

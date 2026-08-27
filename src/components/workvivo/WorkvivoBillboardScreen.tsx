import React from "react";
import { InlineSvg } from "../InlineSvg";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoBillboardScreenStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { WorkvivoCopy } from "../../customize/videoCopy";
import type { ImageSlotKey } from "../../customize/imagery";

/**
 * Workvivo Billboards — the full-screen digital-signage display.
 *
 * The two story cards are built to the supplied Figma geometry verbatim:
 *
 *   large story   1259.82 x 421.37, media well 621.05 x 415.36 inset at (2.98, 1.98),
 *                 radius 9.94 on the LEFT corners only, photo cover-cropped past the well
 *   smaller story 465.42 x 221, media well 459.44 x 150.49 inset at (2.99, 1.99),
 *                 radius 10 across the TOP, "Article" tag at (27, 23) in card space
 *
 * Those ~3px insets are the white hairline that frames each photo. The exports' oversized
 * `<img>` boxes (677.73x436.20 at -9.94,-4.97 and 525x162 at -30,0) just encode a cover
 * crop, so they are expressed as object-fit: cover rather than negative offsets.
 *
 * The screen size is derived rather than measured: the large story's 1259.82 is the
 * content width, which at the reference's margins puts the frame at 1320 x 742 (16:9).
 * The event card and the right-hand column carry no export of their own and are laid out
 * from the reference screenshot, reusing the smaller story's frame.
 *
 * The QR block draws public/img/QR-code.png. It was a hand-drawn three-square pattern
 * for a while, from before there was artwork; that stand-in is still reachable with
 * `qrSrc={null}` and nothing in the film asks for it.
 *
 * Reads `copy.signage`, the `signage.*` image positions, the tenant colour and the
 * knockout logo, so it needs a <CustomizationProvider> above it. Every prop below is an
 * override for a caller that wants to stage it with content of its own; inside the film
 * none is passed. The clock, the reaction counts and the "Article" / "Event" tags stay
 * fixed — they are the same on every tenant's screen.
 */

export interface WorkvivoBillboardScreenProps {
  /** Knockout tenant wordmark for the top bar. */
  logoSrc?: string;
  /** Per-tenant brand colour driving the screen's field. */
  brand?: { lit: string; base: string; dark: string };
  /** 621x415 hero photo for the large story. */
  heroSrc?: string;
  /** 459x150 photo for the Article card. */
  articleSrc?: string;
  /** 459x150 artwork for the Event card. */
  eventSrc?: string;
  /** Override the QR artwork. `null` draws the old placeholder pattern instead. */
  qrSrc?: string | null;
  /** Author avatar image for the first story. */
  authorAvatarSrc?: string;
  /** Author name on the first story. Defaults to the main character. */
  authorName?: string;
  /** Author action line on the first story. */
  authorAction?: string;
  /** Article title. */
  articleTitle?: string;
  /** Event title. */
  eventTitle?: string;
  /** Local frame for first story swipe left. Default 30 (global 1869). */
  firstSwipeFrom?: number;
  /** Local frame for second story swipe left. Default 103 (global 1942). */
  secondSwipeFrom?: number;
  /** Duration of swipe animation in frames. Default 17.5 (700ms at 25 fps). */
  swipeDuration?: number;
}

/**
 * Each story's fixed furniture: the photo it carries, whose face is on it, and the
 * reaction and comment counts.
 *
 * The counts are the same for every tenant and read as chrome; the words over them are
 * `copy.signage.stories`, positionally.
 */
const STORY_CHROME: {
  photo: string;
  photoSlot: ImageSlotKey;
  faceSlot: ImageSlotKey;
  face: string;
  ago: string;
  comments: string;
  reacts: string[];
}[] = [
  {
    photo: "fillers/spotify.Bloomberg.11.27.17.jpg",
    photoSlot: "signage.story.0",
    faceSlot: "signage.face.0",
    face: "img/Daniel-Ek.png",
    ago: "2 minutes ago",
    comments: "7 Comments",
    reacts: ["\u{1F389} 10", "\u{1F44F} 5", "\u{1F680} 3"],
  },
  {
    photo: "fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp",
    photoSlot: "signage.story.1",
    faceSlot: "signage.face.1",
    face: "img/avatar-3.jpeg",
    ago: "15 minutes ago",
    comments: "18 Comments",
    reacts: ["\u2764\uFE0F 24", "\u{1F3B5} 19", "\u2728 14"],
  },
  {
    photo: "fillers/spotify-for-artists-in-focus-logo-billboard-pro-1260.webp",
    photoSlot: "signage.story.2",
    faceSlot: "signage.face.2",
    face: "img/avatar-4.jpeg",
    ago: "45 minutes ago",
    comments: "32 Comments",
    reacts: ["\u{1F680} 42", "\u{1F389} 28", "\u{1F525} 16"],
  },
];

const STORY_WIDTH = 1259.82;

const SWIPE_EASE = Easing.bezier(0.81, 0.01, 0.18, 1.00);

/**
 * Artwork per condition, exhaustive over the enum — the same five files the feed card
 * draws. Declared here rather than imported so neither component owns the other's
 * layout, and so adding a sixth condition breaks both call sites at once.
 */
const BILLBOARD_WEATHER_ICON: Record<
  WorkvivoCopy["feed"]["weather"]["condition"],
  string
> = {
  Sunny: "img/weather/weather-sun.svg",
  "Partly Cloudy": "img/weather/weather-partly-cloud.svg",
  Cloudy: "img/weather/weather-cloudy.svg",
  Rainy: "img/weather/weather-rain.svg",
  Snow: "img/weather/weather-snow.svg",
};

export const WorkvivoBillboardScreen: React.FC<WorkvivoBillboardScreenProps> = ({
  logoSrc,
  brand,
  heroSrc,
  articleSrc,
  eventSrc,
  qrSrc,
  authorAvatarSrc,
  authorName,
  authorAction,
  articleTitle,
  eventTitle,
  firstSwipeFrom = 30,
  secondSwipeFrom = 103,
  swipeDuration = 17.5,
}) => {
  const frame = useCurrentFrame();
  const { copy, image, logo: brandLogo, theme, person } = useCustomization();
  const signage = copy.signage;
  const weather = copy.feed.weather;

  // The screen's field is three stops of one hue. `theme.d1`/`d3` are the same ramp every
  // other Workvivo surface in the cut paints with, so the board matches the frame it sits
  // in rather than carrying a second derivation of the tenant colour (guide §5.6).
  const field = brand ?? { lit: theme.brand, base: theme.d1, dark: theme.d3 };
  const logo = logoSrc ?? brandLogo.onDark;

  /** The first story is the main character's, so its face and name follow the persona. */
  const storyFace = (i: number) =>
    i === 0
      ? (authorAvatarSrc ?? person.photoUrl)
      : image(STORY_CHROME[i].faceSlot, staticFile(STORY_CHROME[i].face));
  const storyName = (i: number) =>
    i === 0 ? (authorName ?? person.name) : signage.stories[i].author;
  const storyPhoto = (i: number) =>
    i === 0 && heroSrc
      ? heroSrc
      : image(STORY_CHROME[i].photoSlot, staticFile(STORY_CHROME[i].photo));

  const article =
    articleSrc ??
    image(
      "signage.article.0",
      staticFile("fillers/spotify-for-artists-in-focus-logo-billboard-pro-1260.webp"),
    );
  const event =
    eventSrc ??
    image(
      "signage.event.0",
      staticFile("fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp"),
    );

  // Swipe 1: local 30 (global 1869) over 700ms (17.5 frames)
  const swipe1 =
    firstSwipeFrom == null
      ? 0
      : interpolate(frame, [firstSwipeFrom, firstSwipeFrom + swipeDuration], [0, STORY_WIDTH], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: SWIPE_EASE,
        });

  // Swipe 2: local 103 (global 1942) over 700ms (17.5 frames)
  const swipe2 =
    secondSwipeFrom == null
      ? 0
      : interpolate(frame, [secondSwipeFrom, secondSwipeFrom + swipeDuration], [0, STORY_WIDTH], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: SWIPE_EASE,
        });

  const totalTranslateX = -(swipe1 + swipe2);
  const activeDot =
    frame < (firstSwipeFrom ?? 30) + swipeDuration / 2
      ? 0
      : frame < (secondSwipeFrom ?? 103) + swipeDuration / 2
        ? 1
        : 2;

  return (
    <div
      className="wbb-frame"
      style={
        {
          "--wbb-brand-lit": field.lit,
          "--wbb-brand": field.base,
          "--wbb-brand-dark": field.dark,
        } as React.CSSProperties
      }
    >
      <WorkvivoSvgDefs />

      {/* ---------- top bar ---------- */}
      <div className="wbb-top">
        <div className="wbb-logo">
          <img src={logo} alt="" />
        </div>

        <div className="wbb-clock">
          <b>11:37 AM</b>
          <span>Monday, March 27</span>
        </div>

        {/* The screen shows the SAME forecast the feed card does — one company, one day
            — so the condition, the temperature and the scale all come from
            `feed.weather` rather than being written twice. It used to print "6 C / 47 F",
            both scales at once; `unit` is the model's answer to which one this city
            actually uses (F in the United States, C everywhere else). */}
        <div className="wbb-weather">
          <InlineSvg
            className="wbb-weather-ico"
            src={staticFile(BILLBOARD_WEATHER_ICON[weather.condition])}
            fill="#ffffff"
          />
          <span>{signage.location}</span>
          <span className="wbb-sep">|</span>
          <span>
            {weather.temperature}&deg; {weather.unit}
          </span>
        </div>
      </div>

      <div className="wbb-body">
        {/* ---------- large story carousel ---------- */}
        <section className="wbb-hero" style={{ position: "relative" }}>
          {/* Pager indicator pinned over bottom-right of media well */}
          <div
            className="wbb-pager"
            style={{
              position: "absolute",
              left: 544,
              bottom: 16,
              zIndex: 10,
            }}
          >
            <i className={activeDot === 0 ? "is-on" : ""} />
            <i className={activeDot === 1 ? "is-on" : ""} />
            <i className={activeDot === 2 ? "is-on" : ""} />
          </div>

          <div
            style={{
              display: "flex",
              width: `${STORY_WIDTH * 3}px`,
              height: "100%",
              transform: `translateX(${totalTranslateX}px)`,
            }}
          >
            {STORY_CHROME.map((chrome, i) => {
              const story = signage.stories[i];
              return (
                <div
                  key={chrome.photoSlot}
                  style={{
                    width: `${STORY_WIDTH}px`,
                    height: "100%",
                    display: "flex",
                    flex: "none",
                  }}>
                  <div className="wbb-hero-media">
                    <img
                      data-vc-slot={chrome.photoSlot}
                      src={storyPhoto(i)}
                      alt=""
                    />
                  </div>
                  <div className="wbb-hero-body">
                    <div className="wbb-author">
                      {/* The first story's face is the persona's, which is why only the
                          other two carry a swap attribute — the main character's headshot
                          is collected on the wizard's Character step, not swapped here. */}
                      <img
                        data-vc-slot={i === 0 ? undefined : chrome.faceSlot}
                        src={storyFace(i)}
                        alt=""
                      />
                      <div>
                        <div className="wbb-author-line">
                          <b>{storyName(i)}</b> {i === 0 ? (authorAction ?? story.action) : story.action}
                        </div>
                        <div className="wbb-author-meta">
                          <span>{chrome.ago}</span>
                          <span>·</span>
                          <Icon href="#i-ui-everyone" width={12} height={12} />
                          <span>{story.scope}</span>
                        </div>
                      </div>
                    </div>

                    {/* Only the first story is a translated post; the other two showed
                        this row with a team name in it, which made a translation
                        affordance read as a byline. */}
                    {i === 0 && (
                      <div className="wbb-translated">
                        <InlineSvg
                          src={staticFile("img/post types/post-translation.svg")}
                          alt=""
                        />
                        <span>{signage.translatedFrom}</span>
                      </div>
                    )}

                    <div className="wbb-hero-text">
                      <p>{story.headline}</p>
                      <p>{story.body}</p>
                    </div>

                    <div className="wbb-value">
                      <div className="wbb-vlabel">Value:</div>
                      <div className="wbb-chip">
                        <InlineSvg src={staticFile("img/post types/post-value.svg")} alt="" />
                        <span>{story.value}</span>
                      </div>
                    </div>

                    <div className="wbb-comments">{chrome.comments}</div>

                    <div className="wbb-reacts">
                      {chrome.reacts.map((r) => (
                        <span className="wbb-react" key={r}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- bottom row ---------- */}
        <div className="wbb-row">
          {/* Article — the smaller story export */}
          <section className="wbb-card">
            <div className="wbb-card-media">
              <img data-vc-slot="signage.article.0" src={article} alt="" />
              <div className="wbb-tag">Article</div>
            </div>
            <div className="wbb-card-body">
              <div className="wbb-card-title">
                {articleTitle ?? signage.article.title}
              </div>
              <div className="wbb-card-foot">
                <div className="wbb-card-meta">Posted 2 hours ago</div>
                <div className="wbb-byline">
                  <img
                    src={image("signage.face.1", staticFile("img/avatar-3.jpeg"))}
                    alt=""
                  />
                  <span>{signage.article.author}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Event — same frame, laid out from the reference screenshot */}
          <section className="wbb-card">
            <div className="wbb-card-media">
              <img data-vc-slot="signage.event.0" src={event} alt="" />
              <div className="wbb-tag">Event</div>
            </div>
            <div className="wbb-event-body">
              <div className="wbb-date">
                <div className="wbb-date-m">Jul</div>
                <div className="wbb-date-d">10</div>
              </div>
              <div className="wbb-event-copy">
                <div className="wbb-card-title">{eventTitle ?? signage.event.title}</div>
                <div className="wbb-event-meta">
                  <span>
                    <Icon href="#i-ui-everyone" width={12} height={12} />
                    Livestream
                  </span>
                  <span>
                    <Icon href="#i-ui-event-time" width={12} height={12} />
                    14:00 - 18:00
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Anniversary + webinar link */}
          <div className="wbb-side">
            <div className="wbb-anniv">
              <img
                data-vc-slot="signage.face.3"
                src={image("signage.face.3", staticFile("img/avatar-1.jpeg"))}
                alt=""
              />
              <div>
                <div className="wbb-anniv-name">{signage.anniversary.name}</div>
                <div className="wbb-anniv-copy">{signage.anniversary.note}</div>
              </div>
            </div>

            <div className="wbb-qr">
              <div className="wbb-qr-copy">
                <div className="wbb-qr-t">Find out more</div>
                <div className="wbb-qr-url">{signage.link}</div>
              </div>
              {/* A real code now. The three-square block underneath it was a stand-in
                  from before there was artwork, and is kept only for a caller that
                  explicitly passes `qrSrc={null}`. */}
              {qrSrc === null ? (
                <div className="wbb-qr-code">
                  <i />
                  <i />
                  <i />
                </div>
              ) : (
                <img
                  src={qrSrc ?? staticFile("img/QR-code.png")}
                  alt=""
                  style={{ width: 62, height: 62, flex: "none" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

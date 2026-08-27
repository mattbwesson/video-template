import React from "react";
import { InlineSvg } from "../InlineSvg";
import { SymbolSvg, registerSymbolJsx } from "./symbolRegistry";
import { Sequence, staticFile } from "remotion";
import { Video } from "@remotion/media";
import "./WorkvivoLiveReplayStyles.css";
import "./WorkvivoGlassEdge.css";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * Native port of public/refs/workvivo-live-replay.html (the mobile live-replay screen with
 * its Chapters sheet). The ref remains the design source — see docs/PORTING-HTML-REFS.md.
 *
 * The component is just the 393x852 .lr-phone; the ref's <body> centring (padding 40px 20px)
 * is the caller's job. Sprite symbol ids are prefixed lr- to avoid colliding with
 * WorkvivoMobileHome's status-bar sprites (same source art, same original ids).
 */

const SpriteDefs: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    aria-hidden
  >
    <symbol id="lr-i-signal" viewBox="0 0 17 11" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M16 0H15C14.4477 0 14 0.447715 14 1V9.66667C14 10.219 14.4477 10.6667 15 10.6667H16C16.5523 10.6667 17 10.219 17 9.66667V1C17 0.447715 16.5523 0 16 0ZM10.3333 2.33333H11.3333C11.8856 2.33333 12.3333 2.78105 12.3333 3.33333V9.66667C12.3333 10.219 11.8856 10.6667 11.3333 10.6667H10.3333C9.78106 10.6667 9.33334 10.219 9.33334 9.66667V3.33333C9.33334 2.78105 9.78106 2.33333 10.3333 2.33333ZM6.66666 4.66667H5.66666C5.11437 4.66667 4.66666 5.11438 4.66666 5.66667V9.66667C4.66666 10.219 5.11437 10.6667 5.66666 10.6667H6.66666C7.21894 10.6667 7.66666 10.219 7.66666 9.66667V5.66667C7.66666 5.11438 7.21894 4.66667 6.66666 4.66667ZM2 6.66667H1C0.447715 6.66667 0 7.11438 0 7.66667V9.66667C0 10.219 0.447715 10.6667 1 10.6667H2C2.55228 10.6667 3 10.219 3 9.66667V7.66667C3 7.11438 2.55228 6.66667 2 6.66667Z" fill="white" />
    </symbol>
    <symbol id="lr-i-wifi" viewBox="0 0 16 11" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.63661 2.27733C9.8525 2.27742 11.9837 3.12886 13.5896 4.65566C13.7105 4.77354 13.9038 4.77205 14.0229 4.65233L15.1789 3.48566C15.2392 3.42494 15.2729 3.34269 15.2724 3.25711C15.2719 3.17153 15.2373 3.08967 15.1763 3.02966C10.9612 -1.00989 4.31137 -1.00989 0.0962725 3.02966C0.0352139 3.08963 0.00057 3.17146 6.97078e-06 3.25704C-0.000556058 3.34262 0.0330082 3.42489 0.0932725 3.48566L1.24961 4.65233C1.36863 4.77223 1.56208 4.77372 1.68294 4.65566C3.28909 3.12876 5.4205 2.27732 7.63661 2.27733ZM7.63659 6.07299C8.85408 6.07292 10.0281 6.52545 10.9306 7.34266C11.0527 7.45864 11.2449 7.45613 11.3639 7.33699L12.5186 6.17033C12.5794 6.10913 12.6131 6.02612 12.6123 5.93985C12.6114 5.85359 12.576 5.77127 12.5139 5.71133C9.76573 3.15494 5.50979 3.15494 2.76159 5.71133C2.69952 5.77127 2.6641 5.85363 2.66328 5.93992C2.66247 6.02621 2.69633 6.10922 2.75726 6.17033L3.91159 7.33699C4.03058 7.45613 4.22286 7.45864 4.34493 7.34266C5.2468 6.52599 6.41991 6.0735 7.63659 6.07299ZM9.94959 8.62681C9.95136 8.71332 9.91735 8.79672 9.8556 8.85733L7.85826 10.873C7.79971 10.9322 7.71989 10.9656 7.6366 10.9656C7.55331 10.9656 7.47348 10.9322 7.41493 10.873L5.41726 8.85733C5.35555 8.79668 5.3216 8.71325 5.32343 8.62674C5.32526 8.54023 5.36271 8.45831 5.42693 8.40033C6.7025 7.32144 8.57069 7.32144 9.84626 8.40033C9.91044 8.45836 9.94783 8.5403 9.94959 8.62681Z" fill="white" />
    </symbol>
    <symbol id="lr-i-battery" viewBox="0 0 25 12" fill="none">
      <path opacity={0.35} d="M2.66699 0.5H19.333C20.5296 0.5 21.5 1.47038 21.5 2.66699V8.66699C21.4998 9.86346 20.5295 10.833 19.333 10.833H2.66699C1.47048 10.833 0.500176 9.86346 0.5 8.66699V2.66699L0.510742 2.44531C0.621596 1.35265 1.54509 0.5 2.66699 0.5Z" stroke="white" />
      <path opacity={0.4} d="M23 3.66669V7.66669C23.8047 7.32791 24.328 6.53982 24.328 5.66669C24.328 4.79355 23.8047 4.00546 23 3.66669Z" fill="white" />
      <path d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H18.6667C19.403 2 20 2.59695 20 3.33333V8C20 8.73638 19.403 9.33333 18.6667 9.33333H3.33333C2.59695 9.33333 2 8.73638 2 8V3.33333Z" fill="white" />
    </symbol>
  </svg>
);

/**
 * Each chapter's timecode and its thumbnail — the parts that belong to the broadcast's
 * shape rather than to a company. Titles come from `copy.livestream.chapters`,
 * positionally, so the four here fix how long the thing runs and the four there say what
 * happens in it.
 */
type ChapterChrome = { stamp: string; thumb: string };

const CHAPTER_CHROME: ChapterChrome[] = [
  { stamp: "00:10", thumb: "img/workvivo/pages_2.png" },
  { stamp: "12:23", thumb: "img/chap_quarter_review.png" },
  { stamp: "21:19", thumb: "img/chap_key_results.png" },
  { stamp: "34:02", thumb: "img/workvivo/pages_3.png" },
];

export interface WorkvivoLiveReplayProps {
  activeChapterIndex?: number;
  videoSrc?: string;
  chapterClickFrame?: number;
}

export const WorkvivoLiveReplay: React.FC<WorkvivoLiveReplayProps> = ({
  activeChapterIndex = 1,
  videoSrc = "img/webinar.mp4",
  chapterClickFrame = 80,
}) => {
  const { copy, image, logo } = useCustomization();
  const livestream = copy.livestream;

  return (
  <div className="lr-phone wv-glass-phone">
    <GlassRing />
    <SpriteDefs />
    <div className="lr-screen">
      <div className="lr-status">
        <div className="lr-time">9:41</div>
        <div className="lr-sysico">
          <SymbolSvg width="17" height="11" href="#lr-i-signal" />
          <SymbolSvg width="16" height="11" href="#lr-i-wifi" />
          <SymbolSvg width="25" height="12" href="#lr-i-battery" />
        </div>
      </div>

      <div className="lr-head">
        <span className="lr-back" />
        <div className="lr-htx">
          <span className="lr-pill">LIVE REPLAY</span>
          <h1>{livestream.title}</h1>
        </div>
        {/* Supplied art, not library icons. The mute file ships #606060; the reference
            draws it white, hence the knockout filter. */}
        <div className="lr-hacts">
          <span className="lr-ic">
            <InlineSvg
              className="lr-knockout"
              src={staticFile("img/webinar-icon-mute.svg")}
              alt=""
            />
          </span>
          <span className="lr-ic">
            <InlineSvg src={staticFile("img/webinar-icon-rotate.svg")} alt="" />
          </span>
        </div>
      </div>

      <div className="lr-video">
        {videoSrc === "img/webinar.mp4" ? (
          <Video
            src={staticFile("img/webinar.mp4")}
            trimBefore={125}
            playbackRate={2}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Sequence from={chapterClickFrame} layout="none">
            <Video
              src={staticFile("img/webinar2.mp4")}
              trimBefore={0}
              playbackRate={1}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Sequence>
        )}
      </div>

      <div className="lr-sheet" data-vc-slot="livestream.chapters">
        <div className="lr-shead">
          <h2>Chapters</h2>
          <span className="lr-xbtn"><span className="lr-g-x"><i /><i /></span></span>
        </div>
        {CHAPTER_CHROME.map((c, index) => (
          <div
            key={c.stamp}
            className={index === activeChapterIndex ? "lr-chap lr-on" : "lr-chap"}
          >
            {index === 0 ? (
              /* The opening chapter reads as a title card: the company's own shot with
                 its logo over it, the way an all-hands recording actually opens. The
                 other three keep the broadcast's stills — see CHAPTER_CHROME. */
              <span className="lr-thumb lr-thumb-title">
                <img
                  data-vc-slot="livestream.chapter.0"
                  className="lr-thumb-photo"
                  src={image("livestream.chapter.0", staticFile(c.thumb))}
                  alt=""
                />
                <span className="lr-thumb-scrim" />
                <img className="lr-thumb-logo" src={logo.onDark} alt="" />
              </span>
            ) : (
              <img
                className="lr-thumb"
                src={staticFile(c.thumb)}
                alt=""
                style={{ objectFit: "cover" }}
              />
            )}
            <span className="lr-ctx">
              <span className="lr-cttl">{livestream.chapters[index]}</span>
              <span className="lr-tstamp">{c.stamp}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};
import { GlassRing } from "./GlassRing";

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<SpriteDefs />);

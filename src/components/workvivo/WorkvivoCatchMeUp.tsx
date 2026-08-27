import React from 'react';
import { InlineSvg } from "../InlineSvg";
import { SymbolSvg, registerSymbolJsx } from './symbolRegistry';
import { staticFile } from 'remotion';
import './WorkvivoCatchMeUpStyles.css';
import './WorkvivoGlassEdge.css';
import { useCustomization } from '../../customize/CustomizationProvider';
import type { Customization } from '../../customize/CustomizationProvider';
import type { ImageSlotKey } from '../../customize/imagery';
import { GlassRing } from "./GlassRing";

export interface StorySlideData {
  title: string;
  image: string;
  /** Which image position this card's photo came from, so the reviewer can swap it. */
  slot: ImageSlotKey;
  tags?: string[];
  paragraphs: string[];
  bgStyle?: React.CSSProperties;
}

/**
 * The four story cards, as a function of the customisation rather than a constant.
 *
 * All four photos are operator-fillable positions (`story.0`-`story.3`). The glow behind
 * two of them is the brand colour at low alpha, so it is derived here rather than written as a
 * literal rgba — that green was #44D760 spelled out in decimal, which is exactly the
 * kind of hard-coding that survives a rebrand and then looks wrong.
 */
const catchMeUpSlides = ({ image, theme, copy }: Customization): StorySlideData[] => [
  {
    title: copy.stories[0].title,
    slot: 'story.0',
    image: image('story.0', staticFile('img/workvivo/story_summit.png')),
    paragraphs: [copy.stories[0].body],

    bgStyle: {
      background: 'linear-gradient(180deg, #D5C5F8 0%, #E6DCFA 40%, #F5F1FE 100%)',
    },
  },
  {
    title: copy.stories[1].title,
    slot: 'story.1',
    image: image('story.1', staticFile('img/workvivo/story_pulse.png')),
    tags: ['12 Questions', 'Anonymous'],
    paragraphs: [copy.stories[1].body],

    bgStyle: {
      background: '#FFFFFF',
      backgroundImage:
        `radial-gradient(circle at 85% 65%, ${theme.alpha(0.4)} 0%, ${theme.alpha(0.08)} 45%, transparent 65%), radial-gradient(circle at 15% 25%, ${theme.alpha(0.25)} 0%, transparent 45%)`,
    },
  },
  {
    title: copy.stories[2].title,
    slot: 'story.2',
    image: image('story.2', staticFile('img/workvivo/story_manager.png')),
    tags: ['1 step remaining'],
    paragraphs: [copy.stories[2].body],

    bgStyle: {
      background: '#FFFFFF',
      backgroundImage:
        `radial-gradient(circle at 80% 70%, ${theme.alpha(0.35)} 0%, ${theme.alpha(0.06)} 45%, transparent 65%), radial-gradient(circle at 20% 30%, ${theme.alpha(0.2)} 0%, transparent 40%)`,
    },
  },
  {
    title: copy.stories[3].title,
    slot: 'story.3',
    image: image('story.3', staticFile('fillers/190206084405_01_spotify_office_file_d0396b0d1b.webp')),
    tags: ['Productivity', 'Tools'],
    paragraphs: [copy.stories[3].body],

    bgStyle: {
      background: 'linear-gradient(180deg, #D5C5F8 0%, #E6DCFA 40%, #F5F1FE 100%)',
    },
  },
];

export const WorkvivoCatchMeUpSvgDefs: React.FC = () => (
  <svg
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    aria-hidden="true"
  >
    <defs>
      <symbol id="wcmu-battery" viewBox="0 0 25 12" fill="none">
        <path
          opacity="0.35"
          d="M2.66699 0.5H19.333C20.5296 0.5 21.5 1.47038 21.5 2.66699V8.66699C21.4998 9.86346 20.5295 10.833 19.333 10.833H2.66699C1.47048 10.833 0.500176 9.86346 0.5 8.66699V2.66699L0.510742 2.44531C0.621596 1.35265 1.54509 0.5 2.66699 0.5Z"
          stroke="white"
        />
        <path
          opacity="0.4"
          d="M23 3.66669V7.66669C23.8047 7.32791 24.328 6.53982 24.328 5.66669C24.328 4.79355 23.8047 4.00546 23 3.66669Z"
          fill="white"
        />
        <path
          d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H18.6667C19.403 2 20 2.59695 20 3.33333V8C20 8.73638 19.403 9.33333 18.6667 9.33333H3.33333C2.59695 9.33333 2 8.73638 2 8V3.33333Z"
          fill="white"
        />
      </symbol>
      <symbol id="wcmu-signal" viewBox="0 0 17 11" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 0H15C14.4477 0 14 0.447715 14 1V9.66667C14 10.219 14.4477 10.6667 15 10.6667H16C16.5523 10.6667 17 10.219 17 9.66667V1C17 0.447715 16.5523 0 16 0ZM10.3333 2.33333H11.3333C11.8856 2.33333 12.3333 2.78105 12.3333 3.33333V9.66667C12.3333 10.219 11.8856 10.6667 11.3333 10.6667H10.3333C9.78106 10.6667 9.33334 10.219 9.33334 9.66667V3.33333C9.33334 2.78105 9.78106 2.33333 10.3333 2.33333ZM6.66666 4.66667H5.66666C5.11437 4.66667 4.66666 5.11438 4.66666 5.66667V9.66667C4.66666 10.219 5.11437 10.6667 5.66666 10.6667H6.66666C7.21894 10.6667 7.66666 10.219 7.66666 9.66667V5.66667C7.66666 5.11438 7.21894 4.66667 6.66666 4.66667ZM2 6.66667H1C0.447715 6.66667 0 7.11438 0 7.66667V9.66667C0 10.219 0.447715 10.6667 1 10.6667H2C2.55228 10.6667 3 10.219 3 9.66667V7.66667C3 7.11438 2.55228 6.66667 2 6.66667Z"
          fill="white"
        />
      </symbol>
      <symbol id="wcmu-wifi" viewBox="0 0 16 11" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.63661 2.27733C9.8525 2.27742 11.9837 3.12886 13.5896 4.65566C13.7105 4.77354 13.9038 4.77205 14.0229 4.65233L15.1789 3.48566C15.2392 3.42494 15.2729 3.34269 15.2724 3.25711C15.2719 3.17153 15.2373 3.08967 15.1763 3.02966C10.9612 -1.00989 4.31137 -1.00989 0.0962725 3.02966C0.0352139 3.08963 0.00057 3.17146 6.97078e-06 3.25704C-0.000556058 3.34262 0.0330082 3.42489 0.0932725 3.48566L1.24961 4.65233C1.36863 4.77223 1.56208 4.77372 1.68294 4.65566C3.28909 3.12876 5.4205 2.27732 7.63661 2.27733ZM7.63659 6.07299C8.85408 6.07292 10.0281 6.52545 10.9306 7.34266C11.0527 7.45864 11.2449 7.45613 11.3639 7.33699L12.5186 6.17033C12.5794 6.10913 12.6131 6.02612 12.6123 5.93985C12.6114 5.85359 12.576 5.77127 12.5139 5.71133C9.76573 3.15494 5.50979 3.15494 2.76159 5.71133C2.69952 5.77127 2.6641 5.85363 2.66328 5.93992C2.66247 6.02621 2.69633 6.10922 2.75726 6.17033L3.91159 7.33699C4.03058 7.45613 4.22286 7.45864 4.34493 7.34266C5.2468 6.52599 6.41991 6.0735 7.63659 6.07299ZM9.94959 8.62681C9.95136 8.71332 9.91735 8.79672 9.8556 8.85733L7.85826 10.873C7.79971 10.9322 7.71989 10.9656 7.6366 10.9656C7.55331 10.9656 7.47348 10.9322 7.41493 10.873L5.41726 8.85733C5.35555 8.79668 5.3216 8.71325 5.32343 8.62674C5.32526 8.54023 5.36271 8.45831 5.42693 8.40033C6.7025 7.32144 8.57069 7.32144 9.84626 8.40033C9.91044 8.45836 9.94783 8.5403 9.94959 8.62681Z"
          fill="white"
        />
      </symbol>
      <symbol id="wcmu-employee-standalone" viewBox="0 0 24 24" stroke="currentColor">
        <g transform="scale(1.71429)">
          <circle
            cx="5.92"
            cy="5.92"
            r="5.42"
            style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
          <path
            d="M13.5 13.5 9.75 9.75"
            style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
        </g>
      </symbol>
      <symbol id="wcmu-everyone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </symbol>
    </defs>
  </svg>
);

export interface WorkvivoCatchMeUpProps {
  storyOpen?: boolean;
  activeSlide?: number;
  slideProgress?: number;
  transitionProgress?: number;
  prevSlide?: number;
  isPlaying?: boolean;
  scrollTop?: number;
  onOpenStory?: () => void;
  onCloseStory?: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onTogglePlay?: () => void;
}

export const WorkvivoCatchMeUp: React.FC<WorkvivoCatchMeUpProps> = ({
  storyOpen = false,
  activeSlide = 0,
  slideProgress = 1,
  transitionProgress = 1,
  prevSlide,
  isPlaying = true,
  scrollTop = 0,
  onOpenStory,
  onCloseStory,
  onNextSlide,
  onPrevSlide,
  onTogglePlay,
}) => {
  const customization = useCustomization();
  const { person, logo, copy, image } = customization;
  const slides = catchMeUpSlides(customization);
  const currentSlide = slides[activeSlide] || slides[0];

  const renderSlideContent = (slideData: StorySlideData) => (
    <div className="wcmu-slide-inner">
      <img
        data-vc-slot={slideData.slot}
        className="wcmu-shot"
        src={slideData.image}
        alt=""
      />
      <h1 className="wcmu-title">{slideData.title}</h1>
      {slideData.tags && slideData.tags.length > 0 && (
        <div className="wcmu-tags">
          {slideData.tags.map((tag, tIdx) => (
            <span key={tIdx} className="wcmu-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {slideData.paragraphs.map((p, pIdx) => (
        <p key={pIdx} className="wcmu-para">{p}</p>
      ))}
    </div>
  );

  return (
    <div className="wcmu-phone wv-glass-phone">
      <GlassRing />
      <WorkvivoCatchMeUpSvgDefs />
      <div className="wcmu-screen">
        {/* Status bar */}
        <div className="wcmu-status">
          <div className="wcmu-time">9:41</div>
          <div className="wcmu-sysico">
            <SymbolSvg width="17" height="11" href="#wcmu-signal" />
            <SymbolSvg width="16" height="11" href="#wcmu-wifi" />
            <SymbolSvg width="25" height="12" href="#wcmu-battery" />
          </div>
        </div>

        {/* Frozen Header */}
        <div className="wcmu-head">
          <div className="wcmu-hrow">
            <img className="wcmu-me" src={person.avatarUrl} style={person.avatarFit} alt="" />
            <img className="wcmu-mark" src={logo.onDark} alt={copy.companyName} />
            <div className="wcmu-hacts">
              <button className="wcmu-gbtn wcmu-plus" type="button"><i /><i /></button>
              <button className="wcmu-gbtn" type="button">
                <SymbolSvg width="21" height="21" href="#wcmu-employee-standalone" />
              </button>
            </div>
          </div>
          <div className="wcmu-htabs">
            <a href="#" className="wcmu-on">Feed</a>
            <a href="#">Spotlight</a>
          </div>
        </div>

        {/* Scrolling body */}
        <div className="wcmu-scroll">
          <div style={{ transform: 'translateY(-' + scrollTop + 'px)' }}>
            <div className="wcmu-sec">
              <button className="wcmu-cmu" id="open" type="button" onClick={onOpenStory}>
                <span className="wcmu-hq">
                  <InlineSvg
                    src={staticFile("img/hq-logo.svg")}
                    width="34"
                    height="20"
                    alt="HQ"
                    style={{ display: "block" }}
                  />
                </span>
                <span className="wcmu-t">
                  <b>Catch Me Up</b>
                  <span>Here's what you missed</span>
                </span>
                <span className="wcmu-chev" />
              </button>
            </div>

            <div className="wcmu-rail">
              <div className="wcmu-fcard">
                <img data-vc-slot="cmu.feed.0"
                  className="wcmu-img"
                  src={image("cmu.feed.0", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"))}
                  style={{ objectFit: "cover" }}
                  alt=""
                  />
                <div className="wcmu-b">
                  <h3>{copy.catchup[0].title}</h3>
                  <div className="wcmu-m"><SymbolSvg width="16" height="16" href="#wcmu-everyone" /><span>Global</span></div>
                  <div className="wcmu-p">Published 1 day ago</div>
                </div>
              </div>
              <div className="wcmu-fcard">
                <img data-vc-slot="cmu.feed.1"
                  className="wcmu-img"
                  src={image("cmu.feed.1", staticFile("fillers/images (1).jpeg"))}
                  style={{ objectFit: "cover" }}
                  alt=""
                  />
                <div className="wcmu-b">
                  <h3>{copy.catchup[1].title}</h3>
                  <div className="wcmu-m"><SymbolSvg width="16" height="16" href="#wcmu-everyone" /><span>Global</span></div>
                  <div className="wcmu-p">Published 2 days ago</div>
                </div>
              </div>
            </div>

            <div className="wcmu-pad" />
          </div>
        </div>

        {/* Story Overlay */}
        {storyOpen && (
          <div className="wcmu-story wcmu-open" id="story">
            <div className="wcmu-sbar">
              <div className="wcmu-stop">
                <span className="wcmu-shq">
                  <InlineSvg
                    src={staticFile("img/hq-logo.svg")}
                    width="18"
                    height="11"
                    alt="HQ"
                    style={{ display: "block" }}
                  />
                </span>
                <span className="wcmu-lbl">Catch Me Up</span>
                <button className="wcmu-ctl" id="playbtn" type="button" onClick={onTogglePlay}>
                  {isPlaying ? (
                    /* An inline <svg> triangle, not the CSS border trick. A zero-size
                       box drawn entirely from a 13px left border and two transparent
                       vertical ones is a triangle only because the browser mitres the
                       corners; the export renderer strokes each side independently and
                       the glyph came out as a solid white square. */
                    <svg
                      className="wcmu-play"
                      width="13"
                      height="16"
                      viewBox="0 0 13 16"
                      aria-hidden="true"
                    >
                      <polygon points="0,0 13,8 0,16" fill="#ffffff" />
                    </svg>
                  ) : (
                    <span className="wcmu-pause"><i /><i /></span>
                  )}
                </button>
                <button className="wcmu-ctl" type="button">
                  <span className="wcmu-dots3"><i /><i /><i /></span>
                </button>
                <button className="wcmu-ctl" id="close" type="button" onClick={onCloseStory}>
                  <span className="wcmu-x"><i /><i /></span>
                </button>
              </div>

              {/* Progress bars (10 segments) */}
              <div className="wcmu-prog" id="prog">
                {Array.from({ length: 10 }).map((_, idx) => {
                  let fillPct = 0;
                  if (idx < activeSlide) {
                    fillPct = 100;
                  } else if (idx === activeSlide) {
                    fillPct = Math.min(100, Math.max(0, slideProgress * 100));
                  }
                  return (
                    <i key={idx}>
                      <span
                        style={{
                          display: 'block',
                          height: '100%',
                          width: `${fillPct}%`,
                          background: '#FFFFFF',
                          borderRadius: 2,
                        }}
                      />
                    </i>
                  );
                })}
              </div>
              {/* Hangs below the bar (top: 100%), so it comes last. */}
              <div className="wcmu-sbar-fade" />
            </div>

            {/* Stage / Active Slide (Hard cut between slides) */}
            <div
              className="wcmu-stage"
              id="stage"
              style={{
                ...currentSlide.bgStyle,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div className="wcmu-tapzone wcmu-l" id="prev" onClick={onPrevSlide} />
              <div className="wcmu-tapzone wcmu-r" id="next" onClick={onNextSlide} />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                {renderSlideContent(currentSlide)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<WorkvivoCatchMeUpSvgDefs />);

import React from "react";
import { SymbolSvg, registerSymbolJsx } from "./symbolRegistry";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import "./WorkvivoLivestreamStyles.css";
import "./WorkvivoGlassEdge.css";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * Native port of public/refs/workvivo-livestream.html (the desktop livestream player with
 * its comments rail). The ref remains the design source — see docs/PORTING-HTML-REFS.md
 * for the porting rules this file follows.
 *
 * The component is just the 1280px .lv-frame; the ref's <body> centring (padding 40px 24px,
 * justify-content:center) is the CALLER's job, so scenes can place it without fighting a
 * baked-in stage. Sprite symbol ids are prefixed lv- because WorkvivoIcons.tsx already
 * registers the unprefixed ids on the same pages.
 */

const SpriteDefs: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    aria-hidden
  >
    <symbol id="lv-i-ui-everyone" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 8h13M8 1.2c2.2 2.2 3.4 4.5 3.4 6.8s-1.2 4.6-3.4 6.8c-2.2-2.2-3.4-4.5-3.4-6.8s1.2-4.6 3.4-6.8z" stroke="currentColor" strokeWidth="1.2" />
    </symbol>
    <symbol id="lv-i-ui-sidebar-collapse-arrows" viewBox="0 0 17 17" fill="none">
      <path d="M14 3.5v10M3 8.5h7.5M7 5l-3.5 3.5L7 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </symbol>
    <symbol id="lv-i-ui-emoji-reaction" viewBox="0 0 19 19" fill="none">
      <circle cx="9.5" cy="9.5" r="8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7" cy="7.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <path d="M6 11.5c.8 1.8 2.2 2.5 3.5 2.5s2.7-.7 3.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </symbol>
    <symbol id="lv-i-ui-send" viewBox="0 0 19 19" fill="none">
      <path d="M9.5 15.5V3.5M4 8l5.5-5.5L15 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </symbol>
  </svg>
);

/**
 * What each comment row keeps whoever the film is for: its portrait, whether it carries a
 * timestamp, and whether the replies strip hangs under it.
 *
 * The name and the bubble come from `copy.livestream.comments`, positionally. The stamp
 * and the replies affordance are the reference's own layout — which row shows them is a
 * property of the design, not of the company.
 */
type CommentChrome = {
  stamp?: string;
  /** File under public/img — resolved through staticFile at render. */
  avatar: string;
  replies?: boolean;
};

/**
 * Framing for the stock portraits, same as `personAvatarStyle` in WorkvivoDesktop: they are
 * face-in-the-upper-third, so a plain `cover` crop into a circle centres on the chest and
 * takes the head off. Pulling the frame to 15% seats the face.
 */
/** Face-in-the-upper-third stock portraits: crop biased to 15% so the head stays in. */
const AVATAR_FIT: React.CSSProperties = {
  objectFit: "cover",
  objectPosition: "50% 15%",
  display: "block",
};

const COMMENT_CHROME: CommentChrome[] = [
  { avatar: "avatar-1.jpeg" },
  { avatar: "vatar-2.jpeg" },
  { avatar: "avatar-3.jpeg" },
  { stamp: "2m ago", avatar: "avatar-4.jpeg" },
  { avatar: "avatar-5.jpeg", replies: true },
  { avatar: "avatar-6.jpeg" },
  { avatar: "avatar-1.jpeg" },
];

/** Natural width of the comments panel, and the stage gap that goes with it. */
export const LV_PANEL_WIDTH = 360;
const LV_STAGE_GAP = 14;

interface LivestreamReactionSpawn {
  emoji: string;
  at: number;
  x: number;
  size: number;
  drift: number;
  rise: number;
  life: number;
}

const LIVESTREAM_REACTIONS: LivestreamReactionSpawn[] = [
  { emoji: "😂", at: 0, x: 0.83, size: 38, drift: -10, rise: 360, life: 50 },
  { emoji: "❤️", at: 2, x: 0.74, size: 44, drift: 12, rise: 390, life: 48 },
  { emoji: "👍", at: 5, x: 0.91, size: 36, drift: -8, rise: 350, life: 46 },
  { emoji: "🎉", at: 8, x: 0.86, size: 40, drift: 14, rise: 400, life: 50 },
  { emoji: "😮", at: 10, x: 0.79, size: 38, drift: -12, rise: 370, life: 48 },
  { emoji: "⭐", at: 13, x: 0.89, size: 34, drift: 10, rise: 350, life: 44 },
  { emoji: "👏", at: 16, x: 0.73, size: 40, drift: -14, rise: 390, life: 52 },
  { emoji: "❤️", at: 19, x: 0.85, size: 44, drift: 12, rise: 410, life: 50 },
  { emoji: "😂", at: 22, x: 0.76, size: 38, drift: -10, rise: 360, life: 46 },
  { emoji: "🙌", at: 25, x: 0.90, size: 36, drift: 8, rise: 350, life: 44 },
  { emoji: "⭐", at: 28, x: 0.81, size: 34, drift: -12, rise: 370, life: 48 },
  { emoji: "❤️", at: 31, x: 0.87, size: 42, drift: 14, rise: 400, life: 50 },
  { emoji: "👍", at: 34, x: 0.75, size: 38, drift: -8, rise: 360, life: 46 },
  { emoji: "🎉", at: 37, x: 0.93, size: 40, drift: 10, rise: 380, life: 48 },
  { emoji: "😂", at: 40, x: 0.82, size: 38, drift: -14, rise: 370, life: 50 },
  { emoji: "👏", at: 43, x: 0.78, size: 40, drift: 12, rise: 390, life: 52 },
  { emoji: "❤️", at: 46, x: 0.86, size: 44, drift: -10, rise: 410, life: 48 },
  { emoji: "😮", at: 49, x: 0.74, size: 38, drift: 12, rise: 360, life: 46 },
  { emoji: "⭐", at: 52, x: 0.90, size: 34, drift: -10, rise: 350, life: 44 },
  { emoji: "😂", at: 55, x: 0.83, size: 38, drift: 14, rise: 380, life: 48 },
  { emoji: "👍", at: 58, x: 0.77, size: 36, drift: -8, rise: 360, life: 46 },
  { emoji: "❤️", at: 62, x: 0.88, size: 42, drift: 12, rise: 400, life: 50 },
  { emoji: "🎉", at: 66, x: 0.80, size: 40, drift: -12, rise: 380, life: 48 },
  { emoji: "👏", at: 70, x: 0.85, size: 38, drift: 10, rise: 390, life: 50 },
];

const LivestreamFloatingReactions: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {LIVESTREAM_REACTIONS.map((s, i) => {
        const t = (frame - s.at) / s.life;
        if (t < 0 || t > 1) return null;

        const y = interpolate(t, [0, 1], [30, -s.rise], {
          easing: Easing.bezier(0.25, 0.6, 0.4, 1),
        });
        const x = s.drift * Math.sin(t * Math.PI) + s.drift * 0.35 * Math.sin(t * Math.PI * 3);
        const rotate = s.drift * 0.3 * Math.sin(t * Math.PI * 2);
        const opacity = interpolate(t, [0, 0.08, 0.75, 1], [0, 1, 1, 0]);
        const scale = interpolate(t, [0, 0.15, 1], [0.6, 1.1, 0.9]);

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${s.x * 100}%`,
              bottom: 45,
              fontSize: s.size,
              lineHeight: 1,
              opacity,
              transform: `translate(-50%, ${y}px) translateX(${x}px) scale(${scale}) rotate(${rotate}deg)`,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))",
            }}
          >
            {s.emoji}
          </span>
        );
      })}
    </div>
  );
};

export interface WorkvivoLivestreamProps {
  /** 0 = comments panel fully collapsed, 1 = fully open. */
  panelOpen?: number;
}

export const WorkvivoLivestream: React.FC<WorkvivoLivestreamProps> = ({
  panelOpen = 1,
}) => {
  const { copy } = useCustomization();
  const livestream = copy.livestream;
  const comments = livestream.comments;

  return (
  <div className="lv-frame wv-glass-edge">
    <SpriteDefs />
    <div className="lv-stage" style={{ gap: LV_STAGE_GAP * panelOpen }}>
      <div className="lv-left">
        <div className="lv-vbar">
          <span className="lv-live">LIVE</span>
          <span className="lv-aud">
            <SymbolSvg width="16" height="16" href="#lv-i-ui-everyone" />Everyone
          </span>
          <span className="lv-count">301</span>
          {/* Only offered while the panel is collapsed — once it is open its own header
              carries the collapse control. */}
          <span
            className="lv-open-comments"
            style={{ opacity: 1 - panelOpen, pointerEvents: "none" }}
          >
            <SymbolSvg width="17" height="17" href="#lv-i-ui-sidebar-collapse-arrows" />
          </span>
        </div>

        <div className="lv-video">
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
          <LivestreamFloatingReactions />
        </div>

        <div className="lv-vfoot">
          <div className="lv-stats">
            <span className="lv-caret" />
            <span>Latency:2.0s</span><span>720p</span><span className="lv-hot">30fps</span>
          </div>
        </div>

        <div className="lv-meta" data-vc-slot="livestream.event">
          <div className="lv-mtop">
            <h1>{livestream.title}</h1>
            {panelOpen > 0.01 && (
              <div
                className="lv-rbar"
                style={{
                  opacity: panelOpen,
                  transform: `scale(${interpolate(panelOpen, [0, 1], [0.8, 1])})`,
                  transformOrigin: "right center",
                }}
              >
                <span>{"\u{1F44D}"}</span><span>{"\u{1F389}"}</span><span>{"\u{1F44F}"}</span>
                <span>{"\u{1F602}"}</span><span>{"\u{1F62E}"}</span>
              </div>
            )}
          </div>
          <div className="lv-watch">
            <span><b>8,145</b> watching, started streaming <b>7 minutes ago</b></span>
            <span className="lv-chip"><span className="lv-g-link"><i /><i /></span></span>
          </div>
          <div className="lv-dsc">
            <p>
              {livestream.description} <a>See more</a>
            </p>
            <div className="lv-dsc-actions">
              <span className="lv-kebab"><i /><i /><i /></span>
              {panelOpen < 0.5 && (
                <button
                  className="lv-end"
                  style={{
                    opacity: 1 - panelOpen * 2,
                  }}
                >
                  End Stream
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsing is a real layout change — the panel's width drives it, so the video
          column (flex:1) widens to fill as it closes. The inner wrapper is pinned to the
          right at full width so the comments stay put and are wiped in, rather than being
          squashed while the box grows. */}
      <aside
        className="lv-panel"
        style={{
          width: LV_PANEL_WIDTH * panelOpen,
          overflow: "hidden",
          position: "relative",
        }}
      >
       <div
         style={{
           position: "absolute",
           top: 0,
           right: 0,
           bottom: 0,
           width: LV_PANEL_WIDTH,
           display: "flex",
           flexDirection: "column",
         }}
       >
        <div className="lv-phead">
          <span className="lv-g-out">
            <SymbolSvg width="17" height="17" href="#lv-i-ui-sidebar-collapse-arrows" />
          </span>
          <span>Comments</span>
          <span className="lv-caret" />
          <span className="lv-all">All</span>
        </div>
        <div className="lv-clist">
          {COMMENT_CHROME.map((c, i) => (
            <div key={c.avatar + i}>
              <div className="lv-cname">
                {comments[i].name}
                {c.stamp && <span className="lv-stamp">{c.stamp}</span>}
              </div>
              <div className="lv-crow">
                <img
                  className="lv-cav"
                  src={staticFile(`img/${c.avatar}`)}
                  style={AVATAR_FIT}
                  alt=""
                />
                <span className="lv-bub">{comments[i].text}</span>
              </div>
              {c.replies && (
                <div className="lv-replies">
                  <span className="lv-stack">
                    <img
                      className="lv-sav"
                      src={staticFile(`img/${COMMENT_CHROME[0].avatar}`)}
                      style={AVATAR_FIT}
                      alt=""
                    />
                    <img
                      className="lv-sav"
                      src={staticFile(`img/${COMMENT_CHROME[1].avatar}`)}
                      style={AVATAR_FIT}
                      alt=""
                    />
                    <img
                      className="lv-sav"
                      src={staticFile(`img/${COMMENT_CHROME[2].avatar}`)}
                      style={AVATAR_FIT}
                      alt=""
                    />
                    <span className="lv-sav lv-rp"><span className="lv-g-reply"><i /><i /></span></span>
                  </span>
                  <span className="lv-rtx">3 new replies</span>
                  <span className="lv-caret" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lv-ccompose">
          <div className="lv-ph">Leave a comment</div>
          <div className="lv-ctools">
            <SymbolSvg width="19" height="19" href="#lv-i-ui-emoji-reaction" />
            <span className="lv-snd">
              <SymbolSvg width="19" height="19" href="#lv-i-ui-send" />
            </span>
          </div>
        </div>
       </div>
      </aside>
    </div>
  </div>
);
};

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<SpriteDefs />);

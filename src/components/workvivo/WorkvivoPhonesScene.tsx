import React from "react";
import { SymbolSvg } from "./symbolRegistry";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoMobileSvgDefs } from "./WorkvivoMobileHome";
import { ZoomCallSvgDefs } from "./ZoomCallIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoMobileStyles.css";
import "./WorkvivoGlassEdge.css";
import "./WorkvivoPhonesSceneStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import type { ImageSlotKey } from "../../customize/imagery";
import { GlassRing } from "./GlassRing";

/**
 * Two Workvivo phones on a purple field: Chat on the left, a video call on the right.
 *
 * Reuses the mobile library rather than re-deriving it — .wm-phone (393x852 shell, 16.5px
 * bezel, 35.5px screen radius), .wm-status/.wm-time/.wm-sysico, the #i-signal/#i-wifi/
 * #i-battery symbols out of WorkvivoMobileSvgDefs, and .wv-glass-phone for the lavender
 * bezel. The pair is scaled 1.082x to sit in a 1920x1080 frame at the reference's
 * proportions.
 *
 * ICON PROVENANCE — three sources, kept separate on purpose:
 *
 *   i-ui-*  Workvivo's own library (WorkvivoIcons.tsx): chat, send, add-reaction.
 *   i-zm-*  Zoom's library (ZoomCallIcons.tsx): phone, videos, back, ellipsis,
 *           ai-companion, mic. The Workvivo set is nav-rail and feed focused and has no
 *           meeting chrome at all, and the right-hand phone IS a call surface, so these
 *           are borrowed deliberately rather than invented.
 *   drawn   Three glyphs exist in NEITHER library — the composer plus, the muted-mic
 *           slash, and switch-camera. They are built from primitive shapes (rect, circle,
 *           line, polygon) below, so they read as generic device chrome rather than as
 *           fake Workvivo or Zoom art. No path data is authored anywhere in this file.
 *
 * The bubble violet is sampled from the reference image, not taken from a token — the
 * documented mobile purple (#5A31F4) is visibly bluer than what the reference shows.
 */

export interface WorkvivoPhonesSceneProps {
  /** Bubble violet. Sampled from the reference; override to match a real capture. */
  bubble?: string;
  /** Main video-call video file. Default "img/webinar.mp4". */
  callerVideoSrc?: string;
  /** Picture-in-picture self view video file. Default "img/webinar2.mp4". */
  selfVideoSrc?: string;
  /** Main video-call fallback image. */
  callerSrc?: string;
  /** Picture-in-picture self view fallback image. */
  selfSrc?: string;
  /** Animate the phones rising up from below. Default true. */
  animateUp?: boolean;
  /** Frames to animate up over. Default 20. */
  riseFrames?: number;
  /** Distance in pixels to rise from. Default 350. */
  riseDistance?: number;
  /** Local frame for incoming chat message animation. Default 25 (global frame 2125). */
  messageInFrame?: number;
  /** Local frame when phones start animating up/out. Default 55 (global frame 2155). */
  exitUpFrom?: number;
  /** Frames to animate up/out over. Default 18. */
  exitUpFrames?: number;
  /** Distance in pixels to translate up by on exit. Default 1200. */
  exitUpDistance?: number;
}

/** Mobile send. Workvivo's ui.send is the HQ-search arrow; the composer wants a plane. */
const PaperPlane: React.FC = () => (
  <svg className="wp-send" width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
    <polygon points="2,3 23,12 2,21 2,14 15,12 2,10" fill="currentColor" />
  </svg>
);

/**
 * Video camera. Neither library has one — Zoom's `videos` glyph is a media-library mark
 * and reads as a box at 18px. Body plus lens barrel, from a rect and a polygon.
 */
const VideoCam: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect
      x="2"
      y="6.5"
      width="13.5"
      height="11"
      rx="2.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <polygon
      points="17.4,10.4 21.6,7.6 21.6,16.4 17.4,13.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

/** Switch-camera. Not in either library — circle-with-a-gap plus two arrowheads. */
const SwitchCamera: React.FC<{ size?: number }> = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeDasharray="34 16"
      transform="rotate(-30 12 12)"
    />
    <polygon points="17.6,3.6 20.6,6.4 16.4,7.6" fill="currentColor" />
    <polygon points="6.4,20.4 3.4,17.6 7.6,16.4" fill="currentColor" />
  </svg>
);

/** The strike-through that turns the borrowed mic glyph into a muted mic. */
const MuteSlash: React.FC = () => (
  <svg
    width="26"
    height="24"
    viewBox="0 0 26 24"
    aria-hidden="true"
    style={{ position: "absolute", inset: 0 }}
  >
    <line
      x1="5"
      y1="3.5"
      x2="21"
      y2="20.5"
      stroke="#26232f"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <line
      x1="5"
      y1="3.5"
      x2="21"
      y2="20.5"
      stroke="#ffffff"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

/** Top status bar: 9:41 plus cellular / wifi / battery icons. */
const StatusIcons: React.FC = () => (
  <div className="wm-sysico">
    <SymbolSvg width="17" height="11" href="#i-signal" />
    <SymbolSvg width="16" height="11" href="#i-wifi" />
    <SymbolSvg width="25" height="12" href="#i-battery" />
  </div>
);

/** The four photos in the thread's grid; the fourth carries the "+2" overlay. */
const OFFSITE: { src: string; slot: ImageSlotKey }[] = [
  { src: "img/workvivo/offsite_smile.png", slot: "chat.photo.0" },
  { src: "img/workvivo/pages_2.png", slot: "chat.photo.1" },
  { src: "img/workvivo/story_summit.png", slot: "chat.photo.2" },
  { src: "img/workvivo/post_2.png", slot: "chat.photo.3" },
];

export const WorkvivoPhonesScene: React.FC<WorkvivoPhonesSceneProps> = ({
  bubble = "#7b3fe8",
  callerVideoSrc = "img/webinar.mp4",
  selfVideoSrc = "img/webinar2.mp4",
  callerSrc,
  selfSrc,
  animateUp = true,
  riseFrames = 20,
  riseDistance = 350,
  messageInFrame = 25,
  exitUpFrom = 55,
  exitUpFrames = 18,
  exitUpDistance = 1200,
}) => {
  const frame = useCurrentFrame();
  const { copy, image } = useCustomization();
  const chat = copy.chat;

  const riseY = animateUp
    ? interpolate(frame, [0, riseFrames], [riseDistance, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 0;

  const exitY =
    exitUpFrom == null
      ? 0
      : interpolate(frame, [exitUpFrom, exitUpFrom + exitUpFrames], [0, -exitUpDistance], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });

  const msgProgress = interpolate(frame, [messageInFrame, messageInFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div className="wp-stage" style={{ "--wp-bubble": bubble } as React.CSSProperties}>
      <WorkvivoSvgDefs />
      <WorkvivoMobileSvgDefs />
      <ZoomCallSvgDefs />

      <div
        className="wp-pair"
        style={{
          transform: `scale(1.082) translateY(${riseY + exitY}px)`,
        }}
      >
        {/* ================= left phone — Workvivo Chat ================= */}
        <div className="wm-phone wv-glass-phone wp-glow">
          <GlassRing />
          <div className="wm-screen wp-screen-light">
            <div className="wm-status wp-status-dark">
              <div className="wm-time">9:41</div>
              <div className="wm-sysico">
                <StatusIcons />
              </div>
            </div>

            <div className="wp-chat">
              <div className="wp-chat-head">
                <span className="wp-back">
                  <span className="wp-chev-back" />
                </span>
                <img
                  className="wp-chat-av"
                  data-vc-slot="chat.face.0"
                  src={image("chat.face.0", staticFile("img/avatar-1.jpeg"))}
                  alt=""
                />
                <div className="wp-chat-id">
                  <div className="wp-chat-t">{chat.channel}</div>
                  <div className="wp-chat-s">{chat.channelMeta}</div>
                </div>
                <div className="wp-chat-acts">
                  <SymbolSvg width="17" height="17" href="#i-zm-phone" />
                  <VideoCam size={18} />
                </div>
              </div>

              <div className="wp-thread">
                <div className="wp-out">{chat.messages[0]}</div>

                <div className="wp-sender">{chat.senders[0]}</div>

                <div className="wp-grid">
                  {OFFSITE.map((photo, i) => {
                    const img = (
                      <img
                        data-vc-slot={photo.slot}
                        src={image(photo.slot, staticFile(photo.src))}
                        alt=""
                      />
                    );
                    return i === 3 ? (
                      <div className="wp-grid-more" key={photo.slot}>
                        {img}
                        <span>+2</span>
                      </div>
                    ) : (
                      <React.Fragment key={photo.slot}>{img}</React.Fragment>
                    );
                  })}
                </div>

                <div className="wp-in-row">
                  <img
                    className="wp-in-av"
                    data-vc-slot="chat.face.1"
                    src={image("chat.face.1", staticFile("img/avatar-3.jpeg"))}
                    alt=""
                  />
                  <div className="wp-in">{chat.messages[1]}</div>
                </div>

                <div className="wp-reacts">
                  <span className="wp-react">❤️ 453</span>
                  <span className="wp-react">🙌 320</span>
                  <span className="wp-react">🚀 311</span>
                  <span className="wp-react-add">
                    <Icon href="#i-ui-add-reaction" width={11} height={11} />
                  </span>
                </div>

                <div className="wp-out">{chat.messages[2]}</div>
                <div className="wp-out">{chat.messages[3]}</div>

                {/* Incoming message from Marley Williams animating in at global frame 2125 (local 25) */}
                {frame >= messageInFrame && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      opacity: msgProgress,
                      transform: `translateY(${(1 - msgProgress) * 16}px) scale(${0.88 + 0.12 * msgProgress})`,
                      transformOrigin: "bottom left",
                    }}
                  >
                    <div className="wp-sender" style={{ marginLeft: 26 }}>
                      {chat.senders[1]}
                    </div>
                    <div className="wp-in-row">
                      <img
                        className="wp-in-av"
                        data-vc-slot="chat.face.2"
                        src={image("chat.face.2", staticFile("img/avatar-6.jpeg"))}
                        alt=""
                      />
                      <div className="wp-in">{chat.messages[4]}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="wp-catchup">
                <div className="wp-catchup-t">Catch up on what you missed</div>
                <div className="wp-summarize">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <defs>
                      <linearGradient id="wp-sparkle-grad" x1="100%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a3cbfa" />
                        <stop offset="100%" stopColor="#eebcdc" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M6.92311 2.33302C7.12369 1.7643 7.92691 1.76702 8.12916 2.33204C8.61157 3.68402 9.22832 4.90423 10.1526 5.8711L10.1721 5.89161C11.1093 6.86022 12.4166 7.43846 13.6848 7.87599C14.2597 8.07483 14.2552 8.89235 13.677 9.08399C12.3956 9.50608 11.0622 10.0787 10.0774 11.0449C9.09334 12.0108 8.49752 13.3205 8.07154 14.665C7.88673 15.2477 7.06541 15.2667 6.85865 14.6885C6.39271 13.3812 5.88049 12.0986 4.89674 11.1162C3.9181 10.1393 2.61111 9.52589 1.32057 9.07813C0.752511 8.88059 0.738975 8.07555 1.3108 7.87208C2.57949 7.42314 3.93327 6.8309 4.89674 5.86915C5.86122 4.90611 6.47761 3.60158 6.92311 2.33302Z"
                      fill="url(#wp-sparkle-grad)"
                    />
                    <path
                      d="M12.346 1.08985C12.4421 0.819095 12.8237 0.821608 12.9202 1.08985L12.9739 1.23341C13.0324 1.38509 13.0971 1.53294 13.1682 1.67188C13.1846 1.70395 13.2016 1.73687 13.219 1.76856C13.3381 1.98486 13.4777 2.18352 13.6438 2.35743L13.6458 2.35841C13.8048 2.52448 13.9966 2.66111 14.2053 2.77442C14.2424 2.79451 14.2816 2.81424 14.3196 2.83302C14.466 2.90528 14.6196 2.96814 14.7727 3.02442C14.8175 3.04088 14.8632 3.05796 14.9075 3.07325C15.1791 3.16827 15.1817 3.55804 14.9046 3.64942C14.859 3.66439 14.8124 3.68027 14.7669 3.6963C14.6149 3.7498 14.4615 3.81028 14.3147 3.87989C14.2757 3.89839 14.2363 3.91828 14.1975 3.93849C13.984 4.04991 13.7848 4.18434 13.6165 4.34962C13.4424 4.52065 13.3028 4.72017 13.1878 4.93751C13.1674 4.97594 13.1478 5.01472 13.1292 5.05372C13.0599 5.19853 12.9997 5.3503 12.9465 5.50489L12.9006 5.64161C12.8125 5.91841 12.4225 5.92905 12.3235 5.65333C12.3072 5.60756 12.2904 5.56113 12.2737 5.51563C12.2165 5.3601 12.1552 5.20601 12.0862 5.05958C12.0667 5.01834 12.0466 4.97668 12.0256 4.93653C11.918 4.73032 11.7886 4.53962 11.6233 4.37501C11.4496 4.20218 11.2471 4.06058 11.0296 3.94239C10.9964 3.92439 10.9616 3.90653 10.928 3.88966C10.7845 3.81773 10.6347 3.75442 10.4846 3.69825C10.4378 3.68072 10.3897 3.66271 10.343 3.64649C10.0755 3.55225 10.0644 3.16913 10.3391 3.0713C10.3872 3.05429 10.4369 3.03589 10.4856 3.01759C10.633 2.96217 10.7825 2.89992 10.926 2.83009C10.9625 2.81233 10.9993 2.79494 11.0344 2.77638C11.2532 2.66081 11.4556 2.52336 11.6223 2.35645C11.7913 2.18726 11.9318 1.98651 12.0501 1.77052C12.0675 1.73857 12.0845 1.7061 12.1008 1.67384C12.1726 1.53227 12.2365 1.38441 12.2922 1.23731C12.3106 1.18879 12.3291 1.13821 12.346 1.08985Z"
                      fill="url(#wp-sparkle-grad)"
                    />
                  </svg>
                  <span>Summarize</span>
                </div>
              </div>

              <div className="wp-composer">
                <span className="wp-plus">
                  <i />
                  <i />
                </span>
                <div className="wp-field">
                  <span>Send message</span>
                  <SymbolSvg className="wp-mic" width="14" height="14" href="#i-zm-mic" />
                </div>
                <PaperPlane />
              </div>
            </div>
          </div>
        </div>

        {/* ================= right phone — video call ================= */}
        <div className="wm-phone wv-glass-phone wp-glow">
          <GlassRing />
          <div className="wm-screen">
            <div className="wp-call">
              <div className="wp-call-video">
                {callerVideoSrc ? (
                  <Video
                    src={staticFile(callerVideoSrc)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <img
                    src={callerSrc ?? staticFile("img/workvivo/call_caller.png")}
                    alt=""
                  />
                )}
              </div>

              <div className="wm-status wp-status-call">
                <div className="wm-time">9:41</div>
                <div className="wm-sysico">
                  <StatusIcons />
                </div>
              </div>

              <div className="wp-call-top">
                <SymbolSvg width="17" height="17" href="#i-zm-back" />
                <SwitchCamera />
                <div className="wp-call-title">{chat.caller} 00:05</div>
                <div className="wp-leave">Leave</div>
              </div>

              <div className="wp-pip">
                {selfVideoSrc ? (
                  <Video
                    src={staticFile(selfVideoSrc)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <img
                    src={selfSrc ?? staticFile("img/workvivo/call_self.png")}
                    alt=""
                  />
                )}
              </div>

              <div className="wp-call-bar">
                <div className="wp-ctl">
                  <span className="wp-ctl-ico">
                    <VideoCam size={20} />
                  </span>
                  <span>Turn Off</span>
                </div>

                <div className="wp-ctl">
                  <span className="wp-ctl-ico">
                    <SymbolSvg width="15" height="15" href="#i-zm-mic" />
                    <MuteSlash />
                  </span>
                  <span>Unmute</span>
                </div>

                <div className="wp-ctl">
                  <span className="wp-ctl-ico">
                    <Icon href="#i-ui-chat" width={17} height={17} />
                    <span className="wp-badge">1</span>
                  </span>
                  <span>Chat</span>
                </div>

                <div className="wp-ctl">
                  <span className="wp-ctl-ico">
                    <SymbolSvg width="19" height="19" href="#i-zm-ellipsis" />
                  </span>
                  <span>More</span>
                </div>
              </div>

              <div
                className="wp-home"
                style={{ background: "#ffffff", bottom: 7 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
